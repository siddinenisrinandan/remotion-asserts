import React from 'react';
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadCinzel } from '@remotion/google-fonts/Cinzel';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';

// -----------------------------------------------------------
// GOLD TEXT OPENER  (luxury gold title on a dark sparkle field)
// Metallic gold = a many-stop gradient clipped to the letters (bright
// top, dark "horizon" band in the middle, warm bounce at the bottom),
// plus a moving shine band, a dark bevel shadow and a warm glow.
// Letters drift in out of a blur, a lens flare skims across the top,
// gold bokeh and light-dust drift in the background.
// -----------------------------------------------------------

const CINZEL = loadCinzel('normal', { weights: ['600', '700'], subsets: ['latin'] }).fontFamily;
const MONT = loadMontserrat('normal', { weights: ['500'], subsets: ['latin'] }).fontFamily;

export const GOLD_STYLES = {
  Classic: ['#fff6d0', '#f6d27a', '#d9a441', '#8a5a17', '#4a2e08', '#b8832c', '#f2cd74', '#fff1bf', '#a26c1d'],
  Pale: ['#ffffff', '#fbefc8', '#ead08e', '#a98a4a', '#5e4a22', '#c9ad6a', '#f3e2a9', '#fffaf0', '#b9995a'],
  Rose: ['#fff0ea', '#f6c7b0', '#e0997a', '#8e4f3a', '#4d2419', '#bf7a5e', '#f0b79c', '#ffe9df', '#a8644b'],
  Deep: ['#ffe9a8', '#f0b640', '#c4861b', '#6b3f06', '#2e1a02', '#9a6512', '#e0a73a', '#ffd97a', '#7d4e0c'],
} as const;
type GoldStyle = keyof typeof GOLD_STYLES;

export const goldTextSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  gold: z.enum(Object.keys(GOLD_STYLES) as [GoldStyle, ...GoldStyle[]]),
  fontSize: z.number().min(40).max(320).step(2),
  letterSpacing: z.number().min(0).max(0.4).step(0.01).describe('Final spacing between letters (em)'),
  particles: z.number().min(0).max(2).step(0.05).describe('Amount of background sparkle'),
  flare: z.boolean().describe('Lens flare skimming the title'),
  shine: z.boolean().describe('Light sweep across the letters'),
  glow: z.number().min(0).max(2).step(0.05),
  backgroundColor: zColor(),
  transparentBackground: z.boolean(),
  exit: z.boolean().describe('Fade/blur out at the end'),
  seconds: z.number().min(1.5).max(20).step(0.1),
});
export type GoldTextProps = z.infer<typeof goldTextSchema>;

export const goldTextDefaults: GoldTextProps = {
  title: 'GOLD OPENER',
  subtitle: 'DYNAMIC AND LUXURY DESIGN',
  gold: 'Classic',
  fontSize: 150,
  letterSpacing: 0.06,
  particles: 1,
  flare: true,
  shine: true,
  glow: 1,
  backgroundColor: '#070604',
  transparentBackground: false,
  exit: true,
  seconds: 5,
};

const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/**
 * Metallic gradient: hard, high-contrast reflection bands like polished gold —
 * hot top edge, bright band, sharp dark "horizon", bright bounce, darker base, bright lip.
 */
const goldGradient = (c: readonly string[]) =>
  `linear-gradient(180deg, ${c[7]} 0%, ${c[0]} 7%, ${c[1]} 16%, ${c[2]} 30%, ${c[3]} 44%, ${c[4]} 49%, ${c[4]} 51%, ${c[6]} 55%, ${c[0]} 61%, ${c[6]} 68%, ${c[2]} 78%, ${c[3]} 88%, ${c[5]} 94%, ${c[7]} 100%)`;

/** very fine horizontal grain, reads as brushed metal */
const BRUSHED =
  'repeating-linear-gradient(180deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0) 1px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0) 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(0,0,0,0.06) 7px, rgba(255,255,255,0.04) 13px)';

