import React, { useId, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { z } from 'zod';

// -----------------------------------------------------------
// FILTER LAYER  ("premium look" colour grading)
// Wrap ANY scene in <FilterLayer {...props}>...</FilterLayer>.
// Each look is a set of tone curves per colour channel (like a
// 1D LUT) + saturation, all designed here (no third-party LUTs,
// so no licence issues). On top: fade, warmth, grain, vignette.
//
// Rule: put the filter on the FINISHED stack (video + text +
// cut-out person), never on footage before making a cut-out.
// -----------------------------------------------------------

export const LOOKS = [
  'None',
  'Warm Film',
  'Teal & Orange',
  'Moody',
  'B&W Film',
  'Vintage',
  'Summer Glow',
  'Clean Pop',
] as const;
export type Look = (typeof LOOKS)[number];

type Curve = [number, number, number, number, number]; // output at input 0, .25, .5, .75, 1
type LookDef = { r: Curve; g: Curve; b: Curve; saturation: number };

const IDENTITY: Curve = [0, 0.25, 0.5, 0.75, 1];

const LOOK_DEFS: Record<Look, LookDef> = {
  None: { r: IDENTITY, g: IDENTITY, b: IDENTITY, saturation: 1 },
  // Soft lifted blacks, warm mids, creamy highlights.
  'Warm Film': {
    r: [0.05, 0.3, 0.58, 0.82, 0.99],
    g: [0.04, 0.26, 0.53, 0.78, 0.96],
    b: [0.05, 0.22, 0.46, 0.7, 0.88],
    saturation: 0.9,
  },
  // Cinema split-tone: teal shadows, warm skin and highlights.
  'Teal & Orange': {
    r: [0.0, 0.21, 0.52, 0.82, 1.0],
    g: [0.05, 0.25, 0.51, 0.77, 0.96],
    b: [0.11, 0.31, 0.5, 0.68, 0.84],
    saturation: 1.1,
  },
  // Darker, low saturation, cool shadows.
  Moody: {
    r: [0.02, 0.17, 0.41, 0.69, 0.92],
    g: [0.03, 0.19, 0.43, 0.7, 0.92],
    b: [0.06, 0.23, 0.46, 0.71, 0.9],
    saturation: 0.72,
  },
  // Rich contrast black and white with soft blacks.
  'B&W Film': {
    r: [0.04, 0.18, 0.5, 0.82, 0.97],
    g: [0.04, 0.18, 0.5, 0.82, 0.97],
    b: [0.04, 0.18, 0.5, 0.82, 0.97],
    saturation: 0,
  },
  // Faded, warm highlights, slightly green-blue shadows.
  Vintage: {
    r: [0.1, 0.32, 0.57, 0.8, 0.95],
    g: [0.1, 0.31, 0.54, 0.76, 0.9],
    b: [0.13, 0.29, 0.47, 0.66, 0.8],
    saturation: 0.8,
  },
  // Bright, warm-pink highlights, gentle contrast.
  'Summer Glow': {
    r: [0.03, 0.3, 0.6, 0.86, 1.0],
    g: [0.02, 0.27, 0.55, 0.8, 0.97],
    b: [0.03, 0.23, 0.49, 0.75, 0.93],
    saturation: 1.12,
  },
  // Neutral colours, crisp contrast and punchy saturation.
  'Clean Pop': {
    r: [0.0, 0.22, 0.5, 0.79, 1.0],
    g: [0.0, 0.22, 0.5, 0.79, 1.0],
    b: [0.0, 0.22, 0.5, 0.79, 1.0],
    saturation: 1.22,
  },
};

export const filterLayerSchema = z.object({
  look: z.enum(LOOKS).describe('Preset colour look'),
  strength: z.number().min(0).max(1).step(0.05).describe('How strong the look is (0 = off, 1 = full)'),
  brightness: z.number().min(-0.3).max(0.3).step(0.01).describe('Brightness'),
  contrast: z.number().min(0.6).max(1.5).step(0.01).describe('Contrast (1 = unchanged)'),
  saturation: z.number().min(0).max(2).step(0.05).describe('Extra saturation (1 = unchanged)'),
  warmth: z.number().min(-1).max(1).step(0.05).describe('Cool (-) to warm (+)'),
  fade: z.number().min(0).max(1).step(0.05).describe('Lift the blacks for a soft, filmic fade'),
  grain: z.number().min(0).max(1).step(0.05).describe('Film grain amount'),
  vignette: z.number().min(0).max(1).step(0.05).describe('Darken the corners'),
});

export type FilterLayerProps = z.infer<typeof filterLayerSchema>;

export const filterLayerDefaults: FilterLayerProps = {
  look: 'Warm Film',
  strength: 1,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  warmth: 0,
  fade: 0,
  grain: 0.25,
  vignette: 0.3,
};

const SAMPLES = 17;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Evaluate a 5-point curve at x (piecewise linear).
const evalCurve = (c: Curve, x: number) => {
  const pos = clamp01(x) * 4;
  const i = Math.min(3, Math.floor(pos));
  const t = pos - i;
  return c[i] + (c[i + 1] - c[i]) * t;
};

const buildTable = (
  curve: Curve,
  p: FilterLayerProps,
  channelShift: number, // warmth push for this channel
) => {
  const out: string[] = [];
  for (let s = 0; s < SAMPLES; s++) {
    const x = s / (SAMPLES - 1);
    // look, blended with identity by strength
    let v = x + (evalCurve(curve, x) - x) * p.strength;
    // contrast around mid-grey, then brightness
    v = (v - 0.5) * p.contrast + 0.5 + p.brightness;
    // warmth: push red up / blue down (or the reverse), mostly in mids/highlights
    v += channelShift * (0.3 + 0.7 * x);
    // fade: lift the blacks
    v = p.fade * 0.14 + v * (1 - p.fade * 0.14);
    out.push(clamp01(v).toFixed(4));
  }
  return out.join(' ');
};

export const FilterLayer: React.FC<React.PropsWithChildren<Partial<FilterLayerProps>>> = ({ children, ...props }) => {
  const p = { ...filterLayerDefaults, ...props };
  const frame = useCurrentFrame();
  const rawId = useId();
  const id = `fl${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const def = LOOK_DEFS[p.look];

  const tables = useMemo(
    () => ({
      r: buildTable(def.r, p, p.warmth * 0.05),
      g: buildTable(def.g, p, p.warmth * 0.012),
      b: buildTable(def.b, p, -p.warmth * 0.05),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.look, p.strength, p.brightness, p.contrast, p.warmth, p.fade],
  );
  const saturation = (1 + (def.saturation - 1) * p.strength) * p.saturation;

  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values={saturation.toFixed(3)} />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={tables.r} />
            <feFuncG type="table" tableValues={tables.g} />
            <feFuncB type="table" tableValues={tables.b} />
          </feComponentTransfer>
        </filter>
        <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
          {/* seed changes each frame, cycling, so the grain "moves" like film */}
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      <AbsoluteFill style={{ filter: `url(#${id})` }}>{children}</AbsoluteFill>

      {p.vignette > 0 ? (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${(p.vignette * 0.75).toFixed(3)}) 100%)`,
          }}
        />
      ) : null}

      {p.grain > 0 ? (
        <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity: p.grain * 0.35 }}>
          <svg width="100%" height="100%">
            <rect width="100%" height="100%" filter={`url(#${id}grain)`} />
          </svg>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
