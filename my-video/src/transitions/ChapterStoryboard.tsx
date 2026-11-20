import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, Easing, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { SfxCue, SfxTrack } from '../SfxTrack';
import { Clip } from './TwoClipTransition';

// -----------------------------------------------------------
// CHAPTER STORYBOARD
// For chapter-wise explainers:
//   1. starts on a storyboard grid of chapter tiles
//   2. zooms into a chapter tile until it fills the screen,
//      the chapter title reveals from the center (~ title ~)
//   3. HARD CUT to the explanation (creator / footage)
//   4. hard cut back to the chapter card, zooms out to the grid,
//      the chapter gets a "done" tick
//   5. zooms into the next chapter ... and so on
// Choose which chapters this composition plays with fromChapter / toChapter,
// so one long video can be split into parts.
// -----------------------------------------------------------

const { fontFamily: sans } = loadArchivo('normal', { weights: ['600', '800'], subsets: ['latin'] });
const { fontFamily: serif } = loadFraunces('normal', { weights: ['700'], subsets: ['latin'] });

const W = 1920;
const H = 1080;
const FPS = 30;

const chapterSchema = z.object({
  title: z.string().describe('Chapter title shown on the tile and full screen'),
  color: zColor().describe('Tile / chapter card colour'),
  explanationSeconds: z.number().min(0.5).max(120).step(0.5).describe('Length of the explanation after the hard cut'),
  explanationVideo: z.string().describe('Video in public/ for the explanation. Empty = placeholder card'),
});

export const chapterStoryboardSchema = z.object({
  chapters: z.array(chapterSchema).min(1).max(10),
  fromChapter: z.number().int().min(1).max(10).describe('First chapter this composition plays'),
  toChapter: z.number().int().min(1).max(10).describe('Last chapter this composition plays'),
  label: z.string().describe('Small label above the board'),
  textColor: zColor(),
  backgroundColor: zColor().describe('Background behind the board'),
  sweepColor: zColor().describe('Background colour that sweeps in while zooming'),
  boardColor: zColor(),
  showChapterNumber: z.boolean(),
  showDoneTicks: z.boolean().describe('Tick on chapters already explained'),
  gridSeconds: z.number().min(0.3).max(5).step(0.1).describe('Time on the grid before / after the chapters'),
  titleSeconds: z.number().min(0.3).max(5).step(0.1).describe('Time the title stays after its reveal'),
  speed: z.number().min(0.5).max(2).step(0.1).describe('Zoom speed: 1 = default, 2 = twice as fast'),
  playSound: z.boolean(),
  soundVolume: z.number().min(0).max(1).step(0.05),
});
export type ChapterStoryboardProps = z.infer<typeof chapterStoryboardSchema>;

const COLORS = ['#1d3fd8', '#f2a516', '#7a3cf0', '#16161d', '#0f8fd8', '#ff6b35', '#2bb673', '#e8364f', '#5c6bc0', '#8a5a44'];
const TITLES = ['1655', 'The Ship', 'Storm', '2011', 'The Dive', 'Treasure', 'Court', 'The Hunt', 'Today', 'Lessons'];

export const chapterStoryboardDefaults: ChapterStoryboardProps = {
  chapters: TITLES.map((title, i) => ({ title, color: COLORS[i], explanationSeconds: 2, explanationVideo: '' })),
  fromChapter: 1,
  toChapter: 2,
  label: 'storyboard',
  textColor: '#f3ead8',
  backgroundColor: '#22313a',
  sweepColor: '#e8e0d6',
  boardColor: '#ffffff',
  showChapterNumber: true,
  showDoneTicks: true,
  gridSeconds: 1,
  titleSeconds: 1,
  speed: 1,
  playSound: true,
  soundVolume: 0.45,
};

// -----------------------------------------------------------
// Timeline
// -----------------------------------------------------------
type ChapterTimes = {
  index: number;
  zoomStart: number;
  zoomEnd: number;
  revealEnd: number;
  titleEnd: number;
  explainEnd: number;
  backEnd: number;
  outEnd: number;
  next: number;
};