/** 4-point star glint */
const Glint: React.FC<{ size: number; o: number; rot: number }> = ({ size, o, rot }) =>
  o <= 0.01 ? null : (
    <svg
      width={size}
      height={size}
      viewBox="-10 -10 20 20"
      style={{ position: 'absolute', left: -size / 2, top: -size / 2, opacity: o, transform: `rotate(${rot}deg) scale(${0.4 + o * 0.6})`, mixBlendMode: 'screen', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="glintG">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#fff3cf" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffcf70" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={4} fill="url(#glintG)" />
      <path d="M0 -10 L0.7 -0.7 L10 0 L0.7 0.7 L0 10 L-0.7 0.7 L-10 0 L-0.7 -0.7Z" fill="#fffaf0" />
    </svg>
  );

// ---------- background ----------
const Sparkles: React.FC<{ amount: number; colors: readonly string[]; frame: number; width: number; height: number }> = ({
  amount,
  colors,
  frame,
  width,
  height,
}) => {
  const bokeh = Math.round(55 * amount);
  const dust = Math.round(140 * amount);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < bokeh; i++) {
    const x = random(`bx${i}`) * width + Math.sin(frame / 60 + i) * 20 - frame * (0.15 + random(`bv${i}`) * 0.3);
    const y = random(`by${i}`) * height + Math.cos(frame / 70 + i * 2) * 15;
    const s = 6 + random(`bs${i}`) * 34;
    const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(frame / (8 + random(`bt${i}`) * 14) + i));
    const blur = random(`bb${i}`) * 6;
    items.push(
      <div
        key={`b${i}`}
        style={{
          position: 'absolute',
          left: ((x % width) + width) % width,
          top: y,
          width: s,
          height: s,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors[1]} 0%, ${colors[2]}aa 45%, transparent 70%)`,
          opacity: tw * (0.25 + random(`bo${i}`) * 0.5),
          filter: `blur(${blur}px)`,
        }}
      />,
    );
  }
  // light dust in soft horizontal streaks (like the reference's dotted light lines)
  for (let i = 0; i < dust; i++) {
    const band = Math.floor(random(`dl${i}`) * 9);
    const y = height * (0.08 + band * 0.11) + (random(`dy${i}`) - 0.5) * 40;
    const speed = 0.4 + random(`ds${i}`) * 1.2;
    const x = (((random(`dx${i}`) * width + frame * speed) % width) + width) % width;
    const s = 1.5 + random(`dz${i}`) * 2.5;
    const tw = 0.5 + 0.5 * Math.sin(frame / (3 + random(`dt${i}`) * 6) + i);
    items.push(
      <div
        key={`d${i}`}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: s,
          height: s,
          borderRadius: '50%',
          background: colors[0],
          boxShadow: `0 0 ${s * 3}px ${colors[1]}`,
          opacity: tw * 0.8,
        }}
      />,
    );
  }
  return <AbsoluteFill>{items}</AbsoluteFill>;
};

const Flare: React.FC<{ x: number; y: number; size: number; intensity: number }> = ({ x, y, size, intensity }) => {
  if (intensity <= 0.01) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: intensity, mixBlendMode: 'screen', pointerEvents: 'none' }}>
      {/* warm halo */}
      <div style={{ position: 'absolute', left: -size * 1.6, top: -size * 1.6, width: size * 3.2, height: size * 3.2, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,214,140,0.55) 0%, rgba(255,160,40,0.18) 35%, transparent 70%)' }} />
      {/* hot core */}
      <div style={{ position: 'absolute', left: -size * 0.3, top: -size * 0.3, width: size * 0.6, height: size * 0.6, borderRadius: '50%', background: 'radial-gradient(circle, #ffffff 0%, rgba(255,240,200,0.9) 25%, transparent 70%)' }} />
      {/* anamorphic streak */}
      <div style={{ position: 'absolute', left: -size * 6, top: -size * 0.06, width: size * 12, height: size * 0.12, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,250,235,0.95) 0%, rgba(255,200,110,0.5) 30%, transparent 70%)' }} />
      {/* short vertical spike */}
      <div style={{ position: 'absolute', left: -size * 0.03, top: -size * 1.1, width: size * 0.06, height: size * 2.2, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,250,235,0.8) 0%, transparent 70%)' }} />
    </div>
  );
};

export const GoldText: React.FC<Partial<GoldTextProps>> = (props) => {
  const p = { ...goldTextDefaults, ...props };
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const c = GOLD_STYLES[p.gold as GoldStyle] ?? GOLD_STYLES.Classic;
  const chars = Array.from(p.title);
  const mid = (chars.length - 1) / 2;

  // exit
  const out = p.exit ? interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [0, 1], clampOpts) : 0;

  // whole-title tracking closes in
  const track = interpolate(frame, [0, 70], [p.letterSpacing + 0.22, p.letterSpacing], { ...clampOpts, easing: Easing.out(Easing.cubic) });
  const titleScale = interpolate(frame, [0, durationInFrames], [1.04, 1], clampOpts);

  // shine band position (moves across, then a second softer pass)
  const shineX = interpolate(frame, [28, 72], [-40, 140], clampOpts);
  const shine2 = interpolate(frame, [durationInFrames - 70, durationInFrames - 30], [-40, 140], clampOpts);

  // flare skims along the top edge of the title, then rests and breathes
  const textW = chars.length * p.fontSize * (0.78 + p.letterSpacing);
  const flareT = interpolate(frame, [22, 80], [0, 1], { ...clampOpts, easing: Easing.inOut(Easing.quad) });
  const flareX = width / 2 - textW * 0.48 + textW * 0.82 * flareT;
  const flareY = height / 2 - p.fontSize * 0.38;
  const flareI = interpolate(frame, [20, 32, 80, 100], [0, 1, 1, 0.55], clampOpts) * (0.9 + 0.1 * Math.sin(frame / 5)) * (1 - out);

  const letterStyle: React.CSSProperties = {
    backgroundImage: goldGradient(c),
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };

  const glowF = p.glow;
  const subIn = interpolate(frame, [40, 70], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ backgroundColor: p.transparentBackground ? 'transparent' : p.backgroundColor, overflow: 'hidden' }}>
      {!p.transparentBackground && (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, ${c[3]}33 0%, transparent 55%)` }} />
      )}
      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 25], [0, 1], clampOpts) * (1 - out) }}>
        <Sparkles amount={p.particles} colors={c} frame={frame} width={width} height={height} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          opacity: 1 - out,
          filter: out > 0 ? `blur(${out * 14}px)` : undefined,
          transform: `scale(${titleScale + out * 0.06})`,
        }}
      >
        {/* title: base gold + bevel shadow + glow */}
        <div style={{ position: 'relative', whiteSpace: 'nowrap', fontFamily: CINZEL, fontWeight: 700, fontSize: p.fontSize, lineHeight: 1.1, letterSpacing: `${track}em` }}>
          <div
            style={{
              filter: `drop-shadow(0 ${p.fontSize * 0.015}px 0 ${c[4]}) drop-shadow(0 ${p.fontSize * 0.03}px ${p.fontSize * 0.04}px rgba(0,0,0,0.8)) drop-shadow(0 0 ${p.fontSize * 0.18 * glowF}px ${c[2]}66)`,
            }}
          >
            {chars.map((ch, i) => {
              const delay = 4 + Math.abs(i - mid) * 3.2;
              const a = interpolate(frame, [delay, delay + 26], [0, 1], { ...clampOpts, easing: Easing.out(Easing.cubic) });
              const glyph = ch === ' ' ? ' ' : ch;
              const fs = p.fontSize;
              const bev = Math.max(1, fs * 0.012);
              const layer: React.CSSProperties = { position: 'absolute', left: 0, top: 0 };
              // occasional glint on a top corner of this letter
              const gStart = 50 + random(`g${i}`) * Math.max(20, durationInFrames - 90);
              const gO = ch === ' ' || random(`gk${i}`) > 0.55 ? 0 : interpolate(frame, [gStart, gStart + 6, gStart + 16], [0, 1, 0], clampOpts);
              return (
                <span
                  key={i}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    opacity: a,
                    filter: `blur(${(1 - a) * 10}px)`,
                    transform: `translateY(${(1 - a) * fs * 0.12}px) scale(${1 + (1 - a) * 0.25})`,
                  }}
                >
                  {/* lower-right bevel in shadow */}
                  <span style={{ ...layer, color: 'transparent', WebkitTextStroke: `${bev * 2.2}px ${c[4]}`, transform: `translate(${bev * 0.8}px, ${bev * 1.2}px)` }}>{glyph}</span>
                  {/* upper-left bevel catching light */}
                  <span style={{ ...layer, color: 'transparent', WebkitTextStroke: `${bev * 1.8}px ${c[7]}`, transform: `translate(${-bev * 0.5}px, ${-bev * 0.7}px)` }}>{glyph}</span>
                  {/* gold body */}
                  <span style={{ ...letterStyle, position: 'relative' }}>{glyph}</span>
                  {/* brushed grain */}
                  <span style={{ ...layer, backgroundImage: BRUSHED, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', mixBlendMode: 'overlay', opacity: 0.55 }}>{glyph}</span>
                  {/* thin bright inner rim */}
                  <span style={{ ...layer, color: 'transparent', WebkitTextStroke: `${Math.max(0.6, bev * 0.45)}px ${c[0]}`, opacity: 0.28, mixBlendMode: 'screen' }}>{glyph}</span>
                  <span style={{ position: 'absolute', left: '18%', top: '16%' }}>
                    <Glint size={fs * 0.42} o={gO} rot={frame * 2} />
                  </span>
                </span>
              );
            })}
          </div>
          {/* edge flash: bright rims revealed by the moving light band */}
          {p.shine && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                color: 'transparent',
                WebkitTextStroke: `${Math.max(1.2, p.fontSize * 0.016)}px #fffaf0`,
                WebkitMaskImage: `linear-gradient(105deg, transparent ${shineX - 22}%, #000 ${shineX}%, transparent ${shineX + 22}%), linear-gradient(105deg, transparent ${shine2 - 16}%, rgba(0,0,0,0.7) ${shine2}%, transparent ${shine2 + 16}%)`,
                maskImage: `linear-gradient(105deg, transparent ${shineX - 22}%, #000 ${shineX}%, transparent ${shineX + 22}%), linear-gradient(105deg, transparent ${shine2 - 16}%, rgba(0,0,0,0.7) ${shine2}%, transparent ${shine2 + 16}%)`,
                filter: `drop-shadow(0 0 ${p.fontSize * 0.04}px rgba(255,230,170,0.9))`,
                mixBlendMode: 'screen',
                opacity: interpolate(frame, [20, 30], [0, 1], clampOpts),
              }}
            >
              {p.title}
            </div>
          )}
          {/* shine sweep: a bright diagonal band clipped to the same letters */}
          {p.shine && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `linear-gradient(105deg, transparent ${shineX - 14}%, rgba(255,250,230,0.95) ${shineX}%, transparent ${shineX + 14}%), linear-gradient(105deg, transparent ${shine2 - 10}%, rgba(255,245,215,0.6) ${shine2}%, transparent ${shine2 + 10}%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                mixBlendMode: 'screen',
                opacity: interpolate(frame, [20, 30], [0, 1], clampOpts),
              }}
            >
              {p.title}
            </div>
          )}
        </div>

        {/* subtitle */}
        <div
          style={{
            marginTop: p.fontSize * 0.08,
            fontFamily: MONT,
            fontWeight: 500,
            fontSize: Math.max(14, p.fontSize * 0.15),
            letterSpacing: `${interpolate(subIn, [0, 1], [1.1, 0.62])}em`,
            paddingLeft: '0.62em',
            backgroundImage: `linear-gradient(180deg, ${c[0]}, ${c[2]} 60%, ${c[6]})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            opacity: subIn,
            whiteSpace: 'nowrap',
          }}
        >
          {p.subtitle}
        </div>
      </AbsoluteFill>

      {p.flare && <Flare x={flareX} y={flareY} size={p.fontSize * 0.55} intensity={flareI} />}
    </AbsoluteFill>
  );
};

export const GOLD_TEXT_PRESETS: { id: string; props: GoldTextProps }[] = [
  { id: 'Gold-Opener', props: goldTextDefaults },
  { id: 'Gold-Opener-Pale', props: { ...goldTextDefaults, gold: 'Pale', title: 'PREMIUM', subtitle: 'ELEGANCE IN EVERY DETAIL' } },
  { id: 'Gold-Opener-Rose', props: { ...goldTextDefaults, gold: 'Rose', title: 'ROSE GOLD', subtitle: 'SOFT LUXURY COLLECTION' } },
  { id: 'Gold-Opener-Deep', props: { ...goldTextDefaults, gold: 'Deep', title: 'THE AWARDS', subtitle: 'CELEBRATING EXCELLENCE' } },
];
