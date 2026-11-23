import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { clamp01, mirrorTime, PALETTE_NAMES, PIXEL_PALETTES, pixelBob, popIn } from './pixelCommon';

// -----------------------------------------------------------
// PIXEL ICON  (sword / heart / trophy / coin / star / potion)
// Our own hand-placed pixel bitmaps. Reveals:
//   Slash   – a coloured streak cuts diagonally, icon fills in behind it
//   Squeeze – icon stretches open sideways with coloured ghost copies
//   Build   – icon stacks up row by row from the bottom
// Exit = the same animation played backwards.
// -----------------------------------------------------------

const C: Record<string, string> = {
  k: '#0d0d0d',
  w: '#ffffff',
  g: '#b9c3cf',
  s: '#7f8a96',
  y: '#ffcc33',
  d: '#c98a12',
  r: '#e8283c',
  D: '#a3121f',
  b: '#7a4a22',
  c: '#4fd8ff',
  C: '#1f7fd6',
  v: '#9b5cff',
};

const BITMAPS = {
  Sword: [
    '............kkkk',
    '...........kwwwk',
    '..........kwwwgk',
    '.........kwwwgk.',
    '........kwwwgk..',
    '.......kwwwgk...',
    '..kk..kwwwgk....',
    '.kyyk.kwwgk.....',
    '.kkyykkwgk......',
    '..kkyykgk.......',
    '....kyyyk.......',
    '...kbkkyyk......',
    '..kbk..kyk......',
    'kkbk....kk......',
    'kyk.............',
    'kkk.............',
  ],
  Heart: [
    '..kkk...kkk..',
    '.krrrk.krrrk.',
    'krwwrrkrrrrrk',
    'krwrrrrrrrrrk',
    'krrrrrrrrrrDk',
    'krrrrrrrrrrDk',
    '.krrrrrrrrDk.',
    '..krrrrrrDk..',
    '...krrrrDk...',
    '....krrDk....',
    '.....kDk.....',
    '......k......',
  ],
  Trophy: [
    '..kkkkkkkkkk..',
    'kkkyywyyyyykkk',
    'k.kyywyyyydk.k',
    'k.kyywyyyydk.k',
    'k.kyyyyyyydk.k',
    '.kkyyyyyyydkk.',
    '...kyyyyydk...',
    '....kyyydk....',
    '.....kyyk.....',
    '.....kydk.....',
    '....kkyykk....',
    '...kyyyyddk...',
    '...kkkkkkkk...',
  ],
  Coin: [
    '...kkkkkk...',
    '.kkyyyyyykk.',
    '.kywyyyyydk.',
    'kywyykkyyydk',
    'kyyyykdyyydk',
    'kyyyykdyyydk',
    'kyyyykdyyydk',
    'kyyyykdyyydk',
    'kyyyyyyyyddk',
    '.kyyyyyyddk.',
    '.kkddddddkk.',
    '...kkkkkk...',
  ],
  Star: [
    '......k......',
    '.....kyk.....',
    '.....kyk.....',
    '....kywyk....',
    'kkkkkywykkkkk',
    'kyyyyyyyyyydk',
    '.kyyyyyyyydk.',
    '..kyyyyyydk..',
    '..kyyyyyydk..',
    '.kyyydkyyydk.',
    '.kydk...kydk.',
    '.kkk.....kkk.',
  ],
  Potion: [
    '....kkkk....',
    '....kbbk....',
    '....kkkk....',
    '.....kgk....',
    '.....kgk....',
    '...kkkgkkk..',
    '..kgggggggk.',
    '.kgcwcccccCk',
    '.kcwcccccCCk',
    '.kcccvcccCCk',
    '.kccccccCCCk',
    '..kCCCCCCCk.',
    '...kkkkkkk..',
  ],
} as const;

export const ICON_NAMES = Object.keys(BITMAPS) as (keyof typeof BITMAPS)[];
export const ICON_REVEALS = ['Slash', 'Squeeze', 'Build'] as const;

export const pixelIconSchema = z.object({
  icon: z.enum(ICON_NAMES as [string, ...string[]]),
  reveal: z.enum(ICON_REVEALS),
  palette: z.enum(PALETTE_NAMES as [string, ...string[]]),
  unit: z.number().min(2).max(30).step(1).describe('Size of one pixel (px)'),
  bob: z.boolean(),
  speed: z.number().min(0.3).max(3).step(0.1),
  backgroundColor: zColor(),
  transparentBackground: z.boolean(),
  seconds: z.number().min(1).max(20).step(0.1),
});
export type PixelIconProps = z.infer<typeof pixelIconSchema>;

export const pixelIconDefaults: PixelIconProps = {
  icon: 'Sword',
  reveal: 'Slash',
  palette: 'Fire',
  unit: 14,
  bob: true,
  speed: 1,
  backgroundColor: '#333333',
  transparentBackground: false,
  seconds: 3,
};

