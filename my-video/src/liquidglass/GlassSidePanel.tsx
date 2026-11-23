import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';
import { Background, liquidGlassDefaults, LiquidGlassProps } from './LiquidGlass';

// -----------------------------------------------------------
// GLASS SIDE PANEL  (glass panel attached to the left edge)
// Timing measured frame by frame from the reference exit (30 fps);
// the entrance is the same timeline played forwards:
//  0–10  a short glass bar slides in from the left edge
//  10–24 the title reveals left to right
//  22–34 the bar grows taller around the title into the full panel
//  30+   the small header fades in, body lines wipe in one by one
//  exit  body lines erase bottom-up, panel shrinks back to the
//        title bar, title fades, bar slides out to the left
// -----------------------------------------------------------

const FONT = loadManrope('normal', { weights: ['300', '500', '600'], subsets: ['latin'] }).fontFamily;

export const glassSidePanelSchema = z.object({
  header: z.string(),
  title: z.string(),
  body: z.string().describe('Body lines separated by |'),
  textColor: zColor(),
  videoFile: z.string().describe('Background video in public/ (empty = drawn petal ring)'),
  magnify: z.number().min(1).max(1.6).step(0.01),
  frost: z.number().min(0).max(30).step(0.5),
  tint: z.number().min(0).max(0.5).step(0.01),
  shade: z.number().min(0).max(0.6).step(0.01),
  seconds: z.number().min(3).max(20).step(0.1),
});
export type GlassSidePanelProps = z.infer<typeof glassSidePanelSchema>;

export const glassSidePanelDefaults: GlassSidePanelProps = {
  header: 'Fresh Perspectives',
  title: 'THE ART OF CLARITY',
  body: 'Discover a calm new style of motion|design — soft blur, thin glowing edges|and smooth glass movement, built|to present your name, idea or|brand with confidence.',
  textColor: '#ffffff',
  videoFile: 'bg_liquid.mp4',
  magnify: 1.12,
  frost: 6,
  tint: 0.06,
  shade: 0.3,
  seconds: 7,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const ease = Easing.bezier(0.55, 0, 0.15, 1);

export const GlassSidePanel: React.FC<Partial<GlassSidePanelProps>> = (props) => {
  const p = { ...glassSidePanelDefaults, ...props };
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames, fps } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const s = H / 1080;
  const lines = p.body.split('|').filter(Boolean);
  const enterLen = 34 + lines.length * 4 + 10;
  // one timeline: forwards for the entrance, mirrored for the exit
  const t = frame < total - enterLen ? frame : Math.max(0, total - frame);

  // geometry at the finished state (1080p units)
  const right = 805 * s;
  const fullTop = 280 * s;
  const fullBottom = 820 * s;
  const titleY = 487 * s; // centre of the title line
  const barHalf = 70 * s;

  const slide = ease(lin(t, 0, 10));
  const grow = ease(lin(t, 22, 34));
  const x0 = -40 * s;
  const panelW = right - x0;
  const x = x0 - (1 - slide) * (panelW + 60 * s);
  const top = interpolate(grow, [0, 1], [titleY - barHalf, fullTop]);
  const bottom = interpolate(grow, [0, 1], [titleY + barHalf, fullBottom]);
  const h = bottom - top;
  const r = 80 * s;

  const bg: LiquidGlassProps = { ...liquidGlassDefaults, videoFile: p.videoFile, showBackground: true };
  const titleChars = Array.from(p.title);
  const headerIn = lin(t, 30, 40);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Background p={bg} frame={frame} W={W} H={H} />
      {slide > 0.001 ? (
        <div
          style={{
            position: 'absolute',
            left: x,
            top,
            width: panelW,
            height: h,
            borderRadius: `0 ${r}px ${r}px 0`,
            overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,30,0.3)',
          }}
        >
          {/* refraction: background again, magnified + slightly frosted */}
          <div
            style={{
              position: 'absolute',
              left: -x,
              top: -top,
              width: W,
              height: H,
              transformOrigin: `${x + panelW / 2}px ${top + h / 2}px`,
              transform: `scale(${p.magnify})`,
              filter: `blur(${p.frost}px) saturate(1.3) brightness(1.05)`,
            }}
          >
            <Background p={bg} frame={frame} W={W} H={H} />
          </div>
          {/* glass body with thin bright rim */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: `0 ${r}px ${r}px 0`,
              background: `linear-gradient(rgba(10,14,40,${p.shade}), rgba(10,14,40,${p.shade})), rgba(255,255,255,${p.tint})`,
              boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.55), inset 0 ${12 * s}px ${26 * s}px rgba(255,255,255,0.22), inset -${10 * s}px 0 ${24 * s}px rgba(255,255,255,0.12)`,
            }}
          />
          {/* contents, placed against the finished layout */}
          <div style={{ position: 'absolute', left: 0, top: -top, width: W, height: H, color: p.textColor, fontFamily: FONT, textShadow: '0 2px 12px rgba(0,0,30,0.3)' }}>
            <div style={{ position: 'absolute', left: 50 * s - x0, top: 362 * s, fontSize: 30 * s, fontWeight: 300, opacity: headerIn, filter: `blur(${(1 - headerIn) * 5}px)` }}>{p.header}</div>
            <div style={{ position: 'absolute', left: 52 * s - x0, top: titleY - 26 * s, fontSize: 46 * s, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'pre' }}>
              {titleChars.map((ch, i) => {
                const a = lin(t, 10 + (i / titleChars.length) * 10, 14 + (i / titleChars.length) * 10);
                return (
                  <span key={i} style={{ opacity: a, filter: `blur(${(1 - a) * 6}px)` }}>
                    {ch}
                  </span>
                );
              })}
            </div>
            <div style={{ position: 'absolute', left: 51 * s - x0, top: 532 * s, fontSize: 30 * s, fontWeight: 500, lineHeight: `${35.5 * s}px` }}>
              {lines.map((line, i) => {
                const a = ease(lin(t, 34 + i * 4, 34 + i * 4 + 8));
                return (
                  <div key={i} style={{ whiteSpace: 'pre', clipPath: `inset(-10% ${(1 - a) * 100}% -10% 0)`, opacity: 0.3 + 0.7 * a }}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
