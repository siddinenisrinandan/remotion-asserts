import React, { useId } from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';

// -----------------------------------------------------------
// PAPER TEXTURE  (printed-poster / collage look)
// Wrap ANY scene: <PaperTexture {...props}>...</PaperTexture>
// Layers (all made in code, no image files, no licences):
//   tint      → one-colour print look (optional)
//   halftone  → fine printing-dot screen
//   paper     → fibre grain + uneven blotches
//   dust      → specks and thin scratches
//   vignette  → darker, worn edges
// "boil" re-rolls the texture a few times a second for a
// stop-motion feel; 0 = still texture (lightest to render).
// -----------------------------------------------------------

export const paperTextureSchema = z.object({
  tintColor: zColor().describe('Print colour for the one-colour look'),
  tint: z.number().min(0).max(1).step(0.05).describe('0 = original colours, 1 = fully one colour'),
  halftone: z.number().min(0).max(1).step(0.05).describe('Strength of the printing-dot screen'),
  dotSize: z.number().min(3).max(16).step(1).describe('Distance between dots (px)'),
  paper: z.number().min(0).max(1).step(0.05).describe('Paper fibre grain'),
  grain: z.enum(['Fine', 'Rough']).describe('Fine = soft print grain, Rough = sandy grunge'),
  blotches: z.number().min(0).max(1).step(0.05).describe('Uneven light/dark patches'),
  dust: z.number().min(0).max(1).step(0.05).describe('Specks and scratches'),
  vignette: z.number().min(0).max(1).step(0.05).describe('Dark worn edges'),
  fade: z.number().min(0).max(0.5).step(0.02).describe('Lifts blacks like old print'),
  boilFps: z.number().min(0).max(24).step(1).describe('Texture changes per second (0 = still)'),
});
export type PaperTextureProps = z.infer<typeof paperTextureSchema>;

export const paperTextureDefaults: PaperTextureProps = {
  tintColor: '#0aa3c9',
  tint: 0.35,
  halftone: 0.5,
  dotSize: 6,
  paper: 0.55,
  grain: 'Fine',
  blotches: 0.45,
  dust: 0.5,
  vignette: 0.55,
  fade: 0.08,
  boilFps: 0,
};

/** Ready-made presets, so the editor / AI can pick by name. */
export const PAPER_PRESETS: Record<string, Partial<PaperTextureProps>> = {
  'Blue poster': {},
  // Keeps the footage's own colours: only the paper grain + dots on top.
  'Texture only': { tint: 0, fade: 0, vignette: 0.2, blotches: 0.3, dust: 0.3 },
  'Old newspaper': { tintColor: '#6b5b45', tint: 0.85, halftone: 0.5, dotSize: 5, paper: 0.7, blotches: 0.6, dust: 0.6, fade: 0.18 },
  'Clean print': { tint: 0, halftone: 0.2, paper: 0.35, blotches: 0.2, dust: 0.15, vignette: 0.25, fade: 0.04 },
  'Grunge zine': { grain: 'Rough', boilFps: 8, tint: 0.15, halftone: 0.6, dotSize: 8, paper: 0.8, blotches: 0.8, dust: 0.9, vignette: 0.75, fade: 0.1 },
};

const FILL: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

const Dust: React.FC<{ seed: number; amount: number; width: number; height: number }> = ({ seed, amount, width, height }) => {
  const specks = Math.round(60 * amount);
  const scratches = Math.round(4 * amount);
  return (
    <svg style={FILL} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {Array.from({ length: specks }, (_, i) => {
        const dark = random(`d-${seed}-${i}`) < 0.6;
        return (
          <circle
            key={`s${i}`}
            cx={random(`x-${seed}-${i}`) * width}
            cy={random(`y-${seed}-${i}`) * height}
            r={0.8 + random(`r-${seed}-${i}`) ** 3 * 5}
            fill={dark ? '#000' : '#fff'}
            opacity={(dark ? 0.45 : 0.35) * (0.4 + random(`o-${seed}-${i}`) * 0.6)}
          />
        );
      })}
      {Array.from({ length: scratches }, (_, i) => {
        const x = random(`sx-${seed}-${i}`) * width;
        const y = random(`sy-${seed}-${i}`) * height;
        const len = 80 + random(`sl-${seed}-${i}`) * 320;
        const ang = (random(`sa-${seed}-${i}`) - 0.5) * 0.6; // mostly horizontal, like scuffs
        return (
          <line
            key={`l${i}`}
            x1={x}
            y1={y}
            x2={x + Math.cos(ang) * len}
            y2={y + Math.sin(ang) * len}
            stroke="#fff"
            strokeWidth={1 + random(`sw-${seed}-${i}`) * 1.5}
            strokeLinecap="round"
            opacity={0.18 + random(`so-${seed}-${i}`) * 0.2}
          />
        );
      })}
    </svg>
  );
};

