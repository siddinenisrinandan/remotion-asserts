import React, { useId } from 'react';
import { AbsoluteFill, Easing, interpolate, Series, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadKaushan } from '@remotion/google-fonts/KaushanScript';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { WaveField } from './WaveField';

// -----------------------------------------------------------
// GOLD TITLES  (20 elegant gold title layouts)
// Script + caps titles with gold frames, circles, hexagons, laurels,
// diamond dividers, brackets and name plates. Lines draw themselves,
// text wipes in, and the exit is the entry played backwards.
// One component; pick the layout with `style`.
// -----------------------------------------------------------

const SCRIPT = loadKaushan('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily;
const MONT = loadMontserrat('normal', { weights: ['500', '600', '700'], subsets: ['latin'] }).fontFamily;

export const GOLD_TITLE_STYLES = [
  'Script Underline',
  'Script Divider',
  'Framed Script',
  'Script Gold Bar',
  'Double Square',
  'Laurel Circle',
  'Laurel Hexagon',
  'Between Lines',
  'Diamond Divider',
  'Bracket Tiles',
  'Curved Badge',
  'Script Label',
  'Name Corner',
  'Name Plate',
  'Quote Brackets',
  'Script Split',
  'Offset Frame',
  'Number Tab',
  'Cross Words',
  'Number Badge',
  'Arch Card',
  'Diamond Card',
  'Deco Ticket',
  'Corner Card',
  'Glass Card',
  'Stacked Cards',
] as const;
export type GoldTitleStyle = (typeof GOLD_TITLE_STYLES)[number];

const PALETTES = {
  Classic: ['#fff4cf', '#f2cf78', '#c8973c', '#8d6420', '#f6dd96', '#b0812f'],
  Pale: ['#ffffff', '#f6ebc8', '#d9c08a', '#9a8352', '#f3e6bd', '#b9a06a'],
  Rose: ['#fff0e8', '#f3c2a8', '#d08f72', '#8e4f3a', '#f6cdb6', '#b57359'],
  Deep: ['#ffe7a0', '#eab443', '#b97f1a', '#6e4307', '#f2c55a', '#94600f'],
} as const;
type PaletteName = keyof typeof PALETTES;

export const goldTitleSchema = z.object({
  style: z.enum(GOLD_TITLE_STYLES),
  title: z.string(),
  subtitle: z.string().describe('Second line (for split styles: two words separated by a comma)'),
  extra: z.string().describe('Third text where a style has one (number, curved word...)'),
  gold: z.enum(Object.keys(PALETTES) as [PaletteName, ...PaletteName[]]),
  scale: z.number().min(0.3).max(2.5).step(0.05),
  offsetX: z.number().min(-900).max(900).step(5),
  offsetY: z.number().min(-500).max(500).step(5),
  cardFill: z.number().min(0).max(1).step(0.05).describe('Darkness inside card styles (helps over video)'),
  background: z.enum(['Waves', 'Solid', 'Transparent']),
  backgroundColor: zColor(),
  speed: z.number().min(0.3).max(3).step(0.1),
  seconds: z.number().min(1.5).max(20).step(0.1),
});
export type GoldTitleProps = z.infer<typeof goldTitleSchema>;

export const goldTitleDefaults: GoldTitleProps = {
  style: 'Script Underline',
  title: 'Golden Titles',
  subtitle: 'MODERN TEMPLATE',
  extra: '',
  gold: 'Classic',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  cardFill: 0.35,
  background: 'Waves',
  backgroundColor: '#1b1546',
  speed: 1,
  seconds: 4,
};

// ---------- helpers ----------
const clampO = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const E = (t: number, a: number, b: number, e = Easing.out(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clampO, easing: e });
const CX = 960;
const CY = 540;

type Ctx = {
  t: number;
  frame: number;
  c: readonly string[];
  stroke: string; // url(#...) for strokes
  fill: string; // url(#...) for filled shapes
  p: GoldTitleProps;
};

const goldText = (c: readonly string[], shine: number): React.CSSProperties => ({
  backgroundImage: `linear-gradient(105deg, transparent ${shine - 9}%, rgba(255,252,238,0.9) ${shine}%, transparent ${shine + 9}%), linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 25%, ${c[2]} 48%, ${c[3]} 56%, ${c[4]} 72%, ${c[5]} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))',
});

type TxtProps = {
  x: number;
  y: number;
  anchor?: 'c' | 'l' | 'r';
  font: 'script' | 'caps' | 'semi';
  size: number;
  spacing?: number;
  dark?: boolean;
  clip?: string;
  style?: React.CSSProperties;
  ctx: Ctx;
  children: React.ReactNode;
};

const Txt: React.FC<TxtProps> = ({ x, y, anchor = 'c', font, size, spacing = 0, dark, clip, style, ctx, children }) => {
  const tx = anchor === 'c' ? '-50%' : anchor === 'l' ? '0%' : '-100%';
  const shine = interpolate(ctx.t, [24, 70], [-20, 130], clampO);
  const fontStyle: React.CSSProperties =
    font === 'script'
      ? { fontFamily: SCRIPT, fontWeight: 400 }
      : { fontFamily: MONT, fontWeight: font === 'caps' ? 700 : 600, textTransform: font === 'caps' ? 'uppercase' : undefined };
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%)`, whiteSpace: 'nowrap' }}>
      <div
        style={{
          ...fontStyle,
          fontSize: size,
          lineHeight: 1.25,
          letterSpacing: `${spacing}em`,
          padding: '0 0.12em',
          clipPath: clip,
          ...(dark ? { color: '#1b1438' } : goldText(ctx.c, shine)),
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** inset clip helpers: reveal from a side (p 0..1) */
const fromLeft = (p: number) => `inset(-20% ${(1 - p) * 100}% -20% 0)`;
const fromRight = (p: number) => `inset(-20% 0 -20% ${(1 - p) * 100}%)`;
const fromCentre = (p: number) => `inset(-20% ${(1 - p) * 50}% -20% ${(1 - p) * 50}%)`;
const fromBottom = (p: number) => `inset(${(1 - p) * 100}% -10% -20% -10%)`;

/** a stroked path that draws itself (p 0..1) */
const Draw: React.FC<{ d: string; p: number; ctx: Ctx; w?: number }> = ({ d, p, ctx, w = 3 }) =>
  p <= 0 ? null : (
    <path d={d} fill="none" stroke={ctx.stroke} strokeWidth={w} strokeLinecap="square" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
  );

/** horizontal line growing out of its centre */
const HLine: React.FC<{ x: number; y: number; w: number; p: number; ctx: Ctx; sw?: number }> = ({ x, y, w, p, ctx, sw = 3 }) =>
  p <= 0 ? null : <rect x={x - (w * p) / 2} y={y - sw / 2} width={w * p} height={sw} fill={ctx.stroke} />;

const rectPath = (x: number, y: number, w: number, h: number) => ({
  a: `M${x} ${y} H${x + w} V${y + h}`,
  b: `M${x + w} ${y + h} H${x} V${y}`,
});

const Laurel: React.FC<{ x: number; y: number; s: number; flip?: boolean; p: number; ctx: Ctx }> = ({ x, y, s, flip, p, ctx }) => {
  if (p <= 0) return null;
  // a horizontal sprig: gently curved stem, leaves alternating above/below, pointing to the tip
  const leaves: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const lx = -18 + i * 8.5;
    const up = i % 2 === 0;
    leaves.push([lx + 3, (up ? -3.2 : 3.2) - i * 0.35, up ? -32 : 32]);
  }
  const grown = Math.round(p * leaves.length);
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${s * (flip ? -1 : 1)})`}>
      <path d="M-24 2 Q0 -2 24 -3" stroke={ctx.fill} strokeWidth={1.4} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      {leaves.slice(0, grown).map(([lx, ly, r], i) => (
        <ellipse key={i} cx={lx} cy={ly} rx={5.2} ry={2} fill={ctx.fill} transform={`rotate(${r} ${lx} ${ly})`} />
      ))}
      {p >= 1 && <ellipse cx={27} cy={-3.5} rx={4.6} ry={1.9} fill={ctx.fill} />}
    </g>
  );
};

const DiamondPair: React.FC<{ x: number; y: number; s: number; p: number; ctx: Ctx }> = ({ x, y, s, p, ctx }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${p})`}>
      {[-s * 0.55, 0, s * 0.55].map((dx, i) => (
        <rect key={i} x={dx - s / 2} y={-s / 2} width={s} height={s} transform={`rotate(45 ${dx} 0)`} fill="none" stroke={ctx.stroke} strokeWidth={2.5} />
      ))}
    </g>
  );

