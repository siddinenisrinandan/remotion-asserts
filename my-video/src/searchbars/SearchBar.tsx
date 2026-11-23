import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

// -----------------------------------------------------------
// SEARCH BAR  (AI prompt / search box animation)
// Pill-shaped bar that grows in, a glowing gradient border that
// slowly travels around it, the query typed letter by letter with a
// blinking cursor, then the send button "presses".
// Icons are our own drawings (no brand logos).
// -----------------------------------------------------------

const INTER = loadInter('normal', { weights: ['400', '500'], subsets: ['latin'] }).fontFamily;

export const BAR_ICONS = ['Sparkle', 'Search', 'Orbit', 'None'] as const;
export const BAR_BORDERS = ['Rainbow', 'Teal', 'Sunset', 'None'] as const;
export const BAR_BUTTONS = ['Send arrow', 'Round arrow', 'Clear', 'None'] as const;

export const searchBarSchema = z.object({
  theme: z.enum(['Dark', 'Light']),
  icon: z.enum(BAR_ICONS),
  border: z.enum(BAR_BORDERS),
  button: z.enum(BAR_BUTTONS),
  placeholder: z.string().describe('Grey text shown before typing'),
  query: z.string().describe('Text that gets typed'),
  width: z.number().min(400).max(1800).step(10),
  height: z.number().min(60).max(260).step(2),
  fontSize: z.number().min(20).max(120).step(1),
  backgroundColor: zColor(),
  glow: z.number().min(0).max(2).step(0.05).describe('Strength of the coloured glow'),
  borderSpin: z.number().min(0).max(4).step(0.1).describe('Turns of the gradient per 10 s'),
  typeStart: z.number().min(0).max(10).step(0.1).describe('Seconds before typing starts'),
  lettersPerSecond: z.number().min(3).max(40).step(1),
  pressSend: z.boolean().describe('Press the button after typing'),
  seconds: z.number().min(1).max(20).step(0.1),
});
export type SearchBarProps = z.infer<typeof searchBarSchema>;

export const searchBarDefaults: SearchBarProps = {
  theme: 'Dark',
  icon: 'Sparkle',
  border: 'Rainbow',
  button: 'Send arrow',
  placeholder: 'Ask anything',
  query: 'Create a 30 second video about saving money',
  width: 1300,
  height: 130,
  fontSize: 46,
  backgroundColor: '#1f1f1f',
  glow: 1,
  borderSpin: 1,
  typeStart: 0.9,
  lettersPerSecond: 16,
  pressSend: true,
  seconds: 5.5,
};

const GRADIENTS: Record<(typeof BAR_BORDERS)[number], string[]> = {
  Rainbow: ['#ff4d6d', '#ff9f1c', '#ffe14d', '#3ee07a', '#2fd3ff', '#4d6bff', '#b04dff', '#ff4d6d'],
  Teal: ['#2bd1b5', '#7ff0dc', '#2bd1b5', '#1a9f8a', '#2bd1b5'],
  Sunset: ['#ff7a18', '#ff3d6e', '#7a5cff', '#2fd3ff', '#ff7a18'],
  None: [],
};

