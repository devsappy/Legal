#!/usr/bin/env node
/**
 * Turns an Act (PDF or plain text) into the Markdown the assistant reads:
 *
 *   node scripts/ingest.mjs <file.pdf|file.txt> <jurisdiction> "<Act title>" [--out name.md] [--label §]
 *
 * e.g. node scripts/ingest.mjs mscs.pdf central "Multi-State Co-operative Societies Act, 2002"
 *
 * Indian Acts number their sections "39. Annual general meeting" followed by
 * the body. A table of contents lists the same headings without bodies, so
 * for every section number we keep the occurrence with the longest body.
 * Review the output: headings that wrap or footnotes that intrude are the
 * usual things to fix by hand.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);
}
const [file, jurisdiction, title] = positional;
if (!file || !jurisdiction || !title) {
  console.error('usage: node scripts/ingest.mjs <file.pdf|file.txt> <jurisdiction> "<Act title>" [--out name.md] [--label §]');
  process.exit(1);
}
const label = flags.label ?? "§";

async function readText(p) {
  if (/\.pdf$/i.test(p)) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: await fs.readFile(p) });
    const r = await parser.getText();
    await parser.destroy();
    return r.text;
  }
  return fs.readFile(p, "utf8");
}

/** Any numbered line: "39. Annual general meeting" / "43A. Something" / "73 AA.DESIGNATED…" / "77. (1) Every…" */
const NUMBERED = /^\s*(?:\d?\[)?\s*(\d{1,3})\s?([A-Z]{0,3})\.?\s*([A-Z(][^\n]{1,400})$/;
/** "Title.- (1) body" — Karnataka / West Bengal put the first sub-section on the heading line; Tamil Nadu uses "__". */
const INLINE = /^(.{3,200}?)[.,]\s*(?:[-—–]|_+)\s*(\[?\(.*|[A-Z].*)$/;
/** "INDEMNITY FOR ACTS DONE IN GOOD FAITH. No suit, prosecution…" — shouted title, sentence follows. */
const SHOUT_THEN_SENTENCE = /^([A-Z][A-Z ,'&()/-]{5,140}?)\.\s+([A-Z(].*)$/;
/** Running page headers: "2  Gujarat Co-operative Societies Act, 1961  [1962 : Guj. X" */
const RUNNING_HEADER = /\[\d{4}\s*:|\bAct, \d{4}\s*\[/;

/** Mostly upper-case, as Maharashtra prints its headings. */
function isShouted(t) {
  const letters = t.replace(/[^A-Za-z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return letters.length >= 6 && upper / letters.length >= 0.8;
}

/** "COMMITTEES. ITS POWERS AND FUNCTIONS." → "Committees. Its powers and functions" */
function sentenceCase(t) {
  if (!isShouted(t)) return t;
  return t.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase());
}
/** Amendment footnotes that look like headings. */
const FOOTNOTE = /\b(re-?numbered|substituted|inserted|deleted|omitted|added|amended)\b.*\b(by|w\.e\.f|ibid)\b|\b(was|were) (re-?numbered|substituted|inserted|deleted|omitted|added|amended)\b|\bibid\b|\bby (Mah|Guj|Kar|T\.?N|W\.?B|Act)\.? ?\d/i;
/** Sentence openers: a numbered line starting this way is a sub-section, not a heading. */
const SENTENCE = /^(It|This|These|Every|Where|Whereas|If|Notwithstanding|Save|Subject|Nothing|Such|Whenever|There|He|She|They|In this|For the purposes)\b/;
/** A heading whose last word cannot end a title. */
const DANGLING = /\b(of|on|or|and|to|in|for|the|a|an|by|with|under|from|into|not|be|as)$/i;
/** Lines that are page furniture rather than content. */
const NOISE = /^\s*(\d{1,3}\s*$|page \d+|-- \d+ of \d+ --|THE GAZETTE|[-_]{3,}\s*$)/i;

function clean(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/ /g, " ")
    .split("\n")
    .filter((l) => !NOISE.test(l))
    .join("\n");
}

function parse(text) {
  const lines = clean(text).split("\n");

  // Pass 1: every numbered line is an occurrence of a section number. It may
  // carry a title ("39. Annual general meeting"), a body ("39. (1) Every…",
  // as Gujarat prints it, titles living in the margin), or both
  // ("29. Annual general meeting.- (1) Every…", Karnataka / West Bengal).
  const occ = []; // { num, title?, bodyStart (line index), lead (text on the same line) }
  for (let i = 0; i < lines.length; i++) {
    const m = NUMBERED.exec(lines[i]);
    if (!m) continue;
    const num = m[1] + m[2];
    let rest = m[3].trim();
    let title = null;
    let lead = "";
    // A heading that wraps continues on the next line or two: "…or vice-" + "president in
    // certain cases", "…fund on" + "winding up…", "…of co-operative" + "societies.- (1) …"
    let consumed = 0;
    let fromContents = false; // carried a page number, as contents entries do
    const PAGE = /\s+\d{1,3}(-\d{1,3})?$/;
    for (let j = 1; j <= 2; j++) {
      const next = (lines[i + j] ?? "").trim();
      const bare = rest.replace(PAGE, "");
      const dangling = /-$/.test(bare) || DANGLING.test(bare) || /^[a-z]/.test(next);
      if (INLINE.test(rest) || !dangling || !next || /^\(/.test(next) || NUMBERED.test(next) || next.length > 120) break;
      if (bare !== rest) fromContents = true;
      rest = /-$/.test(bare) ? bare + next : `${bare} ${next}`;
      consumed = j;
    }
    rest = rest.replace(/\s+/g, " ");
    const inline = INLINE.exec(rest) ?? (SHOUT_THEN_SENTENCE.exec(rest)?.[1] && isShouted(SHOUT_THEN_SENTENCE.exec(rest)[1]) ? SHOUT_THEN_SENTENCE.exec(rest) : null);
    if (inline) {
      rest = inline[1];
      lead = inline[2];
    }
    if (/^\[?\(/.test(rest)) {
      lead = rest; // body only
    } else if (/^[A-Z]/.test(rest)) {
      const noPage = rest.replace(PAGE, ""); // contents page numbers / ranges
      if (noPage !== rest) fromContents = true;
      const sentenceShaped = !fromContents && (/[.]$/.test(rest) || /\b(shall|must|may)\b/.test(rest));
      const raw = noPage.replace(fromContents ? /[\s.:_,;-]+$/ : /[\s.:_-]+$/, "").trim();
      const furniture = FOOTNOTE.test(raw) || RUNNING_HEADER.test(raw);
      const rejected =
        furniture ||
        /[,;]$/.test(raw) ||
        (SENTENCE.test(raw) && sentenceShaped) ||
        (!isShouted(raw) && sentenceShaped && raw.length > 60) ||
        raw.length < 3;
      if (rejected && !lead) {
        if (furniture) continue;
        const prev = occ[occ.length - 1];
        const n = Number(m[1]);
        // "1. This Act may be called…" / "2. It extends to…" straight after a heading:
        // sub-sections printed with bare numbers — they belong to the heading above.
        if (prev && (prev.num === num || (!prev.lead && SENTENCE.test(raw) && Number(prev.num.replace(/\D/g, "")) + 1 === n))) continue;
        lead = rest; // a single-paragraph section whose title lives in the margin (Gujarat)
      } else if (!rejected) {
        title = raw;
      }
    } else {
      continue;
    }
    const bodyStart = i + 1 + consumed;
    if (process.env.INGEST_DEBUG === num) console.error("occurrence", i, JSON.stringify(lines[i]).slice(0, 110), { title, lead: lead.slice(0, 40) });
    occ.push({ num, title: title && sentenceCase(title.replace(/[.\s]+$/, "")), bodyStart, lead, line: i });
  }

  // Pass 2: bodies run to the next occurrence; keep the longest body per number
  // (the contents list has none) and the first sensible title.
  const best = new Map();
  for (let k = 0; k < occ.length; k++) {
    const o = occ[k];
    const end = k + 1 < occ.length ? occ[k + 1].line : lines.length;
    const body = [o.lead, ...lines.slice(o.bodyStart, end)]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const cur = best.get(o.num) ?? { num: o.num, title: null, body: "" };
    if (!cur.title && o.title) cur.title = o.title;
    if (body.length > cur.body.length) cur.body = body;
    best.set(o.num, cur);
  }

  // Pass 3: a section still without a title takes it from any contents-style
  // line for its number ("5. Registration with limited or unlimited liability, 3"),
  // joining a wrapped second line when the first one clearly continues.
  for (const sec of best.values()) {
    if (sec.title) continue;
    const esc = sec.num.replace(/([A-Z]+)$/, " ?$1");
    const toc = new RegExp(`^\s*${esc}\.?\s+([A-Z][^\n]{3,140}?)\s*(?:\d{1,3}(-\d{1,3})?)?\s*$`);
    for (let i = 0; i < lines.length; i++) {
      const m = toc.exec(lines[i]);
      if (!m) continue;
      let t = m[1].trim();
      if (/^\(/.test(t) || SENTENCE.test(t) || FOOTNOTE.test(t) || RUNNING_HEADER.test(t)) continue;
      const next = (lines[i + 1] ?? "").trim();
      if ((/[,-]$/.test(t) || DANGLING.test(t) || /^[a-z]/.test(next)) && next && !NUMBERED.test(next) && next.length < 120) {
        t = `${t.replace(/-$/, "")}${/-$/.test(t) ? "" : " "}${next.replace(/\s*\d{1,3}(-\d{1,3})?$/, "")}`;
      }
      sec.title = sentenceCase(t.replace(/[\s.:_,;-]+$/, "").replace(/\s+/g, " "));
      break;
    }
  }

  const numKey = (n) => {
    const m = /^(\d+)([A-Z]*)$/.exec(n);
    return [Number(m[1]), m[2]];
  };
  return [...best.values()]
    .filter((s) => s.body.length > 40)
    .map((s) => ({ ...s, title: s.title ?? "" }))
    .sort((a, b) => {
      const [x, xs] = numKey(a.num);
      const [y, ys] = numKey(b.num);
      return x - y || xs.localeCompare(ys);
    });
}

const raw = await readText(file);
const sections = parse(raw);
if (!sections.length) {
  console.error("No sections recognised. Check the text layer (scanned PDFs need OCR first).");
  process.exit(2);
}

const md = [
  `# ${title}`,
  "",
  `<!-- Ingested from ${path.basename(file)} by scripts/ingest.mjs. Review headings and bodies before relying on them. -->`,
  "",
  ...sections.flatMap((s) => [`## ${label}${s.num} ${s.title}`.trimEnd(), s.body, ""]),
].join("\n");

const outName = flags.out ?? `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.md`;
const outDir = path.join(process.cwd(), "corpus", jurisdiction);
await fs.mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, outName);
await fs.writeFile(outPath, md, "utf8");
console.log(`${sections.length} sections → ${path.relative(process.cwd(), outPath)}`);
console.log(`first: ${label}${sections[0].num} ${sections[0].title}  …  last: ${label}${sections.at(-1).num} ${sections.at(-1).title}`);
