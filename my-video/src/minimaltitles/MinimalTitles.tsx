import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';

// -----------------------------------------------------------
// MINIMAL TITLES  (white-on-black boxes, lines and labels)
// 15 layouts built from a few moves measured in the reference:
// mask slides, line/box morphs, draw-in outlines, converging
// stacks, label wipes, plus a gentle zoom "breathe" while holding.
// Every exit is the entrance played backwards (like the reference).
// -----------------------------------------------------------

const MONT = loadMontserrat('normal', { weights: ['800', '900'], subsets: ['latin'] }).fontFamily;

export const MINIMAL_LAYOUTS = [
  'Outline box',
  'Spinning square',
  'Split rule',
  'Bar to box',
  'Side bar',
  'Converge stack',
  'Label and line',
  'Outline draw',
  'Label stairs',
  'Letter box',
  'Offset lines',
  'Double rule',
  'Underline',
  'Twin squares',
  'Two labels',
] as const;
export type MinimalLayout = (typeof MINIMAL_LAYOUTS)[number];

export const minimalTitleSchema = z.object({
  layout: z.enum(MINIMAL_LAYOUTS),
  line1: z.string(),
  line2: z.string().describe('Second line (some layouts)'),
  line3: z.string().describe('Third line (some layouts)'),
  size: z.number().min(20).max(200).step(1),
  color: zColor().describe('Lines, boxes and text'),
  inkColor: zColor().describe('Text inside white boxes'),
  backgroundColor: zColor(),
  enterSeconds: z.number().min(0.2).max(3).step(0.05),
  exitSeconds: z.number().min(0.2).max(3).step(0.05),
  breathe: z.number().min(0).max(0.2).step(0.01).describe('Zoom dip while holding'),
  seconds: z.number().min(1).max(20).step(0.1),
});
export type MinimalTitleProps = z.infer<typeof minimalTitleSchema>;

export const minimalTitleDefaults: MinimalTitleProps = {
  layout: 'Outline box',
  line1: 'SHOW TITLES',
  line2: 'CLEAN',
  line3: 'MODERN',
  size: 150,
  color: '#ffffff',
  inkColor: '#0b0b0b',
  backgroundColor: '#050505',
  enterSeconds: 0.7,
  exitSeconds: 0.55,
  breathe: 0.07,
  seconds: 3.3,
};

// ---------- motion helpers ----------
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
// strong ease (slow start, long soft landing) — symmetric enough to play backwards for exits
const ease = Easing.bezier(0.65, 0, 0.15, 1);
/** progress of one element inside the master progress P (0..1) */
const seg = (P: number, a: number, b: number) => ease(lin(P, a, b));

/** Text that slides in from behind an edge (overflow mask). */
const MaskSlide: React.FC<{ s: number; from: 'top' | 'bottom' | 'left' | 'right'; style?: React.CSSProperties; children: React.ReactNode }> = ({
  s,
  from,
  style,
  children,
}) => {
  const off = (1 - s) * 105;
  const t = from === 'top' ? `translateY(${-off}%)` : from === 'bottom' ? `translateY(${off}%)` : from === 'left' ? `translateX(${-off}%)` : `translateX(${off}%)`;
  return (
    <div style={{ overflow: 'hidden', padding: '0.06em 0.08em', ...style }}>
      <div style={{ transform: t, whiteSpace: 'pre' }}>{children}</div>
    </div>
  );
};

type L = { P: number; p: MinimalTitleProps };

// =============================================================
// layouts — each draws itself from the master progress P
// =============================================================
const OutlineBox: React.FC<L> = ({ P, p }) => (
  <div style={{ border: `${p.size * 0.09}px solid ${p.color}`, padding: '0.25em 0.6em', opacity: lin(P, 0, 0.12) }}>
    <MaskSlide s={seg(P, 0.15, 1)} from="top">
      {p.line1}
    </MaskSlide>
  </div>
);

