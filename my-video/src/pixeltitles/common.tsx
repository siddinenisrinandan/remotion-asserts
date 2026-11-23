import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadArchivoBlack } from '@remotion/google-fonts/ArchivoBlack';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadSilkscreen } from '@remotion/google-fonts/Silkscreen';
import { loadFont as loadSerif } from '@remotion/google-fonts/DMSerifDisplay';
import { loadFont as loadBigShoulders } from '@remotion/google-fonts/BigShoulders';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';

// -----------------------------------------------------------
// PIXEL TITLES — shared fonts, schema and helpers
// One schema for every title so each one is editable the same way:
// headline / second line / small words / body / colours / video.
// -----------------------------------------------------------

export const F = {
  anton: loadAnton('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  archivoBlack: loadArchivoBlack('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  archivoItalic: loadArchivo('italic', { weights: ['900'], subsets: ['latin'] }).fontFamily,
  inter: loadInter('normal', { weights: ['400', '500', '600'], subsets: ['latin'] }).fontFamily,
  pixel: loadSilkscreen('normal', { weights: ['400', '700'], subsets: ['latin'] }).fontFamily,
  serif: loadSerif('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  shoulders: loadBigShoulders('normal', { weights: ['900'], subsets: ['latin'] }).fontFamily,
  oswald: loadOswald('normal', { weights: ['600'], subsets: ['latin'] }).fontFamily,
};

export const pixelTitleSchema = z.object({
  headline: z.string(),
  line2: z.string().describe('Second line / extra word (some styles)'),
  words: z.string().describe('Small labels, separated by commas'),
  body: z.string().describe('Small paragraph that types on'),
  textColor: zColor(),
  accentColor: zColor(),
  secondColor: zColor(),
  backgroundColor: zColor(),
  videoFile: z.string().describe('Optional background video/image in public/. Empty = drawn background'),
  pixelExit: z.boolean().describe('Pixel-block dissolve at the end'),
  speed: z.number().min(0.3).max(3).step(0.1),
  seconds: z.number().min(1).max(20).step(0.1),
});
export type PixelTitleProps = z.infer<typeof pixelTitleSchema>;

export const BODY =
  'Graphic design blends creativity and technology, transforming ideas into visual narratives that communicate messages, evoke emotions, and inspire action.';

export const baseDefaults: PixelTitleProps = {
  headline: 'TITLE',
  line2: '',
  words: '',
  body: BODY,
  textColor: '#ffffff',
  accentColor: '#4dff7a',
  secondColor: '#1f3bff',
  backgroundColor: '#0d0f0e',
  videoFile: '',
  pixelExit: true,
  speed: 1,
  seconds: 4,
};

export type TitleFC = React.FC<Partial<PixelTitleProps>>;

/** merge props + local time (frame * speed) */
export const useTitle = (props: Partial<PixelTitleProps>, defaults: PixelTitleProps) => {
  const p = { ...defaults, ...props };
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  return { p, frame, t: frame * p.speed, width, height, durationInFrames, fps };
};

export const words = (s: string) =>
  s
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

// ---------- maths ----------
export const hash = (x: number, y = 0, s = 0) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const smooth = (a: number) => a * a * (3 - 2 * a);
export const noise2 = (x: number, y: number, s = 0) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash(ix, iy, s);
  const b = hash(ix + 1, iy, s);
  const c = hash(ix, iy + 1, s);
  const d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

export const ease = (f: number, a: number, b: number, e = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });

// ---------- text helpers ----------
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&@';

/** Letters lock in one by one; unlocked ones flicker through random glyphs. */
export const scramble = (text: string, progress: number, frame: number, seed = 1, order: 'ltr' | 'random' = 'ltr') => {
  const chars = Array.from(text);
  return chars
    .map((ch, i) => {
      if (ch === ' ') return ' ';
      const at = order === 'ltr' ? i / Math.max(1, chars.length) : hash(i, seed) * 0.85;
      if (progress >= at + 0.08) return ch;
      if (progress < at - 0.25) return order === 'random' ? ' ' : '';
      return GLYPHS[Math.floor(hash(i, Math.floor(frame / 2), seed) * GLYPHS.length)];
    })
    .join('');
};

export const typed = (text: string, t: number, start: number, cps = 2.2) =>
  text.slice(0, Math.max(0, Math.floor((t - start) * cps)));

export const Body: React.FC<{ text: string; t: number; start: number; style?: React.CSSProperties; cps?: number }> = ({
  text,
  t,
  start,
  style,
  cps,
}) => (
  <div style={{ fontFamily: F.inter, fontWeight: 400, fontSize: 22, lineHeight: 1.35, ...style }}>{typed(text, t, start, cps)}</div>
);

// ---------- background ----------
export const MediaBg: React.FC<{ file: string; fallback: React.ReactNode; style?: React.CSSProperties }> = ({ file, fallback, style }) => {
  if (!file) return <AbsoluteFill style={style}>{fallback}</AbsoluteFill>;
  const src = /^https?:/.test(file) ? file : staticFile(file);
  const isImg = /\.(png|jpe?g|webp|gif|avif)$/i.test(file);
  return (
    <AbsoluteFill style={style}>
      {isImg ? (
        <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Video src={src} objectFit="cover" style={{ width: '100%', height: '100%' }} muted />
      )}
    </AbsoluteFill>
  );
};

/** Grid of solid blocks that pop on at random over [start, start+len] — used for the pixel exit. */
export const PixelBlocks: React.FC<{
  t: number;
  start: number;
  len: number;
  cell: number;
  color: string;
  seed?: number;
  invert?: boolean; // true = blocks disappear instead
}> = ({ t, start, len, cell, color, seed = 3, invert }) => {
  const { width, height } = useVideoConfig();
  if (!invert && t < start) return null;
  if (invert && t > start + len) return null;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const out: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const at = start + hash(x, y, seed) * len;
      const on = invert ? t < at : t >= at;
      if (on) out.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={color} />);
    }
  }
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
      {out}
    </svg>
  );
};

/** Wraps a title: runs the pixel-dissolve exit over the last 12 frames. */
export const TitleShell: React.FC<{ p: PixelTitleProps; frame: number; duration: number; bg: string; children: React.ReactNode }> = ({
  p,
  frame,
  duration,
  bg,
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: bg, overflow: 'hidden' }}>
    {children}
    {p.pixelExit && <PixelBlocks t={frame} start={duration - 13} len={11} cell={80} color="#000000" seed={9} />}
  </AbsoluteFill>
);
