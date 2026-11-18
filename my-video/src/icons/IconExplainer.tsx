import React from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';
import { ICON_NAMES, INK, SceneIcon, SIGN_DEFAULTS } from './SceneIcons';

const { fontFamily: SERIF } = loadFraunces('normal', { weights: ['800'], subsets: ['latin'] });
const { fontFamily: SANS } = loadArchivo('normal', { weights: ['500', '700'], subsets: ['latin'] });

// -----------------------------------------------------------
// ICON EXPLAINER
// A cream "whiteboard" scene that explains a system with icons:
// a heading, icons placed anywhere with sticker labels and captions,
// rows of people, arrows between icons, and a trend card.
// Everything is a setting, so AI can build a whole explanation by
// changing values only.
// Positions are in % of the screen (x 0 = left, y 0 = top).
// -----------------------------------------------------------

const TREND = ['Up', 'Down', 'Flat', 'Up then down', 'Down then up'] as const;

export const iconExplainerSchema = z.object({
  kicker: z.string().describe('Small text above the heading'),
  heading: z.string().describe('Big heading'),
  highlight: z.string().describe('Part of the heading to highlight (must match exactly)'),
  highlightColor: zColor(),
  backgroundColor: zColor(),
  seconds: z.number().min(2).max(60).step(0.5).describe('Scene length'),
  icons: z
    .array(
      z.object({
        icon: z.enum(ICON_NAMES).describe('Which icon'),
        signText: z.string().describe('Text on the building sign (empty = default)'),
        x: z.number().min(0).max(100).describe('Centre across, % of screen'),
        y: z.number().min(0).max(100).describe('Bottom of the icon, % of screen'),
        size: z.number().min(40).max(700).describe('Size in pixels'),
        count: z.number().int().min(1).max(12).describe('Repeat in a row (for crowds)'),
        sticker: z.string().describe('Sticker label above (empty hides it)'),
        stickerYellow: z.boolean().describe('Yellow sticker instead of white'),
        caption: z.string().describe('Caption below (empty hides it)'),
        appearAt: z.number().min(0).max(60).step(0.1).describe('Seconds until it pops in'),
      }),
    )
    .describe('Icons in the scene'),
  arrows: z
    .array(
      z.object({
        from: z.number().int().min(1).max(30).describe('From icon number (1 = first)'),
        to: z.number().int().min(1).max(30).describe('To icon number'),
        label: z.string().describe('Text on the arrow'),
        labelPlacement: z
          .enum(['Beside line', 'On line'])
          .optional()
          .describe('Beside line = text sits clear of the line; On line = text in a pill covering the line'),
        bend: z.number().min(-1).max(1).step(0.05).describe('Curve (-1 up, 1 down)'),
        appearAt: z.number().min(0).max(60).step(0.1).describe('Seconds until it draws'),
      }),
    )
    .describe('Arrows between icons'),
  showTrendCard: z.boolean().describe('Show the line-trend card'),
  trendCard: z.object({
    x: z.number().min(0).max(100).describe('Left edge, %'),
    y: z.number().min(0).max(100).describe('Top edge, %'),
    width: z.number().min(10).max(90).describe('Width, %'),
    height: z.number().min(10).max(90).describe('Height, %'),
    appearAt: z.number().min(0).max(60).step(0.1).describe('Seconds until it appears'),
    lines: z.array(
      z.object({
        label: z.string(),
        trend: z.enum(TREND),
        color: zColor(),
      }),
    ),
  }),
});

export type IconExplainerProps = z.infer<typeof iconExplainerSchema>;

