import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

export const { fontFamily: INTER } = loadInter('normal', {
  weights: ['400', '600', '800', '900'],
  subsets: ['latin'],
});
export const { fontFamily: MONO } = loadMono('normal', {
  weights: ['400', '700'],
  subsets: ['latin'],
});

export const C = {
  bg: '#06080d',
  panel: '#0f141d',
  panelBorder: '#1e2633',
  text: '#f4f6fa',
  muted: '#8b95a7',
  teal: '#2dd4bf',
  gold: '#fbbf24',
  red: '#f43f5e',
  purple: '#a78bfa',
};

/**
 * Cheap background: a soft glow and a slowly drifting dot grid, drawn with
 * plain CSS gradients (no thousands of animated elements like the wave ones).
 */
export const LightBackground: React.FC<{ glow?: string; dots?: number }> = ({
  glow = 'rgba(45,212,191,0.18)',
  dots = 0.09,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: C.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,${dots}) 1.6px, transparent 1.6px)`,
          backgroundSize: '44px 44px',
          backgroundPosition: `0px ${(frame * 0.4) % 44}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 55% at 50% ${55 + Math.sin(frame / 60) * 4}%, ${glow} 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,8,13,0.9) 100%)',
        }}
      />
    </div>
  );
};

/** Fades + slides its children up, starting at `delay` frames. */
export const Reveal: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 40, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Fades a whole scene in at the start and out at the end. */
export const SceneFade: React.FC<{ children: React.ReactNode; out?: number }> = ({
  children,
  out = 15,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - out, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return <div style={{ position: 'absolute', inset: 0, opacity }}>{children}</div>;
};

/** Words appear one by one. */
export const WordByWord: React.FC<{
  text: string;
  delay?: number;
  every?: number;
  style?: React.CSSProperties;
  highlight?: string[];
  highlightColor?: string;
}> = ({ text, delay = 0, every = 4, style, highlight = [], highlightColor = C.teal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.28em', ...style }}>
      {text.split(' ').map((word, i) => {
        const p = spring({ frame: frame - delay - i * every, fps, config: { damping: 200 } });
        const clean = word.replace(/[.,]/g, '');
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
              filter: `blur(${interpolate(p, [0, 1], [8, 0])}px)`,
              color: highlight.includes(clean) ? highlightColor : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
