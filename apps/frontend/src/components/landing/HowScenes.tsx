import type { CSSProperties, ReactNode } from "react";
import { LANGUAGES } from "@sahayak/shared";

/*
 * Three line-art scenes for the "How it works" tabs, drawn the way the
 * Skyline is: 1.25px currentColor strokes, every shape carrying
 * pathLength="1" so the `.skyline [pathLength]` rule traces it in, groups
 * staggered through --d. Remounted (keyed) with the active tab so each
 * scene draws itself when it appears. Decorative: the tab panel's text
 * carries the meaning.
 */
const P = { pathLength: 1 } as const;
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 320 180"
      className={`skyline h-auto w-full ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** A tick, 10px wide, with its top-left at (x, y). */
function Tick({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y + 4} l3 3 l7 -8`} strokeWidth="1.75" {...P} />;
}

/** A citation chip: rounded box with the number. */
function Chip({ x, y, n, className }: { x: number; y: number; n: number; className?: string }) {
  return (
    <g className={className}>
      <rect x={x} y={y} width={18} height={14} rx={3} {...P} />
      <text x={x + 9} y={y + 10.5} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono), ui-monospace, monospace" fontWeight="600" fill="currentColor" stroke="none">
        {n}
      </text>
    </g>
  );
}

/** A flag: a circle with an exclamation mark. */
function Flag({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} {...P} />
      <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 0.5} strokeWidth="1.75" {...P} />
      <circle cx={cx} cy={cy + 3} r={0.6} fill="currentColor" stroke="none" />
    </g>
  );
}

const FONT_FOR: Record<string, string> = {
  hi: "var(--font-devanagari), var(--font-body), sans-serif",
  mr: "var(--font-devanagari), var(--font-body), sans-serif",
  ta: "var(--font-tamil), var(--font-body), sans-serif",
};

/** 1 · A composer with the four language chips, a microphone and a send button. */
export function SceneAsk() {
  return (
    <Frame>
      <g style={d(0)}>
        {LANGUAGES.map((l, i) => {
          const x = 16 + i * 58;
          return (
            <g key={l.code}>
              <rect x={x} y={14} width={52} height={20} rx={10} {...P} />
              <text
                x={x + 26}
                y={27.5}
                textAnchor="middle"
                fontSize="9"
                fontFamily={FONT_FOR[l.code] ?? "var(--font-body), sans-serif"}
                fontWeight="500"
                fill="currentColor"
                stroke="none"
                lang={l.code}
              >
                {l.native}
              </text>
            </g>
          );
        })}
      </g>
      <g style={d(250)}>
        <rect x={16} y={62} width={288} height={60} rx={10} {...P} />
        <line x1={32} y1={82} x2={168} y2={82} {...P} />
        <line x1={32} y1={98} x2={120} y2={98} {...P} />
        <line x1={124} y1={92} x2={124} y2={104} strokeWidth="1.75" {...P} />
      </g>
      <g style={d(500)}>
        {/* microphone */}
        <rect x={246} y={78} width={10} height={17} rx={5} {...P} />
        <path d="M240 90 a11 11 0 0 0 22 0" {...P} />
        <line x1={251} y1={101} x2={251} y2={107} {...P} />
        <line x1={245} y1={107} x2={257} y2={107} {...P} />
        {/* send */}
        <circle cx={284} cy={92} r={12} {...P} />
        <line x1={284} y1={98} x2={284} y2={86} {...P} />
        <path d="M279 91 l5 -5 l5 5" {...P} />
      </g>
      <g style={d(700)}>
        <line x1={16} y1={146} x2={96} y2={146} {...P} />
        <line x1={16} y1={158} x2={64} y2={158} {...P} />
      </g>
    </Frame>
  );
}

/** 2 · A magnifier over a ruled page of the Act, one section picked out. */
export function SceneRead() {
  const rules = Array.from({ length: 7 }, (_, i) => 52 + i * 16);
  return (
    <Frame>
      <g style={d(0)}>
        <rect x={40} y={14} width={200} height={152} rx={6} {...P} />
        <line x1={40} y1={38} x2={240} y2={38} {...P} />
        <text x={56} y={30} fontSize="9" fontFamily="var(--font-mono), ui-monospace, monospace" fontWeight="600" fill="currentColor" stroke="none">
          §39
        </text>
        <line x1={84} y1={27} x2={200} y2={27} {...P} />
      </g>
      <g style={d(200)}>
        {rules.map((y, i) => (
          <line key={y} x1={56} y1={y} x2={i === 3 ? 160 : 224} y2={y} {...P} />
        ))}
      </g>
      <g style={d(500)}>
        <rect x={50} y={92} width={180} height={18} rx={3} fill="currentColor" fillOpacity={0.08} stroke="none" />
        <Tick x={22} y={97} />
      </g>
      <g style={d(700)}>
        <circle cx={232} cy={104} r={28} fill="var(--sheet)" {...P} />
        <line x1={216} y1={98} x2={248} y2={98} strokeWidth="1.75" {...P} />
        <line x1={216} y1={110} x2={240} y2={110} strokeWidth="1.75" {...P} />
        <line x1={252} y1={124} x2={286} y2={158} strokeWidth="3" {...P} />
      </g>
    </Frame>
  );
}

/** 3 · The answer with its citation chips and the ledger of sources: two ticked, one flagged. */
export function SceneCite() {
  return (
    <Frame>
      <g style={d(0)}>
        <rect x={16} y={14} width={24} height={24} rx={6} {...P} />
        <line x1={28} y1={20} x2={28} y2={32} {...P} />
        <line x1={22} y1={24} x2={34} y2={24} {...P} />
        <line x1={52} y1={22} x2={244} y2={22} {...P} />
        <line x1={52} y1={38} x2={196} y2={38} {...P} />
        <Chip x={204} y={31} n={1} />
        <line x1={52} y1={54} x2={140} y2={54} {...P} />
        <Chip x={148} y={47} n={2} />
      </g>
      <g style={d(300)}>
        <line x1={52} y1={78} x2={216} y2={78} {...P} />
        <Chip x={224} y={71} n={3} className="text-seal" />
        <line x1={52} y1={94} x2={120} y2={94} {...P} />
      </g>
      <g style={d(550)}>
        <line x1={16} y1={112} x2={304} y2={112} {...P} />
        <Chip x={16} y={121} n={1} />
        <Tick x={42} y={124} />
        <line x1={64} y1={128} x2={200} y2={128} {...P} />
        <Chip x={16} y={141} n={2} />
        <Tick x={42} y={144} />
        <line x1={64} y1={148} x2={176} y2={148} {...P} />
        <g className="text-seal">
          <Chip x={16} y={161} n={3} />
          <Flag cx={47} cy={168} />
        </g>
        <line x1={64} y1={168} x2={150} y2={168} {...P} />
      </g>
      <g style={d(800)} transform="rotate(-6 262 148)">
        <rect x={228} y={138} width={68} height={20} rx={2} strokeWidth="1.75" {...P} />
        <rect x={231} y={141} width={62} height={14} rx={1} {...P} />
        <line x1={238} y1={148} x2={286} y2={148} {...P} />
      </g>
    </Frame>
  );
}

export const SCENES = [SceneAsk, SceneRead, SceneCite] as const;
