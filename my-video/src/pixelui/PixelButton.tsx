import React from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import {
  clamp01,
  mirrorTime,
  PALETTE_NAMES,
  PIXEL_FONT,
  PIXEL_PALETTES,
  pillRows,
  pixelBob,
  popIn,
} from './pixelCommon';

// -----------------------------------------------------------
// PIXEL BUTTON  (retro game UI pill: MENU / START / LEVEL UP! ...)
// Reveal: coloured pixel stripes burst open first (a slit, a beam, a
// wipe or a pop), the black-outlined white pill follows, then the
// letters flicker in through the palette colours before settling.
// The exit is the exact same animation played backwards.
// -----------------------------------------------------------

export const BUTTON_REVEALS = ['Slit', 'Beam', 'Wipe', 'Pop'] as const;

export const pixelButtonSchema = z.object({
  label: z.string(),
  reveal: z.enum(BUTTON_REVEALS).describe('Slit = opens sideways, Beam = opens up/down, Wipe = left to right, Pop = grows'),
  palette: z.enum(PALETTE_NAMES as [string, ...string[]]),
  unit: z.number().min(2).max(24).step(1).describe('Size of one pixel (px)'),
  fillColor: zColor(),
  outlineColor: zColor(),
  textColor: zColor(),
  letterGlitch: z.boolean().describe('Letters flicker through palette colours as they appear'),
  bob: z.boolean().describe('Stepped idle float'),
  speed: z.number().min(0.3).max(3).step(0.1),
  backgroundColor: zColor(),
  transparentBackground: z.boolean(),
  seconds: z.number().min(1).max(20).step(0.1),
});
export type PixelButtonProps = z.infer<typeof pixelButtonSchema>;

export const pixelButtonDefaults: PixelButtonProps = {
  label: 'MENU',
  reveal: 'Slit',
  palette: 'Fire',
  unit: 10,
  fillColor: '#ffffff',
  outlineColor: '#0d0d0d',
  textColor: '#0d0d0d',
  letterGlitch: true,
  bob: true,
  speed: 1,
  backgroundColor: '#333333',
  transparentBackground: false,
  seconds: 3,
};

const H = 12; // pill height in units

