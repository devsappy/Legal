import type { CSSProperties } from "react";

/*
 * A cooperative-society streetscape in thin line art: sugar silos, a dairy
 * godown, a housing society block, the Registrar's office, a cooperative
 * bank tower, a clock tower and a row of shops. Every shape carries
 * pathLength="1" so one CSS rule can trace the whole drawing in; groups
 * stagger through --d. Decorative only.
 */

const P = { pathLength: 1 } as const;

function Windows({ x, y, cols, rows, w = 9, h = 12, gx = 7, gy = 9 }: { x: number; y: number; cols: number; rows: number; w?: number; h?: number; gx?: number; gy?: number }) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(<rect key={`${r}-${c}`} x={x + c * (w + gx)} y={y + r * (h + gy)} width={w} height={h} {...P} />);
  return <>{out}</>;
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 22 * s} {...P} />
      <circle cx={x} cy={y - 30 * s} r={12 * s} {...P} />
      <circle cx={x - 8 * s} cy={y - 24 * s} r={8 * s} {...P} />
      <circle cx={x + 8 * s} cy={y - 24 * s} r={8 * s} {...P} />
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d={`M${x} ${y} h${44 * s} a${10 * s} ${10 * s} 0 0 0 -6 ${-18 * s} a${14 * s} ${14 * s} 0 0 0 -24 ${-6 * s} a${11 * s} ${11 * s} 0 0 0 -18 ${10 * s} a${8 * s} ${8 * s} 0 0 0 4 ${14 * s} z`}
      {...P}
    />
  );
}

function Balloon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <path d={`M${x} ${y} c${-22 * s} 0 ${-22 * s} ${-30 * s} 0 ${-40 * s} c${22 * s} ${10 * s} ${22 * s} ${40 * s} 0 ${40 * s} z`} {...P} />
      <path d={`M${x - 10 * s} ${y - 20 * s} q${10 * s} ${-22 * s} ${20 * s} 0`} {...P} />
      <line x1={x - 5 * s} y1={y} x2={x - 3 * s} y2={y + 12 * s} {...P} />
      <line x1={x + 5 * s} y1={y} x2={x + 3 * s} y2={y + 12 * s} {...P} />
      <rect x={x - 5 * s} y={y + 12 * s} width={10 * s} height={7 * s} {...P} />
    </g>
  );
}

