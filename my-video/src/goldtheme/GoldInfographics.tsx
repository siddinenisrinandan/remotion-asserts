import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadKaushan } from '@remotion/google-fonts/KaushanScript';
import { loadFont as loadCinzel } from '@remotion/google-fonts/Cinzel';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { WaveField } from './WaveField';

// -----------------------------------------------------------
// GOLD INFOGRAPHICS — 7 animated charts in the gold theme.
// Type your data one item per line:   Label | value | note
//   values can carry their own units: 98%  $1,250  4.9★  1.2M
// Numbers count up, bars rise, rings and lines draw themselves.
// Exit = the entry played backwards (numbers count back down).
// -----------------------------------------------------------

const SCRIPT = loadKaushan('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily;
const SERIF = loadCinzel('normal', { weights: ['600', '700'], subsets: ['latin'] }).fontFamily;
const MONT = loadMontserrat('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;

const GOLDS = {
  Classic: ['#fff4cf', '#f2cf78', '#c8973c', '#8d6420', '#f6dd96', '#b0812f'],
  Pale: ['#ffffff', '#f6ebc8', '#d9c08a', '#9a8352', '#f3e6bd', '#b9a06a'],
  Rose: ['#fff0e8', '#f3c2a8', '#d08f72', '#8e4f3a', '#f6cdb6', '#b57359'],
  Deep: ['#ffe7a0', '#eab443', '#b97f1a', '#6e4307', '#f2c55a', '#94600f'],
} as const;
type GoldName = keyof typeof GOLDS;

export const INFO_CHARTS = ['Stat Counters', 'Bar Chart', 'Progress Rings', 'Donut Chart', 'Timeline', 'Podium', 'Line Graph'] as const;
export type InfoChart = (typeof INFO_CHARTS)[number];

export const goldInfoSchema = z.object({
  chart: z.enum(INFO_CHARTS),
  heading: z.string(),
  headingFont: z.enum(['Script', 'Serif Caps']),
  subheading: z.string(),
  data: z.string().describe('One item per line:  Label | value | note   (values may include %, $, ★ …)'),
  gold: z.enum(Object.keys(GOLDS) as [GoldName, ...GoldName[]]),
  textColor: zColor(),
  background: z.enum(['Waves', 'Video', 'Solid', 'Transparent']),
  videoFile: z.string().describe('Background video in public/ (when background = Video)'),
  darken: z.number().min(0).max(0.95).step(0.05),
  backgroundColor: zColor(),
  speed: z.number().min(0.3).max(3).step(0.1),
  seconds: z.number().min(2).max(30).step(0.1),
});
export type GoldInfoProps = z.infer<typeof goldInfoSchema>;

export const goldInfoDefaults: GoldInfoProps = {
  chart: 'Stat Counters',
  heading: 'Our Year in Numbers',
  headingFont: 'Script',
  subheading: 'ANNUAL REPORT 2026',
  data: 'Happy Clients | 1,250+ | worldwide\nProjects Done | 340 | since 2019\nAwards Won | 27 | design & film\nRating | 4.9★ | average review',
  gold: 'Classic',
  textColor: '#f4ecd6',
  background: 'Waves',
  videoFile: 'testvideo4.mp4',
  darken: 0.6,
  backgroundColor: '#1b1546',
  speed: 1,
  seconds: 7,
};

// ---------- helpers ----------
const clampO = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const E = (t: number, a: number, b: number, e = Easing.out(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clampO, easing: e });

type Item = { label: string; raw: string; num: number; prefix: string; suffix: string; decimals: number; note: string };

const parse = (data: string): Item[] =>
  data
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split(/\s*\|\s*/);
      const label = parts[0] ?? '';
      const raw = parts[1] ?? '';
      const note = parts.slice(2).join(' | ');
      const m = raw.match(/^(.*?)(-?[\d,]*\.?\d+)(.*)$/);
      if (!m) return { label, raw, num: NaN, prefix: '', suffix: raw, decimals: 0, note };
      const numStr = m[2].replace(/,/g, '');
      const dec = numStr.includes('.') ? numStr.split('.')[1].length : 0;
      return { label, raw, num: parseFloat(numStr), prefix: m[1], suffix: m[3], decimals: dec, note };
    });

