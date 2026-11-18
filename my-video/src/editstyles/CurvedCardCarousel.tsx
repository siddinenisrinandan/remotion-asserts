import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';

// -----------------------------------------------------------
// CURVED CARD CAROUSEL
// Numbered glass cards sit on a turning ring (a cylinder seen from
// the outside). The ring spins in fast, slows down and lands on one
// card, which lights up; then glossy blocks pop in and spell out
// that card's number on top of it.
// -----------------------------------------------------------

export const ICONS = ['scissors', 'send', 'database', 'copy', 'film', 'monitor', 'message', 'pulse', 'none'] as const;

export const curvedCardCarouselSchema = z.object({
  cards: z
    .array(
      z.object({
        number: z.string().describe('Number shown on the card, e.g. 01'),
        title: z.string().describe('Text on the card'),
        icon: z.enum(ICONS).describe('Small icon in the corner'),
      }),
    )
    .describe('The cards on the ring (6 or more looks best)'),
  landOnCard: z.number().int().min(1).max(40).describe('Which card (1 = first) the ring stops on'),
  accentColor: zColor(),
  backgroundColor: zColor(),
  cardTextColor: zColor(),
  spinTurns: z.number().min(0).max(3).step(0.25).describe('How many extra turns before it stops'),
  spinSeconds: z.number().min(0.5).max(6).step(0.1).describe('How long the spin takes'),
  showPixelNumber: z.boolean().describe('Pop in big blocks spelling the chosen card number'),
  size: z.number().min(0.5).max(1.6).step(0.05).describe('Overall size (1 = normal)'),
});

export type CurvedCardCarouselProps = z.infer<typeof curvedCardCarouselSchema>;

export const curvedCardCarouselDefaults: CurvedCardCarouselProps = {
  cards: [
    { number: '01', title: 'Clone Any Software', icon: 'copy' },
    { number: '02', title: 'Edit Videos in 66 Seconds', icon: 'film' },
    { number: '03', title: 'Hack Your Smart TV', icon: 'monitor' },
    { number: '04', title: 'Delegate Your WhatsApp', icon: 'message' },
    { number: '05', title: 'Automate Your Inbox', icon: 'send' },
    { number: '06', title: 'Build a Second Brain', icon: 'database' },
    { number: '07', title: 'Make Thumbnails Fast', icon: 'film' },
    { number: '08', title: 'Write Scripts with AI', icon: 'message' },
    { number: '09', title: 'Your Health Dashboard', icon: 'pulse' },
    { number: '10', title: 'Cut Podcasts into Clips', icon: 'scissors' },
    { number: '11', title: 'Build a Sales Engine', icon: 'send' },
    { number: '12', title: 'Free Up Storage', icon: 'database' },
  ],
  landOnCard: 2,
  accentColor: '#E9825A',
  backgroundColor: '#121112',
  cardTextColor: '#F3EDE8',
  spinTurns: 1,
  spinSeconds: 2.4,
  showPixelNumber: true,
  size: 1,
};

// --- small helpers -------------------------------------------------------

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(full, 16) || 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
export const rgba = (hex: string, a: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};




// 5 x 7 block font for digits.
export const DIGITS: Record<string, string[]> = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

export const Icon: React.FC<{ name: (typeof ICONS)[number]; color: string; size: number }> = ({ name, color, size }) => {
  if (name === 'none') return null;
  const p = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const shapes: Record<string, React.ReactNode> = {
    scissors: (
      <>
        <circle cx="6" cy="6" r="3" {...p} />
        <circle cx="6" cy="18" r="3" {...p} />
        <path d="M8.1 8.1 20 20M8.1 15.9 20 4" {...p} />
      </>
    ),
    send: <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z" {...p} />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" {...p} />
        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" {...p} />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="12" height="12" rx="2" {...p} />
        <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" {...p} />
      </>
    ),
    film: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" {...p} />
        <path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M3 12h18" {...p} />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" {...p} />
        <path d="M8 20h8M12 16v4" {...p} />
      </>
    ),
    message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...p} />,
    pulse: <path d="M22 12h-4l-3 9L9 3l-3 9H2" {...p} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {shapes[name]}
    </svg>
  );
};