export function Skyline({ className }: { className?: string }) {
  const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
  return (
    <svg
      viewBox="0 0 1400 340"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Sky */}
      <g className="sky-float" style={d(0)}>
        <circle cx="700" cy="62" r="20" {...P} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={700 + Math.cos(a) * 27} y1={62 + Math.sin(a) * 27} x2={700 + Math.cos(a) * 35} y2={62 + Math.sin(a) * 35} {...P} />;
        })}
      </g>
      <g className="sky-drift" style={d(200)}>
        <Cloud x={160} y={96} />
        <Cloud x={1130} y={70} s={0.8} />
        <Cloud x={60} y={190} s={0.6} />
        <Cloud x={1290} y={150} s={0.55} />
      </g>
      <g className="sky-sway" style={d(300)}>
        {/* kite */}
        <path d="M330 52 l22 24 l-22 30 l-22 -30 z" {...P} />
        <line x1="330" y1="52" x2="330" y2="106" {...P} />
        <line x1="308" y1="76" x2="352" y2="76" {...P} />
        <path d="M330 106 q-14 20 -4 36 q8 14 -6 30" {...P} />
      </g>
      <g className="sky-float" style={d(400)}>
        <Balloon x={1240} y={120} />
        <Balloon x={1330} y={200} s={0.7} />
      </g>

      {/* Ground */}
      <line x1="0" y1="320" x2="1400" y2="320" {...P} style={d(0)} />

      {/* Sugar cooperative silos */}
      <g style={d(100)}>
        <rect x="40" y="210" width="44" height="110" {...P} />
        <path d="M40 210 a22 8 0 0 1 44 0" {...P} />
        <path d="M40 200 a22 10 0 0 1 44 0" {...P} />
        <rect x="94" y="230" width="44" height="90" {...P} />
        <path d="M94 230 a22 8 0 0 1 44 0" {...P} />
        <path d="M94 220 a22 10 0 0 1 44 0" {...P} />
        <line x1="84" y1="250" x2="94" y2="250" {...P} />
        <line x1="84" y1="290" x2="94" y2="290" {...P} />
      </g>

      {/* Dairy godown with sawtooth roof */}
      <g style={d(200)}>
        <rect x="170" y="252" width="170" height="68" {...P} />
        <path d="M170 252 l28 -26 l14 26 l28 -26 l14 26 l28 -26 l14 26 l28 -26 l16 26" {...P} />
        <rect x="190" y="282" width="24" height="38" {...P} />
        <rect x="250" y="270" width="18" height="14" {...P} />
        <rect x="290" y="270" width="18" height="14" {...P} />
      </g>
      <Tree x={360} y={320} s={0.9} />

      {/* Housing society block */}
      <g style={d(300)}>
        <rect x="390" y="118" width="110" height="202" {...P} />
        <rect x="405" y="104" width="30" height="14" {...P} />
        <line x1="420" y1="104" x2="420" y2="84" {...P} />
        <Windows x={402} y={134} cols={4} rows={8} w={12} h={11} gx={12} gy={11} />
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="390" y1={130 + i * 22} x2="500" y2={130 + i * 22} {...P} />
        ))}
        <rect x="436" y="300" width="18" height="20" {...P} />
      </g>
      <Tree x={520} y={320} />

      {/* Registrar's office: steps, columns, pediment and dome */}
      <g style={d(450)}>
        <line x1="560" y1="320" x2="880" y2="320" {...P} />
        <line x1="566" y1="312" x2="874" y2="312" {...P} />
        <line x1="572" y1="304" x2="868" y2="304" {...P} />
        <rect x="580" y="214" width="280" height="90" {...P} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={600 + i * 34} y="222" width="10" height="74" {...P} />
        ))}
        <line x1="580" y1="214" x2="860" y2="214" {...P} />
        <path d="M572 214 l148 -46 l148 46" {...P} />
        <rect x="690" y="150" width="60" height="18" {...P} />
        <path d="M684 150 a36 36 0 0 1 72 0" {...P} />
        <line x1="720" y1="114" x2="720" y2="96" {...P} />
        <path d="M720 96 l14 5 l-14 5" {...P} />
        <rect x="708" y="262" width="24" height="34" {...P} />
        <rect x="628" y="246" width="16" height="20" {...P} />
        <rect x="796" y="246" width="16" height="20" {...P} />
      </g>
      <Tree x={900} y={320} />

      {/* Cooperative bank tower */}
      <g style={d(600)}>
        <rect x="930" y="82" width="90" height="238" {...P} />
        <line x1="975" y1="82" x2="975" y2="48" {...P} />
        <line x1="968" y1="56" x2="982" y2="56" {...P} />
        <Windows x={942} y={98} cols={3} rows={11} w={16} h={10} gx={7} gy={9} />
        <rect x="960" y="296" width="30" height="24" {...P} />
        <path d="M960 296 a15 15 0 0 1 30 0" {...P} />
      </g>

      {/* Clock tower */}
      <g style={d(700)}>
        <rect x="1046" y="160" width="40" height="160" {...P} />
        <path d="M1040 160 l26 -34 l26 34 z" {...P} />
        <circle cx="1066" cy="196" r="12" {...P} />
        <line x1="1066" y1="196" x2="1066" y2="188" {...P} />
        <line x1="1066" y1="196" x2="1072" y2="199" {...P} />
        <rect x="1058" y="240" width="16" height="22" {...P} />
        <rect x="1058" y="280" width="16" height="22" {...P} />
      </g>

      {/* Row of shops */}
      <g style={d(800)}>
        <rect x="1110" y="262" width="230" height="58" {...P} />
        <line x1="1110" y1="262" x2="1340" y2="262" {...P} />
        {Array.from({ length: 4 }, (_, i) => (
          <g key={i}>
            <path d={`M${1116 + i * 57} 262 q28 -18 56 0`} {...P} />
            <rect x={1128 + i * 57} y="284" width="30" height="36" {...P} />
            <line x1={1128 + i * 57} y1="300" x2={1158 + i * 57} y2="300" {...P} />
          </g>
        ))}
      </g>
      <Tree x={1368} y={320} s={0.8} />
    </svg>
  );
}