const TwinSquares: React.FC<{ x: number; y: number; s: number; p: number; ctx: Ctx }> = ({ x, y, s, p, ctx }) =>
  p <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${p})`}>
      <rect x={-s * 0.75} y={-s * 0.75} width={s} height={s} fill="none" stroke={ctx.stroke} strokeWidth={2.5} />
      <rect x={-s * 0.25} y={-s * 0.25} width={s} height={s} fill="none" stroke={ctx.stroke} strokeWidth={2.5} />
    </g>
  );

const split = (s: string) => {
  const parts = s.split(',').map((x) => x.trim());
  return [parts[0] ?? '', parts[1] ?? ''];
};

// ---------- the 20 layouts ----------
type Render = (x: Ctx) => { svg?: React.ReactNode; html?: React.ReactNode };

const STYLES: Record<string, Render> = {
  'Script Underline': (x) => {
    const { t, p } = x;
    return {
      svg: <HLine x={CX} y={CY + 22} w={440} p={E(t, 0, 16)} ctx={x} />,
      html: (
        <>
          <Txt ctx={x} x={CX} y={CY - 32} font="script" size={110} clip={fromBottom(E(t, 8, 28))} style={{ transform: `translateY(${(1 - E(t, 8, 28)) * 40}px)` }}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX} y={CY + 52} font="caps" size={22} spacing={interpolate(E(t, 14, 32), [0, 1], [0.7, 0.22])} style={{ opacity: E(t, 14, 30) }}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Script Divider': (x) => {
    const { t, p } = x;
    const a = E(t, 6, 26);
    return {
      svg: <rect x={CX - 1.5} y={CY - 45 * E(t, 0, 12)} width={3} height={90 * E(t, 0, 12)} fill={x.stroke} />,
      html: (
        <>
          <Txt ctx={x} x={CX - 22} y={CY - 4} anchor="r" font="script" size={100} clip={fromRight(a)} style={{ transform: `translateX(${(1 - a) * 60}px)` }}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX + 24} y={CY + 2} anchor="l" font="caps" size={24} spacing={0.12} clip={fromLeft(a)} style={{ transform: `translateX(${(a - 1) * 60}px)` }}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Framed Script': (x) => {
    const { t, p } = x;
    const r = rectPath(CX - 300, CY - 70, 600, 140);
    return {
      svg: (
        <>
          <Draw d={r.a} p={E(t, 0, 24)} ctx={x} />
          <Draw d={r.b} p={E(t, 0, 24)} ctx={x} />
        </>
      ),
      html: (
        <Txt ctx={x} x={CX} y={CY} font="script" size={86} clip={fromLeft(E(t, 10, 32))}>
          {p.title}
        </Txt>
      ),
    };
  },

  'Script Gold Bar': (x) => {
    const { t, p } = x;
    const bar = E(t, 10, 24);
    return {
      svg: <rect x={CX - 270} y={CY + 14} width={540 * bar} height={38} fill={x.fill} />,
      html: (
        <>
          <Txt ctx={x} x={CX} y={CY - 40} font="script" size={100} clip={fromLeft(E(t, 0, 24))}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX} y={CY + 33} font="caps" size={22} spacing={0.08} dark style={{ opacity: E(t, 18, 30) }}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Double Square': (x) => {
    const { t, p } = x;
    const r1 = rectPath(CX - 160, CY - 150, 320, 300);
    const r2 = rectPath(CX - 145, CY - 165, 320, 300);
    return {
      svg: (
        <>
          <Draw d={r1.a} p={E(t, 0, 22)} ctx={x} />
          <Draw d={r1.b} p={E(t, 0, 22)} ctx={x} />
          <Draw d={r2.a} p={E(t, 6, 28)} ctx={x} w={2} />
          <Draw d={r2.b} p={E(t, 6, 28)} ctx={x} w={2} />
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={CX} y={CY - 18} font="script" size={86} style={{ opacity: E(t, 12, 28), transform: `scale(${0.9 + 0.1 * E(t, 12, 30)})` }}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX} y={CY + 40} font="caps" size={16} spacing={0.18} style={{ opacity: E(t, 18, 32) }}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Laurel Circle': (x) => {
    const { t, p } = x;
    const circ = (r: number, pr: number) =>
      pr <= 0 ? null : (
        <circle cx={CX} cy={CY} r={r} fill="none" stroke={x.stroke} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - pr} transform={`rotate(-90 ${CX} ${CY})`} />
      );
    return {
      svg: (
        <>
          {circ(165, E(t, 0, 26))}
          {circ(152, E(t, 5, 30))}
          <Laurel x={CX} y={CY - 92} s={2.2} p={E(t, 16, 30, Easing.out(Easing.back(1.6)))} ctx={x} />
          <Laurel x={CX} y={CY + 92} s={2.2} flip p={E(t, 18, 32, Easing.out(Easing.back(1.6)))} ctx={x} />
        </>
      ),
      html: (
        <Txt ctx={x} x={CX} y={CY} font="script" size={74} style={{ opacity: E(t, 12, 28) }}>
          {p.title}
        </Txt>
      ),
    };
  },

  'Laurel Hexagon': (x) => {
    const { t, p } = x;
    const hex = (r: number) =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${i === 0 ? 'M' : 'L'}${CX + Math.cos(a) * r} ${CY + Math.sin(a) * r}`;
      }).join(' ') + 'Z';
    return {
      svg: (
        <>
          <Draw d={hex(180)} p={E(t, 0, 26)} ctx={x} />
          <Draw d={hex(166)} p={E(t, 5, 30)} ctx={x} w={2} />
          <Laurel x={CX} y={CY - 88} s={2.1} p={E(t, 16, 30, Easing.out(Easing.back(1.6)))} ctx={x} />
          <Laurel x={CX} y={CY + 88} s={2.1} flip p={E(t, 18, 32, Easing.out(Easing.back(1.6)))} ctx={x} />
        </>
      ),
      html: (
        <Txt ctx={x} x={CX} y={CY} font="script" size={74} style={{ opacity: E(t, 12, 28) }}>
          {p.title}
        </Txt>
      ),
    };
  },

  'Between Lines': (x) => {
    const { t, p } = x;
    return {
      svg: (
        <>
          <HLine x={CX} y={CY - 52} w={460} p={E(t, 0, 16)} ctx={x} />
          <HLine x={CX} y={CY + 52} w={460} p={E(t, 3, 19)} ctx={x} />
        </>
      ),
      html: (
        <Txt ctx={x} x={CX} y={CY} font="semi" size={56} clip={fromCentre(E(t, 8, 26))}>
          {p.title}
        </Txt>
      ),
    };
  },

  'Diamond Divider': (x) => {
    const { t, p } = x;
    const [l, r] = split(p.title);
    const ln = E(t, 6, 22);
    return {
      svg: (
        <>
          <DiamondPair x={CX} y={CY} s={22} p={E(t, 0, 12, Easing.out(Easing.back(1.8)))} ctx={x} />
          <rect x={CX - 40 - 380 * ln} y={CY - 1.5} width={380 * ln} height={3} fill={x.stroke} />
          <rect x={CX + 40} y={CY - 1.5} width={380 * ln} height={3} fill={x.stroke} />
          {ln > 0.95 && (
            <>
              <rect x={CX - 424} y={CY - 4} width={8} height={8} transform={`rotate(45 ${CX - 420} ${CY})`} fill={x.fill} />
              <rect x={CX + 416} y={CY - 4} width={8} height={8} transform={`rotate(45 ${CX + 420} ${CY})`} fill={x.fill} />
            </>
          )}
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={CX - 220} y={CY - 24} font="caps" size={24} spacing={0.06} clip={fromRight(E(t, 14, 28))}>
            {l}
          </Txt>
          <Txt ctx={x} x={CX + 220} y={CY - 24} font="caps" size={24} spacing={0.06} clip={fromLeft(E(t, 14, 28))}>
            {r}
          </Txt>
        </>
      ),
    };
  },

  'Bracket Tiles': (x) => {
    const { t, p } = x;
    const d = E(t, 0, 20);
    return {
      svg: (
        <>
          <Draw d={`M${CX - 120} ${CY - 50} H${CX + 230} V${CY + 4}`} p={d} ctx={x} />
          <Draw d={`M${CX + 120} ${CY + 50} H${CX - 230} V${CY - 4}`} p={d} ctx={x} />
          <TwinSquares x={CX - 230} y={CY - 50} s={22} p={E(t, 14, 24, Easing.out(Easing.back(2)))} ctx={x} />
          <TwinSquares x={CX + 230} y={CY + 50} s={22} p={E(t, 16, 26, Easing.out(Easing.back(2)))} ctx={x} />
        </>
      ),
      html: (
        <Txt ctx={x} x={CX} y={CY} font="semi" size={48} clip={fromLeft(E(t, 8, 26))}>
          {p.title}
        </Txt>
      ),
    };
  },

  'Curved Badge': (x) => {
    const { t, p } = x;
    const [top, bottom] = split(p.subtitle);
    const a = E(t, 12, 30);
    const R = 150;
    return {
      svg: (
        <g opacity={a} transform={`rotate(${(1 - a) * -25} ${CX} ${CY})`}>
          <defs>
            <path id="gtArcTop" d={`M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`} />
            <path id="gtArcBot" d={`M${CX - R + 10} ${CY} A${R - 10} ${R - 10} 0 0 0 ${CX + R - 10} ${CY}`} />
          </defs>
          <text fontFamily={MONT} fontWeight={600} fontSize={26} fill={x.fill} letterSpacing={2}>
            <textPath href="#gtArcTop" startOffset="50%" textAnchor="middle">
              {top}
            </textPath>
          </text>
          <text fontFamily={MONT} fontWeight={600} fontSize={26} fill={x.fill} letterSpacing={2} dominantBaseline="hanging">
            <textPath href="#gtArcBot" startOffset="50%" textAnchor="middle">
              {bottom}
            </textPath>
          </text>
        </g>
      ),
      html: (
        <Txt ctx={x} x={CX} y={CY + 4} font="script" size={110} clip={fromLeft(E(t, 0, 22))}>
          {p.title}
        </Txt>
      ),
    };
  },

  'Script Label': (x) => {
    const { t, p } = x;
    const b = E(t, 10, 24);
    return {
      svg: <rect x={CX + 30} y={CY - 22} width={300 * b} height={44} fill={x.fill} />,
      html: (
        <>
          <Txt ctx={x} x={CX + 10} y={CY - 6} anchor="r" font="script" size={96} clip={fromLeft(E(t, 0, 22))}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX + 180} y={CY} font="caps" size={20} spacing={0.08} dark style={{ opacity: E(t, 18, 28) }}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Name Corner': (x) => {
    const { t, p } = x;
    const x0 = CX - 260;
    return {
      svg: (
        <>
          <Draw d={`M${x0} ${CY + 40} V${CY - 50}`} p={E(t, 4, 16)} ctx={x} />
          <Draw d={`M${x0} ${CY + 40} H${x0 + 170}`} p={E(t, 6, 20)} ctx={x} />
          <TwinSquares x={x0} y={CY + 40} s={24} p={E(t, 0, 10, Easing.out(Easing.back(2)))} ctx={x} />
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={x0 + 26} y={CY - 18} anchor="l" font="semi" size={52} clip={fromLeft(E(t, 10, 28))} style={{ textTransform: 'uppercase' }}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={x0 + 28} y={CY + 18} anchor="l" font="caps" size={17} spacing={0.1} clip={fromLeft(E(t, 16, 32))}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Name Plate': (x) => {
    const { t, p } = x;
    const o = rectPath(CX - 280, CY - 70, 560, 140);
    const i = rectPath(CX - 264, CY - 56, 528, 112);
    const corners: [number, number][] = [
      [CX - 280, CY - 70],
      [CX + 280, CY - 70],
      [CX - 280, CY + 70],
      [CX + 280, CY + 70],
    ];
    const cp = E(t, 18, 28, Easing.out(Easing.back(2)));
    return {
      svg: (
        <>
          <Draw d={o.a} p={E(t, 0, 22)} ctx={x} w={2} />
          <Draw d={o.b} p={E(t, 0, 22)} ctx={x} w={2} />
          <Draw d={i.a} p={E(t, 6, 26)} ctx={x} />
          <Draw d={i.b} p={E(t, 6, 26)} ctx={x} />
          {corners.map(([cx, cy], k) =>
            cp > 0 ? <rect key={k} x={cx - 6 * cp} y={cy - 6 * cp} width={12 * cp} height={12 * cp} fill="none" stroke={x.stroke} strokeWidth={2.5} /> : null,
          )}
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={CX} y={CY - 12} font="semi" size={48} clip={fromCentre(E(t, 10, 28))} style={{ textTransform: 'uppercase' }}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX} y={CY + 30} font="caps" size={15} spacing={0.14} style={{ opacity: E(t, 18, 32) }}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Quote Brackets': (x) => {
    const { t, p } = x;
    return {
      svg: (
        <>
          <Draw d={`M${CX - 110} ${CY - 12} V${CY - 52} H${CX - 70}`} p={E(t, 0, 14)} ctx={x} />
          <Draw d={`M${CX + 150} ${CY + 14} V${CY + 54} H${CX + 110}`} p={E(t, 4, 18)} ctx={x} />
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={CX - 88} y={CY - 30} anchor="l" font="semi" size={34} clip={fromLeft(E(t, 8, 26))}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX + 130} y={CY + 26} anchor="r" font="semi" size={34} clip={fromRight(E(t, 14, 32))}>
            {p.subtitle}
          </Txt>
        </>
      ),
    };
  },

  'Script Split': (x) => {
    const { t, p } = x;
    const [l, r] = split(p.subtitle);
    const a = E(t, 0, 24);
    return {
      svg: <rect x={CX - 1.5} y={CY + 46 - 14 * E(t, 14, 24)} width={3} height={28 * E(t, 14, 24)} fill={x.stroke} />,
      html: (
        <>
          <Txt ctx={x} x={CX} y={CY - 22} font="script" size={110} style={{ opacity: a, filter: `blur(${(1 - a) * 8}px)`, transform: `translateY(${(1 - a) * 24}px)` }}>
            {p.title}
          </Txt>
          <Txt ctx={x} x={CX - 18} y={CY + 47} anchor="r" font="caps" size={20} spacing={0.12} clip={fromRight(E(t, 18, 30))}>
            {l}
          </Txt>
          <Txt ctx={x} x={CX + 18} y={CY + 47} anchor="l" font="caps" size={20} spacing={0.12} clip={fromLeft(E(t, 18, 30))}>
            {r}
          </Txt>
        </>
      ),
    };
  },

  'Offset Frame': (x) => {
    const { t, p } = x;
    const r1 = rectPath(CX - 190, CY - 48, 380, 96);
    const off = 14 * E(t, 16, 30);
    const r2 = rectPath(CX - 190 + off, CY - 48 + off, 380, 96);
    return {
      svg: (
        <>
          {E(t, 14, 18) > 0 && (
            <>
              <path d={r2.a} fill="none" stroke={x.stroke} strokeWidth={2} opacity={E(t, 14, 20)} />
              <path d={r2.b} fill="none" stroke={x.stroke} strokeWidth={2} opacity={E(t, 14, 20)} />
            </>
          )}
          <Draw d={r1.a} p={E(t, 0, 20)} ctx={x} />
          <Draw d={r1.b} p={E(t, 0, 20)} ctx={x} />
        </>
      ),
      html: (
        <Txt ctx={x} x={CX} y={CY} font="semi" size={44} clip={fromLeft(E(t, 8, 26))}>
          {p.title}
        </Txt>
      ),
    };
  },

  'Number Tab': (x) => {
    const { t, p } = x;
    const box = E(t, 0, 16);
    const o = rectPath(CX - 140, CY - 44, 360, 88);
    return {
      svg: (
        <>
          <rect x={CX - 230} y={CY - 44} width={88 * box} height={88} fill={x.fill} />
          <Draw d={o.a} p={E(t, 6, 24)} ctx={x} />
          <Draw d={o.b} p={E(t, 6, 24)} ctx={x} />
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={CX - 186} y={CY} font="caps" size={46} dark style={{ opacity: E(t, 12, 20) }}>
            {p.extra}
          </Txt>
          <Txt ctx={x} x={CX + 40} y={CY} font="semi" size={36} clip={fromLeft(E(t, 14, 30))} style={{ textTransform: 'uppercase' }}>
            {p.title}
          </Txt>
        </>
      ),
    };
  },

  'Cross Words': (x) => {
    const { t, p } = x;
    const [l, r] = split(p.title);
    const grow = E(t, 0, 12);
    const cross = E(t, 30, 44, Easing.inOut(Easing.cubic));
    const len = interpolate(cross, [0, 1], [90, 110]) * grow;
    return {
      svg: (
        <>
          {[1, -1].map((s) => (
            <rect key={s} x={CX - 1.5} y={CY - len / 2} width={3} height={len} fill={x.stroke} transform={`rotate(${s * 32 * cross} ${CX} ${CY})`} />
          ))}
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={CX - 30 - 14 * cross} y={CY} anchor="r" font="caps" size={36} spacing={0.04} clip={fromRight(E(t, 6, 22))}>
            {l}
          </Txt>
          <Txt ctx={x} x={CX + 30 + 14 * cross} y={CY} anchor="l" font="caps" size={36} spacing={0.04} clip={fromLeft(E(t, 6, 22))}>
            {r}
          </Txt>
        </>
      ),
    };
  },

  'Number Badge': (x) => {
    const { t, p } = x;
    const o = rectPath(CX - 64, CY - 110, 128, 86);
    return {
      svg: (
        <>
          <Draw d={o.a} p={E(t, 0, 18)} ctx={x} />
          <Draw d={o.b} p={E(t, 0, 18)} ctx={x} />
        </>
      ),
      html: (
        <>
          <Txt ctx={x} x={CX} y={CY - 66} font="caps" size={56} style={{ opacity: E(t, 8, 20), transform: `scale(${0.8 + 0.2 * E(t, 8, 22)})` }}>
            {p.extra}
          </Txt>
          <Txt ctx={x} x={CX} y={CY + 30} font="script" size={86} clip={fromLeft(E(t, 12, 32))}>
            {p.title}
          </Txt>
        </>
      ),
    };
  },
};


// ---------- card helpers ----------
const CardFill: React.FC<{ d: string; p: number; ctx: Ctx }> = ({ d, p, ctx }) =>
  p <= 0 || ctx.p.cardFill <= 0 ? null : <path d={d} fill={`rgba(12,9,30,${ctx.p.cardFill * p})`} />;

/** outer + inner outline of the same shape, drawing on one after the other */
const DoubleOutline: React.FC<{ outer: string; inner: string; t: number; ctx: Ctx; start?: number }> = ({ outer, inner, t, ctx, start = 0 }) => (
  <>
    <Draw d={outer} p={E(t, start, start + 24)} ctx={ctx} />
    <Draw d={inner} p={E(t, start + 6, start + 30)} ctx={ctx} w={1.6} />
  </>
);

const archPath = (cx: number, cy: number, w: number, h: number) => {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y1 = cy + h / 2;
  const ym = cy - h / 2 + w / 2;
  return `M${x0} ${y1} V${ym} A${w / 2} ${w / 2} 0 0 1 ${x1} ${ym} V${y1} Z`;
};
const decoPath = (cx: number, cy: number, w: number, h: number, n: number) => {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  return `M${x0 + n} ${y0} H${x1 - n} L${x1} ${y0 + n} V${y1 - n} L${x1 - n} ${y1} H${x0 + n} L${x0} ${y1 - n} V${y0 + n} Z`;
};
const diamondPath = (cx: number, cy: number, r: number) => `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`;
const roundRectPath = (cx: number, cy: number, w: number, h: number, r: number) => {
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const x1 = cx + w / 2;
  const y1 = cy + h / 2;
  return `M${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y0 + r} V${y1 - r} A${r} ${r} 0 0 1 ${x1 - r} ${y1} H${x0 + r} A${r} ${r} 0 0 1 ${x0} ${y1 - r} V${y0 + r} A${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
};
const boxPath = (cx: number, cy: number, w: number, h: number) => `M${cx - w / 2} ${cy - h / 2} H${cx + w / 2} V${cy + h / 2} H${cx - w / 2} Z`;

const CardText: React.FC<{ ctx: Ctx; y?: number; size?: number; subGap?: number }> = ({ ctx, y = 0, size = 80, subGap = 52 }) => {
  const { t, p } = ctx;
  return (
    <>
      <Txt ctx={ctx} x={CX} y={CY + y - (p.subtitle ? 14 : 0)} font="script" size={size} style={{ opacity: E(t, 14, 30), transform: `scale(${0.9 + 0.1 * E(t, 14, 32)})` }}>
        {p.title}
      </Txt>
      {p.subtitle ? (
        <Txt ctx={ctx} x={CX} y={CY + y - 14 + subGap} font="caps" size={16} spacing={interpolate(E(t, 20, 36), [0, 1], [0.5, 0.2])} style={{ opacity: E(t, 20, 34) }}>
          {p.subtitle}
        </Txt>
      ) : null}
    </>
  );
};

const CARD_STYLES: Record<string, Render> = {
  'Arch Card': (x) => {
    const outer = archPath(CX, CY, 340, 460);
    return {
      svg: (
        <>
          <CardFill d={outer} p={E(x.t, 6, 26)} ctx={x} />
          <DoubleOutline outer={outer} inner={archPath(CX, CY + 2, 312, 432)} t={x.t} ctx={x} />
          <Laurel x={CX} y={CY - 118} s={1.9} p={E(x.t, 18, 32)} ctx={x} />
        </>
      ),
      html: <CardText ctx={x} y={30} size={78} />,
    };
  },
  'Diamond Card': (x) => {
    const outer = diamondPath(CX, CY, 230);
    return {
      svg: (
        <>
          <CardFill d={outer} p={E(x.t, 6, 26)} ctx={x} />
          <DoubleOutline outer={outer} inner={diamondPath(CX, CY, 212)} t={x.t} ctx={x} />
          {[-1, 1].map((sg) => (
            <rect key={sg} x={CX + sg * 230 - 6} y={CY - 6} width={12} height={12} transform={`rotate(45 ${CX + sg * 230} ${CY})`} fill={x.fill} opacity={E(x.t, 22, 30)} />
          ))}
        </>
      ),
      html: <CardText ctx={x} size={70} subGap={46} />,
    };
  },
  'Deco Ticket': (x) => {
    const outer = decoPath(CX, CY, 600, 200, 28);
    return {
      svg: (
        <>
          <CardFill d={outer} p={E(x.t, 6, 26)} ctx={x} />
          <DoubleOutline outer={outer} inner={decoPath(CX, CY, 572, 172, 20)} t={x.t} ctx={x} />
          <HLine x={CX - 200} y={CY + 36} w={56} p={E(x.t, 20, 32)} ctx={x} sw={2} />
          <HLine x={CX + 200} y={CY + 36} w={56} p={E(x.t, 20, 32)} ctx={x} sw={2} />
        </>
      ),
      html: <CardText ctx={x} size={74} subGap={50} />,
    };
  },
  'Corner Card': (x) => {
    const W = 560;
    const H = 260;
    const L = 46;
    const cp = E(x.t, 0, 18);
    const corners = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ].map(([sx, sy]) => {
      const px = CX + (sx * W) / 2;
      const py = CY + (sy * H) / 2;
      return `M${px - sx * L} ${py} H${px} V${py - sy * L}`;
    });
    return {
      svg: (
        <>
          <CardFill d={boxPath(CX, CY, W, H)} p={E(x.t, 6, 26)} ctx={x} />
          {corners.map((d, i) => (
            <Draw key={i} d={d} p={cp} ctx={x} w={4} />
          ))}
          <Draw d={boxPath(CX, CY, W - 36, H - 36)} p={E(x.t, 8, 30)} ctx={x} w={1.6} />
        </>
      ),
      html: <CardText ctx={x} size={80} />,
    };
  },
  'Glass Card': (x) => {
    const outer = roundRectPath(CX, CY, 560, 240, 28);
    const a = E(x.t, 0, 20);
    return {
      svg: (
        <>
          <g opacity={a} transform={`translate(0 ${(1 - a) * 30})`}>
            <path d={outer} fill={`rgba(20,16,44,${0.25 + x.p.cardFill * 0.6})`} />
            <path d={roundRectPath(CX, CY - 62, 528, 92, 22)} fill="rgba(255,255,255,0.05)" />
          </g>
          <DoubleOutline outer={outer} inner={roundRectPath(CX, CY, 532, 212, 20)} t={x.t} ctx={x} start={4} />
        </>
      ),
      html: <CardText ctx={x} size={80} />,
    };
  },
  'Stacked Cards': (x) => {
    const fan = E(x.t, 10, 30, Easing.out(Easing.back(1.4)));
    const card = boxPath(CX, CY, 360, 260);
    return {
      svg: (
        <>
          {[-1, 1].map((sg) => (
            <g key={sg} transform={`rotate(${sg * 7 * fan} ${CX} ${CY + 200}) translate(${sg * 26 * fan} 0)`} opacity={(0.4 + 0.4 * fan) * E(x.t, 8, 16)}>
              <path d={card} fill={`rgba(12,9,30,${x.p.cardFill * 0.6})`} stroke={x.stroke} strokeWidth={2} />
            </g>
          ))}
          <CardFill d={card} p={E(x.t, 4, 22)} ctx={x} />
          <DoubleOutline outer={card} inner={boxPath(CX, CY, 332, 232)} t={x.t} ctx={x} />
        </>
      ),
      html: <CardText ctx={x} size={74} />,
    };
  },
};

export const GoldTitle: React.FC<Partial<GoldTitleProps>> = (props) => {
  const p = { ...goldTitleDefaults, ...props };
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = Math.min(frame, durationInFrames - 1 - frame) * p.speed; // exit = entry reversed
  const c = PALETTES[p.gold as PaletteName] ?? PALETTES.Classic;
  const uid = useId().replace(/:/g, '');
  const ctx: Ctx = { t, frame, c, stroke: `url(#gs${uid})`, fill: `url(#gf${uid})`, p };
  const r = STYLES[p.style] ?? CARD_STYLES[p.style] ?? STYLES['Script Underline'];
  const out = r(ctx);
  const bg =
    p.background === 'Waves' ? <WaveField base={p.backgroundColor} /> : p.background === 'Solid' ? <AbsoluteFill style={{ backgroundColor: p.backgroundColor }} /> : null;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {bg}
      <AbsoluteFill style={{ transform: `translate(${p.offsetX}px, ${p.offsetY}px) scale(${p.scale})` }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>
          <defs>
            {/* strokes: metallic bands repeating along the line, slowly drifting */}
            <linearGradient id={`gs${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={220} y2={60} spreadMethod="reflect" gradientTransform={`translate(${frame * 2.5} 0)`}>
              <stop offset="0" stopColor={c[0]} />
              <stop offset="0.35" stopColor={c[1]} />
              <stop offset="0.6" stopColor={c[3]} />
              <stop offset="1" stopColor={c[4]} />
            </linearGradient>
            {/* fills: vertical polished gold */}
            <linearGradient id={`gf${uid}`} x1={0} y1={0} x2={0} y2={1}>
              <stop offset="0" stopColor={c[0]} />
              <stop offset="0.3" stopColor={c[1]} />
              <stop offset="0.52" stopColor={c[2]} />
              <stop offset="0.6" stopColor={c[3]} />
              <stop offset="0.78" stopColor={c[4]} />
              <stop offset="1" stopColor={c[5]} />
            </linearGradient>
          </defs>
          {out.svg}
        </svg>
        {out.html}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const P = (style: GoldTitleStyle, title: string, subtitle = '', extra = ''): { id: string; props: GoldTitleProps } => ({
  id: `GoldTitle-${style.replace(/\s+/g, '')}`,
  props: { ...goldTitleDefaults, style, title, subtitle, extra },
});

export const GOLD_TITLE_PRESETS = [
  P('Script Underline', 'Golden Titles', 'MODERN TEMPLATE'),
  P('Script Divider', 'Stylish', 'SMOOTH ANIMATION'),
  P('Framed Script', 'Luxury Design'),
  P('Script Gold Bar', 'Every Moment', 'IS A FRESH BEGINNING'),
  P('Double Square', 'Luxury', 'GOLDEN TITLES'),
  P('Laurel Circle', 'Superior'),
  P('Laurel Hexagon', 'Amazing'),
  P('Between Lines', 'Golden Titles'),
  P('Diamond Divider', 'CREATE YOUR, OWN SUNSHINE'),
  P('Bracket Tiles', 'Elegant Tiles'),
  P('Curved Badge', 'Minimal', 'amazing, awesome'),
  P('Script Label', 'Elegant', 'TITLES ANIMATION'),
  P('Name Corner', 'Ruth Richards', 'MOTION DESIGNER'),
  P('Name Plate', 'Chloe Conley', 'SOUND DESIGNER'),
  P('Quote Brackets', 'success is a journey', 'not a destination'),
  P('Script Split', 'Golden', 'LUXURY, MODERN'),
  P('Offset Frame', 'Modern Tiles'),
  P('Number Tab', 'Golden Titles', '', '20'),
  P('Cross Words', 'AWESOME, AMAZING'),
  P('Number Badge', 'Luxury Titles', '', '20'),
  P('Arch Card', 'Forever', 'GOLDEN MEMORIES'),
  P('Diamond Card', 'Royal', 'EST. 2026'),
  P('Deco Ticket', 'Grand Opening', 'YOU ARE INVITED'),
  P('Corner Card', 'Elegance', 'TIMELESS STYLE'),
  P('Glass Card', 'Premium', 'LUXURY COLLECTION'),
  P('Stacked Cards', 'Chapter One', 'THE BEGINNING'),
];

export const GOLD_REEL_EACH = 90;
export const GOLD_REEL_FRAMES = GOLD_REEL_EACH * GOLD_TITLE_PRESETS.length;

/** All 20 back to back over one continuous wave background. */
export const GoldTitlesReel: React.FC = () => (
  <AbsoluteFill>
    <WaveField base={goldTitleDefaults.backgroundColor} />
    <Series>
      {GOLD_TITLE_PRESETS.map(({ id, props }) => (
        <Series.Sequence key={id} durationInFrames={GOLD_REEL_EACH}>
          <GoldTitle {...props} background="Transparent" />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
