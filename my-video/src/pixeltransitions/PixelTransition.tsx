import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { Clip, clipSchema } from '../transitions/TwoClipTransition';
import { SfxTrack } from '../SfxTrack';
import { SfxName } from '../sfx';

// -----------------------------------------------------------
// PIXEL TRANSITIONS  (fire-pixel light-burst cuts)
// A grid of square "pixels" heats up across the frame — dark red at
// the edge, then orange, yellow, pale pink and finally white. At the
// peak the frame is covered, clip A swaps to clip B underneath, and
// the heat cools away in the same direction. Both clips get a short
// mosaic (pixelate) around the cut.
// -----------------------------------------------------------

export const PIXEL_TRANSITION_NAMES = [
  'Corner Burst',
  'Side Sweep',
  'Diagonal Streak',
  'Center Bloom',
  'Rising Heat',
  'Column Wipe',
  'Ring Swirl',
  'Corner Flare',
  'Glitch Blocks',
  'Mosaic Cut',
] as const;
export type PixelTransitionName = (typeof PIXEL_TRANSITION_NAMES)[number];

export const PIXEL_RAMPS = {
  Fire: ['#b3001e', '#ff2a1a', '#ff7a00', '#ffc21a', '#ffe680', '#ffd6e0', '#ffffff'],
  Ice: ['#0a1f8f', '#1f57ff', '#1fb8ff', '#7fe8ff', '#c8f6ff', '#eefbff', '#ffffff'],
  Neon: ['#5a00b3', '#b01fff', '#ff2bd6', '#ff7ac4', '#ffc2e6', '#ffe6f4', '#ffffff'],
  Acid: ['#0b5f2a', '#14b84a', '#7dff3a', '#d8ff4a', '#f4ffa8', '#fbffe0', '#ffffff'],
} as const;
type RampName = keyof typeof PIXEL_RAMPS;

export const pixelTransitionSchema = z.object({
  transition: z.enum(PIXEL_TRANSITION_NAMES),
  clipA: clipSchema,
  clipB: clipSchema,
  secondsA: z.number().min(0.5).max(10).step(0.1).describe('Clip A length (the cut is centred on its end)'),
  secondsB: z.number().min(0.5).max(10).step(0.1).describe('Clip B length after the cut'),
  palette: z.enum(Object.keys(PIXEL_RAMPS) as [RampName, ...RampName[]]),
  pixelSize: z.number().min(16).max(160).step(2).describe('Size of the heat pixels (px)'),
  mosaic: z.number().min(0).max(80).step(1).describe('How chunky the clips get at the cut (0 = off)'),
  cutSeconds: z.number().min(0.3).max(3).step(0.05).describe('Length of the transition'),
  flip: z.boolean().describe('Mirror the direction'),
  playSound: z.boolean(),
  soundVolume: z.number().min(0).max(1).step(0.05),
});
export type PixelTransitionProps = z.infer<typeof pixelTransitionSchema>;

export const pixelTransitionDefaults: PixelTransitionProps = {
  transition: 'Corner Burst',
  clipA: { videoFile: '', startAt: 0, title: '01', color: '#14303a' },
  clipB: { videoFile: '', startAt: 0, title: '02', color: '#3a2a1a' },
  secondsA: 2,
  secondsB: 2,
  palette: 'Fire',
  pixelSize: 60,
  mosaic: 36,
  cutSeconds: 0.9,
  flip: false,
  playSound: true,
  soundVolume: 0.5,
};

// ---------- helpers ----------
const hash = (x: number, y = 0, s = 0) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const smooth = (a: number) => a * a * (3 - 2 * a);
const noise2 = (x: number, y: number, s = 0) => {
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

const hexToRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rampColor = (ramp: readonly string[], v: number) => {
  const x = Math.max(0, Math.min(1, v)) * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(x));
  const f = x - i;
  const a = hexToRgb(ramp[i]);
  const b = hexToRgb(ramp[i + 1]);
  return `rgb(${a.map((c, k) => Math.round(c + (b[k] - c) * f)).join(',')})`;
};

/**
 * Distance field d(x,y) in ~[0,1] for each style: where the heat starts (0)
 * and where it arrives last (1). u,v are 0..1 screen coords, aspect-corrected r.
 */
