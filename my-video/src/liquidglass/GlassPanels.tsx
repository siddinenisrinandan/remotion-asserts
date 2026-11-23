import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';
import { Background, liquidGlassDefaults, LiquidGlassProps } from './LiquidGlass';

// -----------------------------------------------------------
// GLASS PANELS  (two more liquid-glass layouts)
// Bottom bar  — timing from the reference (30 fps): a thin glass bar
//   rises from the bottom edge and widens out from the centre (≈12 f),
//   rests empty, then the header, the big title and the right-hand
//   paragraph fade/wipe in line by line.
// Right panel — the tall glass panel slides in from the right edge
//   (≈11 f), centred title lines appear one after another (≈4 f apart),
//   then the paragraph lines, and last the vertical side caption
//   reveals from the bottom up.
// Both exits are the entrance played backwards.
// -----------------------------------------------------------

const FONT = loadManrope('normal', { weights: ['300', '500', '600'], subsets: ['latin'] }).fontFamily;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const ease = Easing.bezier(0.55, 0, 0.15, 1);

const glassFields = {
  textColor: zColor(),
  videoFile: z.string().describe('Background video in public/ (empty = drawn petal ring)'),
  magnify: z.number().min(1).max(1.6).step(0.01),
  frost: z.number().min(0).max(30).step(0.5),
  tint: z.number().min(0).max(0.5).step(0.01),
  shade: z.number().min(0).max(0.6).step(0.01),
  seconds: z.number().min(3).max(20).step(0.1),
};

type GlassLook = { magnify: number; frost: number; tint: number; shade: number };
type Box = { x: number; y: number; w: number; h: number; radius: string };

/** Glass box: background redrawn inside (magnified + frosted), tint, rim light. */
const GlassBox: React.FC<{ box: Box; look: GlassLook; bg: LiquidGlassProps; frame: number; W: number; H: number; children?: React.ReactNode }> = ({
  box,
  look,
  bg,
  frame,
  W,
  H,
  children,
}) => (
  <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.radius, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,30,0.3)' }}>
    <div
      style={{
        position: 'absolute',
        left: -box.x,
        top: -box.y,
        width: W,
        height: H,
        transformOrigin: `${box.x + box.w / 2}px ${box.y + box.h / 2}px`,
        transform: `scale(${look.magnify})`,
        filter: `blur(${look.frost}px) saturate(1.3) brightness(1.05)`,
      }}
    >
      <Background p={bg} frame={frame} W={W} H={H} />
    </div>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: box.radius,
        background: `linear-gradient(rgba(10,14,40,${look.shade}), rgba(10,14,40,${look.shade})), rgba(255,255,255,${look.tint})`,
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.5), inset 0 14px 28px rgba(255,255,255,0.22), inset 0 -18px 34px rgba(0,0,30,0.18)',
      }}
    />
    {/* content uses screen coordinates */}
    <div style={{ position: 'absolute', left: -box.x, top: -box.y, width: W, height: H }}>{children}</div>
  </div>
);

const fadeUp = (a: number): React.CSSProperties => ({ opacity: a, filter: `blur(${(1 - a) * 6}px)`, transform: `translateY(${(1 - a) * 8}px)` });

// =============================================================
// BOTTOM BAR
// =============================================================
export const glassBottomBarSchema = z.object({
  header: z.string(),
  title: z.string(),
  body: z.string().describe('Right-hand paragraph lines separated by |'),
  ...glassFields,
});
export type GlassBottomBarProps = z.infer<typeof glassBottomBarSchema>;

export const glassBottomBarDefaults: GlassBottomBarProps = {
  header: 'Made for Creators',
  title: 'WHERE LIGHT TELLS THE STORY.',
  body: 'Every frame is shaped by light, glass|and calm motion — simple to read,|easy to edit and made to keep|people watching.',
  textColor: '#ffffff',
  videoFile: 'bg_liquid.mp4',
  magnify: 1.12,
  frost: 7,
  tint: 0.05,
  shade: 0.32,
  seconds: 8,
};

