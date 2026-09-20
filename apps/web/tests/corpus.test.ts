import { describe, expect, it } from "vitest";
import { parseMarkdown } from "@/lib/rag/corpus";

describe("corpus Markdown parsing", () => {
  it("splits sections under an Act heading", () => {
    const md = [
      "# Multi-State Co-operative Societies Act, 2002",
      "",
      "## §39 Annual general meeting of general body",
      "(1) The board shall call the annual general meeting.",
      "",
      "## cl. 24(3) Quorum for general meetings",
      "One-fifth of the members form the quorum.",
    ].join("\n");
    const sections = parseMarkdown(md, "central", "corpus/central/test.md");
    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({ act: "Multi-State Co-operative Societies Act, 2002", section: "§39", title: "Annual general meeting of general body" });
    expect(sections[1]).toMatchObject({ section: "cl. 24(3)", title: "Quorum for general meetings" });
    expect(sections[1].text).toContain("One-fifth");
  });

  it("skips headings with no body", () => {
    expect(parseMarkdown("# Act\n## §1 Empty\n\n## §2 Full\nText here.", "central", "x.md").map((s) => s.section)).toEqual(["§2"]);
  });
});
