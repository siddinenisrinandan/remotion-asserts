import React from 'react';
import { AbsoluteFill, Easing, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBgTrim } from './bgClock';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadManrope } from '@remotion/google-fonts/Manrope';

// -----------------------------------------------------------
// GLASS WORD SELECTOR  (liquid-glass pill that highlights words)
// A list of words and one thick glass pill. The word under the pill
// is big and bright; the others are small and dim. On every step the
// list (or the pill) moves on, the pill stretches like liquid while it
// travels and resizes to fit the next word.
// Timing measured from the reference (60 fps): a move takes ≈0.4 s,
// each word rests ≈0.8–1 s.
// Modes:
//   Scroll vertical   — list slides up, pill stays (optional pointer)
//   Scroll horizontal — list slides sideways, pill stays
//   Tilted            — vertical scroll on a slanted axis
//   Menu jump         — list stays, the pill jumps down the menu
//   Morph blob        — one word at a time inside a chunky glass blob;
//                       two-word items wrap onto two lines
// -----------------------------------------------------------

const FONT = loadManrope('normal', { weights: ['500', '600', '700'], subsets: ['latin'] }).fontFamily;

export const SELECTOR_MODES = ['Scroll vertical', 'Scroll horizontal', 'Tilted', 'Menu jump', 'Morph blob'] as const;

export const glassWordSelectorSchema = z.object({
  mode: z.enum(SELECTOR_MODES),
  words: z.array(z.string()).min(2).max(20),
  pointer: z.boolean().describe('Small play arrow pointing at the pill'),
  fontSize: z.number().min(20).max(200).step(1).describe('Size of the highlighted word'),
  smallScale: z.number().min(0.2).max(1).step(0.01).describe('Size of the other words (×)'),
  holdSeconds: z.number().min(0.2).max(5).step(0.05),
  moveSeconds: z.number().min(0.15).max(2).step(0.05),
  textColor: zColor(),
  backgroundTop: zColor(),
  backgroundBottom: zColor(),
  videoFile: z.string().describe('Optional background video in public/'),
  darken: z.number().min(0).max(0.8).step(0.01).describe('Dark layer over the background'),
  tilt: z.number().min(-30).max(30).step(1).describe('Angle for the Tilted mode'),
  seconds: z.number().min(2).max(30).step(0.1),
});
export type GlassWordSelectorProps = z.infer<typeof glassWordSelectorSchema>;

export const glassWordSelectorDefaults: GlassWordSelectorProps = {
  mode: 'Scroll vertical',
  words: ['IDEA', 'DRAFT', 'DESIGN', 'BUILD', 'TEST', 'LAUNCH', 'GROW'],
  pointer: true,
  fontSize: 130,
  smallScale: 0.55,
  holdSeconds: 0.85,
  moveSeconds: 0.4,
  textColor: '#ffffff',
  backgroundTop: '#2b2b2f',
  backgroundBottom: '#0d0d10',
  videoFile: '',
  darken: 0,
  tilt: -8,
  seconds: 8,
};

const ease = Easing.bezier(0.65, 0, 0.25, 1);

/** Continuous list position: rests on whole numbers, eases between them. */
const positionAt = (frame: number, fps: number, hold: number, move: number, count: number) => {
  const h = hold * fps;
  const m = move * fps;
  const cycle = h + m;
  const k = Math.floor(frame / cycle);
  const inCycle = frame - k * cycle;
  const frac = inCycle < h ? 0 : ease(Math.min(1, (inCycle - h) / m));
  const pos = Math.min(count - 1, k + frac);
  const moving = inCycle >= h && k < count - 1 ? Math.sin(Math.PI * Math.min(1, (inCycle - h) / m)) : 0;
  return { pos, moving };
};

/** Rough text width (Manrope uppercase) for sizing the pill. */
const textWidth = (text: string, size: number) => text.length * size * 0.64;