/** the value text at progress k (counts up from 0) */
const fmt = (it: Item, k: number) => {
  if (Number.isNaN(it.num)) return it.raw;
  const v = it.num * k;
  const useCommas = /\d,\d/.test(it.raw);
  const s = v.toLocaleString('en-US', { minimumFractionDigits: it.decimals, maximumFractionDigits: it.decimals, useGrouping: useCommas });
  return `${it.prefix}${s}${it.suffix}`;
};

type Ctx = { t: number; c: readonly string[]; items: Item[]; p: GoldInfoProps; id: string };

const G = (ctx: Ctx, kind: 'v' | 'h' | 'line') => `url(#${ctx.id}${kind})`;

const label = (ctx: Ctx, x: number, y: number, text: string, o: number, size = 24, anchor: 'middle' | 'start' | 'end' = 'middle', weight = 700, spacing = 3) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={MONT} fontWeight={weight} fontSize={size} letterSpacing={spacing} fill={ctx.p.textColor} opacity={o}>
    {text}
  </text>
);

const goldNum = (ctx: Ctx, x: number, y: number, text: string, o: number, size: number, anchor: 'middle' | 'start' | 'end' = 'middle') => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={SERIF} fontWeight={700} fontSize={size} fill={G(ctx, 'v')} opacity={o} style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))' }}>
    {text}
  </text>
);

const Diamond: React.FC<{ x: number; y: number; s: number; k: number; fill: string }> = ({ x, y, s, k, fill }) =>
  k <= 0 ? null : <rect x={-s / 2} y={-s / 2} width={s} height={s} fill={fill} transform={`translate(${x} ${y}) rotate(45) scale(${k})`} />;