const field = (name: PixelTransitionName, u: number, v: number, flip: boolean, spin: number): number => {
  const U = flip ? 1 - u : u;
  switch (name) {
    case 'Corner Burst':
      return Math.hypot((1 - U) * 1.6, 1 - v) / 1.9;
    case 'Side Sweep':
      return U * 0.9 + Math.abs(v - 0.5) * 0.25;
    case 'Diagonal Streak':
      return (U + (1 - v)) / 2;
    case 'Center Bloom':
      return Math.hypot((U - 0.5) * 1.78, v - 0.5) / 1.02;
    case 'Rising Heat':
      return 1 - v;
    case 'Column Wipe':
      return U;
    case 'Ring Swirl': {
      const a = Math.atan2(v - 0.5, (U - 0.5) * 1.78);
      const r = Math.hypot((U - 0.5) * 1.78, v - 0.5);
      return ((((a + spin) / (Math.PI * 2)) % 1) + 1) % 1 * 0.55 + Math.abs(r - 0.45) * 0.8;
    }
    case 'Corner Flare':
      return Math.hypot(U * 1.4, v) / 1.72;
    default:
      return 0.5;
  }
};

/** The heat overlay. `p` runs 0 → 1 over the whole transition; cover peaks at 0.5. */
export const HeatGrid: React.FC<{ name: PixelTransitionName; p: number; cell: number; ramp: readonly string[]; flip: boolean; frame: number }> = ({
  name,
  p,
  cell,
  ramp,
  flip,
  frame,
}) => {
  const { width, height } = useVideoConfig();
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const rects: React.ReactNode[] = [];
  const flick = Math.floor(frame / 2);

  if (name === 'Glitch Blocks') {
    // scattered blocks, a white flash on the cut frames
    const amt = Math.sin(Math.PI * p);
    const small = Math.max(8, Math.round(cell / 3));
    for (let i = 0; i < 260 * amt; i++) {
      const x = Math.floor(hash(i, flick, 1) * width / small) * small;
      const y = Math.floor(hash(i, flick, 2) * height / small) * small;
      const w = small * (1 + Math.floor(hash(i, flick, 3) * 6));
      const h = small * (1 + Math.floor(hash(i, flick, 4) * 2));
      rects.push(<rect key={i} x={x} y={y} width={w} height={h} fill={rampColor(ramp, 0.1 + hash(i, flick, 5) * 0.5)} opacity={0.35 + hash(i, flick, 6) * 0.5} />);
    }
    if (Math.abs(p - 0.5) < 0.07) rects.push(<rect key="flash" x={0} y={0} width={width} height={height} fill="#ffffff" />);
  } else if (name === 'Mosaic Cut') {
    // no heat: a thin hot scanline and a faint tint ride the mosaic
    const amt = Math.sin(Math.PI * p);
    const y = Math.round((0.2 + 0.6 * hash(Math.floor(frame / 3), 9)) * rows) * cell;
    rects.push(<rect key="tint" x={0} y={0} width={width} height={height} fill={ramp[1]} opacity={amt * 0.18} />);
    rects.push(<rect key="line" x={0} y={y} width={width} height={Math.max(4, cell / 10)} fill={ramp[1]} opacity={amt > 0.15 ? 0.9 : 0} />);
    if (Math.abs(p - 0.5) < 0.05) rects.push(<rect key="flash" x={0} y={0} width={width} height={height} fill="#ffffff" opacity={0.6} />);
  } else {
    const spin = p * Math.PI * 2.2;
    const front = interpolate(p, [0, 0.5], [-0.25, 1.35], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const back = interpolate(p, [0.5, 1], [-0.35, 1.25], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const G = 3.2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const u = (x + 0.5) / cols;
        const v = (y + 0.5) / rows;
        const n = noise2(x * 0.35, y * 0.35 + frame * 0.05, 3) - 0.5;
        const d = field(name, u, v, flip, spin) + n * 0.28 + (hash(x, y, flick) - 0.5) * 0.06;
        let heat = (front - d) * G;
        if (p > 0.5) heat = Math.min(heat, (d - back) * G);
        if (heat <= 0.02) continue;
        rects.push(
          <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={rampColor(ramp, heat)} opacity={Math.min(1, 0.35 + heat * 1.4)} />,
        );
      }
    }
  }
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
      {rects}
    </svg>
  );
};

