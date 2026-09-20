#!/usr/bin/env node
/**
 * Runs eval/questions.json through POST /api/chat and scores:
 *   retrieval  — an expected section is among the retrieved sources
 *   cited      — an expected section is among the sources the answer actually cites
 *   language   — the answer is written in the question's script
 *   verified   — no cited source failed the support check
 *
 *   node eval/run.mjs [--base http://localhost:3000] [--filter agm] [--limit 20]
 * Writes eval/results/<timestamp>.json and prints a table.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const BASE = opt("base", "http://localhost:3000");
const FILTER = opt("filter", "");
const LIMIT = Number(opt("limit", "0"));

const all = JSON.parse(readFileSync(new URL("./questions.json", import.meta.url), "utf8"));
// "--filter -mr" selects a language (id suffix); anything else is a substring match.
let questions = FILTER ? all.filter((q) => (/^-[a-z]{2}$/.test(FILTER) ? q.id.endsWith(FILTER) : q.id.includes(FILTER))) : all;
if (LIMIT) questions = questions.slice(0, LIMIT);

const SCRIPT = {
  en: /[A-Za-z]/g,
  hi: /[ऀ-ॿ]/g,
  mr: /[ऀ-ॿ]/g,
  ta: /[஀-௿]/g,
};

function scriptShare(text, lang) {
  const letters = (text.match(/\p{L}/gu) ?? []).length || 1;
  const own = (text.match(SCRIPT[lang]) ?? []).length;
  return own / letters;
}

// The chat route is behind sign-in; use the demo account (or EVAL_EMAIL / EVAL_PASSWORD).
async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.EVAL_EMAIL ?? "test@gmail.com", password: process.env.EVAL_PASSWORD ?? "1234" }),
  });
  if (!res.ok) throw new Error(`sign-in failed (${res.status})`);
  const cookie = res.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("no session cookie returned");
  return cookie;
}
const COOKIE = await login();

async function ask(q) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: COOKIE },
    body: JSON.stringify({ session_id: "eval", message: q.question, language: q.lang, jurisdiction: q.jurisdiction }),
  });
  const text = await res.text();
  if (!res.ok) return { answer: "", retrieved: [], cited: [], meta: {}, error: `HTTP ${res.status} ${text.slice(0, 80)}` };
  const events = [];
  for (const frame of text.split("\n\n")) {
    let event = "message";
    const data = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    if (data.length) events.push({ event, data: JSON.parse(data.join("\n")) });
  }
  const answer = events.filter((e) => e.event === "token").map((e) => e.data.text).join("");
  const citationEvents = events.filter((e) => e.event === "citations").map((e) => e.data);
  const retrieved = citationEvents[0] ?? [];
  const cited = citationEvents.at(-1) ?? [];
  const meta = events.filter((e) => e.event === "meta").map((e) => e.data).at(-1) ?? {};
  const error = events.find((e) => e.event === "error")?.data?.message;
  return { answer, retrieved, cited, meta, error };
}

const norm = (s) => s.replace(/\s+/g, "").replace(/\(.*$/, "").toLowerCase();
const matches = (sections, expect) => expect.some((e) => sections.some((s) => norm(s) === norm(e) || norm(s).startsWith(norm(e))));

const results = [];
const started = Date.now();
for (const q of questions) {
  const t0 = Date.now();
  let r;
  try {
    r = await ask(q);
  } catch (err) {
    r = { answer: "", retrieved: [], cited: [], meta: {}, error: err.message };
  }
  const ms = Date.now() - t0;
  const retrievedSecs = r.retrieved.map((c) => c.section);
  const citedSecs = r.cited.map((c) => c.section);
  const row = {
    id: q.id,
    ms,
    error: r.error ?? null,
    retrieval: matches(retrievedSecs, q.expect),
    cited: matches(citedSecs, q.expect),
    language: scriptShare(r.answer, q.lang) > 0.6,
    verified: r.cited.every((c) => c.verified),
    confidence: r.meta.confidence ?? null,
    expect: q.expect,
    retrievedSecs,
    citedSecs,
    answer: r.answer,
  };
  results.push(row);
  const mark = (b) => (b ? "✓" : "✗");
  console.log(
    `${row.id.padEnd(30)} ${String(ms).padStart(6)}ms  retr ${mark(row.retrieval)}  cited ${mark(row.cited)}  lang ${mark(row.language)}  ver ${mark(row.verified)}  ${row.error ? "ERROR " + row.error : citedSecs.join(",")}`,
  );
}

const pct = (k) => `${Math.round((100 * results.filter((r) => r[k]).length) / results.length)}%`;
const summary = {
  n: results.length,
  retrieval: pct("retrieval"),
  cited: pct("cited"),
  language: pct("language"),
  verified: pct("verified"),
  errors: results.filter((r) => r.error).length,
  avgMs: Math.round(results.reduce((n, r) => n + r.ms, 0) / results.length),
  byLang: Object.fromEntries(
    ["en", "hi", "mr", "ta"].map((l) => {
      const rs = results.filter((r) => r.id.endsWith(`-${l}`));
      return [l, rs.length ? `${Math.round((100 * rs.filter((r) => r.cited).length) / rs.length)}% cited` : "-"];
    }),
  ),
  totalSeconds: Math.round((Date.now() - started) / 1000),
};
console.log("\n" + JSON.stringify(summary, null, 2));

mkdirSync(new URL("./results/", import.meta.url), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(new URL(`./results/${stamp}.json`, import.meta.url), JSON.stringify({ summary, results }, null, 2));
console.log(`\nsaved eval/results/${stamp}.json`);