const SpinningSquare: React.FC<L> = ({ P, p }) => {
  const s = seg(P, 0, 0.75);
  const side = p.size * 3.4;
  return (
    <div
      style={{
        width: side,
        height: side,
        background: p.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${-(1 - s) * 900}px) rotate(${(1 - s) * 55}deg) scale(${0.45 + 0.55 * s})`,
      }}
    >
      <MaskSlide s={seg(P, 0.55, 1)} from="bottom" style={{ color: p.inkColor, fontSize: p.size * 0.6 }}>
        {p.line1}
      </MaskSlide>
    </div>
  );
};

const SplitRule: React.FC<L> = ({ P, p }) => {
  const line = seg(P, 0, 0.45);
  const conv = seg(P, 0.3, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <div style={{ transform: `translateY(${-(1 - conv) * p.size * 2.2}px)`, opacity: lin(P, 0.25, 0.45) }}>{p.line1}</div>
      <div style={{ width: p.size * 5.6, height: p.size * 0.09, background: p.color, margin: '0.12em 0', transform: `scaleX(${line})` }} />
      <div style={{ transform: `translateY(${(1 - conv) * p.size * 2.2}px)`, opacity: lin(P, 0.3, 0.5), fontSize: p.size * 0.95 }}>{p.line2}</div>
    </div>
  );
};

const BarToBox: React.FC<L> = ({ P, p }) => {
  const grow = seg(P, 0, 0.35); // thin bar grows tall
  const morph = seg(P, 0.3, 0.7); // tall bar → wide box
  const w = interpolate(morph, [0, 1], [p.size * 0.12, p.size * 6]);
  const h = interpolate(morph, [0, 1], [p.size * 4 * grow, p.size * 2.1]);
  return (
    <div style={{ width: w, height: h, background: p.color, color: p.inkColor, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', padding: morph > 0.5 ? '0 0.4em' : 0, overflow: 'hidden', boxSizing: 'border-box' }}>
      <MaskSlide s={seg(P, 0.6, 1)} from="left" style={{ alignSelf: 'flex-start', padding: 0 }}>
        {p.line1}
      </MaskSlide>
      <MaskSlide s={seg(P, 0.65, 1)} from="right" style={{ padding: 0 }}>
        {p.line2}
      </MaskSlide>
    </div>
  );
};

const SideBar: React.FC<L> = ({ P, p }) => (
  <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.35em', transform: `translateX(${(1 - seg(P, 0, 0.5)) * 900}px)` }}>
    <div style={{ width: p.size * 0.09, background: p.color, transform: `scaleY(${seg(P, 0.1, 0.5)})` }} />
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <MaskSlide s={seg(P, 0.35, 0.85)} from="right" style={{ padding: 0 }}>
        {p.line1}
      </MaskSlide>
      <div style={{ padding: 0 }}>{p.line2}</div>
      <MaskSlide s={seg(P, 0.45, 1)} from="right" style={{ padding: 0 }}>
        {p.line3}
      </MaskSlide>
    </div>
  </div>
);

const ConvergeStack: React.FC<L> = ({ P, p }) => {
  const mid = seg(P, 0, 0.45);
  const conv = seg(P, 0.3, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
      <div style={{ transform: `translateY(${-(1 - conv) * p.size * 2.4}px)`, opacity: lin(P, 0.25, 0.4) }}>{p.line1}</div>
      <MaskSlide s={mid} from="bottom" style={{ padding: 0 }}>
        {p.line2}
      </MaskSlide>
      <div style={{ transform: `translateY(${(1 - conv) * p.size * 2.4}px)`, opacity: lin(P, 0.3, 0.45) }}>{p.line3}</div>
    </div>
  );
};

const LabelAndLine: React.FC<L> = ({ P, p }) => {
  const bar = seg(P, 0.15, 0.6);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
      <div style={{ background: p.color, color: p.inkColor, transform: `scale(${0.25 + 0.75 * bar}, ${0.4 + 0.6 * bar})`, opacity: lin(P, 0.1, 0.2), padding: '0 0.25em' }}>
        <MaskSlide s={seg(P, 0.5, 1)} from="bottom" style={{ padding: 0 }}>
          {p.line1}
        </MaskSlide>
      </div>
      <MaskSlide s={seg(P, 0, 0.5)} from="bottom" style={{ padding: 0 }}>
        {p.line2}
      </MaskSlide>
    </div>
  );
};

const OutlineDraw: React.FC<L> = ({ P, p }) => {
  const s = seg(P, 0, 0.7);
  return (
    <div
      style={{
        border: `${p.size * 0.09}px solid ${p.color}`,
        padding: '0.2em 0.5em',
        lineHeight: 1.05,
        textAlign: 'center',
        transform: `rotate(${(1 - s) * 60}deg) scale(${0.35 + 0.65 * s})`,
        clipPath: `inset(${(1 - lin(P, 0, 0.35)) * 100}% 0 0 0)`,
      }}
    >
      <MaskSlide s={seg(P, 0.55, 1)} from="top" style={{ padding: 0 }}>
        {p.line1}
      </MaskSlide>
      <MaskSlide s={seg(P, 0.6, 1)} from="bottom" style={{ padding: 0 }}>
        {p.line2}
      </MaskSlide>
    </div>
  );
};

const Label: React.FC<{ s: number; t: number; from: 'left' | 'right'; p: MinimalTitleProps; text: string; style?: React.CSSProperties }> = ({ s, t, from, p, text, style }) => (
  <div
    style={{
      background: p.color,
      color: p.inkColor,
      padding: '0.05em 0.35em',
      clipPath: from === 'left' ? `inset(0 ${(1 - s) * 100}% 0 0)` : `inset(0 0 0 ${(1 - s) * 100}%)`,
      ...style,
    }}
  >
    <MaskSlide s={t} from={from} style={{ padding: 0 }}>
      {text}
    </MaskSlide>
  </div>
);

const LabelStairs: React.FC<L> = ({ P, p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2em', fontSize: p.size * 0.8 }}>
    <Label s={seg(P, 0.15, 0.6)} t={seg(P, 0.4, 0.9)} from="left" p={p} text={p.line1} style={{ alignSelf: 'flex-start', marginLeft: '0.6em' }} />
    <Label s={seg(P, 0, 0.45)} t={seg(P, 0.3, 0.8)} from="right" p={p} text={p.line2} style={{ alignSelf: 'flex-end', marginRight: '0.2em' }} />
    <Label s={seg(P, 0.25, 0.7)} t={seg(P, 0.5, 1)} from="right" p={p} text={p.line3} style={{ alignSelf: 'flex-start' }} />
  </div>
);

const LetterBox: React.FC<L> = ({ P, p }) => {
  const grow = seg(P, 0, 0.6);
  const side = p.size * 2.2;
  return (
    <div
      style={{
        width: side * (1.6 - 0.6 * grow),
        height: side * (0.12 + 0.88 * grow),
        background: p.color,
        color: p.inkColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: p.size * 1.9,
        transform: `translateY(${(1 - grow) * side * 0.6}px)`,
        overflow: 'hidden',
      }}
    >
      <MaskSlide s={seg(P, 0.5, 1)} from="bottom" style={{ padding: 0 }}>
        {p.line1.slice(0, 1)}
      </MaskSlide>
    </div>
  );
};

const OffsetLines: React.FC<L> = ({ P, p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
    <MaskSlide s={seg(P, 0, 0.7)} from="right" style={{ padding: 0, alignSelf: 'flex-start' }}>
      {p.line1}
    </MaskSlide>
    <MaskSlide s={seg(P, 0.2, 0.9)} from="left" style={{ padding: 0, alignSelf: 'flex-end', marginLeft: '1.2em' }}>
      {p.line2}
    </MaskSlide>
  </div>
);

const DoubleRule: React.FC<L> = ({ P, p }) => {
  const w = p.size * 7.2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: w, height: p.size * 0.08, background: p.color, transform: `scaleX(${seg(P, 0.45, 0.95)})` }} />
      <MaskSlide s={seg(P, 0.3, 0.85)} from="top" style={{ padding: '0.08em 0' }}>
        {p.line1}
      </MaskSlide>
      <div style={{ width: w, height: p.size * 0.08, background: p.color, transform: `scaleX(${seg(P, 0, 0.5)})` }} />
    </div>
  );
};

const Underline: React.FC<L> = ({ P, p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }}>
    <MaskSlide s={seg(P, 0, 0.6)} from="bottom" style={{ padding: 0 }}>
      {p.line1}
    </MaskSlide>
    <MaskSlide s={seg(P, 0.15, 0.75)} from="bottom" style={{ padding: 0 }}>
      {p.line2}
    </MaskSlide>
    <div style={{ width: p.size * 1.8, height: p.size * 0.08, background: p.color, marginTop: '0.18em', transform: `scaleX(${seg(P, 0.4, 1)})` }} />
  </div>
);

const TwinSquares: React.FC<L> = ({ P, p }) => {
  const side = p.size * 1.25;
  const sq = (s: number, letter: string, up: number, t: number) => (
    <div
      style={{
        width: side * (0.08 + 0.92 * s),
        height: side * (0.08 + 0.92 * s),
        background: p.color,
        color: p.inkColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${up}px)`,
        overflow: 'hidden',
        fontSize: p.size * 1.05,
      }}
    >
      <MaskSlide s={t} from="bottom" style={{ padding: 0 }}>
        {letter}
      </MaskSlide>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: p.size * 0.12, height: side * 1.6 }}>
      {sq(seg(P, 0, 0.55), p.line1.slice(0, 1), -side * 0.3 * seg(P, 0, 0.55), seg(P, 0.5, 0.95))}
      {sq(seg(P, 0.1, 0.65), p.line2.slice(0, 1), side * 0.25 * seg(P, 0.1, 0.65), seg(P, 0.55, 1))}
    </div>
  );
};

