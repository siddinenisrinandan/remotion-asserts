import React from 'react';
import { Easing, interpolate } from 'remotion';
import { loadFont } from '@remotion/google-fonts/PixelifySans';

// -----------------------------------------------------------
// PIXEL UI — shared bits (palettes, easing, pixel-shape builder)
// Everything is drawn on an integer "unit" grid so edges stay
// crisp and stepped like real pixel art.
// -----------------------------------------------------------

export const PIXEL_FONT = loadFont('normal', { weights: ['700'], subsets: ['latin'] }).fontFamily;

export const PIXEL_PALETTES = {
  Fire: ['#ff2e63', '#ff7a1a', '#ffd21a'],
  Ice: ['#1f5bff', '#2fb8ff', '#9ff0ff'],
  Lime: ['#2f6bff', '#2bffb0', '#7dff3a'],
  Neon: ['#6b2bff', '#c22bff', '#ff2bd6'],
  Candy: ['#ff4fa3', '#ffd21a', '#33d1ff'],
} as const;
export const PALETTE_NAMES = Object.keys(PIXEL_PALETTES) as (keyof typeof PIXEL_PALETTES)[];
export type PaletteName = keyof typeof PIXEL_PALETTES;

/** 0 → 1 over [start, start+dur], with a little pixel-pop overshoot. */
export const popIn = (f: number, start: number, dur: number, overshoot = 1.4) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(overshoot)),
  });

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Exit = the entry played backwards. Given the real frame and the total
 * length, returns the "animation time" to evaluate the entry timeline at.
 */
export const mirrorTime = (frame: number, total: number) => Math.min(frame, total - 1 - frame);

/** Stepped idle float — moves a whole pixel at a time. */
export const pixelBob = (frame: number, unit: number, on: boolean) =>
  on ? Math.round(Math.sin(frame / 11)) * unit * 0.5 : 0;

// rounded-pill corner profile (how far each edge row is pulled in)
const CAP = [3, 2, 1, 1];

/**
 * Stepped pill shape as one <rect> per row.
 * w/h in units, x0/y0 = top-left in units, cutX = only draw columns < cutX (for wipes).
 */
export const pillRows = (
  w: number,
  h: number,
  x0: number,
  y0: number,
  color: string,
  key: string,
  cutX = Infinity,
): React.ReactNode[] => {
  if (w <= 0 || h <= 0) return [];
  const out: React.ReactNode[] = [];
  for (let r = 0; r < h; r++) {
    const edge = Math.min(r, h - 1 - r);
    let inset = edge < CAP.length ? CAP[edge] : 0;
    inset = Math.min(inset, Math.floor((w - 1) / 2));
    const x = x0 + inset;
    const rw = Math.min(w - inset * 2, cutX - inset);
    if (rw <= 0) continue;
    out.push(<rect key={`${key}-${r}`} x={x} y={y0 + r} width={rw} height={1} fill={color} />);
  }
  return out;
};
