import React, { useId } from 'react';
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadBarlowCond } from '@remotion/google-fonts/BarlowCondensed';

// -----------------------------------------------------------
// RGB TEXT  (colour-light title effects)
// One engine, ten effects, each built from "echoes": copies of the
// text drawn where it was a few frames ago, tinted with light
// colours and added together (screen blend) — that is what makes the
// rainbow smears, RGB splits, tunnels and heat trails.
// Timings measured frame by frame from the reference study.
// -----------------------------------------------------------

const MONT = loadMontserrat('normal', { weights: ['800', '900'], subsets: ['latin'] }).fontFamily;
const MONT_I = loadMontserrat('italic', { weights: ['800', '900'], subsets: ['latin'] }).fontFamily;
const COND = loadBarlowCond('normal', { weights: ['800'], subsets: ['latin'] }).fontFamily;

export const RGB_EFFECTS = [
  'Wave ribbon',
  'RGB rise',
  'Zoom split',
  'Chromatic focus',
  'Echo tunnel',
  'Bloom focus',
  'Light streaks',
  'Datamosh',
  'Slit-scan',
  'Rainbow trail',
] as const;
export type RgbEffect = (typeof RGB_EFFECTS)[number];

export const rgbTextSchema = z.object({
  lines: z.array(z.string()).min(1).max(3),
  effect: z.enum(RGB_EFFECTS),
  size: z.number().min(30).max(400).step(1),
  textColor: zColor(),
  backgroundColor: zColor(),
  rings: z.boolean().describe('Faint circle pattern in the background'),
  intensity: z.number().min(0).max(2).step(0.05).describe('Strength of smears / splits / streaks'),
  speed: z.number().min(0.5).max(2).step(0.05),
  delay: z.number().min(0).max(5).step(0.05),
  seconds: z.number().min(1).max(20).step(0.1),
  seed: z.number().int().min(0).max(999),
});
export type RgbTextProps = z.infer<typeof rgbTextSchema>;

export const rgbTextDefaults: RgbTextProps = {
  lines: ['FRESH IDEAS'],
  effect: 'Wave ribbon',
  size: 120,
  textColor: '#ffffff',
  backgroundColor: '#050505',
  rings: true,
  intensity: 1,
  speed: 1,
  delay: 0.05,
  seconds: 2.6,
  seed: 1,
};

// ---------- helpers ----------
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const cubicOut = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);
const RAINBOW = ['#ff2d2d', '#ff8a00', '#ffe600', '#36ff5c', '#00e1ff', '#2d5bff', '#b03dff'];
const FLICKER = ['#ffffff', '#ffe600', '#ff2040', '#2340ff', '#20f0ff', '#ff30d0'];
/** colour of a trail by age 0 (new) → 1 (old): red → magenta → blue → green → yellow */
const heat = (a: number) => {
  const stops = ['#ff1a1a', '#e01ab0', '#3a3dff', '#2be35a', '#ffe11a', '#ff8a1a'];
  return stops[Math.min(stops.length - 1, Math.floor(a * stops.length))];
};

type Ctx = {
  frame: number;
  fps: number;
  W: number;
  H: number;
  p: RgbTextProps;
  k: number; // timing scale (1/speed)
  d: number; // delay frames
  total: number;
};

const baseText = (p: RgbTextProps, family = MONT, weight = 900): React.CSSProperties => ({
  fontFamily: family,
  fontWeight: weight,
  fontSize: p.size,
  lineHeight: 1,
  whiteSpace: 'pre',
  color: p.textColor,
});

/** A letter anchor: keeps layout, draws any number of absolutely-placed copies. */
const Anchor: React.FC<{ ch: string; style: React.CSSProperties; children: React.ReactNode }> = ({ ch, style, children }) => (
  <span style={{ position: 'relative', display: 'inline-block', ...style }}>
    <span style={{ visibility: 'hidden' }}>{ch}</span>
    {children}
  </span>
);
const Copy: React.FC<{ ch: string; style: React.CSSProperties }> = ({ ch, style }) => (
  <span style={{ position: 'absolute', left: 0, top: 0, ...style }}>{ch}</span>
);

