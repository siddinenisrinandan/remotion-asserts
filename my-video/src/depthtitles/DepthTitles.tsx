import React from 'react';
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadBarlow } from '@remotion/google-fonts/Barlow';
import { loadFont as loadBarlowSemi } from '@remotion/google-fonts/BarlowSemiCondensed';
import { PaperTexture } from '../editstyles/PaperTexture';

// -----------------------------------------------------------
// DEPTH TITLES  (stacked "thick cut-out" typography)
// Lines step exactly one cap-height apart so they touch. Each line
// has a small grey extrusion edge (lower right) and throws a soft
// shadow onto the line below → layered 3D look.
// Every title = an ENTER animation + a slow pull-back hold + an EXIT
// animation, all timed frame by frame from the reference study.
// Mark a word with [brackets] for the accent colour.
// -----------------------------------------------------------

const BARLOW = loadBarlow('normal', { weights: ['300', '700', '800'], subsets: ['latin'] }).fontFamily;
const BARLOW_SEMI = loadBarlowSemi('normal', { weights: ['300', '800'], subsets: ['latin'] }).fontFamily;
const FONTS = { Barlow: BARLOW, 'Barlow Semi Condensed': BARLOW_SEMI } as const;

export const ENTERS = [
  'Whip build',
  'Spring drop',
  'Letter glow & pop',
  'Word zoom build',
  'RGB slide',
  'Stack fade up',
  'Letter pop tilt',
  'Diagonal sweep',
  'Tilted fade build',
  'Word pop scatter',
  'Mixed reveal',
] as const;
export const EXITS = [
  'Slide out right',
  'Anticipate & slide right',
  'Fall apart',
  'Split vertical',
  'Drop out',
  'RGB slide out',
  'Fade down',
  'Fly up',
  'Word pop out',
  'Spread & drop',
] as const;
export type Enter = (typeof ENTERS)[number];
export type Exit = (typeof EXITS)[number];

export const depthTitlesSchema = z.object({
  lines: z
    .array(
      z.object({
        text: z.string().describe('Line text ([word] = accent colour)'),
        weight: z.enum(['Bold', 'Light']),
        size: z.number().min(0.3).max(3).step(0.05).describe('1 = base size'),
      }),
    )
    .min(1)
    .max(7),
  enter: z.enum(ENTERS),
  exit: z.enum(EXITS),
  align: z.enum(['left', 'center', 'right']),
  font: z.enum(['Barlow', 'Barlow Semi Condensed']),
  baseSize: z.number().min(40).max(400).step(1),
  overlap: z.number().min(0).max(0.5).step(0.01).describe('How much each line tucks under the one above'),
  depth: z.number().min(0).max(2).step(0.05).describe('Shadow each line throws onto the next'),
  extrude: z.number().min(0).max(2).step(0.05).describe('Grey 3D edge on the letters'),
  textColor: zColor(),
  lightColor: zColor().describe('Colour of Light-weight lines'),
  accentColor: zColor(),
  backgroundColor: zColor(),
  grain: z.boolean().describe('Film grain, specks and vignette'),
  pullBack: z.number().min(0).max(0.2).step(0.01).describe('Slow camera pull-back while the title holds'),
  speed: z.number().min(0.5).max(2).step(0.05).describe('Animation speed (1 = like the reference)'),
  delay: z.number().min(0).max(5).step(0.05),
  seconds: z.number().min(1).max(20).step(0.1),
  seed: z.number().int().min(0).max(999).describe('Changes the scrambled word order / tumbles'),
});
export type DepthTitlesProps = z.infer<typeof depthTitlesSchema>;

export const depthTitlesDefaults: DepthTitlesProps = {
  lines: [
    { text: 'START', weight: 'Bold', size: 1 },
    { text: 'BEFORE', weight: 'Bold', size: 1 },
    { text: "YOU'RE READY", weight: 'Bold', size: 1 },
  ],
  enter: 'Whip build',
  exit: 'Slide out right',
  align: 'center',
  font: 'Barlow',
  baseSize: 220,
  overlap: 0.3,
  depth: 1,
  extrude: 1,
  textColor: '#ffffff',
  lightColor: '#e6e6e6',
  accentColor: '#ff3b30',
  backgroundColor: '#050505',
  grain: true,
  pullBack: 0.05,
  speed: 1,
  delay: 0.1,
  seconds: 3.6,
  seed: 1,
};