export const GlassWordSelector: React.FC<Partial<GlassWordSelectorProps>> = (props) => {
  const bgTrim = useBgTrim();
  const p = { ...glassWordSelectorDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const u = Math.min(W, H) / 1080;
  const fs = p.fontSize * u;
  const n = p.words.length;
  const { pos, moving } = positionAt(frame, fps, p.holdSeconds, p.moveSeconds, n);
  const lo = Math.floor(pos);
  const hi = Math.min(n - 1, lo + 1);
  const mix = pos - lo;

  const blob = p.mode === 'Morph blob';
  const horizontal = p.mode === 'Scroll horizontal';
  const menu = p.mode === 'Menu jump';
  const tilted = p.mode === 'Tilted';

  // lines of a word (blob mode wraps two-word items)
  const linesOf = (w: string) => (blob && w.includes(' ') ? w.split(' ') : [w]);
  const sizeOf = (w: string) => {
    const lines = linesOf(w);
    const tw = Math.max(...lines.map((l) => textWidth(l, fs)));
    const th = lines.length * fs * 1.05;
    return { w: tw + fs * (blob ? 1.4 : 1.1), h: th + fs * (blob ? 0.9 : 0.62) };
  };
  const a = sizeOf(p.words[lo]);
  const b = sizeOf(p.words[hi]);
  let pillW = a.w + (b.w - a.w) * mix;
  let pillH = a.h + (b.h - a.h) * mix;
  // liquid stretch while travelling (along the travel direction)
  const stretch = 0.16 * moving;
  if (horizontal) {
    pillW *= 1 + stretch;
    pillH *= 1 - stretch * 0.5;
  } else {
    pillH *= 1 + stretch * 0.6;
    pillW *= 1 - stretch * 0.25;
  }

  // spacing between items in the list
  const spacingV = fs * (blob ? 2.6 : 1.55);
  const spacingH = Math.max(...p.words.map((w) => textWidth(w, fs * p.smallScale))) + fs * 1.4;
  const cx = W / 2;
  const cy = H / 2;
  const menuTop = cy - ((n - 1) / 2) * spacingV * 0.8;

  // where each word sits + how "selected" it is (1 = under the pill)
  const place = (i: number) => {
    const d = i - pos;
    const sel = Math.max(0, 1 - Math.abs(d));
    if (menu) return { x: cx, y: menuTop + i * spacingV * 0.8, sel, d };
    if (horizontal) return { x: cx + d * spacingH, y: cy, sel, d };
    return { x: cx, y: cy + d * spacingV, sel, d };
  };
  const pillY = menu ? menuTop + pos * spacingV * 0.8 : cy;

  const bgStyle: React.CSSProperties = { background: `radial-gradient(ellipse 90% 80% at 50% 30%, ${p.backgroundTop}, ${p.backgroundBottom})` };
  const blurNow = moving * 3;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', ...bgStyle }}>
      {p.videoFile ? <Video src={staticFile(p.videoFile)} trimBefore={bgTrim} objectFit="cover" style={{ width: W, height: H }} muted /> : null}
      {p.darken > 0 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${p.darken})` }} /> : null}
      <AbsoluteFill
        style={{
          transform: tilted ? `rotate(${p.tilt}deg)` : undefined,
          scale: 0.985
        }}
      >
        {/* words */}
        {p.words.map((w, i) => {
          const pl = place(i);
          if (!menu && Math.abs(pl.d) > (blob ? 1.6 : 3.2)) return null;
          const scale = p.smallScale + (1 - p.smallScale) * ease(pl.sel);
          const fade = blob ? Math.max(0, 1 - Math.abs(pl.d) * 0.9) : Math.max(0.25, 1 - Math.abs(pl.d) * 0.22);
          // over video: keep side words readable without darkening the background
          const opacity = (p.videoFile ? 0.85 + 0.15 * pl.sel : 0.55 + 0.45 * pl.sel) * (p.videoFile ? Math.max(0.6, fade) : fade);
          const lines = linesOf(w);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: pl.x,
                top: pl.y,
                transform: `translate(-50%, -50%) scale(${scale}) skewX(${horizontal ? -moving * 8 : 0}deg)`,
                fontFamily: FONT,
                fontWeight: pl.sel > 0.5 ? 600 : 500,
                fontSize: fs,
                lineHeight: 1.05,
                letterSpacing: '0.01em',
                color: p.textColor,
                opacity,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                filter: blurNow > 0.2 && pl.sel < 0.95 ? `blur(${blurNow}px)` : undefined,
                WebkitTextStroke: p.videoFile ? `${Math.max(1, fs * 0.012)}px rgba(15,18,28,0.55)` : undefined,
                paintOrder: 'stroke fill',
                textShadow: p.videoFile ? '0 2px 12px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.4)' : pl.sel > 0.5 ? '0 2px 14px rgba(0,0,0,0.35)' : undefined,
              }}
            >
              {lines.map((l, li) => (
                <div key={li}>{l}</div>
              ))}
            </div>
          );
        })}

        {/* the glass pill */}
        <div
          style={{
            position: 'absolute',
            left: cx - pillW / 2,
            top: pillY - pillH / 2,
            width: pillW,
            height: pillH,
            borderRadius: blob ? Math.min(pillH, pillW) * 0.38 : pillH / 2,
            backdropFilter: 'blur(1.5px) saturate(1.4) brightness(1.08)',
            background: `linear-gradient(rgba(10,12,22,${p.videoFile ? 0.28 : 0}), rgba(10,12,22,${p.videoFile ? 0.28 : 0})), linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.1))`,
            boxShadow: [
              `inset 0 0 0 ${2.5 * u}px rgba(255,255,255,0.7)`,
              `inset 0 ${10 * u}px ${18 * u}px rgba(255,255,255,0.35)`,
              `inset 0 -${12 * u}px ${20 * u}px rgba(0,0,0,0.25)`,
              `inset ${8 * u}px 0 ${16 * u}px rgba(255,255,255,0.12)`,
              `0 ${16 * u}px ${36 * u}px rgba(0,0,0,0.35)`,
            ].join(', '),
          }}
        >
          {/* specular streak */}
          <div
            style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              top: '8%',
              height: '22%',
              borderRadius: 999,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))',
            }}
          />
        </div>

        {/* pointer arrow */}
        {p.pointer ? (
          <svg
            width={fs * 0.5}
            height={fs * 0.6}
            viewBox="0 0 10 12"
            style={{ position: 'absolute', left: cx - pillW / 2 - fs * 0.85, top: pillY - fs * 0.3, overflow: 'visible' }}
          >
            <path d="M1 1 L9 6 L1 11 Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.75)" strokeWidth={0.9} strokeLinejoin="round" />
          </svg>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// presets (own words)
// -----------------------------------------------------------
const S = (props: Partial<GlassWordSelectorProps>): GlassWordSelectorProps => ({ ...glassWordSelectorDefaults, ...props });

export const WORD_SELECTOR_PRESETS: { id: string; vertical: boolean; props: GlassWordSelectorProps }[] = [
  { id: 'GlassWords-01-Vertical-List', vertical: false, props: S({}) },
  {
    id: 'GlassWords-02-Morph-Blob',
    vertical: false,
    props: S({ mode: 'Morph blob', words: ['BIG IDEA', 'NEXT STEP', 'CREATIVE', 'OUR PLAN', 'THE GOAL'], pointer: false, fontSize: 140, backgroundTop: '#5a6fd6', backgroundBottom: '#1a2470', holdSeconds: 1 }),
  },
  {
    id: 'GlassWords-03-Tilted',
    vertical: false,
    props: S({ mode: 'Tilted', words: ['SMART START', 'CORE VALUE', 'GOOD FIT', 'PREMIUM', 'TIMELESS', 'TOMORROW'], fontSize: 125, backgroundTop: '#e2a64a', backgroundBottom: '#8a5410' }),
  },
  {
    id: 'GlassWords-04-Horizontal',
    vertical: false,
    props: S({ mode: 'Scroll horizontal', words: ['PLAN', 'SKETCH', 'CREATE', 'POLISH', 'SHARE', 'REPEAT'], pointer: false, fontSize: 92, smallScale: 0.6, backgroundTop: '#5b4ff0', backgroundBottom: '#1f1680' }),
  },
  {
    id: 'GlassWords-05-Menu-Jump',
    vertical: false,
    props: S({ mode: 'Menu jump', words: ['OVERVIEW', 'STRUCTURE', 'STAGE', 'STATUS', 'MARK', 'CONTROL'], pointer: false, fontSize: 70, smallScale: 0.62, backgroundTop: '#d23a7a', backgroundBottom: '#5a0a2c' }),
  },
];