// =============================================================
// 1. WAVE RIBBON — letters fly in along a flattening wave, dragging rainbow echoes
// =============================================================
const WaveRibbon: React.FC<{ c: Ctx; line: string; li: number }> = ({ c, line, li }) => {
  const { p, k, d } = c;
  const state = (fr: number, i: number) => {
    const local = fr - d - (i * 1.3 + li * 4) * k;
    const q = expoOut(lin(local, 0, 14 * k));
    const flat = expoOut(lin(local, 0, 22 * k));
    return {
      on: local >= 0,
      x: -(1 - q) * c.W * 0.22 * p.intensity,
      y: Math.sin(i * 0.9 + fr * 0.25) * p.size * 0.45 * (1 - flat) * p.intensity,
    };
  };
  return (
    <div style={{ display: 'flex', ...baseText(p) }}>
      {Array.from(line).map((ch, i) => {
        const now = state(c.frame, i);
        return (
          <Anchor key={i} ch={ch} style={{}}>
            {/* many close echoes (every 0.45 frame) read as one continuous rainbow smear */}
            {Array.from({ length: 22 }, (_, e) => 21 - e).map((e) => {
              const s = state(c.frame - e * 0.45 * k, i);
              if (!s.on) return null;
              if (e > 0 && Math.abs(s.x - now.x) + Math.abs(s.y - now.y) < 0.6) return null;
              return (
                <Copy
                  key={e}
                  ch={ch}
                  style={{
                    transform: `translate(${s.x}px, ${s.y}px)`,
                    color: e === 0 ? p.textColor : RAINBOW[Math.floor(e / 3 + i) % RAINBOW.length],
                    opacity: e === 0 ? 1 : 0.85 * (1 - e / 24),
                    mixBlendMode: 'screen',
                    filter: e > 0 ? 'blur(3px)' : undefined,
                  }}
                />
              );
            })}
          </Anchor>
        );
      })}
    </div>
  );
};

// =============================================================
// 2. RGB RISE — letters shoot up, leaving red/green/blue vertical smears
// =============================================================
const RgbRise: React.FC<{ c: Ctx; line: string; li: number }> = ({ c, line, li }) => {
  const { p, k, d } = c;
  const state = (fr: number, i: number) => {
    const local = fr - d - (i * 1.4 + li * 5) * k;
    return { on: local >= 0, y: (1 - expoOut(lin(local, 0, 16 * k))) * c.H * 0.35 * p.intensity };
  };
  return (
    <div style={{ display: 'flex', ...baseText(p) }}>
      {Array.from(line).map((ch, i) => {
        const now = state(c.frame, i);
        return (
          <Anchor key={i} ch={ch} style={{}}>
            {/* dense echoes → continuous vertical smear: red near the letter, then green, then blue */}
            {Array.from({ length: 44 }, (_, e) => 43 - e).map((e) => {
              const s = state(c.frame - e * 0.25 * k, i);
              if (!s.on) return null;
              if (e > 0 && Math.abs(s.y - now.y) < 0.6) return null;
              const col = e === 0 ? p.textColor : e <= 15 ? '#ff2020' : e <= 30 ? '#20ff40' : '#2050ff';
              return (
                <Copy
                  key={e}
                  ch={ch}
                  style={{ transform: `translateY(${s.y}px)`, color: col, mixBlendMode: 'screen', opacity: e === 0 ? 1 : 0.8, filter: e > 0 ? 'blur(1.5px)' : undefined }}
                />
              );
            })}
          </Anchor>
        );
      })}
    </div>
  );
};