export const PixelIcon: React.FC<Partial<PixelIconProps> & { frames?: number; transparent?: boolean }> = ({
  frames,
  transparent,
  ...rest
}) => {
  const p = { ...pixelIconDefaults, ...rest };
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const total = frames ?? durationInFrames;
  const t = mirrorTime(frame, total) * p.speed;
  const u = p.unit;
  const colors = [...(PIXEL_PALETTES[p.palette as keyof typeof PIXEL_PALETTES] ?? PIXEL_PALETTES.Fire)];
  const bmp = BITMAPS[p.icon as keyof typeof BITMAPS] ?? BITMAPS.Sword;
  const rows = bmp.length;
  const cols = bmp[0].length;
  const PAD = 6;
  const boxW = cols + PAD * 2;
  const boxH = rows + PAD * 2;

  const rects: React.ReactNode[] = [];
  const drawIcon = (key: string, visible: (x: number, y: number) => string | null, dx = 0) => {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ch = bmp[y][x];
        if (ch === '.') continue;
        const fill = visible(x, y);
        if (!fill) continue;
        rects.push(<rect key={`${key}-${x}-${y}`} x={PAD + x + dx} y={PAD + y} width={1} height={1} fill={fill} />);
      }
    }
  };

  let done = false;
  let svgTransform = '';

  if (p.reveal === 'Slash') {
    // streak from bottom-left to top-right; icon fills diagonally just behind it
    const diag = cols + rows; // diagonal index range 0..diag
    const head = popIn(t, 0, 9, 0) * (diag + 6) - 3;
    const tail = popIn(t, 8, 9, 0) * (diag + 6) - 3;
    const fillFront = popIn(t, 4, 10, 0) * (diag + 4) - 2;
    done = t >= 20;
    drawIcon('i', (x, y) => {
      const dIdx = x + (rows - 1 - y);
      if (dIdx > fillFront) return null;
      const near = fillFront - dIdx;
      if (!done && near < 3) return colors[Math.min(2, Math.floor(near))];
      return C[bmp[y][x]];
    });
    // the streak: two parallel stepped lines
    if (head > tail) {
      for (let s = Math.max(tail, -3); s <= head; s++) {
        for (let k = 0; k < 2; k++) {
          const px = Math.round(s * (cols / diag) * 1.2) - 2 + k;
          const py = Math.round(rows + 1 - s * (rows / diag) * 1.2);
          rects.push(<rect key={`s${k}-${s}`} x={PAD + px} y={PAD + py} width={1} height={1} fill={colors[k === 0 ? 2 : 0]} />);
        }
      }
    }
  } else if (p.reveal === 'Squeeze') {
    const pr = popIn(t, 2, 12, 2);
    done = pr >= 1 && t > 16;
    const ghost = clamp01(1 - pr);
    if (!done) {
      const off = Math.round(ghost * 5) + 1;
      drawIcon('g0', () => colors[0], -off);
      drawIcon('g1', () => colors[2], off);
      drawIcon('g2', () => colors[1], Math.round(-off / 2));
    }
    drawIcon('i', (x, y) => (!done && pr < 0.7 ? (x % 2 === 0 ? '#ffffff' : colors[0]) : C[bmp[y][x]]));
    const sx = Math.max(0.02, pr);
    svgTransform = `scaleX(${sx}) scaleY(${1 + (1 - Math.min(pr, 1)) * 0.25})`;
    if (t <= 2) rects.length = 0;
  } else {
    // Build: rows stack up from the bottom
    const shown = Math.round(popIn(t, 0, 14, 0) * rows);
    done = t >= 18;
    drawIcon('i', (x, y) => {
      const fromBottom = rows - 1 - y;
      if (fromBottom >= shown) return null;
      if (!done && shown - fromBottom <= 2) return colors[(shown - fromBottom) % colors.length];
      return C[bmp[y][x]];
    });
  }

  const bobY = done ? pixelBob(frame, u, p.bob) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: transparent || p.transparentBackground ? 'transparent' : p.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={boxW * u}
        height={boxH * u}
        viewBox={`0 0 ${boxW} ${boxH}`}
        shapeRendering="crispEdges"
        style={{ transform: `translateY(${bobY}px) ${svgTransform}`, overflow: 'visible' }}
      >
        {rects}
      </svg>
    </AbsoluteFill>
  );
};

export const PIXEL_ICON_PRESETS: { id: string; props: PixelIconProps }[] = [
  { id: 'Pixel-Sword', props: { ...pixelIconDefaults, icon: 'Sword', reveal: 'Slash', palette: 'Fire' } },
  { id: 'Pixel-Heart', props: { ...pixelIconDefaults, icon: 'Heart', reveal: 'Squeeze', palette: 'Candy' } },
  { id: 'Pixel-Trophy', props: { ...pixelIconDefaults, icon: 'Trophy', reveal: 'Build', palette: 'Fire' } },
  { id: 'Pixel-Coin', props: { ...pixelIconDefaults, icon: 'Coin', reveal: 'Squeeze', palette: 'Fire' } },
  { id: 'Pixel-Star', props: { ...pixelIconDefaults, icon: 'Star', reveal: 'Slash', palette: 'Lime' } },
  { id: 'Pixel-Potion', props: { ...pixelIconDefaults, icon: 'Potion', reveal: 'Build', palette: 'Neon' } },
];
