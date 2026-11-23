import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBgTrim } from './bgClock';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';

// -----------------------------------------------------------
// GLASS SCREEN  (large 16:9 glass frame to show computer work)
// A big 16:9 pane of glass holds a screen recording. Its thick border
// is glass: the background video shows through it magnified + frosted,
// with a bright rim. Pops in with a soft spring, optional slight 3D
// tilt that settles flat, a slow push-in while holding, and an
// optional glass caption pill below. Empty screenFile shows a
// "your screen here" placeholder.
// -----------------------------------------------------------

const FONT = loadPoppins('normal', { weights: ['500', '600'], subsets: ['latin'] }).fontFamily;

export const glassScreenSchema = z.object({
  backgroundFile: z.string().describe('Background video in public/ (empty = gradient)'),
  screenFile: z.string().describe('Screen recording in public/ (empty = placeholder)'),
  screenStart: z.number().min(0).max(600).step(0.1).describe('Start the screen recording at this second'),
  width: z.number().min(30).max(95).step(1).describe('Frame width, % of the video width'),
  offsetY: z.number().min(-30).max(30).step(1).describe('Move the frame up/down (%)'),
  border: z.number().min(4).max(60).step(1).describe('Glass border thickness'),
  radius: z.number().min(0).max(80).step(1).describe('Corner roundness'),
  frost: z.number().min(0).max(30).step(0.5),
  tiltIn: z.number().min(0).max(30).step(1).describe('3D tilt at the start that settles flat'),
  pushIn: z.number().min(0).max(0.15).step(0.01).describe('Slow zoom while holding'),
  showCaption: z.boolean(),
  caption: z.string(),
  textColor: zColor(),
  darken: z.number().min(0).max(0.8).step(0.01).describe('Dark layer over the background'),
  seconds: z.number().min(2).max(120).step(0.1),
});
export type GlassScreenProps = z.infer<typeof glassScreenSchema>;

export const glassScreenDefaults: GlassScreenProps = {
  backgroundFile: 'bg_liquid.mp4',
  screenFile: '',
  screenStart: 0,
  width: 72,
  offsetY: -4,
  border: 22,
  radius: 34,
  frost: 12,
  tiltIn: 14,
  pushIn: 0.04,
  showCaption: true,
  caption: 'Building the edit, step by step',
  textColor: '#ffffff',
  darken: 0,
  seconds: 8,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Placeholder: React.FC<{ s: number }> = ({ s }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(160deg, #1f2430, #0f1218)', fontFamily: FONT }}>
    {/* fake window bar */}
    <div style={{ height: 44 * s, display: 'flex', alignItems: 'center', gap: 10 * s, padding: `0 ${18 * s}px`, background: 'rgba(255,255,255,0.06)' }}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{ width: 14 * s, height: 14 * s, borderRadius: '50%', background: c }} />
      ))}
    </div>
    <AbsoluteFill style={{ top: 44 * s, justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 38 * s, fontWeight: 500 }}>
      Your screen recording here
    </AbsoluteFill>
  </AbsoluteFill>
);

export const GlassScreen: React.FC<Partial<GlassScreenProps>> = (props) => {
  const bgTrim = useBgTrim();
  const p = { ...glassScreenDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const s = H / 1080;

  const grow = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const out = Easing.in(Easing.cubic)(interpolate(frame, [total - 14, total], [0, 1], clamp));
  const k = Math.max(0, grow * (1 - out));
  const hold = interpolate(frame, [0, total], [0, 1], clamp);

  const fw = (W * p.width) / 100;
  const fh = (fw * 9) / 16;
  const x = (W - fw) / 2;
  const y = (H - fh) / 2 + (H * p.offsetY) / 100;
  const cx = x + fw / 2;
  const cy = y + fh / 2;
  const b = p.border * s;
  const r = p.radius * s;
  const tilt = (1 - grow) * p.tiltIn;
  const scale = (0.6 + 0.4 * k) * (1 + p.pushIn * hold);

  const bg = () =>
    p.backgroundFile ? (
      <Video src={staticFile(p.backgroundFile)} trimBefore={bgTrim} objectFit="cover" style={{ width: W, height: H }} muted />
    ) : (
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 40% 30%, #3a4a6a, #0d1120)' }} />
    );
  const captionIn = interpolate(frame, [14, 26], [0, 1], clamp) * (1 - interpolate(frame, [total - 18, total - 8], [0, 1], clamp));

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#0d1120' }}>
      {bg()}
      {p.darken > 0 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${p.darken})` }} /> : null}
      {k > 0.001 ? (
        <div style={{ position: 'absolute', inset: 0, perspective: 1800 * s }}>
          <div
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: fw,
              height: fh,
              opacity: Math.min(1, k * 1.5),
              transform: `rotateX(${tilt}deg) scale(${scale})`,
              transformOrigin: '50% 60%',
            }}
          >
            {/* glass slab: background magnified + frosted */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: r, overflow: 'hidden', boxShadow: `0 ${30 * s}px ${80 * s}px rgba(0,0,0,0.5)` }}>
              <div style={{ position: 'absolute', left: -x, top: -y, width: W, height: H, transformOrigin: `${cx}px ${cy}px`, transform: 'scale(1.15)', filter: `blur(${p.frost * s}px) saturate(1.3) brightness(1.1)` }}>
                {bg()}
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: r,
                  background: 'linear-gradient(150deg, rgba(255,255,255,0.26), rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.14))',
                  boxShadow: `inset 0 0 0 ${2 * s}px rgba(255,255,255,0.7), inset 0 ${12 * s}px ${24 * s}px rgba(255,255,255,0.28), inset 0 -${12 * s}px ${24 * s}px rgba(0,0,0,0.22)`,
                }}
              />
            </div>
            {/* screen */}
            <div
              style={{
                position: 'absolute',
                left: b,
                top: b,
                width: fw - 2 * b,
                height: fh - 2 * b,
                borderRadius: Math.max(0, r - b * 0.6),
                overflow: 'hidden',
                background: '#000',
                boxShadow: `0 0 0 ${1.5 * s}px rgba(255,255,255,0.55), inset 0 0 ${16 * s}px rgba(0,0,0,0.4)`,
              }}
            >
              {p.screenFile ? (
                <Video src={staticFile(p.screenFile)} trimBefore={Math.round(p.screenStart * fps)} objectFit="cover" style={{ width: '100%', height: '100%' }} muted />
              ) : (
                <Placeholder s={s} />
              )}
              {/* faint glass reflection across the screen */}
              <div
                style={{
                  position: 'absolute',
                  top: '-20%',
                  bottom: '-20%',
                  width: '30%',
                  left: `${interpolate(frame, [0, total], [-35, 110])}%`,
                  background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.08), transparent)',
                  transform: 'skewX(-15deg)',
                }}
              />
            </div>
          </div>
          {p.showCaption ? (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: y + fh + (scale - 1) * fh * 0.6 + 40 * s,
                transform: 'translateX(-50%)',
                opacity: captionIn,
                padding: `${12 * s}px ${34 * s}px`,
                borderRadius: 999,
                backdropFilter: 'blur(14px) saturate(1.4)',
                background: 'linear-gradient(rgba(10,12,22,0.3), rgba(10,12,22,0.3)), rgba(255,255,255,0.14)',
                textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6), 0 10px 26px rgba(0,0,0,0.35)',
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 30 * s,
                color: p.textColor,
                whiteSpace: 'nowrap',
              }}
            >
              {p.caption}
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
