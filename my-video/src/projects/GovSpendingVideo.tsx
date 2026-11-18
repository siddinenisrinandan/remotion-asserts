import React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { IconExplainer, IconExplainerProps } from '../icons/IconExplainer';
import { SfxCue, SfxTrack } from '../SfxTrack';

// -----------------------------------------------------------
// HOW GOVERNMENT SPENDS MONEY
// A short explainer built only from IconExplainer settings
// (no new drawing code). Five scenes, and together they use
// every icon in the icon set.
// -----------------------------------------------------------

type IconItem = IconExplainerProps['icons'][number];
type Arrow = IconExplainerProps['arrows'][number];

const icon = (name: string, x: number, y: number, size: number, extra: Partial<IconItem> = {}): IconItem => ({
  icon: name,
  signText: '',
  x,
  y,
  size,
  count: 1,
  sticker: '',
  stickerYellow: false,
  caption: '',
  appearAt: 0.4,
  ...extra,
});

const arrow = (from: number, to: number, label: string, appearAt: number, bend = 0): Arrow => ({
  from,
  to,
  label,
  appearAt,
  bend,
});

const SCENE_SECONDS = 8;
const KICKER = 'HOW GOVERNMENT SPENDS MONEY';
const TREASURY = (extra: Partial<IconItem> = {}) =>
  icon('Bank', 50, 80, 230, { signText: 'TREASURY', sticker: 'Treasury', stickerYellow: true, appearAt: 0.3, ...extra });

const SCENES: Partial<IconExplainerProps>[] = [
  // 1. Where the money comes from
  {
    kicker: KICKER,
    heading: 'It all starts with your taxes',
    highlight: 'your taxes',
    icons: [
      icon('Boy 1', 8, 54, 140, { appearAt: 0.4 }),
      icon('Girl 1', 18, 54, 140, { appearAt: 0.55, sticker: 'People earn', stickerYellow: false }),
      icon('Boy 2', 28, 54, 140, { appearAt: 0.7 }),
      icon('Girl 2', 38, 54, 140, { appearAt: 0.85 }),
      icon('Market', 10, 92, 180, { appearAt: 1.4 }),
      icon('Restaurant', 26, 92, 180, { appearAt: 1.55, sticker: 'Businesses sell' }),
      icon('Shopping mall', 43, 92, 210, { appearAt: 1.7 }),
      icon('Glass office', 69, 80, 350, { signText: 'GOVT', sticker: 'Government', stickerYellow: true, appearAt: 2.2 }),
      icon('Bank', 91, 92, 170, { signText: 'TREASURY', caption: 'Treasury', appearAt: 4.6 }),
    ],
    arrows: [
      arrow(4, 8, 'income tax', 2.8, -0.2),
      arrow(7, 8, 'GST', 3.4, 0.15),
      arrow(8, 9, 'pooled', 5.0, -0.35),
    ],
    showTrendCard: false,
  },
  // 2. Public services (treasury in the middle, arrows fan out to the corners)
  {
    kicker: KICKER,
    heading: 'It pays for schools and safety',
    highlight: 'schools and safety',
    icons: [
      TREASURY(),
      icon('School', 20, 52, 220, { sticker: 'Education', appearAt: 1.0 }),
      icon('Boy 3', 32, 40, 80, { appearAt: 1.6 }),
      icon('Girl 3', 38, 40, 80, { appearAt: 1.75, caption: 'Students' }),
      icon('Police station', 80, 52, 220, { sticker: 'Safety', appearAt: 2.4 }),
      icon('Office', 18, 97, 200, { signText: 'MINISTRY', sticker: 'Salaries', appearAt: 3.6 }),
      icon('Stadium', 82, 97, 230, { sticker: 'Sports', stickerYellow: true, appearAt: 4.8 }),
    ],
    arrows: [
      arrow(1, 2, 'teachers', 1.4, 0.15),
      arrow(1, 5, 'police', 2.8, -0.15),
      arrow(1, 6, 'staff', 4.0, -0.1),
      arrow(1, 7, 'grounds', 5.2, 0.1),
    ],
    showTrendCard: false,
  },
  // 3. Transport
  {
    kicker: KICKER,
    heading: 'It keeps the country moving',
    highlight: 'moving',
    icons: [
      TREASURY(),
      icon('Railway station', 20, 52, 230, { sticker: 'Railways', appearAt: 1.0 }),
      icon('Airport', 78, 52, 230, { sticker: 'Airports', appearAt: 2.2 }),
      icon('Person (simple)', 93, 52, 42, { count: 4, appearAt: 2.8, caption: 'Travellers' }),
      icon('Bus station', 18, 97, 220, { sticker: 'City buses', stickerYellow: true, appearAt: 3.4 }),
      icon('Bus stop', 77, 97, 210, { sticker: 'Bus stops', appearAt: 4.6 }),
      icon('Girl 4', 93, 89, 110, { caption: 'Commuter', appearAt: 5.4 }),
    ],
    arrows: [
      arrow(1, 2, 'tracks', 1.4, 0.15),
      arrow(1, 3, 'runways', 2.6, -0.15),
      arrow(1, 5, 'buses', 3.8, -0.1),
      arrow(1, 6, 'shelters', 5.0, 0.1),
    ],
    showTrendCard: false,
  },
  // 4. Housing and culture
  {
    kicker: KICKER,
    heading: 'It builds homes, fairs and culture',
    highlight: 'homes',
    icons: [
      TREASURY(),
      icon('House (classic)', 12, 50, 150, { appearAt: 1.0 }),
      icon('House (cottage)', 27, 50, 150, { sticker: 'Affordable housing', stickerYellow: true, appearAt: 1.15 }),
      icon('House (two storey)', 73, 50, 150, { appearAt: 1.3 }),
      icon('House (modern)', 88, 50, 150, { appearAt: 1.45 }),
      icon('Circus tent', 16, 97, 200, { sticker: 'Public fairs', appearAt: 3.0 }),
      icon('Girl 5', 5, 89, 100, { caption: 'Artist', appearAt: 3.6 }),
      icon('Cinema', 80, 97, 200, { sticker: 'Culture grants', appearAt: 4.2 }),
      icon('Boy 4', 94, 89, 105, { caption: 'Homeowner', appearAt: 5.2 }),
    ],
    arrows: [
      arrow(1, 3, 'housing', 1.8, 0.15),
      arrow(1, 4, 'housing', 2.2, -0.15),
      arrow(1, 6, 'events', 3.4, -0.1),
      arrow(1, 8, 'grants', 4.6, 0.1),
    ],
    showTrendCard: false,
  },
  // 5. It comes back to you
  {
    kicker: KICKER,
    heading: 'Spending today, growth tomorrow',
    highlight: 'growth tomorrow',
    icons: [
      icon('Glass office', 14, 62, 280, { signText: 'GOVT', sticker: 'Government', stickerYellow: true, appearAt: 0.3 }),
      icon('Boy 5', 41, 62, 170, { caption: 'Better jobs', appearAt: 1.4 }),
      icon('Person (simple)', 29, 93, 56, { count: 7, caption: 'Everyone benefits', appearAt: 2.4 }),
    ],
    arrows: [
      arrow(1, 2, 'spends', 1.0, -0.3),
      arrow(2, 3, 'returns', 2.2, 0.3),
    ],
    showTrendCard: true,
    trendCard: {
      x: 58,
      y: 26,
      width: 36,
      height: 56,
      appearAt: 3.4,
      lines: [
        { label: 'Public services', trend: 'Up', color: '#2E9B4A' },
        { label: 'Unemployment', trend: 'Down', color: '#E04B3F' },
      ],
    },
  },
];

