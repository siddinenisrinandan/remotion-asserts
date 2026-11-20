import React, { useId } from 'react';
import { AbsoluteFill, Easing, random } from 'remotion';
import { linearTiming } from '@remotion/transitions';
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
  TransitionTiming,
} from '@remotion/transitions';
import type { SfxName } from '../sfx';

// -----------------------------------------------------------
// TRANSITIONS PACK
// Own-designed cuts for <TransitionSeries>. CSS / SVG filters only,
// so they stay light even on video. Use them like this:
//
//   const t = makeTransition('Whip pan', { intensity: 0.8 });
//   <TransitionSeries.Transition presentation={t.presentation} timing={t.timing} />
//
// Each transition has a default length, easing and a matching sound.
// -----------------------------------------------------------

export const TRANSITION_NAMES = [
  'Zoom punch',
  'Whip pan',
  'Glitch cut',
  'Light leak',
  'Zoom-through',
  'Color sweep',
  'Center reveal',
] as const;
export type TransitionName = (typeof TRANSITION_NAMES)[number];

export type Direction = 'Left' | 'Right' | 'Up' | 'Down';

/** Settings shared by every transition. Not every transition uses every field. */
export type PackProps = {
  /** 0 to 1: how strong the zoom / blur / glitch / flash is */
  intensity: number;
  /** Which way the whip pan travels */
  direction: Direction;
  /** Light-leak and flash colour */
  color: string;
};

type Props = TransitionPresentationComponentProps<PackProps>;

const FILL: React.CSSProperties = { position: 'absolute', inset: 0 };

/** A filter id that is safe inside url(#...) */
const useFilterId = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

// Rises 0 → 1 → 0 over the transition; peaks at the cut.
const bell = (p: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, p)));

// -----------------------------------------------------------
// 1. ZOOM PUNCH: old shot rushes into the camera, new shot lands from a zoom.
// -----------------------------------------------------------
const ZoomPunch: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const k = passedProps.intensity;
  const entering = presentationDirection === 'entering';
  let style: React.CSSProperties;
  if (!entering) {
    const t = Math.min(1, p * 2); // only the first half
    style = {
      transform: `scale(${1 + t * t * 1.6 * k})`,
      filter: `blur(${t * 14 * k}px) brightness(${1 + t * 0.35 * k})`,
    };
  } else {
    const t = Math.max(0, p * 2 - 1); // only the second half
    const left = 1 - t;
    style = {
      opacity: p < 0.5 ? 0 : 1,
      transform: `scale(${1 + left * left * 0.9 * k})`,
      filter: `blur(${left * 12 * k}px) brightness(${1 + left * 0.35 * k})`,
    };
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={style}>{children}</AbsoluteFill>
      {entering ? (
        <AbsoluteFill style={{ backgroundColor: passedProps.color, opacity: bell(p) ** 6 * 0.55 * k, pointerEvents: 'none' }} />
      ) : null}
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// 2. WHIP PAN: both shots slide fast with a sideways motion blur.
// -----------------------------------------------------------
const OFFSETS: Record<Direction, [number, number]> = {
  Left: [-1, 0],
  Right: [1, 0],
  Up: [0, -1],
  Down: [0, 1],
};

const WhipPan: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const id = useFilterId('whip');
  const [dx, dy] = OFFSETS[passedProps.direction];
  const shift = presentationDirection === 'exiting' ? p : p - 1; // exiting leaves, entering follows
  const blur = bell(p) * 60 * passedProps.intensity;
  const horizontal = dx !== 0;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={horizontal ? `${blur} 0` : `0 ${blur}`} />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          transform: `translate(${shift * dx * 100}%, ${shift * dy * 100}%) scale(${1 + bell(p) * 0.06})`,
          filter: blur > 0.5 ? `url(#${id})` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// 3. GLITCH CUT: colour channels split, rows tear sideways, hard cut in the middle.
// -----------------------------------------------------------
const GlitchCut: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const id = useFilterId('glitch');
  const k = passedProps.intensity;
  const entering = presentationDirection === 'entering';
  const step = Math.floor(p * 24); // new glitch pattern ~ every frame
  const amount = bell(p) * k;
  const split = 4 + amount * 26;
  const tear = amount * 120;
  const jitterX = (random(`gx-${step}`) - 0.5) * 40 * amount;
  const jitterY = (random(`gy-${step}`) - 0.5) * 10 * amount;
  // A couple of single-frame flickers back to the old shot make it feel digital.
  const flicker = random(`fl-${step}`) < 0.18 * k;
  const visible = entering ? (p >= 0.5) !== flicker : true;

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          {/* Horizontal bands of noise, used to push rows left/right */}
          <feTurbulence type="fractalNoise" baseFrequency="0.00001 0.035" numOctaves={1} seed={step} result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="1.6 0 0 0 -0.3  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 1"
            result="bands"
          />
          <feDisplacementMap in="SourceGraphic" in2="bands" scale={tear} xChannelSelector="R" yChannelSelector="G" result="torn" />
          {/* RGB split: pull red one way, blue the other, add them back up */}
          <feColorMatrix in="torn" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={split} result="r2" />
          <feColorMatrix in="torn" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="torn" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-split} result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          opacity: visible ? 1 : 0,
          // slight zoom hides the torn rows' empty edges
          transform: `translate(${jitterX}px, ${jitterY}px) scale(${1 + amount * 0.1})`,
          filter: amount > 0.02 ? `url(#${id})` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
      {entering && amount > 0.05 ? <GlitchBars step={step} amount={amount} /> : null}
    </AbsoluteFill>
  );
};

