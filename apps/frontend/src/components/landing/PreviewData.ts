import { pick, type Citation } from "@sahayak/shared";
import { MOCK_ANSWER, MOCK_CITATIONS } from "@/lib/mock-data";

/**
 * What the hero's product preview plays back: the same canned answer the
 * mock chat route streams (lib/mock-data.ts, read-only here), broken into
 * words and citation markers so the island can reveal it one word at a
 * time. The sample question lives in the messages (landing.preview.sample)
 * with the rest of the copy.
 */
export type PreviewToken = { kind: "word"; text: string } | { kind: "cite"; n: number };

/** The answer as paragraphs of tokens, for the locale given (English when a translation is missing). */
export function previewAnswer(locale: string): PreviewToken[][] {
  return tokenise(pick(MOCK_ANSWER.text, locale));
}

/** Two verified sections and one the pipeline could not confirm. */
export const PREVIEW_CITATIONS: readonly Citation[] = MOCK_CITATIONS;

/* Playback timing, in milliseconds. */
export const PREVIEW_TIMING = {
  /** Wait after the island scrolls into view before the first keystroke. */
  lead: 300,
  /** Per character of the typed question. */
  char: 34,
  /** The pause between the question and the first word of the answer. */
  think: 700,
  /** Per word (or citation chip) of the answer. */
  word: 28,
} as const;

/**
 * Splits text into paragraphs of words and `[n]` markers. Punctuation stays
 * attached to its word ("bylaws", "[2]", "."), and the renderer decides the
 * spacing, so a marker can sit between a word and its full stop.
 */
export function tokenise(text: string): PreviewToken[][] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const out: PreviewToken[] = [];
      for (const part of paragraph.split(/(\[\d+\])/)) {
        const cite = /^\[(\d+)\]$/.exec(part);
        if (cite) {
          out.push({ kind: "cite", n: Number(cite[1]) });
          continue;
        }
        for (const word of part.split(/\s+/)) if (word) out.push({ kind: "word", text: word });
      }
      return out;
    })
    .filter((p) => p.length > 0);
}

/** Total playable units across every paragraph. */
export function countTokens(paragraphs: PreviewToken[][]): number {
  return paragraphs.reduce((n, p) => n + p.length, 0);
}
