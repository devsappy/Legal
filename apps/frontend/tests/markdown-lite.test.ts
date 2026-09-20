import { describe, expect, it } from "vitest";
import { blocksToText, parseInline, parseMarkdownLite } from "@/lib/markdown-lite";

describe("markdown-lite inline", () => {
  it("splits bold runs and leaves the rest as text", () => {
    expect(parseInline("A **quorum** is needed [1].")).toEqual([
      { type: "text", text: "A " },
      { type: "bold", text: "quorum" },
      { type: "text", text: " is needed [1]." },
    ]);
  });

  it("keeps an unfinished bold marker literal while streaming", () => {
    expect(parseInline("Wait for **the rest")).toEqual([{ type: "text", text: "Wait for **the rest" }]);
    expect(parseInline("")).toEqual([{ type: "text", text: "" }]);
  });
});

describe("markdown-lite blocks", () => {
  it("renders plain paragraphs unchanged", () => {
    expect(parseMarkdownLite("One.\n\nTwo [2].")).toEqual([
      { type: "paragraph", inline: [{ type: "text", text: "One." }] },
      { type: "paragraph", inline: [{ type: "text", text: "Two [2]." }] },
    ]);
  });

  it("parses bullet lists", () => {
    const [list] = parseMarkdownLite("- Notice of 14 days\n- Quorum of one-fifth [1]\n* Minutes");
    expect(list.type).toBe("list");
    if (list.type !== "list") return;
    expect(list.ordered).toBe(false);
    expect(list.items.map((i) => i.map((n) => n.text).join(""))).toEqual([
      "Notice of 14 days",
      "Quorum of one-fifth [1]",
      "Minutes",
    ]);
  });

  it("parses numbered lists with their start number", () => {
    const [list] = parseMarkdownLite("3. File Form A\n4) Pay the fee");
    expect(list).toMatchObject({ type: "list", ordered: true, start: 3 });
    if (list.type !== "list") return;
    expect(list.items).toHaveLength(2);
  });

  it("parses headings and the paragraph that follows in the same chunk", () => {
    const blocks = parseMarkdownLite("### Summary\nThe board cannot extend its own term.");
    expect(blocks).toEqual([
      { type: "heading", level: 3, inline: [{ type: "text", text: "Summary" }] },
      { type: "paragraph", inline: [{ type: "text", text: "The board cannot extend its own term." }] },
    ]);
  });

  it("does not turn a bare number or dash into a list", () => {
    expect(parseMarkdownLite("1.")).toEqual([{ type: "paragraph", inline: [{ type: "text", text: "1." }] }]);
    expect(parseMarkdownLite("-")).toEqual([{ type: "paragraph", inline: [{ type: "text", text: "-" }] }]);
    expect(parseMarkdownLite("2024-25 is the year")).toEqual([
      { type: "paragraph", inline: [{ type: "text", text: "2024-25 is the year" }] },
    ]);
  });

  it("keeps bold inside list items", () => {
    const [list] = parseMarkdownLite("- **Form A**: application");
    if (list.type !== "list") throw new Error("expected a list");
    expect(list.items[0]).toEqual([
      { type: "bold", text: "Form A" },
      { type: "text", text: ": application" },
    ]);
  });

  it("round-trips to plain text", () => {
    const text = "### Steps\n\n1. First\n2. Second\n\nDone **now**.";
    expect(blocksToText(parseMarkdownLite(text))).toBe("Steps\n\n1. First\n2. Second\n\nDone now.");
  });

  it("works with Devanagari and Tamil text", () => {
    const blocks = parseMarkdownLite("- **कोरम**: एक-पाँचवाँ [1]\n- गणपूर्ती\n\n### சுருக்கம்\nபதில்");
    expect(blocks[0].type).toBe("list");
    expect(blocks[1]).toEqual({ type: "heading", level: 3, inline: [{ type: "text", text: "சுருக்கம்" }] });
  });
});