// ---------- charts ----------
const CHARTS: Record<InfoChart, (ctx: Ctx) => React.ReactNode> = {
  'Stat Counters': (ctx) => {
    const { t, items } = ctx;
    const list = items.slice(0, 4);
    const n = list.length || 1;
    const span = Math.min(1600, n * 420);
    return list.map((it, i) => {
      const cx = 960 - span / 2 + (span / n) * (i + 0.5);
      const a = 14 + i * 6;
      const ring = E(t, a, a + 28);
      const count = E(t, a + 4, a + 46, Easing.out(Easing.quad));
      const C = 2 * Math.PI * 135;
      return (
        <g key={i}>
          <circle cx={cx} cy={570} r={135} fill="rgba(12,9,30,0.35)" opacity={ring} />
          <circle cx={cx} cy={570} r={135} fill="none" stroke={G(ctx, 'line')} strokeWidth={4} strokeDasharray={`${C * ring} ${C}`} transform={`rotate(-90 ${cx} 570)`} />
          <circle cx={cx} cy={570} r={120} fill="none" stroke={G(ctx, 'line')} strokeWidth={1.4} opacity={0.7 * E(t, a + 6, a + 30)} strokeDasharray={`${2 * Math.PI * 120 * E(t, a + 6, a + 34)} 9999`} transform={`rotate(90 ${cx} 570)`} />
          {goldNum(ctx, cx, 595, fmt(it, count), E(t, a + 2, a + 14), it.raw.length > 6 ? 54 : 68)}
          {label(ctx, cx, 760, it.label.toUpperCase(), E(t, a + 14, a + 28), 24)}
          {it.note ? label(ctx, cx, 798, it.note, 0.8 * E(t, a + 18, a + 32), 19, 'middle', 400, 1) : null}
        </g>
      );
    });
  },

  'Bar Chart': (ctx) => {
    const { t, items } = ctx;
    const n = items.length || 1;
    const x0 = 330;
    const x1 = 1590;
    const base = 900;
    const maxH = 470;
    const max = Math.max(...items.map((i) => (Number.isNaN(i.num) ? 0 : i.num)), 1);
    const slot = (x1 - x0) / n;
    const bw = Math.min(120, slot * 0.5);
    return (
      <>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1={x0} x2={x0 + (x1 - x0) * E(t, 6 + i * 2, 24 + i * 2)} y1={base - maxH * g} y2={base - maxH * g} stroke={ctx.p.textColor} strokeOpacity={0.12} strokeDasharray="6 8" />
        ))}
        <line x1={x0 - 20} x2={x0 - 20 + (x1 - x0 + 40) * E(t, 4, 22)} y1={base} y2={base} stroke={G(ctx, 'line')} strokeWidth={3} />
        {items.map((it, i) => {
          const cx = x0 + slot * (i + 0.5);
          const a = 18 + i * 5;
          const k = E(t, a, a + 30, Easing.out(Easing.back(1.1)));
          const h = (Math.max(0, it.num) / max) * maxH * k;
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={base - h} width={bw} height={h} fill={G(ctx, 'h')} />
              <rect x={cx - bw / 2} y={base - h} width={bw} height={Math.min(4, h)} fill={ctx.c[0]} opacity={0.9} />
              {goldNum(ctx, cx, base - h - 18, fmt(it, Math.min(1, k)), E(t, a + 6, a + 16), 36)}
              {label(ctx, cx, base + 44, it.label.toUpperCase(), E(t, a, a + 14), 22)}
            </g>
          );
        })}
      </>
    );
  },

  'Progress Rings': (ctx) => {
    const { t, items } = ctx;
    const list = items.slice(0, 5);
    const n = list.length || 1;
    const span = Math.min(1600, n * 380);
    const r = 120;
    const C = 2 * Math.PI * r;
    return list.map((it, i) => {
      const cx = 960 - span / 2 + (span / n) * (i + 0.5);
      const a = 14 + i * 6;
      const k = E(t, a, a + 40, Easing.inOut(Easing.cubic));
      const pct = Math.max(0, Math.min(1, it.num / 100));
      return (
        <g key={i}>
          <circle cx={cx} cy={570} r={r} fill="none" stroke={ctx.p.textColor} strokeOpacity={0.12 * E(t, a - 6, a + 6)} strokeWidth={18} />
          <circle cx={cx} cy={570} r={r} fill="none" stroke={G(ctx, 'line')} strokeWidth={18} strokeLinecap="round" strokeDasharray={`${C * pct * k} ${C}`} transform={`rotate(-90 ${cx} 570)`} />
          {goldNum(ctx, cx, 594, fmt(it, k), E(t, a, a + 10), 62)}
          {label(ctx, cx, 760, it.label.toUpperCase(), E(t, a + 10, a + 24), 24)}
          {it.note ? label(ctx, cx, 796, it.note, 0.8 * E(t, a + 14, a + 28), 19, 'middle', 400, 1) : null}
        </g>
      );
    });
  },

  'Donut Chart': (ctx) => {
    const { t, items, c } = ctx;
    const cols = [c[1], c[3], c[4], c[2], c[0], c[5]];
    const total = items.reduce((s, i) => s + (Number.isNaN(i.num) ? 0 : Math.max(0, i.num)), 0) || 1;
    const cx = 720;
    const cy = 600;
    const r = 220;
    const C = 2 * Math.PI * r;
    const sweep = E(t, 12, 56, Easing.inOut(Easing.cubic)) * C;
    let acc = 0;
    const top = items.reduce((b, i) => (i.num > b.num ? i : b), items[0] ?? { num: 0, label: '' } as Item);
    return (
      <>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={ctx.p.textColor} strokeOpacity={0.08} strokeWidth={80} />
        {items.map((it, i) => {
          const len = (Math.max(0, it.num) / total) * C;
          const start = acc;
          acc += len;
          const vis = Math.max(0, Math.min(len, sweep - start));
          if (vis <= 0) return null;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={cols[i % cols.length]}
              strokeWidth={80}
              strokeDasharray={`${Math.max(0, vis - 3)} ${C}`}
              strokeDashoffset={-start}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r + 48} fill="none" stroke={G(ctx, 'line')} strokeWidth={1.5} strokeDasharray={`${2 * Math.PI * (r + 48) * E(t, 6, 40)} 9999`} transform={`rotate(-90 ${cx} ${cy})`} />
        {top ? goldNum(ctx, cx, cy + 10, fmt(top, E(t, 20, 56)), E(t, 18, 30), 72) : null}
        {top ? label(ctx, cx, cy + 56, top.label.toUpperCase(), E(t, 24, 36), 20) : null}
        {items.map((it, i) => {
          const y = cy - ((items.length - 1) * 80) / 2 + i * 80;
          const a = 24 + i * 6;
          const k = E(t, a, a + 16);
          return (
            <g key={`l${i}`} opacity={k} transform={`translate(${(1 - k) * 30} 0)`}>
              <rect x={1135} y={y - 13} width={26} height={26} fill={cols[i % cols.length]} transform={`rotate(45 1148 ${y})`} />
              {label(ctx, 1190, y + 9, it.label.toUpperCase(), 1, 26, 'start')}
              {goldNum(ctx, 1640, y + 13, fmt(it, E(t, a, a + 30)), 1, 40, 'end')}
            </g>
          );
        })}
      </>
    );
  },

  Timeline: (ctx) => {
    const { t, items } = ctx;
    const n = items.length || 1;
    const x0 = 250;
    const x1 = 1670;
    const y = 610;
    const line = E(t, 8, 60, Easing.inOut(Easing.quad));
    const xEnd = x0 + (x1 - x0) * line;
    return (
      <>
        <line x1={x0} x2={xEnd} y1={y} y2={y} stroke={G(ctx, 'line')} strokeWidth={3} />
        {items.map((it, i) => {
          const x = n === 1 ? (x0 + x1) / 2 : x0 + 60 + ((x1 - x0 - 120) / (n - 1)) * i;
          const reached = xEnd >= x - 4;
          const k = reached ? Math.min(1, (xEnd - x + 4) / 40) : 0;
          return (
            <g key={i}>
              <Diamond x={x} y={y} s={26} k={k} fill={ctx.c[1]} />
              <Diamond x={x} y={y} s={12} k={k} fill="#1b1438" />
              {goldNum(ctx, x, y - 50, it.label, k, 52)}
              <line x1={x} x2={x} y1={y + 22} y2={y + 22 + 36 * k} stroke={G(ctx, 'line')} strokeWidth={1.5} />
              {label(ctx, x, y + 92, it.raw.toUpperCase(), k, 24)}
              {it.note ? label(ctx, x, y + 128, it.note, 0.8 * k, 19, 'middle', 400, 1) : null}
            </g>
          );
        })}
      </>
    );
  },

  Podium: (ctx) => {
    const { t, items, c } = ctx;
    const metals = [
      [c[0], c[1], c[2], c[3]],
      ['#ffffff', '#e3e7ea', '#a9b1b8', '#6d757c'],
      ['#ffe0c7', '#e0a070', '#a8653a', '#5e331a'],
    ];
    const order = [1, 0, 2]; // left = 2nd, centre = 1st, right = 3rd
    const heights = [330, 240, 180];
    const base = 930;
    const w = 280;
    return (
      <>
        <defs>
          {metals.map((m, i) => (
            <linearGradient key={i} id={`${ctx.id}m${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={m[3]} />
              <stop offset="0.2" stopColor={m[2]} />
              <stop offset="0.45" stopColor={m[0]} />
              <stop offset="0.6" stopColor={m[1]} />
              <stop offset="1" stopColor={m[3]} />
            </linearGradient>
          ))}
        </defs>
        {order.map((rank, slot) => {
          const it = items[rank];
          if (!it) return null;
          const x = 960 + (slot - 1) * (w + 30);
          const a = 10 + (2 - rank) * 8;
          const k = E(t, a, a + 26, Easing.out(Easing.back(1.2)));
          const h = heights[rank] * k;
          const tk = E(t, a + 18, a + 32);
          return (
            <g key={rank}>
              <rect x={x - w / 2} y={base - h} width={w} height={h} fill={`url(#${ctx.id}m${rank})`} />
              <rect x={x - w / 2} y={base - h} width={w} height={Math.min(6, h)} fill="#ffffff" opacity={0.5} />
              <text x={x} y={base - h + 120} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={110} fill="rgba(30,20,10,0.35)" opacity={E(t, a + 10, a + 24)}>
                {rank + 1}
              </text>
              {goldNum(ctx, x, base - h - 30, fmt(it, tk), tk, 40)}
              {label(ctx, x, base - h - 86, it.label.toUpperCase(), tk, 30)}
              {rank === 0 ? (
                <path
                  d="M0 -30 L8.8 -12.1 L28.5 -9.3 L14.3 4.6 L17.6 24.3 L0 15 L-17.6 24.3 L-14.3 4.6 L-28.5 -9.3 L-8.8 -12.1Z"
                  fill={G(ctx, 'v')}
                  transform={`translate(${x} ${base - h - 160}) scale(${1.3 * E(t, a + 26, a + 38, Easing.out(Easing.back(2.5)))}) rotate(${(1 - tk) * -90})`}
                  style={{ filter: `drop-shadow(0 0 12px ${c[1]})` }}
                />
              ) : null}
            </g>
          );
        })}
        <line x1={960 - 1.5 * w - 60} x2={960 + 1.5 * w + 60} y1={base} y2={base} stroke={G(ctx, 'line')} strokeWidth={3} opacity={E(t, 4, 14)} />
      </>
    );
  },

  'Line Graph': (ctx) => {
    const { t, items } = ctx;
    const n = items.length || 1;
    const x0 = 320;
    const x1 = 1600;
    const base = 900;
    const top = 400;
    const vals = items.map((i) => (Number.isNaN(i.num) ? 0 : i.num));
    const max = Math.max(...vals, 1);
    const pts = items.map((_, i) => [n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) / (n - 1)) * i, base - (vals[i] / max) * (base - top)] as const);
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    const draw = E(t, 14, 60, Easing.inOut(Easing.cubic));
    const xNow = x0 + (x1 - x0) * draw;
    const area = pts.length ? `${d} L${pts[pts.length - 1][0]} ${base} L${pts[0][0]} ${base} Z` : '';
    return (
      <>
        <defs>
          <linearGradient id={`${ctx.id}area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ctx.c[1]} stopOpacity={0.45} />
            <stop offset="1" stopColor={ctx.c[1]} stopOpacity={0} />
          </linearGradient>
          <clipPath id={`${ctx.id}clip`}>
            <rect x={0} y={0} width={xNow} height={1080} />
          </clipPath>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1={x0} x2={x1} y1={base - (base - top) * g} y2={base - (base - top) * g} stroke={ctx.p.textColor} strokeOpacity={0.1 * E(t, 4, 16)} strokeDasharray="6 8" />
        ))}
        <line x1={x0 - 20} x2={x0 - 20 + (x1 - x0 + 40) * E(t, 4, 20)} y1={base} y2={base} stroke={G(ctx, 'line')} strokeWidth={3} />
        <g clipPath={`url(#${ctx.id}clip)`}>
          <path d={area} fill={`url(#${ctx.id}area)`} />
          <path d={d} fill="none" stroke={G(ctx, 'line')} strokeWidth={5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${ctx.c[2]})` }} />
        </g>
        {pts.map(([x, y], i) => {
          const k = Math.max(0, Math.min(1, (xNow - x + 40) / 40));
          return (
            <g key={i}>
              {k > 0 && <circle cx={x} cy={y} r={11 * k} fill="#1b1438" stroke={ctx.c[1]} strokeWidth={4} />}
              {goldNum(ctx, x, y - 30, fmt(items[i], k), k, 30)}
              {label(ctx, x, base + 42, items[i].label.toUpperCase(), E(t, 10 + i * 2, 22 + i * 2), 20)}
            </g>
          );
        })}
      </>
    );
  },
};

export const GoldInfographic: React.FC<Partial<GoldInfoProps>> = (props) => {
  const p = { ...goldInfoDefaults, ...props };
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = Math.min(frame, durationInFrames - 1 - frame) * p.speed;
  const c = GOLDS[p.gold as GoldName] ?? GOLDS.Classic;
  const id = `gi${React.useId().replace(/:/g, '')}`;
  const items = parse(p.data);
  const ctx: Ctx = { t, c, items, p, id };
  const shine = interpolate(t, [20, 70], [-20, 130], clampO);
  const headIn = E(t, 0, 20);

  const bg =
    p.background === 'Waves' ? (
      <WaveField base={p.backgroundColor} intensity={0.75} />
    ) : p.background === 'Video' && p.videoFile ? (
      <>
        {/\.(png|jpe?g|webp|gif|avif)$/i.test(p.videoFile) ? (
          <Img src={staticFile(p.videoFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Video src={staticFile(p.videoFile)} objectFit="cover" style={{ width: '100%', height: '100%' }} muted />
        )}
        <AbsoluteFill style={{ background: `rgba(10,7,20,${p.darken})` }} />
      </>
    ) : p.background === 'Solid' ? (
      <AbsoluteFill style={{ backgroundColor: p.backgroundColor }} />
    ) : null;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {bg}
      {/* heading */}
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 70 }}>
        <div
          style={{
            fontFamily: p.headingFont === 'Script' ? SCRIPT : SERIF,
            fontWeight: p.headingFont === 'Script' ? 400 : 700,
            fontSize: p.headingFont === 'Script' ? 92 : 70,
            letterSpacing: p.headingFont === 'Script' ? 0 : '0.06em',
            lineHeight: 1.2,
            padding: '0 0.1em',
            backgroundImage: `linear-gradient(105deg, transparent ${shine - 9}%, rgba(255,252,238,0.9) ${shine}%, transparent ${shine + 9}%), linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 25%, ${c[2]} 48%, ${c[3]} 56%, ${c[4]} 72%, ${c[5]} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))',
            opacity: headIn,
            transform: `translateY(${(1 - headIn) * 20}px)`,
          }}
        >
          {p.heading}
        </div>
        {p.subheading ? (
          <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 20, letterSpacing: `${interpolate(E(t, 6, 24), [0, 1], [0.6, 0.3])}em`, color: c[1], opacity: E(t, 6, 22), marginTop: 6 }}>
            {p.subheading}
          </div>
        ) : null}
        <div style={{ position: 'relative', width: 360, height: 14, marginTop: 18 }}>
          <div style={{ position: 'absolute', left: `${50 - E(t, 8, 24) * 50}%`, top: 6, width: `${E(t, 8, 24) * 100}%`, height: 2, background: `linear-gradient(90deg, transparent, ${c[1]}, ${c[2]}, ${c[1]}, transparent)` }} />
          <div style={{ position: 'absolute', left: 'calc(50% - 5px)', top: 2, width: 10, height: 10, background: c[1], transform: `rotate(45deg) scale(${E(t, 14, 22)})` }} />
        </div>
      </AbsoluteFill>
      {/* chart */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c[0]} />
            <stop offset="0.3" stopColor={c[1]} />
            <stop offset="0.52" stopColor={c[2]} />
            <stop offset="0.6" stopColor={c[3]} />
            <stop offset="0.78" stopColor={c[4]} />
            <stop offset="1" stopColor={c[5]} />
          </linearGradient>
          <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={c[3]} />
            <stop offset="0.22" stopColor={c[2]} />
            <stop offset="0.45" stopColor={c[0]} />
            <stop offset="0.6" stopColor={c[1]} />
            <stop offset="1" stopColor={c[3]} />
          </linearGradient>
          <linearGradient id={`${id}line`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={260} y2={80} spreadMethod="reflect">
            <stop offset="0" stopColor={c[0]} />
            <stop offset="0.4" stopColor={c[1]} />
            <stop offset="0.7" stopColor={c[2]} />
            <stop offset="1" stopColor={c[4]} />
          </linearGradient>
        </defs>
        {CHARTS[p.chart](ctx)}
      </svg>
    </AbsoluteFill>
  );
};

