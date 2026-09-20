import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The four message files must describe the same tree: every key present in
 * every locale, and arrays (t.raw lists) the same length, so no page can hit
 * MISSING_MESSAGE or index past the end in one language only.
 */
const LOCALES = ["en", "hi", "mr", "ta"] as const;
const DIR = path.resolve(__dirname, "../messages");

type Tree = { [key: string]: unknown };

function load(locale: string): Tree {
  return JSON.parse(readFileSync(path.join(DIR, `${locale}.json`), "utf8")) as Tree;
}

/** "landing.faq.items" -> "array:8", "app.name" -> "string"; nested objects recurse. */
function flatten(tree: Tree, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      out[full] = `array:${value.length}`;
      // Object items inside arrays must match shape too (faq items, examples).
      value.forEach((item, i) => {
        if (item && typeof item === "object" && !Array.isArray(item)) flatten(item as Tree, `${full}[${i}]`, out);
      });
    } else if (value && typeof value === "object") {
      flatten(value as Tree, full, out);
    } else {
      out[full] = typeof value;
    }
  }
  return out;
}

const trees = Object.fromEntries(LOCALES.map((l) => [l, flatten(load(l))])) as Record<(typeof LOCALES)[number], Record<string, string>>;
const reference = trees.en;

describe("message files", () => {
  it("parse and have a top-level namespace tree", () => {
    for (const locale of LOCALES) expect(Object.keys(trees[locale]).length).toBeGreaterThan(0);
  });

  for (const locale of LOCALES.slice(1)) {
    describe(locale, () => {
      it("has every key that en has", () => {
        const missing = Object.keys(reference).filter((k) => !(k in trees[locale]));
        expect(missing, `${locale}.json is missing:\n  ${missing.join("\n  ")}`).toEqual([]);
      });

      it("has no keys that en lacks", () => {
        const extra = Object.keys(trees[locale]).filter((k) => !(k in reference));
        expect(extra, `${locale}.json has keys en.json lacks:\n  ${extra.join("\n  ")}`).toEqual([]);
      });

      it("matches en's array lengths and value types", () => {
        const differing = Object.keys(reference)
          .filter((k) => k in trees[locale] && trees[locale][k] !== reference[k])
          .map((k) => `${k}: en ${reference[k]}, ${locale} ${trees[locale][k]}`);
        expect(differing, `${locale}.json differs in shape:\n  ${differing.join("\n  ")}`).toEqual([]);
      });

      it("has no empty values", () => {
        const tree = load(locale);
        const empties: string[] = [];
        const walk = (node: unknown, p: string) => {
          if (typeof node === "string") {
            if (!node.trim()) empties.push(p);
          } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${p}[${i}]`));
          else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, p ? `${p}.${k}` : k);
        };
        walk(tree, "");
        expect(empties, `${locale}.json has empty values:\n  ${empties.join("\n  ")}`).toEqual([]);
      });
    });
  }

  it("uses the same ICU placeholders in every locale", () => {
    const placeholders = (s: string) => [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort().join(",");
    const strings = (locale: string, out: Record<string, string> = {}) => {
      const walk = (node: unknown, p: string) => {
        if (typeof node === "string") out[p] = placeholders(node);
        else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${p}[${i}]`));
        else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walk(v, p ? `${p}.${k}` : k);
      };
      walk(load(locale), "");
      return out;
    };
    const en = strings("en");
    for (const locale of LOCALES.slice(1)) {
      const other = strings(locale);
      const bad = Object.keys(en).filter((k) => en[k] && k in other && other[k] !== en[k]);
      expect(bad, `${locale}.json placeholders differ from en:\n  ${bad.join("\n  ")}`).toEqual([]);
    }
  });
});
