import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadOpenSans } from '@remotion/google-fonts/OpenSans';
import { loadFont as loadLora } from '@remotion/google-fonts/Lora';
import { loadFont as loadCourier } from '@remotion/google-fonts/CourierPrime';
import { loadFont as loadBaskerville } from '@remotion/google-fonts/LibreBaskerville';
import { loadFont as loadMarker } from '@remotion/google-fonts/PermanentMarker';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadMerriweather } from '@remotion/google-fonts/Merriweather';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadSpecialElite } from '@remotion/google-fonts/SpecialElite';
import { loadFont as loadRubik } from '@remotion/google-fonts/Rubik';
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono';
import { loadFont as loadCaveat } from '@remotion/google-fonts/Caveat';
import { PaperTexture } from './PaperTexture';
import { SfxTrack } from '../SfxTrack';

// -----------------------------------------------------------
// MATCH CUT (typography)
// A highlighted keyword stays locked at the exact centre of the
// screen while the page around it hard-cuts every few frames:
// article, heading, quote, screenplay, book, label, headline...
// each in its own font. Depth-of-field blur keeps only the
// keyword line sharp; the camera slowly pushes in.
// Works in landscape and vertical (layout scales to the frame).
// -----------------------------------------------------------

const F = {
  sans: loadOpenSans('normal', { weights: ['400', '600', '700'], subsets: ['latin'] }).fontFamily,
  lora: loadLora('italic', { weights: ['500'], subsets: ['latin'] }).fontFamily,
  courier: loadCourier('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily,
  bask: loadBaskerville('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily,
  marker: loadMarker('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  oswald: loadOswald('normal', { weights: ['600', '700'], subsets: ['latin'] }).fontFamily,
  merri: loadMerriweather('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily,
  mont: loadMontserrat('normal', { weights: ['600', '700'], subsets: ['latin'] }).fontFamily,
  elite: loadSpecialElite('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  rubik: loadRubik('normal', { weights: ['400', '500'], subsets: ['latin'] }).fontFamily,
  mono: loadSpaceMono('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily,
  caveat: loadCaveat('normal', { weights: ['700'], subsets: ['latin'] }).fontFamily,
};

export const PAGE_KINDS = [
  'Article',
  'Heading',
  'Quote',
  'Screenplay',
  'Chapter',
  'Label',
  'Headline',
  'Divider',
  'Typewriter',
  'Footnote',
  'Note',
  'Photo caption',
] as const;
type PageKind = (typeof PAGE_KINDS)[number];

export const matchCutSchema = z.object({
  words: z
    .array(z.object({ word: z.string(), cuts: z.number().int().min(1).max(60).describe('How many pages show this word') }))
    .min(1)
    .max(12),
  cutFrames: z.number().int().min(2).max(30).describe('Frames each page stays (4 = fast)'),
  rampIn: z.boolean().describe('First pages stay longer, then speed up'),
  endHoldSeconds: z.number().min(0).max(5).step(0.1).describe('Hold the last page'),
  pages: z.array(z.enum(PAGE_KINDS)).min(2).describe('Which page designs to cycle through'),
  textScale: z.number().min(0.5).max(2).step(0.05).describe('Overall text size (how close the camera is)'),
  highlightColor: zColor(),
  inkColor: zColor(),
  paperColor: zColor(),
  depthBlur: z.number().min(0).max(2).step(0.05).describe('Out-of-focus blur around the keyword'),
  pushIn: z.number().min(0).max(0.5).step(0.01).describe('Slow camera zoom over the whole clip'),
  paperTexture: z.boolean().describe('Grain, specks and soft edges'),
  flashOnCut: z.boolean().describe('Tiny exposure blip on every cut'),
  playSound: z.boolean().describe('Whoosh when the keyword changes'),
  soundVolume: z.number().min(0).max(1).step(0.05),
});
export type MatchCutProps = z.infer<typeof matchCutSchema>;

export const matchCutDefaults: MatchCutProps = {
  words: [
    { word: 'Match Cut', cuts: 14 },
    { word: 'Typography', cuts: 12 },
    { word: 'Storytelling', cuts: 12 },
  ],
  cutFrames: 4,
  rampIn: true,
  endHoldSeconds: 1,
  pages: [...PAGE_KINDS],
  textScale: 1,
  highlightColor: '#ffe81a',
  inkColor: '#2a2a2a',
  paperColor: '#ededeb',
  depthBlur: 1,
  pushIn: 0.12,
  paperTexture: true,
  flashOnCut: false,
  playSound: true,
  soundVolume: 0.45,
};

// -----------------------------------------------------------
// Schedule: which page / word is on screen at each frame
// -----------------------------------------------------------
type Cut = { start: number; end: number; word: string; wordIndex: number; kind: PageKind; seed: number };

const buildCuts = (p: MatchCutProps, fps: number): Cut[] => {
  const cuts: Cut[] = [];
  let t = 0;
  let n = 0;
  let prevKind: PageKind | null = null;
  p.words.forEach((w, wi) => {
    for (let c = 0; c < w.cuts; c++) {
      const ramp = p.rampIn ? Math.max(0, 5 - n) * 3 : 0; // 15, 12, 9, 6, 3 extra frames at the start
      let len = p.cutFrames + ramp;
      const isLast = wi === p.words.length - 1 && c === w.cuts - 1;
      if (isLast) len += Math.round(p.endHoldSeconds * fps);
      // Walk through a shuffled order of the page designs so every design shows up
      // (reshuffled each round, never the same design twice in a row).
      const round = Math.floor(n / p.pages.length);
      const order = [...p.pages].sort((a, b) => random(`o-${round}-${a}`) - random(`o-${round}-${b}`));
      let kind = order[n % p.pages.length];
      if (kind === prevKind) kind = order[(n + 1) % p.pages.length];
      prevKind = kind;
      cuts.push({ start: t, end: t + len, word: w.word, wordIndex: wi, kind, seed: n });
      t += len;
      n++;
    }
  });
  return cuts;
};

export const calculateMatchCutMetadata: CalculateMetadataFunction<MatchCutProps> = ({ props }) => {
  const cuts = buildCuts(props, 30);
  return { durationInFrames: Math.max(1, cuts[cuts.length - 1]?.end ?? 30) };
};

// -----------------------------------------------------------
// Filler text (own sentences)
// -----------------------------------------------------------
const SENTENCES = [
  'It started as a small idea that slowly turned into something much bigger than anyone expected.',
  'Every great edit hides hundreds of tiny decisions that the viewer never notices at all.',
  'The real power of a story lies in the moments between the big events.',
  'Designers and engineers worked side by side to shape the final result.',
  'Nobody remembers the plan, but everyone remembers how it made them feel.',
  'Over the years the method spread from studio to studio and city to city.',
  'Simple rules, repeated with care, often beat complicated systems.',
  'What looked like luck from the outside was years of quiet practice.',
  'The audience leaned in, waiting for the next line to land.',
  'It is one of the oldest tricks in the book, and it still works today.',
  'Each frame carries a little piece of the message forward.',
  'Critics called it a passing trend; ten years later it was everywhere.',
];
const BEFORE = ['The real power of', 'This is why', 'Everything changed with', 'Nobody talks about', 'They built it on', 'The secret behind', 'Welcome to'];
const AFTER = ['in modern editing.', 'and why it works.', 'that changed everything.', 'for every creator.', 'step by step.', 'in this very story.', 'like never before.'];

const pick = <T,>(arr: T[], seed: string) => arr[Math.floor(random(seed) * arr.length)];
const textRun = (seed: number, i: number, length = 3) =>
  Array.from({ length }, (_, k) => pick(SENTENCES, `s-${seed}-${i}-${k}`)).join(' ');

// -----------------------------------------------------------
// Building blocks (all positioned from the screen centre, in px)
// -----------------------------------------------------------
type Ctx = { u: number; colW: number; ink: string; hl: string; seed: number; word: string };

const Line: React.FC<{ y: number; x?: number; w?: number; style: React.CSSProperties; children: React.ReactNode; align?: 'left' | 'center' | 'right' }> = ({
  y,
  x,
  w,
  style,
  children,
  align = 'left',
}) => (
  <div
    style={{
      position: 'absolute',
      left: x ?? -(w ?? 0) / 2,
      width: w,
      top: y,
      transform: 'translateY(-50%)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textAlign: align,
      ...style,
    }}
  >
    {children}
  </div>
);

type HighlightKind = 'marker' | 'brush' | 'tape' | 'none';

const Keyword: React.FC<{ text: string; color: string; kind: HighlightKind; tilt?: number; seed: number }> = ({ text, color, kind, tilt = 0, seed }) => {
  const r = (k: string) => random(`${k}-${seed}`);
  const brushClip = `polygon(0% ${10 + r('a') * 10}%, 3% 2%, 97% ${r('b') * 8}%, 100% ${15 + r('c') * 10}%, 99% ${85 + r('d') * 10}%, 96% 100%, 2% ${92 + r('e') * 8}%, 0% ${80 - r('f') * 10}%)`;
  return (
    <span style={{ position: 'relative', display: 'inline-block', padding: '0 0.16em', transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      {kind !== 'none' ? (
        <span
          style={{
            position: 'absolute',
            left: kind === 'brush' ? '-0.12em' : 0,
            right: kind === 'brush' ? '-0.2em' : 0,
            top: kind === 'tape' ? '-0.12em' : '0.08em',
            bottom: kind === 'tape' ? '-0.1em' : '0.02em',
            background: color,
            clipPath: kind === 'brush' ? brushClip : undefined,
            transform: kind === 'marker' ? `skewX(-${4 + r('s') * 6}deg)` : undefined,
            boxShadow: kind === 'tape' ? '0 6px 14px rgba(0,0,0,0.25)' : undefined,
            zIndex: 0,
          }}
        />
      ) : null}
      <span style={{ position: 'relative', zIndex: 1 }}>{text}</span>
    </span>
  );
};

/** The line that carries the keyword: keyword exactly centred, text either side. */
const KeyLine: React.FC<{
  ctx: Ctx;
  before: string;
  after: string;
  style: React.CSSProperties;
  hl: HighlightKind;
  width?: number;
  tilt?: number;
  keywordStyle?: React.CSSProperties;
}> = ({ ctx, before, after, style, hl, width, tilt, keywordStyle }) => {
  const w = width ?? ctx.colW;
  return (
    <div
      style={{
        position: 'absolute',
        left: -w / 2,
        width: w,
        top: 0,
        transform: 'translateY(-50%)',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', overflow: 'hidden' }}>
        <span style={{ flexShrink: 0, paddingRight: '0.25em' }}>{before}</span>
      </div>
      <span style={keywordStyle}>
        <Keyword text={ctx.word} color={ctx.hl} kind={hl} tilt={tilt} seed={ctx.seed} />
      </span>
      <div style={{ display: 'flex', justifyContent: 'flex-start', overflow: 'hidden' }}>
        <span style={{ flexShrink: 0, paddingLeft: after === '*' || after === '!' ? 0 : '0.25em' }}>{after}</span>
      </div>
    </div>
  );
};

/** Black-and-white "photo" made in code (soft shapes + grain), no image files. */
const Photo: React.FC<{ x: number; y: number; w: number; h: number; seed: number; tilt?: number; frame?: boolean }> = ({ x, y, w, h, seed, tilt = 0, frame }) => {
  const r = (k: string) => random(`${k}-${seed}`);
  const g1 = Math.round(90 + r('g1') * 80);
  const g2 = Math.round(170 + r('g2') * 60);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `rotate(${tilt}deg)`,
        padding: frame ? 10 : 0,
        background: frame ? '#fafafa' : undefined,
        boxShadow: frame ? '0 10px 30px rgba(0,0,0,0.25)' : undefined,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `radial-gradient(ellipse ${30 + r('a') * 30}% ${40 + r('b') * 30}% at ${20 + r('c') * 60}% ${60 + r('d') * 30}%, rgb(${g1 - 60},${g1 - 60},${g1 - 60}), transparent 70%),
            radial-gradient(circle at ${r('e') * 100}% ${r('f') * 50}%, rgba(255,255,255,0.55), transparent 45%),
            linear-gradient(${Math.round(r('h') * 180)}deg, rgb(${g1},${g1},${g1}), rgb(${g2},${g2},${g2}))`,
          filter: 'grayscale(1) contrast(1.1)',
        }}
      />
    </div>
  );
};

const paragraph = (ctx: Ctx, ys: number[], style: React.CSSProperties, w = ctx.colW, x?: number) =>
  ys.map((y, i) => (
    <Line key={`p${y}`} y={y} w={w} x={x} style={style}>
      {textRun(ctx.seed, i)}
    </Line>
  ));

const columns = (ctx: Ctx, top: number, rows: number, cols: number, colWidth: number, gap: number, size: number, font: string) => {
  const total = cols * colWidth + (cols - 1) * gap;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => (
      <Line
        key={`c${c}-${r}`}
        y={top + r * size * 1.5}
        x={-total / 2 + c * (colWidth + gap)}
        w={colWidth}
        style={{ fontFamily: font, fontSize: size, color: ctx.ink, opacity: 0.75 }}
      >
        {textRun(ctx.seed + c * 7, r, 1)}
      </Line>
    )),
  );
};

// -----------------------------------------------------------
// Page designs
// -----------------------------------------------------------
const Page: React.FC<{ kind: PageKind; ctx: Ctx }> = ({ kind, ctx }) => {
  const { u, colW, ink, seed } = ctx;
  const before = pick(BEFORE, `b-${seed}`);
  const after = pick(AFTER, `a-${seed}`);
  switch (kind) {
    case 'Article': {
      const s = 44 * u;
      const body: React.CSSProperties = { fontFamily: F.sans, fontSize: s, color: ink, fontWeight: 400 };
      return (
        <>
          {paragraph(ctx, [-3, -2, -1, 1, 2, 3, 4].map((k) => k * s * 1.6), body)}
          <KeyLine ctx={ctx} before={before} after={after} style={{ ...body, fontWeight: 600 }} hl="marker" />
        </>
      );
    }
    case 'Heading': {
      const s = 78 * u;
      const body: React.CSSProperties = { fontFamily: F.sans, fontSize: 40 * u, color: ink, opacity: 0.85 };
      return (
        <>
          <Photo x={-colW * 0.1} y={-s * 4.2} w={colW * 0.75} h={s * 2.6} seed={seed} />
          <KeyLine ctx={ctx} before={`0${(seed % 9) + 1}.`} after="" style={{ fontFamily: F.sans, fontWeight: 700, fontSize: s, color: ink }} hl="brush" />
          {paragraph(ctx, [1.3, 2.1, 2.9].map((k) => k * s), body)}
        </>
      );
    }
    case 'Quote': {
      const s = 62 * u;
      return (
        <>
          <KeyLine ctx={ctx} before="“The best" after="on the market”" style={{ fontFamily: F.lora, fontStyle: 'italic', fontWeight: 500, fontSize: s, color: ink }} hl="marker" />
          <Line y={s * 1.3} x={colW * 0.05} w={colW * 0.45} style={{ fontFamily: F.sans, fontSize: 28 * u, color: ink, opacity: 0.7 }}>
            — J. Rivera, The Morning Post
          </Line>
          {paragraph(ctx, [-2.6, -3.4].map((k) => k * s), { fontFamily: F.sans, fontSize: 26 * u, color: ink, opacity: 0.5 })}
        </>
      );
    }
    case 'Screenplay': {
      const s = 42 * u;
      const mono: React.CSSProperties = { fontFamily: F.courier, fontSize: s, color: ink };
      const w = colW * 0.8;
      return (
        <>
          <Line y={-s * 1.8} w={w} align="center" style={{ ...mono, fontWeight: 700 }}>
            MAIN CHARACTER (O.S.)
          </Line>
          <KeyLine ctx={ctx} before="I'm so glad" after="is here and" style={mono} hl="marker" width={w} />
          <Line y={s * 1.2} w={w} style={mono}>
            use all the power we have left!
          </Line>
          <Line y={s * 3.4} w={w} align="center" style={{ ...mono, fontWeight: 700, opacity: 0.8 }}>
            STREET OBSERVER (O.S.)
          </Line>
          {paragraph(ctx, [4.6, 5.8].map((k) => k * s), { ...mono, opacity: 0.7 }, w)}
        </>
      );
    }
    case 'Chapter': {
      const s = 42 * u;
      const serif: React.CSSProperties = { fontFamily: F.bask, fontSize: s, color: ink };
      return (
        <>
          <Line y={-s * 3.4} w={colW} style={{ ...serif, fontSize: s * 1.5, fontWeight: 700 }}>
            Chapter {['One', 'Two', 'Three', 'Four'][seed % 4]}
          </Line>
          {paragraph(ctx, [-1.6, 1.6, 3.2, 4.8].map((k) => k * s), serif)}
          <KeyLine ctx={ctx} before="to be with this" after="technique used in" style={serif} hl="marker" />
        </>
      );
    }
    case 'Label': {
      const s = 54 * u;
      return (
        <>
          <Photo x={-colW * 0.5} y={-s * 5} w={colW * 0.42} h={s * 3.6} seed={seed} tilt={-4} frame />
          <Photo x={colW * 0.08} y={s * 1.4} w={colW * 0.44} h={s * 3.4} seed={seed + 3} tilt={5} frame />
          {paragraph(ctx, [-1.6, 1.6].map((k) => k * s), { fontFamily: F.sans, fontSize: 24 * u, color: ink, opacity: 0.6 }, colW * 0.4, -colW * 0.5)}
          <KeyLine ctx={ctx} before="" after="" style={{ fontFamily: F.marker, fontSize: s, color: ink }} hl="tape" tilt={-3} />
        </>
      );
    }
    case 'Headline': {
      const s = 36 * u;
      return (
        <>
          <Line y={-s * 4.2} w={colW} align="center" style={{ fontFamily: F.oswald, fontWeight: 700, fontSize: 150 * u, color: ink, lineHeight: 1 }}>
            {pick(['THE NEW ERA', 'MAIN TAKEOVER', 'GOING GLOBAL', 'BREAKING POINT'], `h-${seed}`)}
          </Line>
          <KeyLine ctx={ctx} before="you can get this" after="and get the most" style={{ fontFamily: F.merri, fontSize: s, color: ink, fontWeight: 700 }} hl="marker" />
          {columns(ctx, s * 1.8, 4, 3, colW * 0.3, colW * 0.05, 20 * u, F.merri)}
        </>
      );
    }
    case 'Divider': {
      const s = 50 * u;
      const rule = <span style={{ display: 'inline-block', width: colW * 0.28, height: 2 * u, background: ink, opacity: 0.6, verticalAlign: 'middle' }} />;
      return (
        <>
          <Photo x={-colW * 0.4} y={-s * 4.6} w={colW * 0.8} h={s * 2.8} seed={seed} />
          <KeyLine
            ctx={ctx}
            before=""
            after=""
            style={{ fontFamily: F.mont, fontWeight: 700, fontSize: s, color: ink }}
            hl="marker"
            keywordStyle={{ display: 'flex', alignItems: 'center', gap: 24 * u }}
          />
          <Line y={0} w={colW} style={{}}>
            {rule}
          </Line>
          <Line y={0} w={colW} align="right" style={{}}>
            {rule}
          </Line>
          {columns(ctx, s * 1.4, 5, 3, colW * 0.3, colW * 0.05, 19 * u, F.sans)}
        </>
      );
    }
    case 'Typewriter': {
      const s = 44 * u;
      const tw: React.CSSProperties = { fontFamily: F.elite, fontSize: s, color: ink };
      return (
        <>
          {paragraph(ctx, [-3, -2, -1, 1, 2, 3].map((k) => k * s * 1.5), { ...tw, opacity: 0.85 })}
          <KeyLine ctx={ctx} before="using this" after="for their work" style={tw} hl="marker" />
        </>
      );
    }
    case 'Footnote': {
      const s = 52 * u;
      return (
        <>
          <KeyLine ctx={ctx} before="" after="*" style={{ fontFamily: F.rubik, fontWeight: 500, fontSize: s, color: ink }} hl="marker" />
          {paragraph(ctx, [1.5, 2.1, 2.7, 3.3].map((k) => k * s), { fontFamily: F.rubik, fontSize: 24 * u, color: ink, opacity: 0.65 }, colW * 0.7)}
          {paragraph(ctx, [-2.4, -3.0].map((k) => k * s), { fontFamily: F.rubik, fontSize: 24 * u, color: ink, opacity: 0.4 }, colW * 0.7)}
        </>
      );
    }
    case 'Note': {
      const s = 40 * u;
      const mono: React.CSSProperties = { fontFamily: F.mono, fontSize: s, color: ink };
      return (
        <>
          <Line y={-s * 2.4} w={colW * 0.9} style={{ ...mono, fontWeight: 700, opacity: 0.7 }}>
            NOTE {String((seed % 40) + 1).padStart(3, '0')} —
          </Line>
          <KeyLine ctx={ctx} before="Remember:" after="matters most." style={mono} hl="brush" width={colW * 0.9} />
          {paragraph(ctx, [1.6, 2.8, 4].map((k) => k * s), { ...mono, opacity: 0.6, fontSize: s * 0.8 }, colW * 0.9)}
        </>
      );
    }
    case 'Photo caption': {
      const s = 70 * u;
      return (
        <>
          <Photo x={-colW * 0.38} y={-s * 4.4} w={colW * 0.76} h={s * 3.6} seed={seed} frame tilt={1.5} />
          <KeyLine ctx={ctx} before="" after="!" style={{ fontFamily: F.caveat, fontWeight: 700, fontSize: s, color: ink }} hl="none" />
          {paragraph(ctx, [1.4, 2].map((k) => k * s), { fontFamily: F.sans, fontSize: 22 * u, color: ink, opacity: 0.5 }, colW * 0.76)}
        </>
      );
    }
    default:
      return null;
  }
};

// -----------------------------------------------------------
// Main
// -----------------------------------------------------------
export const MatchCut: React.FC<MatchCutProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const cuts = buildCuts(p, fps);
  const cut = cuts.find((c) => frame >= c.start && frame < c.end) ?? cuts[cuts.length - 1];

  const landscape = width > height;
  const u = (Math.min(width, height) / 1080) * p.textScale * (landscape ? 1.6 : 1.15);
  const colW = width * (landscape ? 0.96 : 1.1); // text runs off the edges, like a real close-up
  const ctx: Ctx = { u, colW, ink: p.inkColor, hl: p.highlightColor, seed: cut.seed, word: cut.word };

  const zoom = 1 + p.pushIn * interpolate(frame, [0, durationInFrames], [0, 1]);
  // A tiny shift / tilt per page sells the "different sheet of paper" feel (keyword stays centred).
  const tilt = (random(`t-${cut.seed}`) - 0.5) * 2.4;
  const flash = p.flashOnCut && frame === cut.start && cut.seed > 0 ? 1.08 : 1;

  const d = p.depthBlur;
  const cues = p.playSound
    ? cuts
        .filter((c, i) => i > 0 && c.wordIndex !== cuts[i - 1].wordIndex)
        .map((c) => ({ sound: 'whoosh-air' as const, at: Math.max(0, c.start - 3), volume: p.soundVolume }))
    : [];

  const scene = (
    <AbsoluteFill style={{ backgroundColor: p.paperColor, overflow: 'hidden', filter: flash !== 1 ? `brightness(${flash})` : undefined }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) rotate(${tilt}deg)` }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 }}>
          {/* tall frames: fill the rest of the sheet with soft text so it reads as a full page */}
          {!landscape
            ? [...Array.from({ length: 9 }, (_, i) => -height * 0.5 + i * 34 * u * 1.7), ...Array.from({ length: 9 }, (_, i) => height * 0.24 + i * 34 * u * 1.7)].map(
                (y, i) => (
                  <Line key={`f${i}`} y={y} w={colW} style={{ fontFamily: F.sans, fontSize: 30 * u, color: p.inkColor, opacity: 0.45 }}>
                    {textRun(cut.seed + 50, i)}
                  </Line>
                ),
              )
            : null}
          <Page kind={cut.kind} ctx={ctx} />
        </div>
      </AbsoluteFill>
      {/* depth of field: sharp band around the keyword, blur grows outward */}
      {d > 0 ? (
        <>
          <AbsoluteFill
            style={{
              backdropFilter: `blur(${2.5 * d * u}px)`,
              WebkitMaskImage: 'radial-gradient(ellipse 34% 7% at 50% 50%, transparent 55%, black 100%)',
              maskImage: 'radial-gradient(ellipse 34% 7% at 50% 50%, transparent 55%, black 100%)',
            }}
          />
          <AbsoluteFill
            style={{
              backdropFilter: `blur(${7 * d * u}px)`,
              WebkitMaskImage: 'radial-gradient(ellipse 55% 26% at 50% 50%, transparent 45%, black 100%)',
              maskImage: 'radial-gradient(ellipse 55% 26% at 50% 50%, transparent 45%, black 100%)',
            }}
          />
        </>
      ) : null}
      {/* soft light sheen across the paper */}
      <AbsoluteFill style={{ background: 'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.35) 48%, transparent 62%)', mixBlendMode: 'screen' }} />
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill>
      {p.paperTexture ? (
        <PaperTexture tint={0} halftone={0} paper={0.45} grain="Fine" blotches={0.15} dust={0.2} vignette={0.22} fade={0.04} boilFps={0}>
          {scene}
        </PaperTexture>
      ) : (
        scene
      )}
      <SfxTrack cues={cues} />
    </AbsoluteFill>
  );
};