// -----------------------------------------------------------
// helpers
// -----------------------------------------------------------
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const cubicIn = Easing.in(Easing.cubic);
const cubicOut = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);
/** grey first frame, then up to white — how words "light up" in the reference */
const greyIn = (local: number, len = 4) => interpolate(local, [0, 0.01, 1, len], [0, 0.0, 0.35, 1], clamp);

type Word = { text: string; accent: boolean; light: boolean; line: number; index: number; gIndex: number };

/** split lines into words, tracking [accent] marks across spaces */
const parse = (lines: DepthTitlesProps['lines']) => {
  let g = 0;
  let accent = false;
  return lines.map((l, li) => {
    const words: Word[] = [];
    l.text
      .split(' ')
      .filter(Boolean)
      .forEach((raw, wi) => {
        let t = raw;
        let a = accent;
        if (t.startsWith('[')) {
          a = true;
          accent = true;
          t = t.slice(1);
        }
        if (t.endsWith(']')) {
          accent = false;
          t = t.slice(0, -1);
        }
        words.push({ text: t, accent: a, light: l.weight === 'Light', line: li, index: wi, gIndex: g++ });
      });
    return words;
  });
};

/** deterministic shuffle → rank of every word */
const scrambleRanks = (count: number, seed: number) => {
  const ids = Array.from({ length: count }, (_, i) => i);
  ids.sort((a, b) => random(`s${seed}-${a}`) - random(`s${seed}-${b}`));
  const rank: number[] = [];
  ids.forEach((id, r) => (rank[id] = r));
  return rank;
};

/** frames the exit needs (so it can finish exactly at the end) */
const exitFrames = (exit: Exit, nLines: number, nWords: number) => {
  switch (exit) {
    case 'Slide out right':
      return (nLines - 1) * 2.5 + 10;
    case 'Anticipate & slide right':
      return (nLines - 1) * 3 + 14;
    case 'Fall apart':
      return 5 + (nLines - 1) * 3 + 16;
    case 'Split vertical':
      return 16;
    case 'Drop out':
      return (nLines - 1) * 3 + 12;
    case 'RGB slide out':
      return (nWords - 1) * 2.2 + 10;
    case 'Fade down':
      return (nLines - 1) * 3 + 6;
    case 'Fly up':
      return 4 + (nLines - 1) * 3 + 11;
    case 'Word pop out':
      return (nWords - 1) * 1.8 + 5;
    case 'Spread & drop':
      return 7 + (nLines - 1) * 2.5 + 10;
    default:
      return 12;
  }
};