const GlitchBars: React.FC<{ step: number; amount: number }> = ({ step, amount }) => {
  const bars = Array.from({ length: 5 }, (_, i) => {
    const show = random(`bs-${step}-${i}`) < 0.55;
    if (!show) return null;
    const top = random(`bt-${step}-${i}`) * 100;
    const h = 0.6 + random(`bh-${step}-${i}`) * 5;
    const left = random(`bl-${step}-${i}`) * 50;
    const w = 20 + random(`bw-${step}-${i}`) * 70;
    const colors = ['#ff2d55', '#00e5ff', '#ffffff', '#b6ff00'];
    const c = colors[Math.floor(random(`bc-${step}-${i}`) * colors.length)];
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: `${top}%`,
          left: `${left}%`,
          width: `${w}%`,
          height: `${h}%`,
          background: c,
          mixBlendMode: 'difference',
          opacity: 0.85 * amount,
        }}
      />
    );
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {bars}
      {/* scanlines */}
      <div
        style={{
          ...FILL,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 5px)',
          opacity: amount * 0.8,
        }}
      />
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// 4. LIGHT LEAK: a warm burst of light washes over and reveals the new shot.
// -----------------------------------------------------------
const LightLeak: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const k = passedProps.intensity;
  const entering = presentationDirection === 'entering';
  const glow = bell(p);
  const contentStyle: React.CSSProperties = entering
    ? {
        opacity: Easing.inOut(Easing.quad)(Math.min(1, Math.max(0, (p - 0.3) / 0.4))),
        filter: `brightness(${1 + (1 - p) * 0.8 * k}) saturate(${1 + (1 - p) * 0.3})`,
      }
    : { filter: `brightness(${1 + p * 0.8 * k}) saturate(${1 + p * 0.3})` };

  // The leak drifts across the frame while it grows and fades.
  const x = 10 + p * 80;
  const y = 30 + Math.sin(p * Math.PI) * 25;
  const c = passedProps.color;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={contentStyle}>{children}</AbsoluteFill>
      {entering ? (
        <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: glow * k }}>
          <div
            style={{
              ...FILL,
              background: `radial-gradient(ellipse 55% 75% at ${x}% ${y}%, ${c} 0%, ${c}aa 30%, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />
          <div
            style={{
              ...FILL,
              background: `radial-gradient(ellipse 35% 50% at ${100 - x * 0.7}% ${85 - y * 0.5}%, #ffffff 0%, ${c}88 40%, transparent 75%)`,
              opacity: glow,
            }}
          />
          <div style={{ ...FILL, background: '#fff', opacity: glow ** 4 * 0.6 }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// 5. ZOOM-THROUGH: new shot appears as a small box in the center and
//    grows to fill the screen while the old shot pushes past behind it.
// -----------------------------------------------------------
const ZoomThrough: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const k = passedProps.intensity;
  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${1 + p * 0.5 * k})`,
          filter: `blur(${p * 10 * k}px) brightness(${1 - p * 0.55 * k})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  const scale = 0.12 + 0.88 * p;
  // Corners and border are drawn at screen size, so divide by scale to keep them steady.
  const radius = (1 - p) * 60;
  const border = (1 - p) * 10;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          borderRadius: radius / scale,
          overflow: 'hidden',
          boxShadow: p < 1 ? `0 ${30 / scale}px ${90 / scale}px rgba(0,0,0,${0.6 * (1 - p)})` : undefined,
        }}
      >
        {children}
        {border > 0.3 ? (
          <AbsoluteFill
            style={{
              borderRadius: radius / scale,
              border: `${border / scale}px solid rgba(255,255,255,${0.9 * (1 - p)})`,
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// 6. COLOR SWEEP: a straight edge sweeps across and uncovers the new shot,
//    led by a thin band of colour. The old shot drifts away a little.
// -----------------------------------------------------------
const ColorSweep: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const k = passedProps.intensity;
  const d = passedProps.direction;
  if (presentationDirection === 'exiting') {
    const [dx, dy] = OFFSETS[d];
    return (
      <AbsoluteFill style={{ transform: `translate(${dx * p * 12 * k}%, ${dy * p * 12 * k}%)`, filter: `brightness(${1 - p * 0.3 * k})` }}>
        {children}
      </AbsoluteFill>
    );
  }
  const hidden = (1 - p) * 100; // % of the new shot still covered
  const inset =
    d === 'Up' ? `${hidden}% 0 0 0` : d === 'Down' ? `0 0 ${hidden}% 0` : d === 'Left' ? `0 0 0 ${hidden}%` : `0 ${hidden}% 0 0`;
  const band = 2.2 * k; // thickness of the colour edge, in %
  const vertical = d === 'Up' || d === 'Down';
  const bandStyle: React.CSSProperties = vertical
    ? { left: 0, right: 0, height: `${band}%`, top: d === 'Up' ? `${hidden - band}%` : `${100 - hidden}%` }
    : { top: 0, bottom: 0, width: `${band}%`, left: d === 'Left' ? `${hidden - band}%` : `${100 - hidden}%` };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${inset})` }}>{children}</AbsoluteFill>
      {p > 0 && p < 1 ? <div style={{ position: 'absolute', background: passedProps.color, ...bandStyle }} /> : null}
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// 7. CENTER REVEAL: the new shot opens from a thin slit in the middle out to
//    the sides, with two small wave marks riding the edges.
// -----------------------------------------------------------
const Wave: React.FC<{ color: string; flip?: boolean }> = ({ color, flip }) => (
  <svg width={90} height={30} viewBox="0 0 90 30" style={{ transform: flip ? 'scaleX(-1)' : undefined, overflow: 'visible' }}>
    <path d="M2 15 C 14 3, 26 3, 38 15 S 62 27, 74 15 S 86 9, 88 12" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

const CenterReveal: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, passedProps }) => {
  const k = passedProps.intensity;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{ filter: `brightness(${1 - p * 0.5 * k}) blur(${p * 4 * k}px)` }}>{children}</AbsoluteFill>;
  }
  const side = (1 - p) * 50; // % covered on each side
  const markOpacity = Math.min(1, p * 6) * Math.min(1, (1 - p) * 5);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${side}% 0 ${side}%)` }}>
        <AbsoluteFill style={{ transform: `scale(${1 + (1 - p) * 0.12 * k})` }}>{children}</AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: markOpacity, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: `${side}%`, transform: 'translate(-100%, -50%)', paddingRight: 14 }}>
          <Wave color={passedProps.color} />
        </div>
        <div style={{ position: 'absolute', top: '50%', left: `${100 - side}%`, transform: 'translate(0, -50%)', paddingLeft: 14 }}>
          <Wave color={passedProps.color} flip />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// Registry: everything the editor / AI needs to know about each transition.