export const GlassBottomBar: React.FC<Partial<GlassBottomBarProps>> = (props) => {
  const p = { ...glassBottomBarDefaults, ...props };
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames, fps } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const s = H / 1080;
  const lines = p.body.split('|').filter(Boolean);
  const enterLen = 34 + lines.length * 3 + 10;
  const t = frame < total - enterLen ? frame : Math.max(0, total - frame);

  // bar rises and widens from the centre
  const rise = ease(lin(t, 0, 8));
  const widen = ease(lin(t, 2, 14));
  const fullW = 1580 * s;
  const w = interpolate(widen, [0, 1], [430 * s, fullW]);
  const top = interpolate(rise, [0, 1], [H + 10 * s, 870 * s]);
  const box: Box = { x: W / 2 - w / 2, y: top, w, h: 260 * s, radius: `${110 * s}px ${110 * s}px 0 0` };
  const bg: LiquidGlassProps = { ...liquidGlassDefaults, videoFile: p.videoFile };
  const left = W / 2 - fullW / 2;

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Background p={bg} frame={frame} W={W} H={H} />
      {t > 0.5 ? (
        <GlassBox box={box} look={p} bg={bg} frame={frame} W={W} H={H}>
          <div style={{ position: 'absolute', left: left + 95 * s, top: 932 * s, fontFamily: FONT, color: p.textColor, textShadow: '0 2px 12px rgba(0,0,30,0.3)' }}>
            <div style={{ fontSize: 32 * s, fontWeight: 300, ...fadeUp(lin(t, 26, 34)) }}>{p.header}</div>
            <div style={{ fontSize: 40 * s, fontWeight: 600, marginTop: 10 * s, whiteSpace: 'nowrap', ...fadeUp(lin(t, 22, 32)) }}>{p.title}</div>
          </div>
          <div style={{ position: 'absolute', left: left + 940 * s, top: 920 * s, fontFamily: FONT, color: p.textColor, fontSize: 24 * s, fontWeight: 500, lineHeight: `${30 * s}px`, textShadow: '0 2px 12px rgba(0,0,30,0.3)' }}>
            {lines.map((line, i) => {
              const a = ease(lin(t, 28 + i * 3, 28 + i * 3 + 8));
              return (
                <div key={i} style={{ whiteSpace: 'pre', clipPath: `inset(-10% ${(1 - a) * 100}% -10% 0)`, opacity: 0.3 + 0.7 * a }}>
                  {line}
                </div>
              );
            })}
          </div>
        </GlassBox>
      ) : null}
    </AbsoluteFill>
  );
};

// =============================================================
// RIGHT PANEL
// =============================================================
export const glassRightPanelSchema = z.object({
  title: z.string().describe('Title lines separated by |'),
  body: z.string().describe('Paragraph lines separated by |'),
  sideText: z.string().describe('Vertical caption on the right edge'),
  ...glassFields,
});
export type GlassRightPanelProps = z.infer<typeof glassRightPanelSchema>;

export const glassRightPanelDefaults: GlassRightPanelProps = {
  title: 'WHERE|IDEAS|BECOME|STORIES THAT|STAY',
  body: 'Every scene moves like water,|soft light and steady pace —|a quiet balance between|clear design, warm mood|and modern craft.',
  sideText: 'MADE FOR PEOPLE WHO LOVE THE DETAILS',
  textColor: '#ffffff',
  videoFile: 'bg_liquid.mp4',
  magnify: 1.1,
  frost: 9,
  tint: 0.05,
  shade: 0.34,
  seconds: 8,
};

export const GlassRightPanel: React.FC<Partial<GlassRightPanelProps>> = (props) => {
  const p = { ...glassRightPanelDefaults, ...props };
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames, fps } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const s = H / 1080;
  const titleLines = p.title.split('|').filter(Boolean);
  const bodyLines = p.body.split('|').filter(Boolean);
  const titleStart = 14;
  const bodyStart = titleStart + titleLines.length * 4 + 4;
  const sideStart = bodyStart + bodyLines.length * 3 + 4;
  const enterLen = sideStart + 12;
  const t = frame < total - enterLen ? frame : Math.max(0, total - frame);

  const panelLeft = 1295 * s;
  const slide = ease(lin(t, 0, 11));
  const x = interpolate(slide, [0, 1], [W + 20 * s, panelLeft]);
  const box: Box = { x, y: -4 * s, w: W - panelLeft + 40 * s, h: H + 8 * s, radius: `${90 * s}px 0 0 ${90 * s}px` };
  const bg: LiquidGlassProps = { ...liquidGlassDefaults, videoFile: p.videoFile };
  const cx = 1585 * s + (x - panelLeft); // content travels with the panel
  const side = lin(t, sideStart, sideStart + 12);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Background p={bg} frame={frame} W={W} H={H} />
      {t > 0.5 ? (
        <GlassBox box={box} look={p} bg={bg} frame={frame} W={W} H={H}>
          <div style={{ position: 'absolute', left: cx, top: 245 * s, transform: 'translateX(-50%)', textAlign: 'center', fontFamily: FONT, color: p.textColor, textShadow: '0 2px 14px rgba(0,0,30,0.3)' }}>
            {titleLines.map((line, i) => (
              <div key={i} style={{ fontSize: 58 * s, fontWeight: 600, lineHeight: `${66 * s}px`, whiteSpace: 'nowrap', ...fadeUp(lin(t, titleStart + i * 4, titleStart + i * 4 + 8)) }}>
                {line}
              </div>
            ))}
            <div style={{ marginTop: 100 * s, fontSize: 25 * s, fontWeight: 500, lineHeight: `${30 * s}px` }}>
              {bodyLines.map((line, i) => (
                <div key={i} style={{ whiteSpace: 'nowrap', ...fadeUp(lin(t, bodyStart + i * 3, bodyStart + i * 3 + 8)) }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
          {/* vertical side caption, revealed bottom-up */}
          <div
            style={{
              position: 'absolute',
              left: cx + 262 * s,
              top: H / 2 - 20 * s,
              transform: 'translate(-50%, -50%) rotate(-90deg)',
              whiteSpace: 'nowrap',
              fontFamily: FONT,
              fontWeight: 300,
              fontSize: 34 * s,
              letterSpacing: '0.02em',
              color: p.textColor,
              clipPath: `inset(-20% ${(1 - side) * 100}% -20% 0)`,
            }}
          >
            {p.sideText}
          </div>
        </GlassBox>
      ) : null}
    </AbsoluteFill>
  );
};
