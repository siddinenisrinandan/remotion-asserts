import React from 'react';
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { useBgTrim } from './bgClock';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';

// -----------------------------------------------------------
// LIQUID GLASS TITLE
// A thick glass panel grows out of a thin bar, magnifying and
// blurring whatever is behind it (we draw the background a second
// time inside the panel, scaled + blurred = refraction). Bright rim,
// inner shadow and a sliding highlight sell the glass. Text, rule
// and a glass "pill" badge blur in. Exit = entrance reversed.
// The petal ring background is drawn in code (own design).
// -----------------------------------------------------------

const FONT = loadManrope('normal', { weights: ['500', '600', '700'], subsets: ['latin'] }).fontFamily;

export const liquidGlassSchema = z.object({
  layout: z.enum(['Title card', 'Lower third', 'Badge']),
  title: z.string(),
  body: z.string(),
  badge: z.string().describe('Small glass pill text (empty = hidden). Use \\n for 2 lines'),
  textColor: zColor(),
  backgroundTop: zColor(),
  backgroundBottom: zColor(),
  petalA: zColor(),
  petalB: zColor(),
  showBackground: z.boolean().describe('Off = transparent, put it over your own video'),
  videoFile: z.string().describe('Background video in public/ (empty = drawn petal ring)'),
  shade: z.number().min(0).max(0.6).step(0.01).describe('Dark tint inside the glass (helps white text on bright video)'),
  magnify: z.number().min(1).max(1.6).step(0.01).describe('How much the glass enlarges what is behind it'),
  frost: z.number().min(0).max(30).step(0.5).describe('Blur inside the glass'),
  tint: z.number().min(0).max(0.5).step(0.01).describe('White tint of the glass'),
  seconds: z.number().min(2).max(20).step(0.1),
});
export type LiquidGlassProps = z.infer<typeof liquidGlassSchema>;