// --- component -----------------------------------------------------------

export const CurvedCardCarousel: React.FC<
  Partial<CurvedCardCarouselProps> & {
    /** Set false to skip the fade-in (used when chained after another scene). */
    animateIn?: boolean;
    /** If set, the cards fade away over the 10 frames before this frame. */
    hideCardsAt?: number;
  }
> = ({ animateIn = true, hideCardsAt, ...props }) => {
  const {
    cards,
    landOnCard,
    accentColor,
    backgroundColor,
    cardTextColor,
    spinTurns,
    spinSeconds,
    showPixelNumber,
    size,
  } = { ...curvedCardCarouselDefaults, ...props };

  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const scale = (width / 1920) * size;

  const count = Math.max(cards.length, 1);
  const target = Math.min(Math.max(landOnCard, 1), count) - 1;

  // Card size and a big, gentle ring (wide arc like a curved screen).
  const cardW = 340 * scale;
  const cardH = 220 * scale;
  const gap = 40 * scale;
  const radius = 1900 * scale;
  // Angle between neighbouring cards on that ring.
  const step = ((cardW + gap) / radius) * (180 / Math.PI);

  // Position along the strip, in cards. The strip loops forever,
  // so it can spin any number of turns and land on the chosen card.
  const spinFrames = Math.max(1, Math.round(spinSeconds * fps));
  const finalPos = target;
  const startPos = finalPos - count * spinTurns - 3;
  const spinProgress = interpolate(frame, [0, spinFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // A tiny settle drift after landing keeps the shot alive.
  const drift = interpolate(frame, [spinFrames, spinFrames + 6 * fps], [0, 0.15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  const pos = startPos + (finalPos - startPos) * spinProgress + drift;
  const finalRot = finalPos * step;
  const startRot = startPos * step;

  // Whole ring fades/zooms in at the start.
  const enter = animateIn ? spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 }) : 1;
  const cardsOut =
    hideCardsAt === undefined
      ? 1
      : interpolate(frame, [hideCardsAt - 10, hideCardsAt], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // Chosen card lights up when the ring lands.
  const landFrame = spinFrames - Math.round(fps * 0.25);
  const glow = spring({ frame: frame - landFrame, fps, config: { damping: 18, stiffness: 120 } });

  // Motion blur while spinning fast.
  const speed = Math.abs(
    interpolate(frame + 1, [0, spinFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }) - spinProgress,
  ) * Math.abs(finalRot - startRot);
  const blur = Math.min(speed * 0.35, 6) * scale;

  const centerY = height / 2;

  // Show enough copies of the strip to fill the arc even with few cards.
  const half = Math.ceil(60 / step);
  const slots: number[] = [];
  for (let s = Math.floor(pos) - half; s <= Math.ceil(pos) + half; s++) slots.push(s);

  const cardEls = slots.map((slot) => {
    const i = ((slot % count) + count) % count;
    const card = cards[i];
    const theta = (slot - pos) * step;
    if (Math.abs(theta) > 62 || !card) return null;
    const rad = (theta * Math.PI) / 180;
    const x = Math.sin(rad) * radius;
    const z = Math.cos(rad) * radius - radius;
    const fade = interpolate(Math.abs(theta), [38, 60], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const isActive = slot === finalPos;
    const lit = isActive ? glow : 0;

    return (
      <div
        key={slot}
        style={{
          position: 'absolute',
          left: width / 2 - cardW / 2,
          top: centerY - cardH / 2,
          width: cardW,
          height: cardH,
          transform: `translate3d(${x}px, 0, ${z}px) rotateY(${theta}deg)`,
          zIndex: Math.round(1000 + z),
          opacity: fade,
          borderRadius: 22 * scale,
          padding: `${26 * scale}px ${28 * scale}px`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(160deg, ${rgba('#ffffff', 0.07 + lit * 0.05)}, ${rgba('#ffffff', 0.02)}), ${rgba(accentColor, lit * 0.55)}`,
          border: `${1.5 * scale}px solid ${rgba(isActive ? accentColor : '#ffffff', 0.12 + lit * 0.5)}`,
          boxShadow: `0 ${20 * scale}px ${50 * scale}px rgba(0,0,0,0.55), inset 0 1px 0 ${rgba('#ffffff', 0.12)}${
            lit > 0 ? `, 0 0 ${60 * scale * lit}px ${rgba(accentColor, 0.45 * lit)}` : ''
          }`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span
            style={{
              color: lit > 0.5 ? cardTextColor : accentColor,
              fontSize: 46 * scale,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: -1 * scale,
            }}
          >
            {card.number}
          </span>
          <Icon name={card.icon} color={lit > 0.5 ? cardTextColor : accentColor} size={30 * scale} />
        </div>
        <span
          style={{
            color: cardTextColor,
            fontSize: 30 * scale,
            fontWeight: 500,
            lineHeight: 1.2,
            maxWidth: '92%',
          }}
        >
          {card.title}
        </span>
      </div>
    );
  });

  // --- pixel number overlay ---
  const digits = (cards[target]?.number ?? '').split('').filter((c) => DIGITS[c]);
  const cell = 52 * scale;
  const block = 44 * scale;
  const glyphGap = 1; // empty columns between digits
  const cols = digits.length * 5 + Math.max(digits.length - 1, 0) * glyphGap;
  const gridW = cols * cell;
  const gridH = 7 * cell;
  const blocks: { c: number; r: number }[] = [];
  digits.forEach((d, di) => {
    DIGITS[d].forEach((row, r) => {
      row.split('').forEach((bit, c) => {
        if (bit === '1') blocks.push({ c: di * (5 + glyphGap) + c, r });
      });
    });
  });
  const pixelStart = spinFrames + Math.round(fps * 0.1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(${rgba('#ffffff', 0.05)} 1px, transparent 1px)`,
        backgroundSize: `${28 * scale}px ${28 * scale}px`,
        overflow: 'hidden',
      }}
    >
      {/* soft warm light behind the ring */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 45% 35% at 50% 50%, ${rgba(accentColor, 0.12 + glow * 0.1)}, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          perspective: 2200 * scale,
          perspectiveOrigin: '50% 45%',
          opacity: enter * cardsOut,
          transform: `scale(${0.92 + enter * 0.08})`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>{cardEls}</div>
      </AbsoluteFill>

      {showPixelNumber && blocks.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: width / 2 - gridW / 2,
            top: centerY - gridH / 2,
            width: gridW,
            height: gridH,
            zIndex: 5000,
          }}
        >
          {blocks.map(({ c, r }, i) => {
            // Pop in from the centre outwards.
            const dist = Math.hypot(c - cols / 2, r - 3);
            const pop = spring({
              frame: frame - pixelStart - Math.round(dist * 1.6),
              fps,
              config: { damping: 11, stiffness: 170, mass: 0.6 },
            });
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: c * cell + (cell - block) / 2,
                  top: r * cell + (cell - block) / 2,
                  width: block,
                  height: block,
                  borderRadius: 12 * scale,
                  transform: `scale(${pop}) translateY(${(1 - pop) * 20 * scale}px)`,
                  opacity: Math.min(pop * 1.5, 1),
                  background: `linear-gradient(155deg, ${rgba('#ffffff', 0.35)} 0%, ${rgba(accentColor, 0.95)} 35%, ${rgba(accentColor, 0.85)} 100%)`,
                  boxShadow: `inset 0 ${2 * scale}px 0 ${rgba('#ffffff', 0.45)}, inset 0 -${3 * scale}px ${6 * scale}px rgba(0,0,0,0.18), 0 ${8 * scale}px ${18 * scale}px rgba(0,0,0,0.45)`,
                }}
              />
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