export const PaperTexture: React.FC<React.PropsWithChildren<Partial<PaperTextureProps>>> = ({ children, ...rest }) => {
  const p = { ...paperTextureDefaults, ...rest };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const seed = p.boilFps > 0 ? Math.floor((frame / fps) * p.boilFps) : 0;
  // Shift the texture a little on every boil step (cheaper than a new pattern, looks hand-made).
  const jx = p.boilFps > 0 ? Math.round((random(`jx-${seed}`) - 0.5) * 40) : 0;
  const jy = p.boilFps > 0 ? Math.round((random(`jy-${seed}`) - 0.5) * 40) : 0;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* the scene, with a little print fade */}
      <AbsoluteFill style={{ filter: `contrast(${1 - p.fade * 0.6}) brightness(${1 + p.fade * 0.3})` }}>{children}</AbsoluteFill>

      {/* one-colour print tint */}
      {p.tint > 0 ? (
        <>
          <AbsoluteFill style={{ backgroundColor: '#808080', mixBlendMode: 'saturation', opacity: p.tint }} />
          <AbsoluteFill style={{ backgroundColor: p.tintColor, mixBlendMode: 'color', opacity: p.tint }} />
        </>
      ) : null}

      {/* paper fibre + blotches */}
      <svg style={{ ...FILL, mixBlendMode: 'overlay' }} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <filter id={`fibre-${uid}`} x="0" y="0" width="100%" height="100%">
            {p.grain === 'Fine' ? (
              <>
                {/* soft, fine grain: lets the halftone dots lead */}
                <feTurbulence type="fractalNoise" baseFrequency="0.75 0.55" numOctaves={2} seed={seed} />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncR type="linear" slope={2.6} intercept={-0.8} />
                  <feFuncG type="linear" slope={2.6} intercept={-0.8} />
                  <feFuncB type="linear" slope={2.6} intercept={-0.8} />
                  <feFuncA type="linear" slope={p.paper} />
                </feComponentTransfer>
              </>
            ) : (
              <>
                {/* rough, sandy grain for a grungy look */}
                <feTurbulence type="fractalNoise" baseFrequency="0.42 0.32" numOctaves={3} seed={seed} />
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncR type="linear" slope={3.2} intercept={-1.1} />
                  <feFuncG type="linear" slope={3.2} intercept={-1.1} />
                  <feFuncB type="linear" slope={3.2} intercept={-1.1} />
                  <feFuncA type="table" tableValues={`${p.paper * 0.85} ${p.paper * 0.85}`} />
                </feComponentTransfer>
              </>
            )}
          </filter>
          <filter id={`blot-${uid}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves={3} seed={7} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope={2.2} intercept={-0.6} />
              <feFuncG type="linear" slope={2.2} intercept={-0.6} />
              <feFuncB type="linear" slope={2.2} intercept={-0.6} />
              <feFuncA type="linear" slope={p.blotches * 0.8} />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect x={jx - 40} y={jy - 40} width={width + 80} height={height + 80} filter={`url(#fibre-${uid})`} />
        <rect width={width} height={height} filter={`url(#blot-${uid})`} />
      </svg>

      {/* halftone dot screen (45°, like print) */}
      {p.halftone > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: '-60%',
            left: '-20%',
            width: '140%',
            height: '220%',
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.9) 30%, transparent 34%)`,
            backgroundSize: `${p.dotSize}px ${p.dotSize}px`,
            transform: 'rotate(45deg)',
            mixBlendMode: 'soft-light',
            opacity: p.halftone,
          }}
        />
      ) : null}

      {p.dust > 0 ? (
        <AbsoluteFill style={{ mixBlendMode: 'normal' }}>
          <Dust seed={seed} amount={p.dust} width={width} height={height} />
        </AbsoluteFill>
      ) : null}

      {/* worn edges */}
      {p.vignette > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 45%, rgba(0,0,0,${0.75 * p.vignette}) 100%)`,
            mixBlendMode: 'multiply',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