// -----------------------------------------------------------
// component
// -----------------------------------------------------------
export const DepthTitles: React.FC<Partial<DepthTitlesProps>> = (props) => {
  const p = { ...depthTitlesDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const k = 1 / p.speed; // frame-scale for all timings
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const lines = parse(p.lines);
  const n = lines.length;
  const allWords = lines.flat();
  const nWords = allWords.length;
  const rank = scrambleRanks(nWords, p.seed);
  const d = p.delay * fps;
  const f = frame - d; // frames since the title started entering

  const exitLen = exitFrames(p.exit, n, nWords) * k;
  const exitStart = total - exitLen - 2;
  const e = frame - exitStart; // frames since exit started (negative before)

  // ---------- block (camera) ----------
  let blockScale = 1 - p.pullBack * lin(frame, d, exitStart); // slow pull-back while it lives
  let blockRotate = 0;
  let blockY = 0;
  if (p.enter === 'Word zoom build') {
    // tiny → overshoot big → settle
    const a = interpolate(f, [0, 6 * k], [0.06, 1.38], { ...clamp, easing: cubicOut });
    const b = interpolate(f, [6 * k, 15 * k], [1.38, 1], { ...clamp, easing: inOut });
    blockScale *= f < 6 * k ? a : b;
  }
  if (p.enter === 'Letter pop tilt') {
    blockRotate = -4 * (1 - inOut(lin(f, 4 * k, 26 * k)));
    blockScale *= 1.04 - 0.04 * inOut(lin(f, 0, 26 * k));
  }
  if (p.enter === 'Diagonal sweep') {
    blockRotate = -10 * (1 - inOut(lin(f, (n * 3 + 4) * k, (n * 3 + 15) * k)));
  }
  if (p.enter === 'Tilted fade build') {
    blockRotate = -4 * (1 - inOut(lin(f, 0, 32 * k)));
    blockScale *= 1.06 - 0.06 * inOut(lin(f, 0, 32 * k));
  }

  // line pitch in px (used for re-centring / spreading)
  const step = p.baseSize * (1 - p.overlap);
  if (p.enter === 'Stack fade up') {
    // stack grows upward from the bottom; block drifts to stay roughly centred
    const shown = lines.reduce((s, _, i) => s + lin(f, (n - 1 - i) * 3 * k, ((n - 1 - i) * 3 + 4) * k), 0);
    blockY = -(n - shown) * step * 0.2;
  }

  const fontFamily = FONTS[p.font];
  const ex = p.extrude;
  const extrusion = (base: string) =>
    ex > 0
      ? [1, 2, 3, 4]
          .map((i) => `${(i * 0.006 * ex).toFixed(4)}em ${(i * 0.006 * ex).toFixed(4)}em 0 color-mix(in srgb, ${base} ${78 - i * 7}%, #000)`)
          .join(', ')
      : undefined;
  const castShadow =
    p.depth > 0
      ? `drop-shadow(0 ${0.075 * p.depth}em ${0.08 * p.depth}em rgba(0,0,0,${Math.min(1, 0.92 * p.depth)})) drop-shadow(0 ${0.02 * p.depth}em ${0.02 * p.depth}em rgba(0,0,0,${Math.min(1, 0.7 * p.depth)}))`
      : undefined;

  // ---------- per-line transform ----------
  const lineStyle = (i: number): React.CSSProperties => {
    let x = 0;
    let y = 0;
    let rot = 0;
    let opacity = 1;
    const r = n - 1 - i; // rank from bottom

    // ENTER
    switch (p.enter) {
      case 'Whip build': {
        const local = f - i * 3.5 * k;
        const q = expoOut(lin(local, 0, 7 * k));
        const dir = i % 3; // left, bottom, right
        if (local < 0) opacity = 0;
        if (dir === 0) x = -(1 - q) * W * 0.75;
        if (dir === 1) y = (1 - q) * H * 0.45;
        if (dir === 2) x = (1 - q) * W * 0.75;
        break;
      }
      case 'Spring drop': {
        if (i === n - 1) {
          const q = expoOut(lin(f, 0, 9 * k));
          y = (1 - q) * H * 0.55;
          if (f < 0) opacity = 0;
        } else {
          // falls from the top, hits the line below, rebounds ~40%, settles (≈9 frames)
          const local = f - (9 + (n - 2 - i) * 9) * k;
          const b = Easing.bounce(lin(local, 0, 10 * k));
          y = -(1 - b) * H * 0.42;
          if (local < 0) opacity = 0;
        }
        break;
      }
      case 'Stack fade up': {
        const local = f - r * 3 * k;
        opacity = greyIn(local, 4 * k);
        y = -(1 - cubicOut(lin(local, 0, 6 * k))) * 0.18 * p.baseSize;
        break;
      }
      case 'Diagonal sweep': {
        const local = f - i * 3 * k;
        const q = expoOut(lin(local, 0, 9 * k));
        x = -(1 - q) * W * 0.9;
        if (local < 0) opacity = 0;
        break;
      }
      case 'Tilted fade build': {
        const local = f - i * 3 * k;
        opacity = greyIn(local, 5 * k);
        y = (1 - cubicOut(lin(local, 0, 6 * k))) * 0.25 * p.baseSize;
        break;
      }
      default:
        break;
    }

    // EXIT
    if (e >= 0) {
      switch (p.exit) {
        case 'Slide out right': {
          const local = e - r * 2.5 * k;
          x += cubicIn(lin(local, 0, 9 * k)) * W * 1.05;
          break;
        }
        case 'Anticipate & slide right': {
          const local = e - r * 3 * k;
          x += -0.12 * p.baseSize * cubicOut(lin(local, 0, 5 * k));
          x += cubicIn(lin(local, 5 * k, 13 * k)) * W * 1.1;
          break;
        }
        case 'Fall apart': {
          y += (i - (n - 1) / 2) * 0.25 * p.baseSize * cubicOut(lin(e, 0, 6 * k));
          const local = (e - (5 + r * 3) * k) / k;
          if (local > 0) {
            const t = local / fps;
            y += 0.5 * H * 7 * t * t;
            const dir = random(`fa${p.seed}-${i}`) < 0.5 ? -1 : 1;
            rot += dir * (14 + random(`fr${p.seed}-${i}`) * 16) * t * 2;
          }
          break;
        }
        case 'Split vertical': {
          const dir = i < n / 2 - 0.01 ? -1 : 1;
          y += dir * (cubicOut(lin(e, 0, 5 * k)) * 0.12 * p.baseSize + cubicIn(lin(e, 3 * k, 15 * k)) * H * 0.65);
          break;
        }
        case 'Drop out': {
          const local = e - r * 3 * k;
          y += (r === 0 ? 0 : 0.08 * p.baseSize * cubicOut(lin(e, 0, 5 * k))) + cubicIn(lin(local, 0, 11 * k)) * H * 0.75;
          break;
        }
        case 'Fade down': {
          const local = e - r * 3 * k;
          opacity *= 1 - greyIn(local, 5 * k);
          y += cubicIn(lin(local, 0, 5 * k)) * 0.2 * p.baseSize;
          break;
        }
        case 'Fly up': {
          y += -(i - (n - 1) / 2) * -0.15 * p.baseSize * cubicOut(lin(e, 0, 5 * k));
          const local = e - (4 + i * 3) * k;
          y += -cubicIn(lin(local, 0, 10 * k)) * H * 0.85;
          break;
        }
        case 'Spread & drop': {
          y += (i - (n - 1) / 2) * 0.4 * p.baseSize * cubicOut(lin(e, 0, 8 * k));
          const local = e - (7 + r * 2.5) * k;
          y += cubicIn(lin(local, 0, 9 * k)) * H * 0.75;
          break;
        }
        default:
          break;
      }
    }

    return { transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`, opacity };
  };

  // ---------- per-word style ----------
  type WordRender = { style: React.CSSProperties; rgb?: [number, number, number]; scale?: number };
  const wordRender = (w: Word): WordRender => {
    let opacity = 1;
    let scale = 1;
    let y = 0;
    let rgb: [number, number, number] | undefined;

    switch (p.enter) {
      case 'Word zoom build': {
        opacity = greyIn(f - w.gIndex * 2.4 * k, 4 * k);
        break;
      }
      case 'RGB slide': {
        const local = f - rank[w.gIndex] * 2.6 * k;
        if (local < 0) opacity = 0;
        // red leads, green, then blue lags behind
        const qs = [0, 1.6, 3.2].map((lag) => expoOut(lin(local - lag * k, 0, 9 * k)));
        if (qs[2] < 0.999) rgb = qs.map((q) => -(1 - q) * W * 0.65) as [number, number, number];
        break;
      }
      case 'Word pop scatter': {
        const local = f - rank[w.gIndex] * 2.5 * k;
        scale = spring({ frame: local / k, fps, config: { damping: 12, stiffness: 210 } });
        if (local < 0) opacity = 0;
        break;
      }
      case 'Mixed reveal': {
        const local = f - w.gIndex * 3 * k;
        if (w.light) {
          scale = 0.3 + 0.7 * spring({ frame: local / k, fps, config: { damping: 12, stiffness: 200 } });
          opacity = lin(local, 0, 2 * k);
        } else {
          opacity = greyIn(local, 4 * k);
          y = -(1 - cubicOut(lin(local, 0, 5 * k))) * 0.2;
        }
        break;
      }
      default:
        break;
    }

    // a stray glitch flicker on RGB titles while they hold
    if (p.enter === 'RGB slide' && e < 0 && !rgb) {
      const tick = Math.floor(frame / 2);
      if (random(`gl${p.seed}-${tick}`) < 0.06 && Math.floor(random(`gw${p.seed}-${tick}`) * nWords) === w.gIndex) {
        rgb = [0.02 * p.baseSize, 0, -0.02 * p.baseSize];
      }
    }

    if (e >= 0) {
      if (p.exit === 'RGB slide out') {
        const order = nWords - 1 - rank[w.gIndex]; // last in leaves first
        const local = e - order * 2.2 * k;
        const qs = [3.2, 1.6, 0].map((lag) => cubicIn(lin(local - lag * k, 0, 8 * k)));
        if (qs[0] > 0.001 || qs[2] > 0.001) rgb = qs.map((q) => -q * W * 0.75) as [number, number, number];
        if (qs[0] >= 0.999) opacity = 0;
      }
      if (p.exit === 'Word pop out') {
        const order = nWords - 1 - (p.enter === 'Word pop scatter' ? rank[w.gIndex] : w.gIndex);
        const local = e - order * 1.8 * k;
        scale *= 1 - Easing.in(Easing.back(1.6))(lin(local, 0, 5 * k));
        if (local >= 5 * k) opacity = 0;
      }
    }

    return {
      style: { opacity, transform: `translateY(${y}em) scale(${Math.max(0, scale)})`, transformOrigin: '50% 60%' },
      rgb,
    };
  };

  // ---------- per-letter style ----------
  const letterStyle = (w: Word, li: number, lineLetterIndex: number, lineLetters: number): React.CSSProperties => {
    if (p.enter === 'Letter glow & pop') {
      if (!w.light) {
        // bold lines: letters brighten grey → white, left to right
        const local = f - lineLetterIndex * 1.3 * k - li * 2 * k;
        return { opacity: greyIn(local, 5 * k) };
      }
      const local = f - (4 + lineLetterIndex * 1.5) * k;
      const s = spring({ frame: local / k, fps, config: { damping: 11, stiffness: 210 } });
      return {
        opacity: lin(local, 0, 2 * k),
        transform: `translateY(${(1 - s) * 0.35}em) scale(${0.2 + 0.8 * s})`,
        transformOrigin: '50% 100%',
      };
    }
    if (p.enter === 'Letter pop tilt') {
      const order = li % 2 === 0 ? lineLetterIndex : lineLetters - 1 - lineLetterIndex;
      const local = f - order * 1.2 * k;
      const s = spring({ frame: local / k, fps, config: { damping: 11, stiffness: 230 } });
      return { opacity: lin(local, 0, 2 * k), transform: `scale(${0.15 + 0.85 * s})`, transformOrigin: '50% 70%' };
    }
    return {};
  };
  const perLetter = p.enter === 'Letter glow & pop' || p.enter === 'Letter pop tilt';

  return (
    <AbsoluteFill style={{ backgroundColor: p.backgroundColor }}>
      <PaperTexture
        tint={0}
        halftone={0}
        paper={p.grain ? 0.3 : 0}
        grain="Rough"
        blotches={p.grain ? 0.2 : 0}
        dust={p.grain ? 0.4 : 0}
        vignette={0.55}
        fade={0.02}
        boilFps={p.grain ? 12 : 0}
      >
        <AbsoluteFill style={{ backgroundColor: p.backgroundColor }}>
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse 50% 45% at 50% 50%, rgba(255,255,255,0.045), transparent 70%)' }} />
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: p.align === 'left' ? 'flex-start' : p.align === 'right' ? 'flex-end' : 'center',
                transform: `translateY(${blockY}px) rotate(${blockRotate}deg) scale(${blockScale})`,
              }}
            >
              {lines.map((words, i) => {
                const size = p.baseSize * p.lines[i].size;
                const light = p.lines[i].weight === 'Light';
                const color = light ? p.lightColor : p.textColor;
                const lineLetters = words.reduce((s, w) => s + w.text.length, 0);
                let lineLetterIndex = 0;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      zIndex: n - i, // upper lines sit on top and shade the lines below
                      fontFamily,
                      fontWeight: light ? 300 : p.font === 'Barlow' ? 700 : 800,
                      fontSize: size,
                      lineHeight: 1,
                      letterSpacing: light ? '0' : '-0.005em',
                      marginTop: i === 0 ? 0 : `${-p.overlap}em`,
                      whiteSpace: 'nowrap',
                      filter: castShadow,
                      ...lineStyle(i),
                    }}
                  >
                    <div style={{ display: 'flex' }}>
                      {words.map((w, wi) => {
                        const wr = wordRender(w);
                        const c = w.accent ? p.accentColor : color;
                        const face: React.CSSProperties = { color: c, textShadow: extrusion(c) };
                        const content = perLetter
                          ? Array.from(w.text).map((ch, ci) => {
                              const st = letterStyle(w, i, lineLetterIndex++, lineLetters);
                              return (
                                <span key={ci} style={{ display: 'inline-block', whiteSpace: 'pre', ...st }}>
                                  {ch}
                                </span>
                              );
                            })
                          : w.text;
                        return (
                          <span
                            key={wi}
                            style={{
                              display: 'inline-block',
                              position: 'relative',
                              marginRight: wi < words.length - 1 ? '0.22em' : 0,
                              ...wr.style,
                            }}
                          >
                            {wr.rgb ? (
                              <span style={{ position: 'relative', display: 'inline-block', isolation: 'isolate' }}>
                                <span style={{ visibility: 'hidden' }}>{w.text}</span>
                                {(['#ff1a1a', '#1aff3c', '#2b4bff'] as const).map((col, ci) => (
                                  <span
                                    key={col}
                                    style={{
                                      position: 'absolute',
                                      left: 0,
                                      top: 0,
                                      color: col,
                                      mixBlendMode: 'screen',
                                      transform: `translateX(${wr.rgb![ci]}px)`,
                                    }}
                                  >
                                    {w.text}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span style={face}>{content}</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      </PaperTexture>
    </AbsoluteFill>
  );
};
