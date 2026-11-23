import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBgTrim } from './bgClock';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';

// -----------------------------------------------------------
// GLASS FACE CAM  (picture-in-picture frame for a talking head)
// A clean glass frame in a corner holds the creator's face video.
// The frame's thick border is real "glass": the main video behind it
// is redrawn magnified + frosted inside the border, with a bright rim
// and inner shadow, so the face looks set into a pane of glass.
// Pops in from a small dot (spring), optional name tag underneath,
// exits by shrinking back.
// -----------------------------------------------------------

const FONT = loadPoppins('normal', { weights: ['500', '600'], subsets: ['latin'] }).fontFamily;

export const glassFaceCamSchema = z.object({
  backgroundFile: z.string().describe('Main video in public/'),
  faceFile: z.string().describe('Face / talking-head video in public/'),
  corner: z.enum(['Top right', 'Top left', 'Bottom right', 'Bottom left']),
  shape: z.enum(['Square', 'Rounded', 'Circle']),
  size: z.number().min(150).max(800).step(5).describe('Frame size in px (1080p)'),
  margin: z.number().min(0).max(200).step(2).describe('Distance from the edges'),
  border: z.number().min(4).max(60).step(1).describe('Glass border thickness'),
  frost: z.number().min(0).max(30).step(0.5),
  faceZoom: z.number().min(1).max(3).step(0.05).describe('Zoom into the face video'),
  faceX: z.number().min(0).max(100).step(1).describe('Face focus, % from left'),
  faceY: z.number().min(0).max(100).step(1).describe('Face focus, % from top'),
  showName: z.boolean(),
  name: z.string(),
  textColor: zColor(),
  seconds: z.number().min(2).max(60).step(0.1),
});
export type GlassFaceCamProps = z.infer<typeof glassFaceCamSchema>;

export const glassFaceCamDefaults: GlassFaceCamProps = {
  backgroundFile: 'bg_liquid.mp4',
  faceFile: 'testvideo2.mp4',
  corner: 'Top right',
  shape: 'Rounded',
  size: 380,
  margin: 50,
  border: 18,
  frost: 10,
  faceZoom: 1.6,
  faceX: 50,
  faceY: 35,
  showName: true,
  name: 'Maya Rowe',
  textColor: '#ffffff',
  seconds: 8,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const GlassFaceCam: React.FC<Partial<GlassFaceCamProps>> = (props) => {
  const bgTrim = useBgTrim();
  const p = { ...glassFaceCamDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const s = H / 1080;

  const grow = spring({ frame, fps, config: { damping: 16, stiffness: 150 } });
  const out = Easing.in(Easing.cubic)(interpolate(frame, [total - 12, total], [0, 1], clamp));
  const k = Math.max(0, grow * (1 - out));

  const size = p.size * s;
  const m = p.margin * s;
  const right = p.corner.includes('right');
  const bottom = p.corner.includes('Bottom');
  const nameH = p.showName ? 64 * s : 0;
  const x = right ? W - m - size : m;
  const y = bottom ? H - m - size - nameH : m;
  const radius = p.shape === 'Circle' ? size / 2 : p.shape === 'Rounded' ? size * 0.16 : size * 0.04;
  const b = p.border * s;
  const innerR = Math.max(0, radius - b * (p.shape === 'Circle' ? 0 : 0.6));
  const cx = x + size / 2;
  const cy = y + size / 2;

  const bg = (style: React.CSSProperties) => <Video src={staticFile(p.backgroundFile)} trimBefore={bgTrim} objectFit="cover" style={{ width: W, height: H, ...style }} muted />;
  const nameIn = interpolate(frame, [10, 20], [0, 1], clamp) * (1 - interpolate(frame, [total - 16, total - 8], [0, 1], clamp));

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#111' }}>
      {p.backgroundFile ? bg({}) : null}
      {k > 0.001 ? (
        <div style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0 }}>
          <div style={{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size, transform: `scale(${k})` }}>
            {/* outer glass slab: background magnified + frosted */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: radius, overflow: 'hidden', boxShadow: `0 ${20 * s}px ${50 * s}px rgba(0,0,0,0.4)` }}>
              {p.backgroundFile ? (
                <div style={{ position: 'absolute', left: -x, top: -y, width: W, height: H, transformOrigin: `${cx}px ${cy}px`, transform: 'scale(1.25)', filter: `blur(${p.frost * s}px) saturate(1.3) brightness(1.1)` }}>
                  {bg({})}
                </div>
              ) : null}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: radius,
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.16))',
                  boxShadow: `inset 0 0 0 ${2 * s}px rgba(255,255,255,0.75), inset 0 ${10 * s}px ${20 * s}px rgba(255,255,255,0.3), inset 0 -${10 * s}px ${20 * s}px rgba(0,0,0,0.2)`,
                }}
              />
            </div>
            {/* face window */}
            <div
              style={{
                position: 'absolute',
                left: b,
                top: b,
                width: size - 2 * b,
                height: size - 2 * b,
                borderRadius: innerR,
                overflow: 'hidden',
                boxShadow: `0 0 0 ${1.5 * s}px rgba(255,255,255,0.6), inset 0 0 ${14 * s}px rgba(0,0,0,0.35)`,
                background: '#000',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, transformOrigin: `${p.faceX}% ${p.faceY}%`, transform: `scale(${p.faceZoom})` }}>
                <Video
                  src={staticFile(p.faceFile)}
                  objectFit="cover"
                  style={{
                    width: '100%',
                    height: '100%',
                    translate: '-54.3px 13.4px'
                  }}
                  muted
                />
              </div>
              {/* glass sheen over the face */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.18), transparent 40%)', pointerEvents: 'none' }} />
            </div>
          </div>
          {/* name tag */}
          {p.showName ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: size / 2 + 14 * s,
                transform: `translateX(-50%) scale(${k})`,
                opacity: nameIn,
                padding: `${8 * s}px ${26 * s}px`,
                borderRadius: 999,
                backdropFilter: 'blur(12px) saturate(1.4)',
                background: 'rgba(255,255,255,0.14)',
                boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6), 0 8px 20px rgba(0,0,0,0.3)',
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 26 * s,
                color: p.textColor,
                whiteSpace: 'nowrap',
              }}
            >
              {p.name}
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const FACE_CAM_PRESETS: { id: string; props: GlassFaceCamProps }[] = [
  { id: 'GlassFaceCam-01-Top-Right', props: glassFaceCamDefaults },
  { id: 'GlassFaceCam-02-Square-Sharp', props: { ...glassFaceCamDefaults, shape: 'Square', border: 14, showName: false } },
  { id: 'GlassFaceCam-03-Circle', props: { ...glassFaceCamDefaults, shape: 'Circle', size: 340, corner: 'Bottom right' } },
];
