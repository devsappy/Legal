#!/usr/bin/env node
/**
 * End-to-end smoke test against a running server:
 *   node scripts/smoke.mjs [base-url] [--real]
 * Signs in with the demo admin, exercises the conversation API, streams an
 * answer (mock route by default; --real uses /api/chat and needs the model
 * server) and checks the SSE contract. Exit code 1 on any failure.
 */
const BASE = process.argv[2]?.startsWith("http") ? process.argv[2] : "http://localhost:3000";
const REAL = process.argv.includes("--real");
let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? `  ${detail}` : ""}`);
  if (!ok) failed++;
};

const login = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@gmail.com", password: "1234" }),
});
const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
check("sign in", login.ok && cookie.startsWith("coop_session="));

const bad = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@gmail.com", password: "wrong" }),
});
check("wrong password rejected", bad.status === 401);

const anon = await fetch(`${BASE}/api/conversations`);
check("conversations need sign-in", anon.status === 401);

const put = await fetch(`${BASE}/api/conversations`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ id: "smoke", title: "Smoke", messages: [] }),
});
const list = await fetch(`${BASE}/api/conversations`, { headers: { Cookie: cookie } }).then((r) => r.json());
check("conversation saved and listed", put.ok && list.conversations?.some((c) => c.id === "smoke"));
await fetch(`${BASE}/api/conversations?id=smoke`, { method: "DELETE", headers: { Cookie: cookie } });

const endpoint = REAL ? "/api/chat" : "/api/mock/chat";
const res = await fetch(`${BASE}${endpoint}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ session_id: "smoke", message: "What is the quorum for an annual general meeting?", language: "en", jurisdiction: "central" }),
});
check(`${endpoint} responds`, res.ok, String(res.status));
const text = await res.text();
const events = [...text.matchAll(/^event: (\w+)$/gm)].map((m) => m[1]);
check("stream has meta, citations, token and done", ["meta", "citations", "token", "done"].every((e) => events.includes(e)), events.filter((e, i, a) => a.indexOf(e) === i).join(","));
const tokens = events.filter((e) => e === "token").length;
check("answer has content", tokens > 10, `${tokens} tokens`);

// Pages: public ones render; private ones redirect to sign-in when anonymous
// (Next.js answers 307 for a redirect() in a layout) and render when signed in.
const expectStatus = (r, want) => (Array.isArray(want) ? want : [want]).includes(r.status);
const pages = [
  ["/en", 200],
  ["/en/login", 200],
  ["/en/register", 200],
  ["/en/privacy", 200],
  ["/en/terms", 200],
  ["/en/status", 200],
  ["/en/changelog", 200],
  ["/en/home", 307],
  ["/en/ask", 307],
  ["/en/settings", 307],
  ["/en/does-not-exist", 404],
  ["/sitemap.xml", 200],
  ["/robots.txt", 200],
];
for (const [p, want] of pages) {
  const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
  check(`GET ${p} -> ${want}`, expectStatus(r, want), String(r.status));
}
for (const p of ["/en/home", "/en/ask", "/en/settings", "/en/admin", "/en/checklists"]) {
  const r = await fetch(`${BASE}${p}`, { headers: { Cookie: cookie } });
  check(`GET ${p} signed in`, r.status === 200, String(r.status));
}
const health = await fetch(`${BASE}/api/health`);
check("GET /api/health answers", health.status === 200 || health.status === 503, String(health.status));

console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