const buildTimeline = (p: ChapterStoryboardProps) => {
  const s = (f: number) => Math.max(2, Math.round(f / p.speed));
  const n = p.chapters.length;
  const from = Math.min(n, Math.max(1, p.fromChapter)) - 1;
  const to = Math.min(n, Math.max(from + 1, p.toChapter)) - 1;
  const grid = Math.round(p.gridSeconds * FPS);
  let cur = grid;
  const chapters: ChapterTimes[] = [];
  for (let i = from; i <= to; i++) {
    const zoomStart = cur;
    const zoomEnd = zoomStart + s(32);
    const revealEnd = zoomEnd + s(22);
    const titleEnd = revealEnd + Math.round(p.titleSeconds * FPS);
    const explainEnd = titleEnd + Math.round(p.chapters[i].explanationSeconds * FPS);
    const backEnd = explainEnd + s(8);
    const outEnd = backEnd + s(28);
    const next = i === to ? outEnd + grid : outEnd + s(14);
    chapters.push({ index: i, zoomStart, zoomEnd, revealEnd, titleEnd, explainEnd, backEnd, outEnd, next });
    cur = next;
  }
  return { chapters, total: cur, from };
};

export const calculateChapterStoryboardMetadata: CalculateMetadataFunction<ChapterStoryboardProps> = ({ props }) => ({
  durationInFrames: buildTimeline(props).total,
});

// -----------------------------------------------------------
// Layout
// -----------------------------------------------------------
const MAX_COLS = 5;
const PAD = 26;
const GAP = 14;
const TILE_W = (1600 - PAD * 2 - GAP * (MAX_COLS - 1)) / MAX_COLS;
const TILE_H = (TILE_W * 9) / 16;

type Rect = { x: number; y: number; w: number; h: number };
const FULL: Rect = { x: 0, y: 0, w: W, h: H };

const boardLayout = (n: number) => {
  const cols = Math.min(MAX_COLS, n);
  const rows = Math.ceil(n / MAX_COLS);
  const w = PAD * 2 + cols * TILE_W + (cols - 1) * GAP;
  const h = PAD * 2 + rows * TILE_H + (rows - 1) * GAP;
  const x = (W - w) / 2;
  const y = (H - h) / 2;
  const tile = (i: number): Rect => ({
    x: x + PAD + (i % MAX_COLS) * (TILE_W + GAP),
    y: y + PAD + Math.floor(i / MAX_COLS) * (TILE_H + GAP),
    w: TILE_W,
    h: TILE_H,
  });
  return { board: { x, y, w, h }, tile };
};

