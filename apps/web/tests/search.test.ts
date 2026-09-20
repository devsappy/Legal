import { describe, expect, it } from "vitest";
import { search, tokenize } from "@/lib/rag/search";
import type { Section } from "@/lib/rag/corpus";

const sec = (id: string, section: string, title: string, text: string): Section => ({
  id,
  jurisdiction: "central",
  act: "Test Act",
  section,
  title,
  text,
  file: "corpus/central/test.md",
});

const SECTIONS = [
  sec("a", "§39", "Annual general meeting", "The board shall call the annual general meeting within six months after the close of the year."),
  sec("b", "§40", "Special general meeting", "The chief executive may call a special general meeting on the direction of the board."),
  sec("c", "§84", "Reference of disputes", "Disputes touching the constitution or management of the society shall be referred to arbitration."),
  sec("d", "§25", "Persons who may become members", "No person shall be admitted as a member unless he needs the services of the society."),
];

describe("tokenize", () => {
  it("keeps Indic script words and drops English stop words", () => {
    expect(tokenize("What is the quorum for the annual general meeting?")).toEqual(["quorum", "annual", "general", "meeting"]);
    expect(tokenize("वार्षिक आम सभा")).toEqual(["वार्षिक", "आम", "सभा"]);
  });
});

describe("search (BM25)", () => {
  it("ranks the section about the query first", () => {
    const hits = search(SECTIONS, "annual general meeting six months", 3);
    expect(hits[0].section.section).toBe("§39");
    expect(hits.map((h) => h.section.section)).toContain("§40");
  });

  it("finds disputes by topic words", () => {
    expect(search(SECTIONS, "dispute arbitration management", 1)[0].section.section).toBe("§84");
  });

  it("returns nothing for words that appear nowhere", () => {
    expect(search(SECTIONS, "helicopter", 5)).toHaveLength(0);
  });
});
