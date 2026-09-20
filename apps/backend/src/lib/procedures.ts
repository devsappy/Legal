import { promises as fs } from "node:fs";
import path from "node:path";
import type { Checklist } from "@sahayak/shared";

/**
 * Step-by-step procedures live in corpus/procedures/<jurisdiction>.json so
 * they can be edited without touching code. Each entry has the Checklist
 * shape (title, summary, authority, basis, steps) with en/hi/mr/ta text.
 */
const DIR = path.join(process.cwd(), "corpus", "procedures");

export async function loadProcedures(): Promise<Checklist[]> {
  let names: string[] = [];
  try {
    names = (await fs.readdir(DIR)).filter((n) => n.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const out: Checklist[] = [];
  for (const name of names) {
    try {
      const list = JSON.parse(await fs.readFile(path.join(DIR, name), "utf8")) as Checklist[];
      out.push(...list);
    } catch (err) {
      console.warn(`[procedures] skipped ${name}: ${(err as Error).message}`);
    }
  }
  // Central first, then states alphabetically; keeps the list stable.
  return out.sort((a, b) => (a.jurisdiction === "central" ? -1 : b.jurisdiction === "central" ? 1 : a.jurisdiction.localeCompare(b.jurisdiction)));
}

export async function findProcedure(slug: string): Promise<Checklist | undefined> {
  return (await loadProcedures()).find((c) => c.slug === slug);
}