const mix = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});
const ease = Easing.bezier(0.65, 0, 0.25, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// -----------------------------------------------------------
// Pieces
// -----------------------------------------------------------
const Wave: React.FC<{ color: string; flip?: boolean }> = ({ color, flip }) => (
  <svg width={150} height={50} viewBox="0 0 90 30" style={{ transform: flip ? 'scaleX(-1)' : undefined, overflow: 'visible', display: 'block' }}>
    <path d="M2 15 C 14 3, 26 3, 38 15 S 62 27, 74 15 S 86 9, 88 12" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

/** Full-size chapter card (1920x1080). reveal: 0 = hidden, 1 = fully shown. */
const ChapterCard: React.FC<{
  title: string;
  number: number;
  color: string;
  textColor: string;
  showNumber: boolean;
  reveal: number;
}> = ({ title, number, color, textColor, showNumber, reveal }) => {
  const side = (1 - reveal) * 50;
  return (
    <AbsoluteFill style={{ backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      {/* soft vignette like the reference */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.06), rgba(0,0,0,0.35))' }} />
      {showNumber ? (
        <div
          style={{
            position: 'absolute',
            top: 120,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: '0.3em',
            color: textColor,
            opacity: 0.7,
          }}
        >
          CHAPTER {String(number).padStart(2, '0')}
        </div>
      ) : null}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: `${side}%`, top: '50%', transform: 'translate(-100%, -40%)', paddingRight: 30 }}>
          <Wave color={textColor} />
        </div>
        <div
          style={{
            fontFamily: serif,
            fontWeight: 700,
            fontSize: 260,
            lineHeight: 1,
            color: textColor,
            whiteSpace: 'nowrap',
            clipPath: `inset(-20% ${side}% -20% ${side}%)`,
            padding: '0 10px',
          }}
        >
          {title}
        </div>
        <div style={{ position: 'absolute', left: `${100 - side}%`, top: '50%', transform: 'translate(0, -40%)', paddingLeft: 30 }}>
          <Wave color={textColor} flip />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Draws a full-size scene scaled into a rectangle. */
const Placed: React.FC<{ rect: Rect; radius: number; opacity?: number; children: React.ReactNode }> = ({
  rect,
  radius,
  opacity = 1,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: rect.x,
      top: rect.y,
      width: rect.w,
      height: rect.h,
      borderRadius: radius,
      overflow: 'hidden',
      opacity,
    }}
  >
    <div style={{ width: W, height: H, transform: `scale(${rect.w / W}, ${rect.h / H})`, transformOrigin: '0 0', position: 'relative' }}>
      {children}
    </div>
  </div>
);

const Tick: React.FC<{ rect: Rect; opacity: number }> = ({ rect, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: rect.x + rect.w - 44,
      top: rect.y + 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      background: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      opacity,
      transform: `scale(${0.6 + 0.4 * opacity})`,
    }}
  >
    <svg viewBox="0 0 34 34" width={34} height={34}>
      <path d="M10 17.5 L15 22.5 L24.5 12" fill="none" stroke="#2bb673" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const ExplanationPlaceholder: React.FC<{ number: number; title: string }> = ({ number, title }) => (
  <AbsoluteFill style={{ backgroundColor: '#2a2a30', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
    <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.55)' }}>
      HARD CUT · EXPLANATION
    </div>
    <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 110, color: '#fff' }}>Creator / footage here</div>
    <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 44, color: 'rgba(255,255,255,0.7)' }}>
      Chapter {String(number).padStart(2, '0')} · {title}
    </div>
  </AbsoluteFill>
);

