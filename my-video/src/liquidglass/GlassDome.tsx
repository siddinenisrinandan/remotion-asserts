import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';
import { Background, liquidGlassDefaults, LiquidGlassProps } from './LiquidGlass';

// -----------------------------------------------------------
// GLASS DOME  (big glass circle rising from the bottom edge)
// Timing measured frame by frame from the reference (30 fps):
//  0–24  a glass circle rises from below the frame and swells into a
//        large dome (only the top half is ever on screen)
//  24–46 the headline sweeps along the dome's arc, rotating into place
//  40–56 the paragraph lines fade up, then the small centre label
//  exit  the same timeline played backwards
// -----------------------------------------------------------

const FONT = loadManrope('normal', { weights: ['400', '500', '600'], subsets: ['latin'] }).fontFamily;

export const glassDomeSchema = z.object({
  arcText: z.string().describe('Headline that follows the curve'),
  label: z.string().describe('Small centre label'),
  body: z.string().describe('Paragraph lines separated by |'),
  textColor: zColor(),
  videoFile: z.string().describe('Background video in public/ (empty = drawn petal ring)'),
  magnify: z.number().min(1).max(1.8).step(0.01),
  frost: z.number().min(0).max(30).step(0.5),
  tint: z.number().min(0).max(0.5).step(0.01),
  shade: z.number().min(0).max(0.6).step(0.01),
  seconds: z.number().min(3).max(20).step(0.1),
});
export type GlassDomeProps = z.infer<typeof glassDomeSchema>;

export const glassDomeDefaults: GlassDomeProps = {
  arcText: 'NEW IDEAS READY TO LAUNCH',
  label: 'CALM GLASS MOTION',
  body: 'Every scene feels smooth, modern|and clear — like looking through|a lens made of light.',
  textColor: '#ffffff',
  videoFile: 'bg_liquid.mp4',
  magnify: 1.3,
  frost: 4,
  tint: 0.04,
  shade: 0.3,
  seconds: 8,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const ease = Easing.bezier(0.55, 0, 0.15, 1);

export const GlassDome: React.FC<Partial<GlassDomeProps>> = (props) => {
  const p = { ...glassDomeDefaults, ...props };
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames, fps } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const s = H / 1080;
  const lines = p.body.split('|').filter(Boolean);
  const enterLen = 60;
  const t = frame < total - enterLen ? frame : Math.max(0, total - frame);

  // dome: centre just below the frame, radius grows as it rises
  const g = ease(lin(t, 0, 24));
  const R = interpolate(g, [0, 1], [70 * s, 445 * s]);
  const cx = W / 2 - 10 * s;
  const cy = interpolate(g, [0, 1], [H + 120 * s, H + 10 * s]);
  const bg: LiquidGlassProps = { ...liquidGlassDefaults, videoFile: p.videoFile };

  // headline sweeps along the arc
  const sweep = ease(lin(t, 24, 46));
  const arcTurn = (1 - sweep) * -70; // degrees
  const arcR = R - 62 * s;
  const arcId = 'domeArc';
  const bodyIn = (i: number) => lin(t, 40 + i * 3, 48 + i * 3);
  const labelIn = lin(t, 50, 58);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Background p={bg} frame={frame} W={W} H={H} />
      {t > 0.5 ? (
        <div style={{ position: 'absolute', left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 -20px 60px rgba(0,0,0,0.35)' }}>
          {/* lens: background redrawn inside, magnified around the dome centre */}
          <div
            style={{
              position: 'absolute',
              left: -(cx - R),
              top: -(cy - R),
              width: W,
              height: H,
              transformOrigin: `${cx}px ${cy - R * 0.4}px`,
              transform: `scale(${p.magnify})`,
              filter: `blur(${p.frost}px) saturate(1.3) brightness(1.06)`,
            }}
          >
            <Background p={bg} frame={frame} W={W} H={H} />
          </div>
          {/* glass body: tint, bright rim, darker edge like a thick lens */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,${p.tint}) 0%, rgba(10,10,30,${p.shade * 0.6}) 70%, rgba(10,10,30,${p.shade}) 100%)`,
              boxShadow: `inset 0 0 0 ${3 * s}px rgba(255,255,255,0.7), inset 0 ${20 * s}px ${40 * s}px rgba(255,255,255,0.25), inset 0 0 ${60 * s}px rgba(0,0,0,0.35)`,
            }}
          />
        </div>
      ) : null}

      {/* arc headline */}
      {sweep > 0.001 ? (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: Math.min(1, sweep * 2) }}>
          <defs>
            <path id={arcId} d={`M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`} />
          </defs>
          <g transform={`rotate(${arcTurn} ${cx} ${cy})`}>
            <text fill={p.textColor} fontFamily={FONT} fontWeight={500} fontSize={52 * s} letterSpacing={1 * s} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }}>
              <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                {p.arcText}
              </textPath>
            </text>
          </g>
        </svg>
      ) : null}

      {/* centre label + paragraph */}
      <div style={{ position: 'absolute', left: cx, top: cy - R * 0.52, transform: 'translateX(-50%)', textAlign: 'center', fontFamily: FONT, color: p.textColor, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 26 * s, fontWeight: 400, letterSpacing: '0.02em', opacity: labelIn, filter: `blur(${(1 - labelIn) * 5}px)` }}>{p.label}</div>
        <div style={{ marginTop: 52 * s, fontSize: 25 * s, fontWeight: 500, lineHeight: `${30 * s}px` }}>
          {lines.map((line, i) => (
            <div key={i} style={{ whiteSpace: 'nowrap', opacity: bodyIn(i), transform: `translateY(${(1 - bodyIn(i)) * 10 * s}px)`, filter: `blur(${(1 - bodyIn(i)) * 5}px)` }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
