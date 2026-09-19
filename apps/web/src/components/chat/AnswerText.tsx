"use client";

import { Fragment } from "react";

type Props = {
  text: string;
  streaming?: boolean;
  activeCitation?: number | null;
  onCite?: (id: number) => void;
};

const MARKER = /\[(\d{1,2})\]/g;

/**
 * Renders answer text as paragraphs, turning [n] markers into citation chips
 * that highlight the matching ledger entry.
 */
export function AnswerText({ text, streaming, activeCitation, onCite }: Props) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, pi) => {
        const parts: React.ReactNode[] = [];
        let last = 0;
        for (const m of para.matchAll(MARKER)) {
          const idx = m.index ?? 0;
          if (idx > last) parts.push(para.slice(last, idx));
          const n = Number(m[1]);
          parts.push(
            <button
              key={`${pi}-${idx}`}
              type="button"
              className="cite"
              data-active={activeCitation === n}
              onClick={() => onCite?.(n)}
              aria-label={`Source ${n}`}
            >
              {n}
            </button>,
          );
          last = idx + m[0].length;
        }
        if (last < para.length) parts.push(para.slice(last));

        const isLast = pi === paragraphs.length - 1;
        return (
          <p key={pi} className={isLast && streaming ? "caret" : undefined}>
            {parts.map((p, i) => (
              <Fragment key={i}>{p}</Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