export const iconExplainerDefaults: IconExplainerProps = {
  kicker: 'THINK OF A RESTAURANT',
  heading: 'More customers, less cash',
  highlight: 'less cash',
  highlightColor: '#FFE45C',
  backgroundColor: '#FBF5EA',
  seconds: 8,
  icons: [
    { icon: 'Restaurant', signText: 'DOSA HUT', x: 17, y: 64, size: 330, count: 1, sticker: 'Growing slower than expected', stickerYellow: false, caption: 'The original outlet', appearAt: 0.4, },
    { icon: 'Person (simple)', signText: '', x: 17, y: 78, size: 52, count: 6, sticker: '', stickerYellow: false, caption: '', appearAt: 1.2 },
    { icon: 'Restaurant', signText: 'DOSA HUT', x: 37, y: 52, size: 190, count: 1, sticker: 'New branches', stickerYellow: true, caption: '', appearAt: 2.2 },
    { icon: 'Restaurant', signText: 'DOSA HUT', x: 51, y: 52, size: 190, count: 1, sticker: '', stickerYellow: false, caption: '', appearAt: 2.5 },
  ],
  arrows: [{ from: 1, to: 3, label: 'expand', bend: -0.35, appearAt: 1.8 }],
  showTrendCard: true,
  trendCard: {
    x: 63,
    y: 26,
    width: 31,
    height: 52,
    appearAt: 3.2,
    lines: [
      { label: 'Sales', trend: 'Up', color: '#2E9B4A' },
      { label: "Owner's bank balance", trend: 'Down', color: '#E04B3F' },
    ],
  },
};

export const calculateIconExplainerMetadata: CalculateMetadataFunction<IconExplainerProps> = ({ props }) => ({
  durationInFrames: Math.max(30, Math.round((props.seconds ?? iconExplainerDefaults.seconds) * 30)),
});

// --- pieces --------------------------------------------------------------

const Sticker: React.FC<{ text: string; yellow: boolean; s: number; pop: number; tilt: number }> = ({ text, yellow, s, pop, tilt }) => (
  <div
    style={{
      display: 'inline-block',
      padding: `${8 * s}px ${16 * s}px`,
      background: yellow ? '#FFE45C' : '#FFFFFF',
      border: `${3 * s}px solid ${INK}`,
      borderRadius: 8 * s,
      boxShadow: `${4 * s}px ${4 * s}px 0 ${INK}`,
      fontFamily: SANS,
      fontWeight: 700,
      fontSize: 24 * s,
      color: INK,
      whiteSpace: 'nowrap',
      transform: `rotate(${tilt}deg) scale(${pop})`,
    }}
  >
    {text}
  </div>
);

// Points (0..1) for a trend line, x across, y up.
const trendPoints = (t: (typeof TREND)[number]): [number, number][] => {
  switch (t) {
    case 'Up':
      return [[0, 0.1], [1, 0.9]];
    case 'Down':
      return [[0, 0.9], [1, 0.1]];
    case 'Flat':
      return [[0, 0.5], [1, 0.5]];
    case 'Up then down':
      return [[0, 0.15], [0.5, 0.9], [1, 0.15]];
    case 'Down then up':
      return [[0, 0.85], [0.5, 0.1], [1, 0.85]];
  }
};

// --- scene ---------------------------------------------------------------