// =============================================================
// 3. ZOOM SPLIT — slanted lines zoom in from huge with a heavy RGB split
// =============================================================
const ZoomSplit: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(-5deg) skewX(-10deg)' }}>
      {p.lines.map((line, i) => {
        const local = c.frame - d - i * 2 * k;
        const q = expoOut(lin(local, 0, 16 * k));
        const dir = i % 2 === 0 ? -1 : 1;
        const split = ((1 - q) * 0.14 * p.intensity + 0.012) * p.size;
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              opacity: local < 0 ? 0 : 1,
              transform: `translateX(${dir * (1 - q) * c.W * 0.25}px) scale(${1 + (1 - q) * 2.5})`,
              filter: `blur(${(1 - q) * 10}px)`,
              ...baseText(p),
              marginTop: i === 0 ? 0 : -p.size * 0.12,
            }}
          >
            <span style={{ visibility: 'hidden' }}>{line}</span>
            {(['#ff2020', '#20ff40', '#2050ff'] as const).map((col, ci) => (
              <span key={col} style={{ position: 'absolute', left: 0, top: 0, color: col, mixBlendMode: 'screen', transform: `translateX(${(ci - 1) * split}px)` }}>
                {line}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================
// 4. CHROMATIC FOCUS — blurred & stretched → sharp, RGB split narrows, then widens out
// =============================================================
const ChromaticFocus: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  const id = `cf${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const local = c.frame - d;
  const q = cubicOut(lin(local, 0, 24 * k));
  const out = lin(c.frame, c.total - 16 * k, c.total);
  const blurX = (1 - q) * 18 + out * 16;
  const split = ((1 - q) * 0.08 + 0.03 + out * 0.14) * p.size * p.intensity;
  const scale = 1 + lin(local, 0, c.total) * 0.05;
  return (
    <div style={{ position: 'relative', opacity: lin(local, 0, 10 * k), transform: `scale(${scale * (1.25 - 0.25 * q)}, ${scale}) skewX(-8deg)`, filter: blurX > 0.3 ? `url(#${id})` : undefined }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={`${blurX} ${blurX * 0.15}`} />
        </filter>
      </svg>
      {p.lines.map((line, i) => (
        <div key={i} style={{ position: 'relative', ...baseText(p, COND, 800), fontSize: p.size * 1.25, letterSpacing: '0.01em' }}>
          <span style={{ visibility: 'hidden' }}>{line}</span>
          {(['#ff2020', '#20ff40', '#2050ff'] as const).map((col, ci) => (
            <span key={col} style={{ position: 'absolute', left: 0, top: 0, color: col, mixBlendMode: 'screen', transform: `translateX(${(ci - 1) * split}px)` }}>
              {line}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

// =============================================================
// 5. ECHO TUNNEL — flies out of a vanishing point on the right as a cone
//    of outline echoes; later a second burst fills it solid with a glow
// =============================================================
const EchoTunnel: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  const VX = c.W * 0.42;
  const fillAt = d + 52 * k;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {p.lines.map((line, i) => {
        const state = (fr: number) => {
          const local = fr - d - i * 12 * k;
          const q = expoOut(lin(local, 0, 26 * k));
          return { on: local >= 0, x: (1 - q) * VX, y: (1 - q) * (i - 0.5) * -p.size * 0.6, s: 0.04 + 0.96 * q };
        };
        const fillLocal = c.frame - fillAt - i * 6 * k;
        const fill = cubicOut(lin(fillLocal, 4 * k, 14 * k));
        const burst = Math.sin(Math.PI * lin(fillLocal, 0, 16 * k)) * p.intensity;
        // the last line is drawn solid from the start (like the reference's two-line version)
        const solidLine = p.lines.length > 1 && i === p.lines.length - 1;
        const f = solidLine ? 1 : fill;
        const textStyle: React.CSSProperties = { ...baseText(p, MONT_I, 900), fontStyle: 'italic' };
        return (
          <div key={i} style={{ position: 'relative', ...textStyle, marginTop: i === 0 ? 0 : -p.size * 0.08 }}>
            <span style={{ visibility: 'hidden' }}>{line}</span>
            {Array.from({ length: 24 }, (_, e) => 23 - e).map((e) => {
              const s = state(c.frame - e * 1.1 * k);
              if (!s.on) return null;
              const now = state(c.frame);
              const settled = Math.abs(s.x - now.x) < 0.5;
              // fill burst: echoes fan back toward the vanishing point and return
              const bx = burst > 0.01 && e > 0 ? (e / 23) * burst * VX * 0.35 : 0;
              if (e > 0 && settled && bx === 0) return null;
              const isNow = e === 0;
              return (
                <span
                  key={e}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: `translate(${s.x + bx}px, ${s.y}px) scale(${s.s})`,
                    transformOrigin: '100% 50%',
                    color: isNow ? `rgba(255,255,255,${f})` : 'transparent',
                    WebkitTextStroke: `${isNow ? 2.5 : 2}px ${isNow ? p.textColor : e % 3 === 0 ? '#ffffff' : RAINBOW[(e * 2) % RAINBOW.length]}`,
                    opacity: isNow ? 1 : 1 - e / 30,
                    mixBlendMode: 'screen',
                    textShadow: isNow && f > 0.5 ? `0 0 ${18 * f}px rgba(255,255,255,0.55)` : undefined,
                  }}
                >
                  {line}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================
// 6. BLOOM FOCUS — grows from a dot, warm defocus (blue rim, orange core) → white + halo
// =============================================================
const BloomFocus: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  const local = c.frame - d;
  const s = cubicOut(lin(local, 0, 30 * k));
  const sharp = cubicOut(lin(local, 6 * k, 44 * k));
  const t: React.CSSProperties = { ...baseText(p, MONT, 800), letterSpacing: '-0.02em' };
  return (
    <div style={{ position: 'relative', transform: `scale(${0.03 + 0.97 * s})`, opacity: lin(local, 0, 4 * k) }}>
      {p.lines.map((line, i) => (
        <div key={i} style={{ position: 'relative', ...t }}>
          <span style={{ position: 'absolute', inset: 0, color: '#3a6cff', filter: `blur(${30 * (1 - sharp) + 4}px)`, opacity: 0.9 * (1 - sharp) + 0.05 }}>{line}</span>
          <span style={{ position: 'absolute', inset: 0, color: '#ff8a1a', filter: `blur(${18 * (1 - sharp) + 7}px)`, opacity: 0.95 - 0.3 * sharp }}>{line}</span>
          <span style={{ position: 'relative', color: sharp > 0.6 ? p.textColor : '#ffd28a', filter: `blur(${16 * (1 - sharp)}px)` }}>{line}</span>
        </div>
      ))}
    </div>
  );
};

// =============================================================
// 7. LIGHT STREAKS — flickering colour bands shoot out of the word,
//    letters reveal from the centre, streaks thin and retract
// =============================================================
const LightStreaks: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  const local = c.frame - d;
  const tilt = -6 * (1 - inOut(lin(local, 0, 44 * k))) * p.intensity;
  const thick = interpolate(local, [0, 10 * k, 44 * k], [0.55, 0.09, 0.05], clamp) * p.size * p.intensity;
  const reach = 1 - cubicOut(lin(local, 22 * k, 46 * k)); // streak length 1 → 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `rotate(${tilt}deg)` }}>
      {p.lines.map((line, li) => {
        const chars = Array.from(line);
        const mid = (chars.length - 1) / 2;
        const shown = chars.map((_, i) => local - li * 4 * k >= Math.abs(i - mid) * 2 * k);
        const first = shown.indexOf(true);
        const last = shown.lastIndexOf(true);
        return (
          <div key={li} style={{ display: 'flex', ...baseText(p), marginTop: li === 0 ? 0 : -p.size * 0.05 }}>
            {chars.map((ch, i) => {
              const bar = (side: -1 | 1) => {
                if (reach <= 0.001) return null;
                const col = FLICKER[(c.frame + (side > 0 ? 3 : 0) + li) % FLICKER.length];
                const col2 = FLICKER[(c.frame + (side > 0 ? 1 : 4) + li) % FLICKER.length];
                const len = c.W * 0.9 * reach;
                const common: React.CSSProperties = { position: 'absolute', [side < 0 ? 'right' : 'left']: '100%', width: len, borderRadius: thick };
                return (
                  <>
                    <span style={{ ...common, top: `calc(50% - ${thick / 2}px)`, height: thick, background: col, boxShadow: `0 0 12px ${col}` }} />
                    {thick < p.size * 0.2 ? (
                      <span style={{ ...common, top: `calc(50% + ${thick * 1.6}px)`, height: Math.max(2, thick * 0.6), background: col2, width: len * 0.8 }} />
                    ) : null}
                  </>
                );
              };
              return (
                <span key={i} style={{ position: 'relative', display: 'inline-block', opacity: shown[i] ? 1 : 0, whiteSpace: 'pre' }}>
                  {ch}
                  {i === first ? bar(-1) : null}
                  {i === last ? bar(1) : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================
// 8. DATAMOSH — text torn into displaced blue/cyan blocks that settle clean
// =============================================================
const Datamosh: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const local = c.frame - d;
  const q = cubicOut(lin(local, 0, 26 * k));
  const scale = (1 - q) * 140 * p.intensity;
  const step = Math.floor(c.frame / 2);
  const cols = ['#2050ff', '#20f0ff', '#ff2a3a'];
  return (
    <div style={{ position: 'relative', transform: `rotate(${-8 * (1 - q)}deg)`, opacity: lin(local, 0, 3 * k) }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        {cols.map((_, ci) => (
          <filter key={ci} id={`dm${uid}${ci}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.06" numOctaves={1} seed={step * 3 + ci} result="n" />
            <feComponentTransfer in="n" result="b">
              <feFuncR type="discrete" tableValues="0 0.2 0.45 0.55 0.8 1" />
              <feFuncG type="discrete" tableValues="0.3 0.5 0.7" />
            </feComponentTransfer>
            <feDisplacementMap in="SourceGraphic" in2="b" scale={scale * (1 + ci * 0.25)} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </svg>
      {p.lines.map((line, i) => (
        <div key={i} style={{ position: 'relative', ...baseText(p, MONT, 800), letterSpacing: '-0.01em' }}>
          <span style={{ visibility: 'hidden' }}>{line}</span>
          {cols.map((col, ci) => (
            <span
              key={col}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: q > 0.97 ? '#ffffff' : col,
                mixBlendMode: 'screen',
                filter: scale > 0.5 ? `url(#dm${uid}${ci})` : undefined,
                opacity: ci === 2 ? lin(local, 6 * k, 18 * k) : 1,
                transform: `translateX(${(ci - 1) * (0.01 + (1 - q) * 0.03) * p.size}px)`,
              }}
            >
              {line}
            </span>
          ))}
          <span style={{ position: 'absolute', inset: 0, color: 'transparent', textShadow: `0 0 ${24 * q}px rgba(255,255,255,${0.35 * q})` }}>{line}</span>
        </div>
      ))}
    </div>
  );
};

// =============================================================
// 9. SLIT-SCAN — the word slides down then up, leaving a solid rainbow heat trail
// =============================================================
const SlitScan: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  const yAt = (fr: number) => {
    const local = fr - d;
    const a = inOut(lin(local, 0, 22 * k));
    const b = inOut(lin(local, 22 * k, 50 * k));
    return (a * 0.26 - b * 0.46) * c.H * p.intensity;
  };
  const collapse = lin(c.frame, c.total - 12 * k, c.total);
  const N = Math.round(34 * (1 - collapse));
  return (
    <div style={{ position: 'relative', ...baseText(p, MONT, 900) }}>
      <span style={{ visibility: 'hidden' }}>{p.lines.join(' ')}</span>
      {Array.from({ length: N + 1 }, (_, e) => N - e).map((e) => {
        if (c.frame - e * k - d < 0) return null;
        return (
          <span key={e} style={{ position: 'absolute', left: 0, top: 0, transform: `translateY(${yAt(c.frame - e * k)}px)`, color: e === 0 ? p.textColor : heat(e / (N + 1)) }}>
            {p.lines.join(' ')}
          </span>
        );
      })}
    </div>
  );
};

// =============================================================
// 10. RAINBOW TRAIL — small text zig-zags around, painting rainbow ribbons
// =============================================================
const RainbowTrail: React.FC<{ c: Ctx }> = ({ c }) => {
  const { p, k, d } = c;
  const paths = [
    [
      [-0.05, -0.3],
      [0.06, 0.05],
      [-0.22, 0.28],
      [0.2, 0.3],
    ],
    [
      [0.25, -0.35],
      [0.18, 0.1],
      [-0.25, -0.05],
      [-0.2, -0.3],
    ],
  ];
  const posAt = (fr: number, path: number[][], start: number) => {
    const local = (fr - d - start) / k;
    const seg = 22;
    const i = Math.min(path.length - 2, Math.max(0, Math.floor(local / seg)));
    const t = inOut(Math.min(1, Math.max(0, (local - i * seg) / seg)));
    return { on: local >= 0, x: (path[i][0] + (path[i + 1][0] - path[i][0]) * t) * c.W, y: (path[i][1] + (path[i + 1][1] - path[i][1]) * t) * c.H };
  };
  const t: React.CSSProperties = { ...baseText(p, MONT, 900), fontSize: p.size * 0.38, position: 'absolute', left: 0, top: 0, transform: 'translate(-50%, -50%)' };
  return (
    <div style={{ position: 'relative', width: 0, height: 0 }}>
      {paths.map((path, pi) =>
        Array.from({ length: 37 }, (_, e) => 36 - e).map((e) => {
          const s = posAt(c.frame - e * 0.8 * k, path, pi * 20 * k);
          if (!s.on) return null;
          return (
            <div key={`${pi}-${e}`} style={{ position: 'absolute', left: s.x, top: s.y }}>
              <span style={{ ...t, color: e === 0 ? p.textColor : heat(e / 37), opacity: e === 0 ? 1 : 0.95 }}>{p.lines[0]}</span>
            </div>
          );
        }),
      )}
    </div>
  );
};

// =============================================================
// main
// =============================================================
export const RgbText: React.FC<Partial<RgbTextProps>> = (props) => {
  const p = { ...rgbTextDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const k = 1 / p.speed;
  const c: Ctx = { frame, fps, W, H, p, k, d: p.delay * fps, total: Math.min(durationInFrames, Math.round(p.seconds * fps)) };

  let content: React.ReactNode = null;
  switch (p.effect) {
    case 'Wave ribbon':
    case 'RGB rise': {
      const Comp = p.effect === 'Wave ribbon' ? WaveRibbon : RgbRise;
      content = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {p.lines.map((l, i) => (
            <Comp key={i} c={c} line={l} li={i} />
          ))}
        </div>
      );
      break;
    }
    case 'Zoom split':
      content = <ZoomSplit c={c} />;
      break;
    case 'Chromatic focus':
      content = <ChromaticFocus c={c} />;
      break;
    case 'Echo tunnel':
      content = <EchoTunnel c={c} />;
      break;
    case 'Bloom focus':
      content = <BloomFocus c={c} />;
      break;
    case 'Light streaks':
      content = <LightStreaks c={c} />;
      break;
    case 'Datamosh':
      content = <Datamosh c={c} />;
      break;
    case 'Slit-scan':
      content = <SlitScan c={c} />;
      break;
    case 'Rainbow trail':
      content = <RainbowTrail c={c} />;
      break;
    default:
      break;
  }

  // faint drifting rings, like the reference background
  const ringShift = (random(`r${p.seed}`) - 0.5) * 40 + frame * 0.15;
  return (
    <AbsoluteFill style={{ backgroundColor: p.backgroundColor, overflow: 'hidden' }}>
      {p.rings ? (
        <AbsoluteFill
          style={{
            backgroundImage: 'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.035) 0 1.5px, transparent 1.5px 190px)',
            transform: `scale(${1 + ringShift * 0.0005})`,
          }}
        />
      ) : null}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6))' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>{content}</AbsoluteFill>
    </AbsoluteFill>
  );
};