/** Pixelate whatever is inside with an SVG filter (block size in px). */
export const Mosaic: React.FC<{ size: number; id: string; children: React.ReactNode }> = ({ size, id, children }) => {
  const s = Math.round(size);
  if (s < 3) return <AbsoluteFill>{children}</AbsoluteFill>;
  const half = Math.floor(s / 2);
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feFlood x={half} y={half} width={1} height={1} />
          <feComposite width={s} height={s} />
          <feTile result="grid" />
          <feComposite in="SourceGraphic" in2="grid" operator="in" />
          <feMorphology operator="dilate" radius={half} />
        </filter>
      </svg>
      {/* grown by one block (a smooth, tiny zoom that scales with the block size) so the
          last partial row/column still has something to sample */}
      <div style={{ position: 'absolute', left: -s / 2, top: -s / 2, width: `calc(100% + ${s}px)`, height: `calc(100% + ${s}px)`, filter: `url(#${id})` }}>
        <AbsoluteFill>{children}</AbsoluteFill>
      </div>
    </AbsoluteFill>
  );
};

export const SOUND: Record<PixelTransitionName, SfxName> = {
  'Corner Burst': 'whoosh-synth-whip',
  'Side Sweep': 'whoosh-swipe-clean',
  'Diagonal Streak': 'whoosh-synth-whip',
  'Center Bloom': 'whoosh-air',
  'Rising Heat': 'whoosh-soft',
  'Column Wipe': 'whoosh-swipe-clean',
  'Ring Swirl': 'whoosh-air',
  'Corner Flare': 'whoosh-synth-whip',
  'Glitch Blocks': 'glitch-digital-error',
  'Mosaic Cut': 'glitch-digital-error',
};

export const calculatePixelTransitionMetadata: CalculateMetadataFunction<PixelTransitionProps> = ({ props }) => ({
  durationInFrames: Math.round((props.secondsA + props.secondsB) * 30),
});

export const PixelTransition: React.FC<PixelTransitionProps> = (props) => {
  const p = { ...pixelTransitionDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cut = Math.round(p.secondsA * fps);
  const len = Math.max(6, Math.round(p.cutSeconds * fps));
  const start = cut - len / 2;
  const prog = (frame - start) / len; // 0..1 inside the transition
  const inside = prog > 0 && prog < 1;
  const ramp = PIXEL_RAMPS[p.palette as RampName] ?? PIXEL_RAMPS.Fire;
  const mos = inside ? p.mosaic * Math.pow(Math.sin(Math.PI * prog), 1.5) * (p.transition === 'Mosaic Cut' ? 1.8 : 1) : 0;
  const showB = frame >= cut;
  const bLen = Math.round(p.secondsB * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Mosaic size={mos} id="ptx-mosaic">
        {/* both clips stay mounted so the swap is frame-exact */}
        <Sequence durationInFrames={cut} layout="none">
          <AbsoluteFill style={{ opacity: showB ? 0 : 1 }}>
            <Clip {...p.clipA} />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={cut} durationInFrames={bLen} layout="none">
          <Clip {...p.clipB} />
        </Sequence>
      </Mosaic>
      {inside && <HeatGrid name={p.transition} p={prog} cell={p.pixelSize} ramp={ramp} flip={p.flip} frame={frame} />}
      {p.playSound && (
        <SfxTrack cues={[{ sound: SOUND[p.transition], at: Math.max(0, Math.round(start + len * 0.2)), volume: p.soundVolume }]} />
      )}
    </AbsoluteFill>
  );
};

export const pixelTransitionId = (name: PixelTransitionName) => `PixelTx-${name.replace(/\s+/g, '')}`;

export const PIXEL_TRANSITION_PRESETS: Record<PixelTransitionName, Partial<PixelTransitionProps>> = {
  'Corner Burst': {},
  'Side Sweep': { pixelSize: 54 },
  'Diagonal Streak': { pixelSize: 48 },
  'Center Bloom': { pixelSize: 64 },
  'Rising Heat': { pixelSize: 56 },
  'Column Wipe': { pixelSize: 72, palette: 'Fire' },
  'Ring Swirl': { pixelSize: 50, cutSeconds: 1.1 },
  'Corner Flare': { pixelSize: 60, flip: true },
  'Glitch Blocks': { pixelSize: 60, palette: 'Neon', cutSeconds: 0.6 },
  'Mosaic Cut': { mosaic: 48, cutSeconds: 0.7 },
};
