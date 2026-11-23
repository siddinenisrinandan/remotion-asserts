import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';
import { Background, liquidGlassDefaults, LiquidGlassProps } from './LiquidGlass';

// -----------------------------------------------------------
// GLASS CARD  (square liquid-glass title card)
// Timing measured frame by frame from the reference (30 fps):
//  0–13  a small glass pill appears near the top and grows down and
//        out into the rounded square
//  13–40 big title lines light up one after another, top to bottom
//  26–34 a tall glass pill draws downward on the right, its rotated
//        caption fades in; the small header fades in last
//  exit  everything in reverse: lines go bottom-up, the side pill
//        retracts, then the card shrinks back into a pill and vanishes
// The glass magnifies + frosts the background (video or drawn).
// -----------------------------------------------------------

const FONT = loadManrope('normal', { weights: ['500', '700', '800'], subsets: ['latin'] }).fontFamily;

export const glassCardSchema = z.object({
  header: z.string(),
  title: z.string().describe('One word or short phrase per line, separated by |'),
  sideText: z.string().describe('Text in the tall side pill'),
  textColor: zColor(),
  videoFile: z.string().describe('Background video in public/ (empty = drawn petal ring)'),
  magnify: z.number().min(1).max(1.6).step(0.01),
  frost: z.number().min(0).max(30).step(0.5),
  tint: z.number().min(0).max(0.5).step(0.01),
  shade: z.number().min(0).max(0.6).step(0.01),
  seconds: z.number().min(3).max(20).step(0.1),
});
export type GlassCardProps = z.infer<typeof glassCardSchema>;

export const glassCardDefaults: GlassCardProps = {
  header: 'A New Point of View',
  title: 'SIMPLE|CLEAN|IDEAS|BUILT|WITH|REAL|CARE',
  sideText: 'Design You Can Feel',
  textColor: '#ffffff',
  videoFile: 'bg_liquid.mp4',
  magnify: 1.15,
  frost: 11,
  tint: 0.12,
  shade: 0.18,
  seconds: 8,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const ease = Easing.bezier(0.55, 0, 0.15, 1);

export const GlassCard: React.FC<Partial<GlassCardProps>> = (props) => {
  const p = { ...glassCardDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const s = H / 1080;
  const lines = p.title.split('|').filter(Boolean);
  const n = lines.length;

  // one timeline played forward for the entrance and mirrored for the exit
  const enterLen = 14 + n * 3.2 + 12;
  const t = frame < total - enterLen ? frame : Math.max(0, total - frame);

  // card: pill near the top → rounded square
  const g = ease(lin(t, 0, 13));
  const full = { w: 690 * s, h: 740 * s, r: 82 * s };
  const cx = W / 2;
  const top = H / 2 - full.h / 2;
  const w = interpolate(g, [0, 1], [150 * s, full.w]);
  const h = interpolate(g, [0, 1], [42 * s, full.h]);
  const r = interpolate(g, [0, 1], [21 * s, full.r]);
  const x = cx - w / 2;
  const y = top + interpolate(g, [0, 1], [10 * s, 0]);
  const visible = t > 0.5;

  const bg: LiquidGlassProps = { ...liquidGlassDefaults, videoFile: p.videoFile, showBackground: true };

  // side pill draws downward
  const pillP = ease(lin(t, 14 + n * 1.6, 14 + n * 1.6 + 9));
  const pillH = 640 * s * pillP;
  const capIn = lin(t, 14 + n * 2.4, 14 + n * 2.4 + 8);
  const headIn = lin(t, 14 + n * 3.2, 14 + n * 3.2 + 8);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Background p={bg} frame={frame} W={W} H={H} />
      {visible ? (
        <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, overflow: 'hidden', boxShadow: '0 40px 80px rgba(40,20,10,0.28)' }}>
          {/* refraction: background again, magnified around the card centre and frosted */}
          <div
            style={{
              position: 'absolute',
              left: -x,
              top: -y,
              width: W,
              height: H,
              transformOrigin: `${cx}px ${H / 2}px`,
              transform: `scale(${p.magnify})`,
              filter: `blur(${p.frost}px) saturate(1.35) brightness(1.1)`,
            }}
          >
            <Background p={bg} frame={frame} W={W} H={H} />
          </div>
          {/* glass body: tint, shade, rim light, inner depth */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: r,
              background: `linear-gradient(rgba(10,14,24,${p.shade}), rgba(10,14,24,${p.shade})), rgba(255,255,255,${p.tint})`,
              boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.6), inset 0 ${16 * s}px ${30 * s}px rgba(255,255,255,0.35), inset 0 -${24 * s}px ${44 * s}px rgba(0,0,30,0.16)`,
            }}
          />
          {/* moving diagonal reflection */}
          <div
            style={{
              position: 'absolute',
              top: -h * 0.2,
              bottom: -h * 0.2,
              width: w * 0.5,
              left: interpolate(frame, [0, total], [-w * 0.6, w * 1.1]),
              background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.16), transparent)',
              transform: 'rotate(18deg)',
            }}
          />
          {/* content (positioned against the finished card) */}
          <div style={{ position: 'absolute', left: (w - full.w) / 2, top: 0, width: full.w, height: full.h, color: p.textColor, fontFamily: FONT, textShadow: '0 2px 14px rgba(0,0,0,0.25)' }}>
            <div style={{ position: 'absolute', left: 112 * s, top: 46 * s, fontSize: 30 * s, fontWeight: 500, opacity: headIn, filter: `blur(${(1 - headIn) * 6}px)` }}>{p.header}</div>
            <div style={{ position: 'absolute', left: 90 * s, top: 112 * s }}>
              {lines.map((line, i) => {
                const a = lin(t, 13 + i * 3.2, 13 + i * 3.2 + 7);
                return (
                  <div
                    key={i}
                    style={{
                      fontSize: Math.min(74, 560 / n) * s * (n <= 7 ? 1 : 0.9),
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '-0.01em',
                      marginBottom: 2 * s,
                      opacity: 0.15 + 0.85 * a,
                      filter: `blur(${(1 - a) * 8}px)`,
                      transform: `translateY(${(1 - a) * 8 * s}px)`,
                      visibility: a > 0.01 ? 'visible' : 'hidden',
                    }}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
            {/* tall glass side pill with rotated caption */}
            {pillP > 0.01 ? (
              <div
                style={{
                  position: 'absolute',
                  left: 485 * s,
                  top: 52 * s,
                  width: 148 * s,
                  height: pillH,
                  borderRadius: 74 * s,
                  background: 'rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.65), inset 0 10px 22px rgba(255,255,255,0.25), 0 10px 26px rgba(0,0,30,0.12)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 320 * s,
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    whiteSpace: 'nowrap',
                    fontSize: 46 * s,
                    fontWeight: 500,
                    opacity: capIn,
                    filter: `blur(${(1 - capIn) * 6}px)`,
                  }}
                >
                  {p.sideText}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