export const IconExplainer: React.FC<Partial<IconExplainerProps>> = (props) => {
  const p = { ...iconExplainerDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = width / 1920;
  const at = (sec: number) => Math.round(sec * fps);

  // Heading
  const headIn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });
  const hlIdx = p.highlight ? p.heading.indexOf(p.highlight) : -1;
  const hlSweep = interpolate(frame, [12, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Icon geometry (for arrows): centre of each icon.
  const iconBox = p.icons.map((it) => {
    const totalW = it.size * s * it.count + (it.count - 1) * it.size * s * 0.15;
    const cx = (it.x / 100) * width;
    const bottom = (it.y / 100) * height;
    return { cx, cy: bottom - (it.size * s) / 2, w: totalW, h: it.size * s, bottom };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.backgroundColor,
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.09) 1.2px, transparent 1.2px)',
        backgroundSize: `${26 * s}px ${26 * s}px`,
      }}
    >
      {/* heading */}
      <div
        style={{
          position: 'absolute',
          left: 70 * s,
          top: 40 * s,
          opacity: headIn,
          transform: `translateY(${(1 - headIn) * 20 * s}px)`,
        }}
      >
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 22 * s, letterSpacing: 2 * s, color: '#6B655E' }}>
          {p.kicker}
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 76 * s, color: INK, lineHeight: 1.15, marginTop: 6 * s }}>
          {hlIdx < 0 ? (
            p.heading
          ) : (
            <>
              {p.heading.slice(0, hlIdx)}
              <span
                style={{
                  backgroundImage: `linear-gradient(${p.highlightColor}, ${p.highlightColor})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: `${hlSweep * 100}% 55%`,
                  backgroundPosition: '0 85%',
                }}
              >
                {p.highlight}
              </span>
              {p.heading.slice(hlIdx + p.highlight.length)}
            </>
          )}
        </div>
      </div>

      {/* arrows (under the icons) */}
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {p.arrows.map((a, i) => {
          const A = iconBox[a.from - 1];
          const B = iconBox[a.to - 1];
          if (!A || !B) return null;
          const dx = B.cx - A.cx;
          const dy = B.cy - A.cy;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const startGap = Math.min(A.w, A.h) * 0.5;
          const endGap = Math.min(B.w, B.h) * 0.5 + 10 * s;
          const x1 = A.cx + ux * startGap;
          const y1 = A.cy + uy * startGap;
          const x2 = B.cx - ux * endGap;
          const y2 = B.cy - uy * endGap;
          const mx = (x1 + x2) / 2 - uy * a.bend * len * 0.5;
          const my = (y1 + y2) / 2 + ux * a.bend * len * 0.5;
          const draw = interpolate(frame, [at(a.appearAt), at(a.appearAt) + 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          });
          // Arrow head direction = tangent at the end of the curve.
          const tx = x2 - mx;
          const ty = y2 - my;
          const tl = Math.hypot(tx, ty) || 1;
          const hx = tx / tl;
          const hy = ty / tl;
          const hs = 18 * s;
          const head = `M${x2 - hx * hs - hy * hs * 0.6} ${y2 - hy * hs + hx * hs * 0.6}L${x2} ${y2}L${x2 - hx * hs + hy * hs * 0.6} ${y2 - hy * hs - hx * hs * 0.6}`;
          // Label placement. Start at the curve's midpoint.
          const midX = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
          const midY = 0.25 * y1 + 0.5 * my + 0.25 * y2;
          // Estimated label box (bold 22px text + padding).
          const fontPx = 22 * s;
          const labelW = a.label.length * fontPx * 0.58 + 24 * s;
          const labelH = fontPx * 1.5;
          // Normal to the line at the midpoint (tangent there is x1->x2).
          let nx = -(y2 - y1);
          let ny = x2 - x1;
          const nl = Math.hypot(nx, ny) || 1;
          nx /= nl;
          ny /= nl;
          // Push to the outside of the curve (the side the bend bulges to);
          // a straight arrow puts its label above the line.
          const bulgeX = midX - (x1 + x2) / 2;
          const bulgeY = midY - (y1 + y2) / 2;
          const side = Math.abs(a.bend) > 0.02 ? Math.sign(nx * bulgeX + ny * bulgeY) || 1 : ny < 0 ? 1 : -1;
          nx *= side;
          ny *= side;
          // Distance so the whole box clears the line, plus a small gap.
          const clear = Math.abs(nx) * (labelW / 2) + Math.abs(ny) * (labelH / 2) + 8 * s;
          const onLine = a.labelPlacement === 'On line';
          const lx = onLine ? midX : midX + nx * clear;
          const ly = onLine ? midY : midY + ny * clear;
          return (
            <g key={i}>
              <path
                d={`M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`}
                fill="none"
                stroke={INK}
                strokeWidth={5 * s}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - draw}
                opacity={draw > 0 ? 1 : 0}
              />
              {draw > 0.95 && <path d={head} fill="none" stroke={INK} strokeWidth={5 * s} strokeLinecap="round" strokeLinejoin="round" />}
              {a.label && draw > 0.5 && (
                <foreignObject x={lx - 150 * s} y={ly - 28 * s} width={300 * s} height={56 * s}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <span
                      style={{
                        fontFamily: SANS,
                        fontWeight: 700,
                        fontSize: fontPx,
                        color: INK,
                        whiteSpace: 'nowrap',
                        ...(onLine
                          ? {
                              background: '#FFFFFF',
                              border: `${3 * s}px solid ${INK}`,
                              borderRadius: 20 * s,
                              padding: `${3 * s}px ${12 * s}px`,
                            }
                          : { padding: `${2 * s}px ${6 * s}px` }),
                      }}
                    >
                      {a.label}
                    </span>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>

      {/* icons */}
      {p.icons.map((it, i) => {
        const box = iconBox[i];
        const start = at(it.appearAt);
        const pop = spring({ frame: frame - start, fps, config: { damping: 12, stiffness: 150 } });
        const stickerPop = spring({ frame: frame - start - 8, fps, config: { damping: 11, stiffness: 170 } });
        const capIn = spring({ frame: frame - start - 10, fps, config: { damping: 200 } });
        const sz = it.size * s;
        const gap = sz * 0.15;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: box.cx - box.w / 2,
              top: box.bottom - sz,
              width: box.w,
              height: sz,
            }}
          >
            {it.sticker && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: sz * 0.96,
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                }}
              >
                <Sticker text={it.sticker} yellow={it.stickerYellow} s={s} pop={stickerPop} tilt={i % 2 ? 2 : -2} />
              </div>
            )}
            <div style={{ display: 'flex', gap }}>
              {Array.from({ length: it.count }).map((_, k) => {
                const kp = it.count > 1 ? spring({ frame: frame - start - k * 3, fps, config: { damping: 12, stiffness: 160 } }) : pop;
                return (
                  <SceneIcon
                    key={k}
                    name={it.icon}
                    size={sz}
                    sign={it.signText || SIGN_DEFAULTS[it.icon]}
                    style={{ transform: `scale(${kp})`, transformOrigin: '50% 100%' }}
                  />
                );
              })}
            </div>
            {it.caption && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: sz + 12 * s,
                  transform: `translateX(-50%) translateY(${(1 - capIn) * 10 * s}px)`,
                  opacity: capIn,
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 26 * s,
                  color: INK,
                  whiteSpace: 'nowrap',
                }}
              >
                {it.caption}
              </div>
            )}
          </div>
        );
      })}

      {/* trend card */}
      {p.showTrendCard && (() => {
        const c = p.trendCard;
        const cx = (c.x / 100) * width;
        const cy = (c.y / 100) * height;
        const cw = (c.width / 100) * width;
        const ch = (c.height / 100) * height;
        const start = at(c.appearAt);
        const cardIn = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 140 } });
        const pad = 30 * s;
        const plotTop = 80 * s;
        const plotW = cw - pad * 2;
        const plotH = ch - plotTop - pad;
        return (
          <div
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              width: cw,
              height: ch,
              background: '#FFFFFF',
              border: `${4 * s}px solid ${INK}`,
              borderRadius: 16 * s,
              boxShadow: `${8 * s}px ${8 * s}px 0 ${INK}`,
              transform: `scale(${cardIn})`,
              opacity: Math.min(cardIn * 1.5, 1),
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: pad,
                right: pad,
                top: 22 * s,
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: SERIF,
                fontWeight: 800,
                fontSize: 26 * s,
                color: INK,
              }}
            >
              {c.lines.map((l, k) => (
                <span key={k}>{l.label}</span>
              ))}
            </div>
            <svg width={cw} height={ch} style={{ position: 'absolute', left: 0, top: 0 }}>
              {c.lines.map((l, k) => {
                // Lines take turns across the card, like a "this goes up while that goes down" chart.
                const n = c.lines.length;
                const segW = plotW / n;
                const pts = trendPoints(l.trend).map(([px, py]) => [
                  pad + k * segW + px * (segW - 14 * s) + 7 * s,
                  plotTop + (1 - py) * plotH,
                ]);
                const d = pts.map(([x, y], j) => `${j ? 'L' : 'M'}${x} ${y}`).join('');
                const draw = interpolate(frame, [start + 10 + k * 14, start + 34 + k * 14], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.inOut(Easing.cubic),
                });
                return (
                  <path
                    key={k}
                    d={d}
                    fill="none"
                    stroke={l.color}
                    strokeWidth={9 * s}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={1 - draw}
                  />
                );
              })}
            </svg>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
