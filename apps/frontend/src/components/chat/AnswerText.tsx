"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { parseMarkdownLite, type Block, type InlineNode } from "@/lib/markdown-lite";

type Props = {
  text: string;
  streaming?: boolean;
  activeCitation?: number | null;
  onCite?: (id: number) => void;
};

const MARKER = /\[(\d{1,2})\]/g;

/**
 * Renders answer text as light Markdown (bold, lists, headings) with [n]
 * markers turned into citation chips that highlight the matching ledger
 * entry. The Markdown pass runs first so a marker inside a bold run or a
 * list item still becomes a chip.
 */
export function AnswerText({ text, streaming, activeCitation, onCite }: Props) {
  const t = useTranslations("chat");
  const blocks = parseMarkdownLite(text);

  const cite = (n: number, key: string) => (
    <button
      key={key}
      type="button"
      className="cite"
      data-active={activeCitation === n}
      onClick={() => onCite?.(n)}
      aria-label={t("sourceLabel", { n })}
      aria-pressed={activeCitation === n}
    >
      {n}
    </button>
  );

  /** Text leaf -> text and chips. */
  const leaf = (value: string, key: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    let last = 0;
    for (const m of value.matchAll(MARKER)) {
      const idx = m.index ?? 0;
      if (idx > last) parts.push(<Fragment key={`${key}-t${idx}`}>{value.slice(last, idx)}</Fragment>);
      parts.push(cite(Number(m[1]), `${key}-c${idx}`));
      last = idx + m[0].length;
    }
    if (last < value.length) parts.push(<Fragment key={`${key}-t${last}`}>{value.slice(last)}</Fragment>);
    return parts;
  };

  const inline = (nodes: InlineNode[], key: string): ReactNode[] =>
    nodes.flatMap((n, i): ReactNode[] =>
      n.type === "bold"
        ? [
            <strong key={`${key}-b${i}`} className="font-semibold text-ink">
              {leaf(n.text, `${key}-b${i}`)}
            </strong>,
          ]
        : leaf(n.text, `${key}-${i}`),
    );

  const render = (block: Block, i: number, isLast: boolean) => {
    const caret = isLast && streaming ? "caret" : undefined;
    switch (block.type) {
      case "heading":
        return (
          <p key={i} className={clsx("font-sans text-base font-medium text-ink", caret)}>
            {inline(block.inline, `h${i}`)}
          </p>
        );
      case "list": {
        const Tag = block.ordered ? "ol" : "ul";
        return (
          <Tag
            key={i}
            start={block.ordered ? block.start : undefined}
            className={clsx("space-y-1 pl-5", block.ordered ? "list-decimal marker:font-mono marker:text-xs marker:text-ink-3" : "list-disc marker:text-ink-3")}
          >
            {block.items.map((item, j) => (
              <li key={j} className={clsx("pl-0.5", caret && j === block.items.length - 1 && "caret")}>
                {inline(item, `l${i}-${j}`)}
              </li>
            ))}
          </Tag>
        );
      }
      default:
        return (
          <p key={i} className={caret}>
            {inline(block.inline, `p${i}`)}
          </p>
        );
    }
  };

  return <div className="space-y-3">{blocks.map((b, i) => render(b, i, i === blocks.length - 1))}</div>;
}