// ---------- our own icons ----------
const Sparkle: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <defs>
      <linearGradient id="sbSpark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4d8bff" />
        <stop offset="0.5" stopColor="#b04dff" />
        <stop offset="1" stopColor="#ff4d6d" />
      </linearGradient>
    </defs>
    <path d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5C11.4 16.9 7.1 12.6 1.5 12 7.1 11.4 11.4 7.1 12 1.5z" fill="url(#sbSpark)" />
  </svg>
);
const SearchIcon: React.FC<{ s: number; c: string }> = ({ s, c }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={c} strokeWidth="2.4" />
    <path d="M15.5 15.5L21 21" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
const Orbit: React.FC<{ s: number; c: string }> = ({ s, c }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="6" fill="none" stroke={c} strokeWidth="2.4" />
    <ellipse cx="12" cy="12" rx="11" ry="4" fill="none" stroke={c} strokeWidth="1.8" transform="rotate(-35 12 12)" />
  </svg>
);
const Arrow: React.FC<{ s: number; c: string; kind: 'send' | 'round' }> = ({ s, c, kind }) =>
  kind === 'send' ? (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path d="M3 3.5L21.5 12 3 20.5l2.6-8.5z" fill={c} />
    </svg>
  ) : (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
const Clear: React.FC<{ s: number; bg: string; c: string }> = ({ s, bg, c }) => (
  <svg width={s} height={s} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill={bg} />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const SearchBar: React.FC<Partial<SearchBarProps> & { transparent?: boolean }> = ({ transparent, ...props }) => {
  const p = { ...searchBarDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const dark = p.theme === 'Dark';
  const fill = dark ? '#262626' : '#ffffff';
  const ink = dark ? '#f2f2f2' : '#151515';
  const ghost = dark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.36)';

  // entrance: pill grows from a circle into the full bar, then contents fade in
  const grow = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const w = interpolate(grow, [0, 1], [p.height, p.width]);
  const appear = interpolate(frame, [0, 6], [0, 1], clamp);
  const content = interpolate(frame, [10, 20], [0, 1], clamp);
  // exit: shrink back into a circle and fade
  const out = Easing.in(Easing.cubic)(interpolate(frame, [total - 14, total], [0, 1], clamp));

  // typing
  const typed = Math.max(0, Math.floor(((frame - p.typeStart * fps) / fps) * p.lettersPerSecond));
  const text = p.query.slice(0, Math.min(p.query.length, typed));
  const doneAt = p.typeStart * fps + (p.query.length / p.lettersPerSecond) * fps;
  const typing = frame >= p.typeStart * fps && frame < doneAt;
  const cursorOn = typing || Math.floor(frame / (fps * 0.5)) % 2 === 0;

  // send press after typing
  const pressT = frame - (doneAt + 0.45 * fps);
  const press = p.pressSend ? interpolate(pressT, [0, 4, 12], [1, 0.82, 1], clamp) : 1;
  const flash = p.pressSend ? interpolate(pressT, [0, 3, 16], [0, 1, 0], clamp) : 0;

  // border gradient travels around the pill
  const stops = GRADIENTS[p.border];
  const angle = (frame / fps) * (p.borderSpin * 36) + 200;
  const grad = stops.length ? `conic-gradient(from ${angle}deg, ${stops.join(', ')})` : undefined;
  const borderW = Math.max(3, p.height * 0.035);
  const plainBorder = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';

  const iconSize = p.height * 0.42;
  const iconColor = ink;
  const btnSize = p.height * 0.62;
  const roundBtnBg = dark ? '#ffffff' : '#0b0b0b';
  const roundBtnInk = dark ? '#0b0b0b' : '#ffffff';

  const iconEl =
    p.icon === 'Sparkle' ? <Sparkle s={iconSize} /> : p.icon === 'Search' ? <SearchIcon s={iconSize} c={iconColor} /> : p.icon === 'Orbit' ? <Orbit s={iconSize} c={iconColor} /> : null;

  let buttonEl: React.ReactNode = null;
  if (p.button === 'Send arrow') buttonEl = <Arrow s={p.height * 0.36} c={text.length ? ink : ghost} kind="send" />;
  if (p.button === 'Round arrow')
    buttonEl = (
      <div style={{ width: btnSize, height: btnSize, borderRadius: '50%', background: roundBtnBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Arrow s={btnSize * 0.55} c={roundBtnInk} kind="round" />
      </div>
    );
  if (p.button === 'Clear') buttonEl = <Clear s={p.height * 0.32} bg={ink} c={fill} />;

  const glowStrength = p.glow * (0.55 + 0.45 * flash);

  return (
    <AbsoluteFill style={{ backgroundColor: transparent ? undefined : p.backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: w,
          height: p.height,
          opacity: appear * (1 - out),
          transform: `scale(${(0.9 + 0.1 * grow) * (1 - out * 0.15)})`,
        }}
      >
        {/* soft drop shadow, like the reference */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: p.height, boxShadow: `0 ${p.height * 0.28}px ${p.height * 0.5}px rgba(0,0,0,${dark ? 0.55 : 0.28})` }} />
        {/* coloured glow behind the border */}
        {grad && glowStrength > 0 ? (
          <div style={{ position: 'absolute', inset: -borderW, borderRadius: p.height, background: grad, filter: `blur(${p.height * 0.16}px)`, opacity: 0.55 * glowStrength }} />
        ) : null}
        {/* border ring */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: p.height, background: grad ?? plainBorder, padding: borderW }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: p.height,
              background: fill,
              boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 -2px 6px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              padding: `0 ${p.height * 0.32}px`,
              gap: p.height * 0.22,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {iconEl ? <div style={{ display: 'flex', opacity: content, transform: `scale(${0.6 + 0.4 * content})`, flexShrink: 0 }}>{iconEl}</div> : null}
            <div style={{ flex: 1, minWidth: 0, fontFamily: INTER, fontSize: p.fontSize, whiteSpace: 'nowrap', overflow: 'hidden', opacity: content, display: 'flex', alignItems: 'center' }}>
              {text.length === 0 ? (
                <>
                  {frame >= p.typeStart * fps - 6 && cursorOn ? <span style={{ width: 3, height: p.fontSize * 1.05, background: ink, marginRight: 2 }} /> : null}
                  <span style={{ color: ghost }}>{p.placeholder}</span>
                </>
              ) : (
                <>
                  <span style={{ color: ink }}>{text}</span>
                  {cursorOn ? <span style={{ width: 3, height: p.fontSize * 1.05, background: ink, marginLeft: 3 }} /> : null}
                </>
              )}
            </div>
            {buttonEl ? <div style={{ display: 'flex', opacity: content, transform: `scale(${(0.6 + 0.4 * content) * press})`, flexShrink: 0 }}>{buttonEl}</div> : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// presets (own text) + grid preview
// -----------------------------------------------------------
const S = (props: Partial<SearchBarProps>): SearchBarProps => ({ ...searchBarDefaults, ...props });
export const SEARCH_BAR_PRESETS: { id: string; props: SearchBarProps }[] = [
  { id: 'SearchBar-01-Rainbow-Light', props: S({ theme: 'Light', border: 'Rainbow', icon: 'Sparkle', button: 'Send arrow' }) },
  { id: 'SearchBar-02-Rainbow-Dark', props: S({ theme: 'Dark', border: 'Rainbow', icon: 'Sparkle', button: 'Send arrow', backgroundColor: '#f2f2f2' }) },
  { id: 'SearchBar-03-Minimal-Light', props: S({ theme: 'Light', border: 'None', icon: 'Orbit', button: 'Round arrow', glow: 0, query: 'How do I start a podcast?' }) },
  { id: 'SearchBar-04-Minimal-Dark', props: S({ theme: 'Dark', border: 'None', icon: 'Orbit', button: 'Round arrow', glow: 0, backgroundColor: '#f2f2f2', query: 'How do I start a podcast?' }) },
  { id: 'SearchBar-05-Teal-Dark', props: S({ theme: 'Dark', border: 'Teal', icon: 'Orbit', button: 'Send arrow', glow: 0.8, query: 'Explain black holes simply' }) },
  { id: 'SearchBar-06-Teal-Light', props: S({ theme: 'Light', border: 'Teal', icon: 'Orbit', button: 'Send arrow', glow: 0.8, backgroundColor: '#f2f2f2', query: 'Explain black holes simply' }) },
  { id: 'SearchBar-07-Search-Dark', props: S({ theme: 'Dark', border: 'Sunset', icon: 'Search', button: 'Clear', placeholder: 'Search here or paste a link', query: 'best budget cameras 2026', pressSend: false }) },
  { id: 'SearchBar-08-Search-Light', props: S({ theme: 'Light', border: 'Sunset', icon: 'Search', button: 'Clear', placeholder: 'Search here or paste a link', query: 'best budget cameras 2026', pressSend: false, backgroundColor: '#f2f2f2' }) },
];

/** All styles stacked: dark half on top, light half below (like the reference). */
export const SearchBarsGrid: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: 'absolute', inset: 0, bottom: '50%', background: '#1f1f1f' }} />
    <div style={{ position: 'absolute', inset: 0, top: '50%', background: '#f2f2f2' }} />
    {SEARCH_BAR_PRESETS.map((preset, i) => {
      // dark-background presets go in the top half, light-background in the bottom half
      const onDark = preset.props.backgroundColor === '#1f1f1f';
      const slot = SEARCH_BAR_PRESETS.filter((x) => (x.props.backgroundColor === '#1f1f1f') === onDark).indexOf(preset);
      return (
        <div key={preset.id} style={{ position: 'absolute', left: (slot % 2) * 960, top: (onDark ? 0 : 540) + Math.floor(slot / 2) * 270, width: 960, height: 270 }}>
          <Sequence from={i * 4} layout="none">
            <SearchBar {...preset.props} width={820} height={96} fontSize={34} seconds={8} transparent />
          </Sequence>
        </div>
      );
    })}
  </AbsoluteFill>
);
