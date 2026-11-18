import React from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadGrotesk } from '@remotion/google-fonts/SpaceGrotesk';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { DIGITS, rgba } from './CurvedCardCarousel';
import * as Backgrounds from '../backgroundefffects';
import * as Callouts from '../callouts';
import * as Infographics from '../infografics';
import * as LowerThirds from '../Lowerthird';
import * as TextStyles from '../textstyles';
import * as Shortcraft from '../video shortcraft';

// -----------------------------------------------------------
// RIGHT-SIDE SLOT
// The right side is an open slot. It can hold any component from
// the library (infographics, callouts, text styles ...), the user's
// own image or video, one of the two built-in demos, or nothing.
// -----------------------------------------------------------

type AnyComponent = React.ComponentType<Record<string, unknown>>;

const LIBRARY: Record<string, AnyComponent> = {};
for (const [group, mod] of [
  ['Infographic', Infographics],
  ['Callout', Callouts],
  ['Text style', TextStyles],
  ['Shortcraft', Shortcraft],
  ['Lower third', LowerThirds],
  ['Background', Backgrounds],
] as const) {
  for (const [id, comp] of Object.entries(mod as Record<string, unknown>)) {
    if (typeof comp === 'function' && /^[A-Z]/.test(id)) LIBRARY[`${group}: ${id}`] = comp as AnyComponent;
  }
}

const BUILT_IN = ['None', 'Clone app demo', 'Checklist demo', 'My image', 'My video'] as const;
const RIGHT_SIDE_OPTIONS = [...BUILT_IN, ...Object.keys(LIBRARY)] as [string, ...string[]];

const { fontFamily: GROTESK } = loadGrotesk('normal', { weights: ['500', '600'], subsets: ['latin'] });
const { fontFamily: MONO } = loadMono('normal', { weights: ['400', '500'], subsets: ['latin'] });
const SERIF = 'Georgia, "Times New Roman", serif';

// -----------------------------------------------------------
// LIST DETAIL SLIDE ("Thing 01 of 20")
// One slide for one list item: big pixel number top-left, a typed
// label, the title, a tag pill, a progress bar, and an open slot
// on the right (any library component, image, video or demo).
// It is a separate asset from CurvedCardCarousel; put them one
// after another in your edit.
// -----------------------------------------------------------

export const listDetailSlideSchema = z.object({
  number: z.string().describe('Number, e.g. 01'),
  title: z.string().describe('Title (type \\n to split lines)'),
  tag: z.string().describe('Small pill under the title (empty hides it)'),
  position: z.number().int().min(1).max(99).describe('Which item this is (fills the progress bar)'),
  totalCount: z.number().int().min(1).max(99).describe('The "of 20" number'),
  labelWord: z.string().describe('Word in the small label, e.g. THING'),
  seconds: z.number().min(2).max(60).step(0.5).describe('How long the slide lasts'),
  numberEntrance: z
    .enum(['Pop in', 'Fly from center'])
    .describe('"Fly from center" matches the end of CurvedCardCarousel'),
  rightSide: z.enum(RIGHT_SIDE_OPTIONS).describe('What fills the right side: any library component, your image/video, a demo, or nothing'),
  mediaFile: z.string().describe('For "My image"/"My video": file name in public/ (e.g. clip.mp4) or a web link'),
  slotFrame: z.boolean().describe('Put the right side inside a rounded card frame'),
  slotSize: z.number().min(0.5).max(1.3).step(0.05).describe('Size of the right side (1 = normal)'),
  slotDelaySeconds: z.number().min(0).max(5).step(0.1).describe('When the right side appears'),
  sourceName: z.string().describe('Demo: left window name'),
  cloneName: z.string().describe('Clone app demo: right window name'),
  documentTitle: z.string().describe('Demo: heading inside the windows'),
  points: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .describe('Demo: rows (Clone app) or checklist lines (Checklist)'),
  totalLabel: z.string().describe('Clone app demo: total row value; empty hides it'),
  accentColor: zColor(),
  backgroundColor: zColor(),
  textColor: zColor(),
});

export type ListDetailSlideProps = z.infer<typeof listDetailSlideSchema>;
type Item = ListDetailSlideProps;

