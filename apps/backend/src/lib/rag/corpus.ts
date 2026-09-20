import { promises as fs } from "node:fs";
import path from "node:path";
import { JURISDICTIONS } from "@sahayak/shared";

/**
 * The Acts live as Markdown under apps/backend/corpus/<jurisdiction>/*.md:
 *
 *   # Multi-State Cooperative Societies Act, 2002
 *   ## §39(1) Annual general meeting
 *   Every multi-State co-operative society shall ...
 *   ## §40 Special general meeting
 *   ...
 *
 * One `##` heading per section: the first word is the section label
 * (§39, 39(1), cl. 24(3), Rule 12 ...), the rest is its title. The first
 * `#` heading names the Act. Files are re-read when they change.
 */
export type Section = {
  id: string;
  jurisdiction: string;
  act: string;
  section: string;
  title: string;
  text: string;
  file: string;
};

const CORPUS_DIR = path.join(process.cwd(), "corpus");

let cache: { stamp: string; sections: Section[] } | null = null;

async function listFiles(): Promise<{ file: string; jurisdiction: string; mtime: number }[]> {
  const out: { file: string; jurisdiction: string; mtime: number }[] = [];
  let dirs: string[] = [];
  try {
    dirs = await fs.readdir(CORPUS_DIR);
  } catch {
    return out;
  }
  for (const dir of dirs) {
    if (dir.startsWith("_")) continue; // _sources holds the original PDFs
    const full = path.join(CORPUS_DIR, dir);
    const st = await fs.stat(full).catch(() => null);
    if (!st?.isDirectory()) continue;
    for (const name of await fs.readdir(full)) {
      if (!/\.(md|txt)$/i.test(name)) continue;
      const file = path.join(full, name);
      const fst = await fs.stat(file);
      out.push({ file, jurisdiction: dir, mtime: fst.mtimeMs });
    }
  }
  return out;
}

/** "§39(1) Annual general meeting" → { section: "§39(1)", title: "Annual general meeting" } */
function splitHeading(h: string) {
  const m = /^((?:§|cl\.?\s*|rule\s+|section\s+|s\.\s*)?[\w().\-/]+)\s*[—–-]?\s*(.*)$/i.exec(h.trim());
  if (!m) return { section: h.trim(), title: "" };
  return { section: m[1].trim(), title: m[2].trim() };
}

export function parseMarkdown(markdown: string, jurisdiction: string, file: string): Section[] {
  const lines = markdown.split(/\r?\n/);
  const fallbackAct = JURISDICTIONS.find((j) => j.id === jurisdiction)?.act ?? path.basename(file);
  let act = fallbackAct;
  const sections: Section[] = [];
  let current: { heading: string; body: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const text = current.body.join("\n").trim();
    if (!text) return;
    const { section, title } = splitHeading(current.heading);
    const slug = section.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    sections.push({
      id: `${jurisdiction}/${path.basename(file, path.extname(file))}/${slug}`,
      jurisdiction,
      act,
      section,
      title,
      text,
      file: path.relative(process.cwd(), file),
    });
  };

  for (const line of lines) {
    if (/^#\s+/.test(line)) {
      act = line.replace(/^#\s+/, "").trim() || fallbackAct;
    } else if (/^##\s+/.test(line)) {
      flush();
      current = { heading: line.replace(/^##\s+/, ""), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  flush();
  return sections;
}

export async function loadCorpus(): Promise<Section[]> {
  const files = await listFiles();
  const stamp = files.map((f) => `${f.file}:${f.mtime}`).join("|");
  if (cache && cache.stamp === stamp) return cache.sections;
  const sections: Section[] = [];
  for (const f of files) {
    const md = await fs.readFile(f.file, "utf8");
    sections.push(...parseMarkdown(md, f.jurisdiction, f.file));
  }
  cache = { stamp, sections };
  return sections;
}

/** Sections a question in this jurisdiction may draw on: its own Act plus the central corpus. */
export async function sectionsFor(jurisdiction: string): Promise<Section[]> {
  const all = await loadCorpus();
  return all.filter((s) => s.jurisdiction === jurisdiction || s.jurisdiction === "central");
}