const TwoLabels: React.FC<L> = ({ P, p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25em', fontSize: p.size * 0.9 }}>
    <Label s={seg(P, 0, 0.55)} t={seg(P, 0.35, 0.9)} from="left" p={p} text={p.line1} />
    <Label s={seg(P, 0.12, 0.65)} t={seg(P, 0.45, 1)} from="right" p={p} text={p.line2} />
  </div>
);

const LAYOUTS: Record<MinimalLayout, React.FC<L>> = {
  'Outline box': OutlineBox,
  'Spinning square': SpinningSquare,
  'Split rule': SplitRule,
  'Bar to box': BarToBox,
  'Side bar': SideBar,
  'Converge stack': ConvergeStack,
  'Label and line': LabelAndLine,
  'Outline draw': OutlineDraw,
  'Label stairs': LabelStairs,
  'Letter box': LetterBox,
  'Offset lines': OffsetLines,
  'Double rule': DoubleRule,
  Underline,
  'Twin squares': TwinSquares,
  'Two labels': TwoLabels,
};

// =============================================================
// main
// =============================================================
export const MinimalTitle: React.FC<Partial<MinimalTitleProps> & { transparent?: boolean }> = ({ transparent, ...props }) => {
  const p = { ...minimalTitleDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const enterEnd = p.enterSeconds * fps;
  const exitStart = total - p.exitSeconds * fps;
  // master progress: 0 → 1 while entering, holds at 1, then 1 → 0 (entrance played backwards)
  const P = frame < exitStart ? lin(frame, 0, enterEnd) : 1 - lin(frame, exitStart, total);
  const breathe = 1 - p.breathe * Math.sin(Math.PI * lin(frame, enterEnd, exitStart));
  const Layout = LAYOUTS[p.layout];
  return (
    <AbsoluteFill style={{ backgroundColor: transparent ? undefined : p.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `scale(${breathe})`, fontFamily: MONT, fontWeight: 900, fontSize: p.size, color: p.color, letterSpacing: '0.01em', lineHeight: 1.1 }}>
        <Layout P={P} p={p} />
      </div>
    </AbsoluteFill>
  );
};

// =============================================================
// presets (own text), reel and grid preview
// =============================================================
const M = (props: Partial<MinimalTitleProps>): MinimalTitleProps => ({ ...minimalTitleDefaults, ...props });
export const MINIMAL_PRESETS: { id: string; props: MinimalTitleProps }[] = [
  { id: 'Minimal-01-Outline-Box', props: M({ layout: 'Outline box', line1: 'SHOW TITLES' }) },
  { id: 'Minimal-02-Spinning-Square', props: M({ layout: 'Spinning square', line1: 'INTRO' }) },
  { id: 'Minimal-03-Split-Rule', props: M({ layout: 'Split rule', line1: 'CHAPTER', line2: 'ONE' }) },
  { id: 'Minimal-04-Bar-To-Box', props: M({ layout: 'Bar to box', line1: 'SIMPLE', line2: 'STORIES' }) },
  { id: 'Minimal-05-Side-Bar', props: M({ layout: 'Side bar', line1: 'FAST', line2: 'CLEAR', line3: 'HONEST' }) },
  { id: 'Minimal-06-Converge-Stack', props: M({ layout: 'Converge stack', line1: 'IDEAS', line2: 'WORTH', line3: 'SHARING' }) },
  { id: 'Minimal-07-Label-And-Line', props: M({ layout: 'Label and line', line1: 'BUSINESS', line2: 'UPDATE' }) },
  { id: 'Minimal-08-Outline-Draw', props: M({ layout: 'Outline draw', line1: 'PART', line2: 'TWO' }) },
  { id: 'Minimal-09-Label-Stairs', props: M({ layout: 'Label stairs', line1: 'PLAN', line2: 'BUILD', line3: 'LAUNCH' }) },
  { id: 'Minimal-10-Letter-Box', props: M({ layout: 'Letter box', line1: 'B' }) },
  { id: 'Minimal-11-Offset-Lines', props: M({ layout: 'Offset lines', line1: 'MAKE IT', line2: 'MATTER' }) },
  { id: 'Minimal-12-Double-Rule', props: M({ layout: 'Double rule', line1: 'BIG NEWS' }) },
  { id: 'Minimal-13-Underline', props: M({ layout: 'Underline', line1: 'QUARTERLY', line2: 'REPORT' }) },
  { id: 'Minimal-14-Twin-Squares', props: M({ layout: 'Twin squares', line1: 'N', line2: 'O' }) },
  { id: 'Minimal-15-Two-Labels', props: M({ layout: 'Two labels', line1: 'FRESH', line2: 'START' }) },
];
const frames = (preset: { props: MinimalTitleProps }) => Math.round(preset.props.seconds * 30);
export const MINIMAL_REEL_FRAMES = MINIMAL_PRESETS.reduce((s, preset) => s + frames(preset), 0);

export const MinimalTitlesReel: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      {MINIMAL_PRESETS.map((preset) => {
        const start = from;
        from += frames(preset);
        return (
          <Sequence key={preset.id} from={start} durationInFrames={frames(preset)} name={preset.id}>
            <MinimalTitle {...preset.props} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** All 15 at once in a 5x3 grid, like the pack preview. */
export const MinimalTitlesGrid: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#050505' }}>
    {MINIMAL_PRESETS.map((preset, i) => (
      <div key={preset.id} style={{ position: 'absolute', left: (i % 5) * 384, top: Math.floor(i / 5) * 360, width: 384, height: 360 }}>
        <Sequence from={i * 3} layout="none">
          <MinimalTitle {...preset.props} size={preset.props.size * 0.18} seconds={6} transparent />
        </Sequence>
      </div>
    ))}
  </AbsoluteFill>
);