export const listDetailSlideDefaults: ListDetailSlideProps = {
  number: '01',
  title: 'Clone Any\nSoftware',
  tag: 'Reverse Engineer Anything skill',
  position: 1,
  totalCount: 20,
  labelWord: 'THING',
  seconds: 7,
  numberEntrance: 'Pop in',
  rightSide: 'Clone app demo',
  mediaFile: '',
  slotFrame: true,
  slotSize: 1,
  slotDelaySeconds: 0.2,
  sourceName: 'invoicing-app',
  cloneName: 'your-clone',
  documentTitle: 'Invoice',
  points: [
    { label: 'Video edit', value: '₹18,000' },
    { label: 'Design', value: '₹6,500' },
    { label: 'Strategy', value: '₹16,400' },
  ],
  totalLabel: '₹48,262',
  accentColor: '#E9825A',
  backgroundColor: '#161213',
  textColor: '#F3EDE8',
};

export const calculateListDetailMetadata: CalculateMetadataFunction<ListDetailSlideProps> = ({ props }) => ({
  durationInFrames: Math.max(30, Math.round((props.seconds ?? listDetailSlideDefaults.seconds) * 30)),
});

// --- pixel number --------------------------------------------------------

const digitBlocks = (text: string) => {
  const digits = text.split('').filter((c) => DIGITS[c]);
  const cols = digits.length * 5 + Math.max(digits.length - 1, 0);
  const blocks: { c: number; r: number }[] = [];
  digits.forEach((d, di) =>
    DIGITS[d].forEach((row, r) =>
      row.split('').forEach((bit, c) => {
        if (bit === '1') blocks.push({ c: di * 6 + c, r });
      }),
    ),
  );
  return { blocks, cols };
};

// --- right-side demos ----------------------------------------------------

type DemoProps = { item: Item; accent: string; s: number; frame: number; fps: number; durationInFrames: number };