// --- sound effects ---------------------------------------------------------
// Built from the scene settings, so the sounds follow if a scene changes:
// every icon pop-in gets a pop, every arrow gets a swipe. Extra moments are
// listed by hand below.
const FPS = 30;
const SCENE_FRAMES = SCENE_SECONDS * FPS;
const f = (scene: number, seconds: number) => scene * SCENE_FRAMES + Math.round(seconds * FPS);

const buildCues = (): SfxCue[] => {
  const cues: SfxCue[] = [];
  SCENES.forEach((scene, i) => {
    // Heading: quick typing as the kicker appears, sparkle on the highlight sweep.
    cues.push({ sound: 'keyboard-typing', at: f(i, 0.05), volume: 0.18, seconds: 0.7 });
    cues.push({ sound: 'sparkle-wink', at: f(i, 0.5), volume: 0.3 });
    // One pop per icon (icons that appear within 4 frames share a pop).
    let lastPop = -100;
    [...(scene.icons ?? [])]
      .map((it) => f(i, it.appearAt))
      .sort((a, b) => a - b)
      .forEach((at) => {
        if (at - lastPop >= 4) cues.push({ sound: 'pop-bubble', at, volume: 0.22 });
        lastPop = at;
      });
    // A swipe as each arrow draws.
    (scene.arrows ?? []).forEach((a) => cues.push({ sound: 'whoosh-swipe-clean', at: f(i, a.appearAt), volume: 0.3 }));
    // Whoosh into the next scene (its loudest point lands on the cut).
    if (i < SCENES.length - 1) cues.push({ sound: 'whoosh-transition', at: f(i + 1, 0) - 22, volume: 0.3 });
  });
  // Hand-placed moments.
  cues.push({ sound: 'cash-register', at: f(0, 5.6), volume: 0.35 }); // taxes pooled into the treasury
  cues.push({ sound: 'school-bell', at: f(1, 1.0), volume: 0.18, seconds: 1.2 }); // school appears
  cues.push({ sound: 'hint-two-tone', at: f(2, 2.8), volume: 0.3 }); // travellers
  cues.push({ sound: 'drumroll-cymbal', at: f(4, 1.7), volume: 0.3 }); // cymbal lands as the trend lines finish
  cues.push({ sound: 'game-success', at: f(4, 5.6), volume: 0.3 }); // "everyone benefits" ending
  return cues;
};

const SFX_CUES = buildCues();

const FADE = 10;
export const GOV_SPENDING_DURATION = SCENES.length * SCENE_SECONDS * 30;

const Fade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, FADE, durationInFrames - FADE, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const GovSpendingVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const len = SCENE_SECONDS * fps;
  return (
    <AbsoluteFill style={{ backgroundColor: '#FBF5EA' }}>
      {SCENES.map((scene, i) => (
        <Sequence key={i} from={i * len} durationInFrames={len}>
          <Fade>
            <IconExplainer {...scene} seconds={SCENE_SECONDS} />
          </Fade>
        </Sequence>
      ))}
      <SfxTrack cues={SFX_CUES} />
    </AbsoluteFill>
  );
};