// -----------------------------------------------------------
type TransitionInfo = {
  component: React.FC<Props>;
  /** Default length at 30 fps */
  frames: number;
  easing: (t: number) => number;
  sound: SfxName;
  /** How long to play the sound (seconds), if it should be cut short */
  soundSeconds?: number;
  /** Render cost on a normal laptop */
  performance: 'light' | 'medium';
  description: string;
};

export const TRANSITIONS: Record<TransitionName, TransitionInfo> = {
  'Zoom punch': {
    component: ZoomPunch,
    frames: 12,
    easing: Easing.inOut(Easing.cubic),
    sound: 'whoosh-air',
    performance: 'light',
    description: 'Old shot zooms into the camera, new shot lands from a zoom. Energetic, good on beats.',
  },
  'Whip pan': {
    component: WhipPan,
    frames: 10,
    easing: Easing.inOut(Easing.exp),
    sound: 'whoosh-swipe-clean',
    performance: 'medium',
    description: 'Fast sideways swipe with motion blur, like the camera whipping to a new spot.',
  },
  'Glitch cut': {
    component: GlitchCut,
    frames: 12,
    easing: (t) => t,
    sound: 'glitch-digital-error',
    soundSeconds: 0.5,
    performance: 'medium',
    description: 'RGB split, torn rows and flicker. Tech, gaming and "plot twist" moments.',
  },
  'Light leak': {
    component: LightLeak,
    frames: 22,
    easing: Easing.inOut(Easing.sin),
    sound: 'whoosh-soft',
    performance: 'light',
    description: 'Warm film-style burst of light that washes into the next shot. Vlogs, travel, emotional cuts.',
  },
  'Zoom-through': {
    component: ZoomThrough,
    frames: 18,
    easing: Easing.bezier(0.7, 0, 0.2, 1),
    sound: 'whoosh-air',
    performance: 'light',
    description: 'New shot pops up as a small box in the center and zooms to fill the screen. Explainers, "next point" moments.',
  },
  'Color sweep': {
    component: ColorSweep,
    frames: 16,
    easing: Easing.bezier(0.65, 0, 0.35, 1),
    sound: 'whoosh-swipe-clean',
    performance: 'light',
    description: 'A straight edge with a colour band sweeps across and uncovers the next shot. Clean, documentary feel.',
  },
  'Center reveal': {
    component: CenterReveal,
    frames: 20,
    easing: Easing.bezier(0.6, 0, 0.25, 1),
    sound: 'whoosh-soft',
    performance: 'light',
    description: 'Next shot opens from a slit in the middle out to the sides, with wave marks on the edges. Titles, dates, reveals.',
  },
};

export const packDefaults: PackProps = {
  intensity: 0.8,
  direction: 'Left',
  color: '#ff9a3c',
};

/** Ready-to-use presentation + timing for <TransitionSeries.Transition>. */
export const makeTransition = (
  name: TransitionName,
  options: Partial<PackProps> & { frames?: number } = {},
): { presentation: TransitionPresentation<PackProps>; timing: TransitionTiming; frames: number } => {
  const info = TRANSITIONS[name];
  const frames = Math.max(2, Math.round(options.frames ?? info.frames));
  return {
    presentation: { component: info.component, props: { ...packDefaults, ...options } },
    timing: linearTiming({ durationInFrames: frames, easing: info.easing }),
    frames,
  };
};