const WindowFrame: React.FC<{
  name: string;
  s: number;
  accent: string;
  badge?: string;
  grid?: boolean;
  height: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ name, s, accent, badge, grid, height, children, style }) => (
  <div
    style={{
      position: 'absolute',
      width: 420 * s,
      height,
      borderRadius: 18 * s,
      overflow: 'hidden',
      background: '#FBF7F1',
      backgroundImage: grid
        ? `linear-gradient(${rgba('#000000', 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${rgba('#000000', 0.05)} 1px, transparent 1px)`
        : undefined,
      backgroundSize: grid ? `${22 * s}px ${22 * s}px` : undefined,
      boxShadow: `0 ${30 * s}px ${70 * s}px rgba(0,0,0,0.55)`,
      ...style,
    }}
  >
    <div
      style={{
        height: 44 * s,
        background: '#EFE8DE',
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${16 * s}px`,
        gap: 8 * s,
        fontFamily: MONO,
        fontSize: 15 * s,
        color: '#5C534B',
      }}
    >
      {[0, 1, 2].map((d) => (
        <span key={d} style={{ width: 10 * s, height: 10 * s, borderRadius: '50%', background: '#D4CCC2' }} />
      ))}
      <span style={{ marginLeft: 10 * s }}>{name}</span>
      {badge && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12 * s,
            letterSpacing: 1.5 * s,
            padding: `${4 * s}px ${10 * s}px`,
            borderRadius: 6 * s,
            background: rgba(accent, 0.18),
            color: accent,
            fontWeight: 500,
          }}
        >
          {badge}
        </span>
      )}
    </div>
    <div style={{ position: 'relative', height: height - 44 * s }}>{children}</div>
  </div>
);

const CloneDemo: React.FC<DemoProps> = ({ item, accent, s, frame, fps, durationInFrames }) => {
  const pad = 28 * s;
  const rows = item.points.slice(0, 5);
  const rowH = 44 * s;

  // Section layout inside the window body (top, height).
  const header = { top: 40 * s, h: 50 * s, label: 'Header' };
  const client = { top: header.top + header.h + 10 * s, h: 84 * s, label: 'Client info' };
  const lines = { top: client.top + client.h + 14 * s, h: rows.length * rowH + 8 * s, label: 'Line items' };
  const total = { top: lines.top + lines.h + 20 * s, h: item.totalLabel ? 54 * s : 0, label: 'Total' };
  const sections = [header, client, lines, ...(item.totalLabel ? [total] : [])];
  const bodyH = total.top + total.h + 70 * s;
  const winH = bodyH + 44 * s;

  // Windows slide in.
  const inL = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const inR = spring({ frame: frame - 14, fps, config: { damping: 200 } });

  // A scan line sweeps down the original; each section it passes is copied over.
  const scanStart = Math.round(fps * 1.0);
  const scanEnd = Math.max(scanStart + fps, durationInFrames - Math.round(fps * 1.5));
  const scanY = interpolate(frame, [scanStart, scanEnd], [header.top - 10 * s, total.top + total.h + 20 * s], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const scanOn = frame >= scanStart && frame <= scanEnd + 8;
  const active = sections.findIndex((sec) => scanY >= sec.top && scanY <= sec.top + sec.h + 10 * s);
  const copiedAt = (sec: { top: number; h: number }) =>
    interpolate(sec.top + sec.h, [header.top - 10 * s, total.top + total.h + 20 * s], [scanStart, scanEnd]);

  const sectionBody = (sec: (typeof sections)[number]) => {
    if (sec === header)
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: SERIF, fontSize: 34 * s, color: '#1E1A17', fontWeight: 600 }}>
            {item.documentTitle}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 14 * s, color: '#8A8077' }}>#0142</span>
        </div>
      );
    if (sec === client)
      return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${12 * s}px ${6 * s}px` }}>
          {[0, 1].map((col) => (
            <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 9 * s, width: col ? '38%' : '52%' }}>
              {[0.6, 1, 0.75].map((w, k) => (
                <div key={k} style={{ height: 7 * s, width: `${w * 100}%`, borderRadius: 4 * s, background: '#DDD4C9' }} />
              ))}
            </div>
          ))}
        </div>
      );
    if (sec === lines)
      return (
        <div style={{ padding: `${4 * s}px ${6 * s}px` }}>
          {rows.map((row, k) => (
            <div
              key={k}
              style={{
                height: rowH,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: k < rows.length - 1 ? `1px solid ${rgba('#000000', 0.07)}` : undefined,
                fontFamily: GROTESK,
                fontSize: 18 * s,
                color: '#2B2521',
              }}
            >
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
      );
    return (
      <div
        style={{
          height: total.h,
          borderRadius: 10 * s,
          background: '#1E1A17',
          color: '#FBF7F1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `0 ${16 * s}px`,
          fontFamily: GROTESK,
        }}
      >
        <span style={{ fontSize: 17 * s }}>Total</span>
        <span style={{ fontSize: 24 * s, fontWeight: 600 }}>{item.totalLabel}</span>
      </div>
    );
  };

  const leftX = 0;
  const rightX = 560 * s;
  const activeSec = active >= 0 ? sections[active] : null;
  const chipPop = spring({ frame: frame - scanStart, fps, config: { damping: 14 } });

  return (
    <div style={{ position: 'relative', width: rightX + 420 * s, height: winH }}>
      {/* original app */}
      <WindowFrame
        name={item.sourceName}
        badge="PAID PLAN"
        s={s}
        accent={accent}
        height={winH}
        style={{ left: leftX, opacity: inL, transform: `translateX(${(1 - inL) * 80 * s}px)` }}
      >
        {sections.map((sec, k) => {
          const isActive = k === active && scanOn;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: pad - 8 * s,
                right: pad - 8 * s,
                top: sec.top - 6 * s,
                height: sec.h + 12 * s,
                padding: `${6 * s}px ${8 * s}px`,
                boxSizing: 'border-box',
                borderRadius: 10 * s,
                outline: isActive ? `${2 * s}px solid ${rgba(accent, 0.85)}` : `${2 * s}px solid transparent`,
                background: isActive ? rgba(accent, 0.06) : undefined,
              }}
            >
              {sectionBody(sec)}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            right: pad,
            top: total.top + total.h + 18 * s,
            padding: `${9 * s}px ${18 * s}px`,
            borderRadius: 10 * s,
            background: accent,
            color: '#fff',
            fontFamily: GROTESK,
            fontSize: 15 * s,
            fontWeight: 600,
          }}
        >
          Download PDF
        </div>
        {/* scan line */}
        {scanOn && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanY,
              height: 2 * s,
              background: accent,
              boxShadow: `0 0 ${18 * s}px ${6 * s}px ${rgba(accent, 0.35)}`,
            }}
          />
        )}
      </WindowFrame>

      {/* your clone */}
      <WindowFrame
        name={`✷ ${item.cloneName}`}
        grid
        s={s}
        accent={accent}
        height={winH}
        style={{ left: rightX, opacity: inR, transform: `translateX(${(1 - inR) * 80 * s}px)` }}
      >
        {sections.map((sec, k) => {
          const appear = spring({ frame: frame - Math.round(copiedAt(sec)), fps, config: { damping: 16, stiffness: 140 } });
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: pad - 8 * s,
                right: pad - 8 * s,
                top: sec.top - 6 * s,
                height: sec.h + 12 * s,
                padding: `${6 * s}px ${8 * s}px`,
                boxSizing: 'border-box',
                opacity: appear,
                transform: `translateY(${(1 - appear) * 14 * s}px)`,
              }}
            >
              {sectionBody(sec)}
            </div>
          );
        })}
      </WindowFrame>

      {/* label chip + dotted link to the clone */}
      {activeSec && scanOn && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 420 * s,
              width: rightX - 420 * s,
              top: 44 * s + activeSec.top + activeSec.h / 2,
              borderTop: `${2 * s}px dashed ${rgba(accent, 0.7)}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 330 * s,
              top: 44 * s + activeSec.top + activeSec.h / 2 - 20 * s,
              height: 40 * s,
              padding: `0 ${18 * s}px`,
              display: 'flex',
              alignItems: 'center',
              gap: 6 * s,
              borderRadius: 20 * s,
              background: accent,
              color: '#fff',
              fontFamily: GROTESK,
              fontWeight: 600,
              fontSize: 18 * s,
              whiteSpace: 'nowrap',
              boxShadow: `0 ${8 * s}px ${20 * s}px rgba(0,0,0,0.35)`,
              transform: `scale(${chipPop})`,
            }}
          >
            ✓ {activeSec.label}
          </div>
        </>
      )}
    </div>
  );
};

const ChecklistDemo: React.FC<DemoProps> = ({ item, accent, s, frame, fps }) => {
  const rows = item.points.slice(0, 6);
  const rowH = 66 * s;
  const winH = 44 * s + 110 * s + rows.length * rowH + 30 * s;
  const enter = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  return (
    <div style={{ position: 'relative', width: 560 * s, height: winH }}>
      <WindowFrame
        name={item.sourceName}
        s={s}
        accent={accent}
        height={winH}
        style={{ width: 560 * s, opacity: enter, transform: `translateX(${(1 - enter) * 80 * s}px)` }}
      >
        <div style={{ padding: `${34 * s}px ${32 * s}px` }}>
          <div style={{ fontFamily: SERIF, fontSize: 34 * s, fontWeight: 600, color: '#1E1A17', marginBottom: 22 * s }}>
            {item.documentTitle}
          </div>
          {rows.map((row, k) => {
            const at = Math.round(fps * 0.9) + k * Math.round(fps * 0.55);
            const pop = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 160 } });
            const tick = spring({ frame: frame - at - 6, fps, config: { damping: 12 } });
            return (
              <div
                key={k}
                style={{
                  height: rowH,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16 * s,
                  borderBottom: k < rows.length - 1 ? `1px solid ${rgba('#000000', 0.07)}` : undefined,
                  opacity: pop,
                  transform: `translateX(${(1 - pop) * 30 * s}px)`,
                  fontFamily: GROTESK,
                  fontSize: 22 * s,
                  color: '#2B2521',
                }}
              >
                <span
                  style={{
                    width: 30 * s,
                    height: 30 * s,
                    borderRadius: 8 * s,
                    background: rgba(accent, 0.15 + 0.85 * tick),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18 * s,
                    transform: `scale(${0.7 + 0.3 * tick})`,
                  }}
                >
                  {tick > 0.5 ? '✓' : ''}
                </span>
                <span style={{ flex: 1 }}>{row.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 17 * s, color: '#8A8077' }}>{row.value}</span>
              </div>
            );
          })}
        </div>
      </WindowFrame>
    </div>
  );
};

// --- detail slide --------------------------------------------------------

export const ListDetailSlide: React.FC<Partial<ListDetailSlideProps>> = (props) => {
  const p = { ...listDetailSlideDefaults, ...props };
  const item: Item = p;
  const index = p.position - 1;
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const s = width / 1920;
  const { accentColor: accent, textColor } = p;
  const total = p.totalCount;
  const flyIn = p.numberEntrance === 'Fly from center';

  // "Fly from center": the number starts where CurvedCardCarousel leaves it
  // and moves to the top-left. "Pop in": blocks pop in at the top-left.
  const fly = flyIn ? spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 }) : 1;
  const { blocks, cols } = digitBlocks(item.number);
  const startCell = 52 * s;
  const endCell = 36 * s;
  const cell = startCell + (endCell - startCell) * fly;
  const gx = interpolate(fly, [0, 1], [width / 2 - (cols * startCell) / 2, 160 * s]);
  const gy = interpolate(fly, [0, 1], [height / 2 - (7 * startCell) / 2, 110 * s]);

  // Left text column reveals.
  const reveal = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 18 });
  const labelIn = reveal(12);
  const titleLines = item.title.split('\n');
  const pillIn = spring({ frame: frame - 26 - titleLines.length * 4, fps, config: { damping: 15 } });
  const barIn = reveal(10);

  // Fade out at the end so the next shot cuts in cleanly.
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const label = `${p.labelWord} ${item.number} OF ${String(total).padStart(2, '0')}`;
  const visibleChars = Math.round(interpolate(frame, [12, 12 + label.length * 1.2], [0, label.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));

  const DemoComp = p.rightSide === 'Clone app demo' ? CloneDemo : p.rightSide === 'Checklist demo' ? ChecklistDemo : null;
  const LibraryComp = LIBRARY[p.rightSide];
  const slotDelay = Math.round(p.slotDelaySeconds * fps);
  const slotIn = spring({ frame: frame - slotDelay, fps, config: { damping: 200 }, durationInFrames: 20 });
  // 16:9 slot on the right; library components are drawn at full 1920x1080 and scaled into it.
  const slotW = 820 * s * p.slotSize;
  const slotH = (slotW * 9) / 16;
  const isWeb = /^https?:\/\//.test(p.mediaFile);
  const mediaSrc = p.mediaFile ? (isWeb ? p.mediaFile : staticFile(p.mediaFile)) : '';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.backgroundColor,
        backgroundImage: `radial-gradient(${rgba('#ffffff', 0.05)} 1px, transparent 1px)`,
        backgroundSize: `${28 * s}px ${28 * s}px`,
      }}
    >
    <AbsoluteFill
      style={{ background: `radial-gradient(ellipse 60% 50% at 25% 30%, ${rgba(accent, 0.07)}, transparent 70%)` }}
    />
    <AbsoluteFill style={{ opacity: out }}>
      {/* pixel number */}
      {blocks.map(({ c, r }, k) => {
        const pop = flyIn
          ? 1
          : spring({ frame: frame - Math.round(Math.hypot(c - cols / 2, r - 3) * 1.4), fps, config: { damping: 11, stiffness: 170, mass: 0.6 } });
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: gx + c * cell + cell * 0.08,
              top: gy + r * cell + cell * 0.08,
              width: cell * 0.84,
              height: cell * 0.84,
              borderRadius: cell * 0.22,
              transform: `scale(${pop})`,
              opacity: Math.min(pop * 1.5, 1),
              background: `linear-gradient(155deg, ${rgba('#ffffff', 0.35)} 0%, ${rgba(accent, 0.95)} 35%, ${rgba(accent, 0.85)} 100%)`,
              boxShadow: `inset 0 ${2 * s}px 0 ${rgba('#ffffff', 0.45)}, 0 0 ${18 * s}px ${rgba(accent, 0.45)}`,
            }}
          />
        );
      })}

      {/* left column */}
      <div style={{ position: 'absolute', left: 160 * s, top: 410 * s, width: 820 * s }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 26 * s,
            letterSpacing: 9 * s,
            color: accent,
            opacity: labelIn,
            whiteSpace: 'pre',
          }}
        >
          ✷ {label.slice(0, visibleChars)}
        </div>
        <div style={{ marginTop: 26 * s }}>
          {titleLines.map((line, k) => {
            const t = reveal(18 + k * 4);
            return (
              <div key={k} style={{ overflow: 'hidden', paddingBottom: 6 * s }}>
                <div
                  style={{
                    fontFamily: GROTESK,
                    fontWeight: 600,
                    fontSize: 104 * s,
                    lineHeight: 1.0,
                    letterSpacing: -2 * s,
                    color: textColor,
                    transform: `translateY(${(1 - t) * 110}%)`,
                  }}
                >
                  {line}
                </div>
              </div>
            );
          })}
        </div>
        {item.tag && (
          <div
            style={{
              marginTop: 30 * s,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14 * s,
              padding: `${12 * s}px ${26 * s}px`,
              borderRadius: 40 * s,
              border: `${1.5 * s}px solid ${rgba(accent, 0.45)}`,
              background: rgba(accent, 0.08),
              fontFamily: GROTESK,
              fontSize: 28 * s,
              color: textColor,
              transform: `scale(${pillIn})`,
              transformOrigin: 'left center',
            }}
          >
            <span style={{ width: 10 * s, height: 10 * s, borderRadius: '50%', background: accent }} />
            {item.tag}
          </div>
        )}
      </div>

      {/* right side: built-in demo */}
      {DemoComp && (
        <div style={{ position: 'absolute', right: 120 * s, top: 170 * s, display: 'flex', justifyContent: 'flex-end' }}>
          <DemoComp
            item={item}
            accent={accent}
            s={s}
            frame={frame - slotDelay}
            fps={fps}
            durationInFrames={durationInFrames - slotDelay}
          />
        </div>
      )}

      {/* right side: open slot (library component, image or video) */}
      {(LibraryComp || ((p.rightSide === 'My image' || p.rightSide === 'My video') && mediaSrc)) && (
        <div
          style={{
            position: 'absolute',
            right: 120 * s,
            top: 470 * s - slotH / 2,
            width: slotW,
            height: slotH,
            borderRadius: p.slotFrame ? 22 * s : 0,
            overflow: 'hidden',
            border: p.slotFrame ? `${1.5 * s}px solid ${rgba(accent, 0.35)}` : undefined,
            boxShadow: p.slotFrame ? `0 ${30 * s}px ${70 * s}px rgba(0,0,0,0.55)` : undefined,
            opacity: slotIn,
            transform: `translateX(${(1 - slotIn) * 80 * s}px)`,
          }}
        >
          <Sequence from={slotDelay} layout="none">
            {LibraryComp ? (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width,
                  height,
                  transform: `scale(${slotW / width})`,
                  transformOrigin: 'top left',
                }}
              >
                <LibraryComp />
              </div>
            ) : p.rightSide === 'My image' ? (
              <Img src={mediaSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <OffthreadVideo src={mediaSrc} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </Sequence>
        </div>
      )}

      {/* progress bar */}
      <div
        style={{
          position: 'absolute',
          left: 160 * s,
          right: 160 * s,
          bottom: 100 * s,
          display: 'flex',
          gap: 10 * s,
          opacity: barIn,
        }}
      >
        {Array.from({ length: total }).map((_, k) => {
          const fill =
            k < index ? 1 : k === index ? interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
          return (
            <div key={k} style={{ flex: 1, height: 6 * s, borderRadius: 3 * s, background: rgba(textColor, 0.1), overflow: 'hidden' }}>
              <div style={{ width: `${fill * 100}%`, height: '100%', background: accent }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
    </AbsoluteFill>
  );
};