const P = (chart: InfoChart, heading: string, subheading: string, data: string, extra: Partial<GoldInfoProps> = {}) => ({
  id: `GoldInfo-${chart.replace(/\s+/g, '')}`,
  props: { ...goldInfoDefaults, chart, heading, subheading, data, ...extra } as GoldInfoProps,
});

export const GOLD_INFO_PRESETS = [
  P('Stat Counters', 'Our Year in Numbers', 'ANNUAL REPORT 2026', goldInfoDefaults.data),
  P('Bar Chart', 'Growth', 'REVENUE IN THOUSANDS', '2021 | $120K\n2022 | $180K\n2023 | $260K\n2024 | $340K\n2025 | $470K'),
  P('Progress Rings', 'Our Skills', 'WHAT WE DO BEST', 'Design | 92% | brand & web\nMotion | 85% | animation\nBranding | 78% | identity'),
  P('Donut Chart', 'Where Time Goes', 'WEEKLY BREAKDOWN', 'Video | 45%\nSocial | 25%\nWeb | 18%\nPrint | 12%'),
  P('Timeline', 'Our Journey', 'FROM DAY ONE', '2019 | Founded | first tiny studio\n2021 | First Award | best short film\n2023 | New Office | 20 people strong\n2026 | Going Global | 3 countries'),
  P('Podium', 'Top Creators', 'THIS MONTH', 'Anna | 9,820 pts\nMia | 8,450 pts\nLeo | 7,300 pts'),
  P('Line Graph', 'Subscribers', 'FIRST HALF OF 2026', 'Jan | 20K\nFeb | 34K\nMar | 30K\nApr | 52K\nMay | 61K\nJun | 88K'),
];