export const liquidGlassDefaults: LiquidGlassProps = {
  layout: 'Title card',
  title: 'CLEAR VISION',
  body: 'Smooth glass titles with depth, soft reflections and gentle motion — made for intros, chapter cards and lower thirds.',
  badge: 'New\nSeries',
  textColor: '#ffffff',
  backgroundTop: '#9bb2c9',
  backgroundBottom: '#3f5a78',
  petalA: '#d23cff',
  petalB: '#47e6c8',
  showBackground: true,
  videoFile: '',
  shade: 0,
  magnify: 1.18,
  frost: 9,
  tint: 0.1,
  seconds: 8.6,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const ease = Easing.bezier(0.6, 0, 0.15, 1);

// ---------- background: soft gradient + slowly turning ring of ribbon petals ----------
const PetalRing: React.FC<{ frame: number; a: string; b: string; W: number; H: number }> = ({ frame, a, b, W, H }) => {
  const N = 30;
  const R = H * 0.2;
  const spin = frame * 0.12;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="lgPA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor="#7a2cff" />
        </linearGradient>
        <linearGradient id="lgPB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={b} />
          <stop offset="1" stopColor="#e8f4f2" />
        </linearGradient>
      </defs>
      <g transform={`translate(${W / 2} ${H * 0.47}) rotate(${spin})`}>
        {Array.from({ length: N }, (_, i) => {
          const ang = (i / N) * 360;
          // magenta on one side, teal on the other
          const side = Math.cos(((ang + spin + 40) * Math.PI) / 180);
          const fill = side > 0 ? 'url(#lgPA)' : 'url(#lgPB)';
          const len = H * (0.24 + 0.05 * Math.sin(i * 1.7));
          const wv = Math.sin(frame * 0.03 + i * 0.6) * 12;
          return (
            <g key={i} transform={`rotate(${ang}) translate(${R} 0) rotate(${-55 + wv})`}>
              <path
                d={`M0 0 C ${len * 0.3} ${-len * 0.12}, ${len * 0.7} ${len * 0.1}, ${len} ${-len * 0.04} C ${len * 0.7} ${len * 0.22}, ${len * 0.3} ${len * 0.05}, 0 ${len * 0.1} Z`}
                fill={fill}
                opacity={0.95}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={2}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export const Background: React.FC<{ p: LiquidGlassProps; frame: number; W: number; H: number }> = ({ p, frame, W, H }) => {
  const bgTrim = useBgTrim();
  return p.videoFile ? (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Video src={staticFile(p.videoFile)} trimBefore={bgTrim} objectFit="cover" style={{ width: W, height: H }} muted />
    </AbsoluteFill>
  ) : (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 35%, ${p.backgroundTop}, ${p.backgroundBottom})` }}>
    <PetalRing frame={frame} a={p.petalA} b={p.petalB} W={W} H={H} />
  </AbsoluteFill>
  );
};

// ---------- glass panel ----------
type Rect = { x: number; y: number; w: number; h: number; r: number };

const Glass: React.FC<{
  rect: Rect;
  p: LiquidGlassProps;
  frame: number;
  W: number;
  H: number;
  shine: number;
  children?: React.ReactNode;
}> = ({ rect, p, frame, W, H, shine, children }) => {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return (
    <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: rect.r, overflow: 'hidden', boxShadow: '0 30px 60px rgba(20,30,60,0.35)' }}>
      {/* refraction: background drawn again, magnified around the panel centre and frosted */}
      {p.showBackground ? (
        <div
          style={{
            position: 'absolute',
            left: -rect.x,
            top: -rect.y,
            width: W,
            height: H,
            transformOrigin: `${cx}px ${cy}px`,
            transform: `scale(${p.magnify})`,
            filter: `blur(${p.frost}px) saturate(1.35) brightness(1.08)`,
          }}
        >
          <Background p={p} frame={frame} W={W} H={H} />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, backdropFilter: `blur(${p.frost}px) saturate(1.3)` }} />
      )}
      {/* glass tint + inner rim light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: rect.r,
          background: `linear-gradient(rgba(10,14,24,${p.shade}), rgba(10,14,24,${p.shade})), rgba(255,255,255,${p.tint})`,
          boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.55), inset 0 ${Math.min(18, rect.h * 0.08)}px ${Math.min(30, rect.h * 0.15)}px rgba(255,255,255,0.35), inset 0 -${Math.min(22, rect.h * 0.1)}px ${Math.min(40, rect.h * 0.2)}px rgba(0,0,40,0.18)`,
        }}
      />
      {/* sliding specular highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: rect.w * 0.35,
          left: interpolate(shine, [0, 1], [-rect.w * 0.4, rect.w * 1.05]),
          background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.22), transparent)',
          transform: 'skewX(-18deg)',
        }}
      />
      {children}
    </div>
  );
};

// ---------- main ----------
export const LiquidGlassTitle: React.FC<Partial<LiquidGlassProps>> = (props) => {
  const p = { ...liquidGlassDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));

  // master progress: grows in over ~0.55 s, holds, reverses over ~0.55 s (measured from the reference)
  const enter = 17;
  const P = frame < total - enter ? ease(lin(frame, 0, enter)) : ease(1 - lin(frame, total - enter, total));

  // final panel for each layout
  const scale = H / 1080;
  const full: Rect =
    p.layout === 'Title card'
      ? { x: 330 * scale * (W / H / (16 / 9)), y: 355 * scale, w: 1240 * scale, h: 395 * scale, r: 90 * scale }
      : p.layout === 'Lower third'
        ? { x: 110 * scale, y: 760 * scale, w: 900 * scale, h: 210 * scale, r: 70 * scale }
        : { x: W / 2 - 260 * scale, y: H / 2 - 95 * scale, w: 520 * scale, h: 190 * scale, r: 95 * scale };
  if (p.layout === 'Title card') full.x = W / 2 - full.w / 2;
  // start: thin bar low and to the left (like the reference)
  const start: Rect = { x: full.x - full.w * 0.05, y: full.y + full.h * 0.7, w: full.w * 0.62, h: full.h * 0.18, r: full.h * 0.09 };
  const mix = (a: number, b: number) => a + (b - a) * P;
  const rect: Rect = { x: mix(start.x, full.x), y: mix(start.y, full.y), w: mix(start.w, full.w), h: mix(start.h, full.h), r: mix(start.r, full.r) };

  // contents
  const textIn = (delay: number) => {
    const t = frame < total - enter - 10 ? lin(frame, enter + delay, enter + delay + 14) : 1 - lin(frame, total - enter - 10, total - enter + 2);
    return { opacity: t, filter: `blur(${(1 - t) * 10}px)`, transform: `translateY(${(1 - t) * 10}px)` } as React.CSSProperties;
  };
  const rule = frame < total - enter - 10 ? ease(lin(frame, enter + 8, enter + 26)) : 1 - lin(frame, total - enter - 10, total - enter);
  const shine = lin(frame, enter, total - enter);
  const s = scale;

  const badgeLines = p.badge.split('\\n').join('\n');
  const badgeRect: Rect | null = p.badge && p.layout !== 'Badge' ? { x: rect.w - 240 * s, y: 52 * s, w: 200 * s, h: 120 * s, r: 60 * s } : null;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {p.showBackground ? <Background p={p} frame={frame} W={W} H={H} /> : null}
      {P > 0.001 ? (
        <Glass rect={rect} p={p} frame={frame} W={W} H={H} shine={shine}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: p.layout === 'Badge' ? 0 : `${rect.h * 0.27}px ${56 * s}px 0`,
              color: p.textColor,
              fontFamily: FONT,
              textShadow: p.shade > 0 || p.videoFile ? '0 2px 12px rgba(0,0,0,0.35)' : undefined,
            }}
          >
            {p.layout === 'Badge' ? (
              <div style={{ ...textIn(0), height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58 * s, fontWeight: 600, textAlign: 'center', whiteSpace: 'pre', lineHeight: 1.1 }}>
                {badgeLines || p.title}
              </div>
            ) : (
              <>
                <div style={{ ...textIn(0), fontSize: (p.layout === 'Title card' ? 64 : 52) * s, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1 }}>{p.title}</div>
                <div style={{ width: (p.layout === 'Title card' ? 590 : 420) * s, height: 3 * s, background: 'rgba(255,255,255,0.75)', margin: `${18 * s}px 0 ${24 * s}px`, transform: `scaleX(${rule})`, transformOrigin: '0 50%' }} />
                {p.layout === 'Title card' ? (
                  <div style={{ ...textIn(8), fontSize: 30 * s, fontWeight: 500, lineHeight: 1.18, maxWidth: 1000 * s }}>{p.body}</div>
                ) : null}
              </>
            )}
          </div>
          {badgeRect && p.layout === 'Title card' ? (
            <div style={{ position: 'absolute', left: badgeRect.x, top: badgeRect.y, width: badgeRect.w, height: badgeRect.h, borderRadius: badgeRect.r, ...textIn(12) }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: badgeRect.r,
                  background: 'rgba(255,255,255,0.14)',
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.6), inset 0 8px 16px rgba(255,255,255,0.3), 0 8px 20px rgba(0,0,40,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: p.textColor,
                  fontFamily: FONT,
                  fontWeight: 500,
                  fontSize: 32 * s,
                  lineHeight: 1.15,
                  textAlign: 'center',
                  whiteSpace: 'pre',
                }}
              >
                {badgeLines}
              </div>
            </div>
          ) : null}
        </Glass>
      ) : null}
    </AbsoluteFill>
  );
};

export const LIQUID_GLASS_PRESETS: { id: string; props: LiquidGlassProps }[] = [
  { id: 'LiquidGlass-01-Title-Card', props: liquidGlassDefaults },
  {
    id: 'LiquidGlass-05-On-Video',
    props: { ...liquidGlassDefaults, videoFile: 'bg_liquid.mp4', shade: 0.22, tint: 0.06, frost: 12, magnify: 1.2 },
  },
  {
    id: 'LiquidGlass-02-Lower-Third',
    props: { ...liquidGlassDefaults, layout: 'Lower third', title: 'Maya Rowe', body: '', badge: '', seconds: 6 },
  },
  { id: 'LiquidGlass-03-Badge', props: { ...liquidGlassDefaults, layout: 'Badge', badge: 'Coming\nSoon', seconds: 5 } },
  {
    id: 'LiquidGlass-04-Sunset',
    props: { ...liquidGlassDefaults, title: 'GOLDEN HOUR', badge: 'Episode\n04', backgroundTop: '#f3c7a5', backgroundBottom: '#7d4b6b', petalA: '#ff7a3d', petalB: '#ffd36b' },
  },
];