export const PixelButton: React.FC<Partial<PixelButtonProps> & { frames?: number; transparent?: boolean }> = ({
  frames,
  transparent,
  ...rest
}) => {
  const p = { ...pixelButtonDefaults, ...rest };
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const total = frames ?? durationInFrames;
  const t = mirrorTime(frame, total) * p.speed;

  const colors = [...(PIXEL_PALETTES[p.palette as keyof typeof PIXEL_PALETTES] ?? PIXEL_PALETTES.Fire)];
  const n = colors.length;
  const u = p.unit;
  const fontPx = u * 5.4;
  const chars = Array.from(p.label);
  const W = Math.max(H + 4, Math.ceil((chars.length * fontPx * 0.66) / u) + 10);

  // layer timings: coloured stripes lead, main pill (index n) last
  const STAGGER = 2;
  const DUR = 11;
  const prog = (i: number) => popIn(t, i * STAGGER, DUR, i === n ? 1.2 : 1.8);
  const pMain = prog(n);
  const settle = clamp01(pMain);
  const MAXB = n * 2;

  const dims = (i: number) => {
    const pi = prog(i);
    const b = i === n ? 0 : Math.round((n - i) * 2 * (1 - settle));
    const fullW = W + b * 2;
    const fullH = H + b * 2;
    switch (p.reveal) {
      case 'Beam':
        return { w: fullW, h: pi <= 0 ? 0 : Math.max(1, Math.round(fullH * pi)), cut: Infinity, b };
      case 'Wipe':
        return { w: fullW, h: fullH, cut: pi <= 0 ? 0 : Math.round(fullW * Math.min(pi, 1)), b };
      case 'Pop':
        return {
          w: pi <= 0 ? 0 : Math.max(1, Math.round(fullW * pi)),
          h: pi <= 0 ? 0 : Math.max(1, Math.round(fullH * pi)),
          cut: Infinity,
          b,
        };
      case 'Slit':
      default:
        return { w: pi <= 0 ? 0 : Math.max(1, Math.round(fullW * pi)), h: fullH, cut: Infinity, b };
    }
  };

  const boxW = W + MAXB * 2 + 8;
  const boxH = H + MAXB * 2 + 8;
  const cx = boxW / 2;
  const cy = boxH / 2;
  const place = (w: number, h: number, wipeLeft: number) =>
    p.reveal === 'Wipe'
      ? { x: wipeLeft, y: Math.floor(cy - h / 2) }
      : { x: Math.floor(cx - w / 2), y: Math.floor(cy - h / 2) };

  const rects: React.ReactNode[] = [];
  // coloured stripes (hidden once the pill has fully landed)
  if (settle < 1) {
    for (let i = 0; i < n; i++) {
      const d = dims(i);
      const pos = place(d.w, d.h, Math.floor(cx - W / 2) - d.b);
      rects.push(...pillRows(d.w, d.h, pos.x, pos.y, colors[i], `c${i}`, d.cut));
    }
  }
  // main pill: outline, then fill (bottom edge is 2px thick = little drop)
  const m = dims(n);
  const mp = place(m.w, m.h, Math.floor(cx - W / 2));
  rects.push(...pillRows(m.w, m.h, mp.x, mp.y, p.outlineColor, 'o', m.cut));
  if (m.w > 2 && m.h > 3) {
    rects.push(...pillRows(m.w - 2, m.h - 3, mp.x + 1, mp.y + 1, p.fillColor, 'f', m.cut - 1));
  }

  // letters
  const textStart = n * STAGGER + DUR * 0.55;
  const GL = 5;
  const letters = chars.map((ch, j) => {
    const appear = textStart + j * 1.3;
    const age = t - appear;
    if (age < 0) return <span key={j} style={{ opacity: 0 }}>{ch}</span>;
    const glitching = p.letterGlitch && age < GL;
    const color = glitching ? colors[(j + Math.floor(frame / 1.5)) % n] : p.textColor;
    const jx = glitching ? Math.round((random(`pb-${j}-${frame}`) - 0.5) * 2) * u : 0;
    return (
      <span key={j} style={{ color, display: 'inline-block', transform: `translateX(${jx}px)` }}>
        {ch === ' ' ? ' ' : ch}
      </span>
    );
  });

  const bobY = settle >= 1 ? pixelBob(frame, u, p.bob) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: transparent || p.transparentBackground ? 'transparent' : p.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: boxW * u, height: boxH * u, transform: `translateY(${bobY}px)` }}>
        <svg width={boxW * u} height={boxH * u} viewBox={`0 0 ${boxW} ${boxH}`} shapeRendering="crispEdges" style={{ position: 'absolute', inset: 0 }}>
          {rects}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: u,
            fontFamily: PIXEL_FONT,
            fontWeight: 700,
            fontSize: fontPx,
            letterSpacing: u * 0.2,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {letters}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PIXEL_BUTTON_PRESETS: { id: string; props: PixelButtonProps }[] = [
  { id: 'Pixel-Menu', props: { ...pixelButtonDefaults, label: 'MENU', reveal: 'Slit', palette: 'Fire' } },
  { id: 'Pixel-Pause', props: { ...pixelButtonDefaults, label: 'PAUSE', reveal: 'Slit', palette: 'Ice' } },
  { id: 'Pixel-Start', props: { ...pixelButtonDefaults, label: 'START', reveal: 'Beam', palette: 'Lime' } },
  { id: 'Pixel-Play', props: { ...pixelButtonDefaults, label: 'PLAY', reveal: 'Wipe', palette: 'Neon' } },
  { id: 'Pixel-LevelUp', props: { ...pixelButtonDefaults, label: 'LEVEL UP!', reveal: 'Slit', palette: 'Fire' } },
  { id: 'Pixel-GameOver', props: { ...pixelButtonDefaults, label: 'GAME OVER!', reveal: 'Beam', palette: 'Ice' } },
  { id: 'Pixel-Continue', props: { ...pixelButtonDefaults, label: 'CONTINUE?', reveal: 'Pop', palette: 'Candy' } },
];