// -----------------------------------------------------------
// Main
// -----------------------------------------------------------
export const ChapterStoryboard: React.FC<ChapterStoryboardProps> = (p) => {
  const frame = useCurrentFrame();
  const { chapters: times } = buildTimeline(p);
  const n = p.chapters.length;
  const { board, tile } = boardLayout(n);

  // Which chapter is in play right now (if any)?
  const current = times.find((t) => frame >= t.zoomStart && frame < t.next) ?? null;

  let fly = 0; // 0 = active tile in its slot, 1 = full screen
  let othersVisible = 1; // other tiles
  let reveal = 1; // title reveal
  let sweep = 0; // background sweep
  let explaining = false;
  if (current) {
    const t = current;
    if (frame < t.zoomEnd) {
      const z = interpolate(frame, [t.zoomStart, t.zoomEnd], [0, 1], clamp);
      othersVisible = 1 - z; // used per tile with a stagger below
      fly = ease(interpolate(z, [0.3, 1], [0, 1], clamp));
      sweep = ease(interpolate(z, [0, 0.7], [0, 1], clamp));
    } else if (frame < t.backEnd) {
      fly = 1;
      othersVisible = 0;
      sweep = 1;
      reveal = frame < t.revealEnd ? ease(interpolate(frame, [t.zoomEnd, t.revealEnd], [0, 1], clamp)) : 1;
      explaining = frame >= t.titleEnd && frame < t.explainEnd;
    } else if (frame < t.outEnd) {
      const o = interpolate(frame, [t.backEnd, t.outEnd], [0, 1], clamp);
      fly = 1 - ease(interpolate(o, [0, 0.75], [0, 1], clamp));
      othersVisible = interpolate(o, [0.45, 1], [0, 1], clamp);
      sweep = 1 - ease(interpolate(o, [0.2, 1], [0, 1], clamp));
    }
  }
  const zooming = current !== null && frame < current.zoomEnd;
  const boardOpacity = interpolate(fly, [0.55, 0.9], [1, 0], clamp);

  // During the zoom-in, tiles furthest from the active one fade first.
  const activeIndex = current?.index ?? -1;
  const tileOpacity = (i: number) => {
    if (!current || i === activeIndex) return 1;
    if (!zooming) return othersVisible;
    const a = tile(activeIndex);
    const dist = (k: number) => Math.hypot(tile(k).x - a.x, tile(k).y - a.y);
    const maxDist = Math.max(...p.chapters.map((_, k) => dist(k)));
    const delay = (1 - dist(i) / (maxDist || 1)) * 0.25;
    const z = interpolate(frame, [current.zoomStart, current.zoomEnd], [0, 1], clamp);
    return interpolate(z, [delay, delay + 0.25], [1, 0], clamp);
  };
  const isDone = (i: number) => times.some((t) => t.index === i && frame >= t.outEnd) || i < (times[0]?.index ?? 0);
  const tickOpacity = (i: number) => {
    const t = times.find((x) => x.index === i);
    if (!t) return isDone(i) ? 1 : 0;
    return interpolate(frame, [t.outEnd - 4, t.outEnd + 6], [0, 1], clamp);
  };
  const labelChars = Math.round(p.label.length * (current && zooming ? 1 - interpolate(frame, [current.zoomStart, current.zoomStart + 10], [0, 1], clamp) : current && frame < current.outEnd ? 0 : 1));

  const cues: SfxCue[] = p.playSound
    ? times.flatMap((t) => [
        { sound: 'whoosh-air' as const, at: t.zoomStart + Math.round((t.zoomEnd - t.zoomStart) * 0.35), volume: p.soundVolume },
        { sound: 'whoosh-soft' as const, at: t.zoomEnd, volume: p.soundVolume * 0.7 },
        { sound: 'whoosh-swipe-clean' as const, at: t.backEnd + 2, volume: p.soundVolume },
        ...(p.showDoneTicks ? [{ sound: 'pop-bubble' as const, at: t.outEnd, volume: p.soundVolume * 0.6 }] : []),
      ])
    : [];

  const chapterCard = (i: number, r: number) => (
    <ChapterCard
      title={p.chapters[i].title}
      number={i + 1}
      color={p.chapters[i].color}
      textColor={p.textColor}
      showNumber={p.showChapterNumber}
      reveal={r}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: p.backgroundColor, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${sweep * 100}%`, background: p.sweepColor }} />

      {/* board */}
      <div
        style={{
          position: 'absolute',
          left: board.x,
          top: board.y - 38,
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 24,
          color: sweep > 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)',
          opacity: boardOpacity,
        }}
      >
        {p.label.slice(0, labelChars)}
      </div>
      <div
        style={{
          position: 'absolute',
          left: board.x,
          top: board.y,
          width: board.w,
          height: board.h,
          background: p.boardColor,
          borderRadius: 22,
          boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
          opacity: boardOpacity,
        }}
      />
      {p.chapters.map((c, i) =>
        i === activeIndex ? null : (
          <React.Fragment key={i}>
            <Placed rect={tile(i)} radius={8} opacity={tileOpacity(i) * (p.showDoneTicks && isDone(i) ? 0.6 : 1)}>
              {chapterCard(i, 1)}
            </Placed>
            {p.showDoneTicks ? <Tick rect={tile(i)} opacity={tickOpacity(i) * tileOpacity(i)} /> : null}
          </React.Fragment>
        ),
      )}

      {/* active chapter tile → full screen */}
      {current ? (
        <>
          <Placed rect={mix(tile(activeIndex), FULL, fly)} radius={8 * (1 - fly)} opacity={p.showDoneTicks && frame >= current.outEnd ? 0.6 : 1}>
            {chapterCard(activeIndex, reveal)}
          </Placed>
          {p.showDoneTicks && frame >= current.outEnd - 4 ? <Tick rect={tile(activeIndex)} opacity={tickOpacity(activeIndex)} /> : null}
        </>
      ) : null}

      {/* hard cut to the explanation */}
      {current && explaining ? (
        <Sequence from={current.titleEnd} durationInFrames={current.explainEnd - current.titleEnd} layout="none">
          <AbsoluteFill>
            {p.chapters[activeIndex].explanationVideo ? (
              <Clip videoFile={p.chapters[activeIndex].explanationVideo} startAt={0} title="" color="#000" />
            ) : (
              <ExplanationPlaceholder number={activeIndex + 1} title={p.chapters[activeIndex].title} />
            )}
          </AbsoluteFill>
        </Sequence>
      ) : null}

      <SfxTrack cues={cues} />
    </AbsoluteFill>
  );
};
