/**
 * The four Markdown forms the model actually produces, and nothing else:
 * **bold**, "- " bullet lists, "1. " numbered lists and "### " headings.
 * Everything unrecognised is plain text, and an unfinished token mid-stream
 * ("**partial", "1.") stays literal until the closing characters arrive,
 * so a streaming answer never flickers between shapes.
 *
 * The parser returns a small tree; AnswerText renders it and runs its own
 * [n] citation pass over the text leaves.
 */
export type InlineNode = { type: "text"; text: string } | { type: "bold"; text: string };

export type Block =
  | { type: "paragraph"; inline: InlineNode[] }
  | { type: "heading"; level: 1 | 2 | 3; inline: InlineNode[] }
  | { type: "list"; ordered: boolean; start: number; items: InlineNode[][] };

const BOLD = /\*\*([^*\n]+?)\*\*/g;
const HEADING = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,3})[.)]\s+(.*)$/;

/** "a **b** c" -> [text a, bold b, text c]; unmatched "**" is literal. */
export function parseInline(text: string): InlineNode[] {
  const out: InlineNode[] = [];
  let last = 0;
  for (const m of text.matchAll(BOLD)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ type: "text", text: text.slice(last, idx) });
    out.push({ type: "bold", text: m[1] });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  if (out.length === 0) out.push({ type: "text", text: "" });
  return out;
}

type LineKind = "heading" | "bullet" | "numbered" | "text";

function classify(line: string): { kind: LineKind; body: string; level?: 1 | 2 | 3; number?: number } {
  const h = HEADING.exec(line);
  if (h) return { kind: "heading", body: h[2], level: h[1].length as 1 | 2 | 3 };
  const b = BULLET.exec(line);
  if (b) return { kind: "bullet", body: b[1] };
  const n = NUMBERED.exec(line);
  if (n) return { kind: "numbered", body: n[2], number: Number(n[1]) };
  return { kind: "text", body: line };
}

/**
 * One chunk (text between blank lines) may hold a heading followed by its
 * paragraph, or a run of list items; consecutive lines of one kind form a
 * block. Text lines are joined with a newline, as the source had them.
 */
export function parseChunk(chunk: string): Block[] {
  const lines = chunk.split("\n").filter((l) => l.trim() !== "");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const first = classify(lines[i]);
    if (first.kind === "heading") {
      blocks.push({ type: "heading", level: first.level ?? 3, inline: parseInline(first.body) });
      i += 1;
      continue;
    }
    if (first.kind === "bullet" || first.kind === "numbered") {
      const ordered = first.kind === "numbered";
      const items: InlineNode[][] = [];
      let start = first.number ?? 1;
      let firstItem = true;
      while (i < lines.length) {
        const c = classify(lines[i]);
        if (c.kind !== first.kind) break;
        if (firstItem) {
          start = c.number ?? 1;
          firstItem = false;
        }
        items.push(parseInline(c.body));
        i += 1;
      }
      blocks.push({ type: "list", ordered, start, items });
      continue;
    }
    const text: string[] = [];
    while (i < lines.length && classify(lines[i]).kind === "text") {
      text.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "paragraph", inline: parseInline(text.join("\n")) });
  }
  return blocks;
}

/** Whole answer -> blocks; blank lines separate chunks, as AnswerText always split them. */
export function parseMarkdownLite(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    if (chunk.trim() === "") continue;
    blocks.push(...parseChunk(chunk));
  }
  return blocks;
}

/** The plain text of a block tree, for copying and reading aloud. */
export function blocksToText(blocks: Block[]): string {
  const inline = (nodes: InlineNode[]) => nodes.map((n) => n.text).join("");
  return blocks
    .map((b) => {
      if (b.type === "paragraph" || b.type === "heading") return inline(b.inline);
      return b.items.map((it, i) => `${b.ordered ? `${b.start + i}.` : "-"} ${inline(it)}`).join("\n");
    })
    .join("\n\n");
}
