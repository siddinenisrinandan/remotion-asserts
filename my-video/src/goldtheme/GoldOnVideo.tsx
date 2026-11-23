import React from 'react';
import { AbsoluteFill, Sequence, staticFile } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { GoldText, goldTextDefaults } from './GoldText';
import { GoldTitle, goldTitleDefaults, GoldTitleProps } from './GoldTitles';

// -----------------------------------------------------------
// GOLD ON VIDEO — demo: the gold opener, then gold cards
// (double square, arch, name corner, glass, stacked, deco ticket)
// laid over real footage, with a soft vignette so gold reads on bright shots.
// -----------------------------------------------------------

export const goldOnVideoSchema = z.object({
  videoFile: z.string().describe('Video in public/'),
  startAt: z.number().min(0).step(0.1).describe('Start this many seconds into the video'),
  openerTitle: z.string(),
  openerSubtitle: z.string(),
  card1Title: z.string(),
  card1Subtitle: z.string(),
  card2Title: z.string(),
  card2Subtitle: z.string(),
  name: z.string(),
  nameRole: z.string(),
  card3Title: z.string(),
  card3Subtitle: z.string(),
  card4Title: z.string(),
  card4Subtitle: z.string(),
  endTitle: z.string(),
  endSubtitle: z.string(),
  cardFill: z.number().min(0).max(1).step(0.05).describe('Darkness inside the cards'),
  darken: z.number().min(0).max(0.9).step(0.05).describe('How much the vignette darkens the video'),
});
export type GoldOnVideoProps = z.infer<typeof goldOnVideoSchema>;

export const goldOnVideoDefaults: GoldOnVideoProps = {
  videoFile: 'testvideo4.mp4',
  startAt: 0,
  openerTitle: 'GOLDEN HOUR',
  openerSubtitle: 'A SUMMER WALK',
  card1Title: 'Together',
  card1Subtitle: 'MOTHER & DAUGHTER',
  card2Title: 'Forever',
  card2Subtitle: 'GOLDEN MEMORIES',
  name: 'Anna & Mia',
  nameRole: 'SUMMER 2026',
  card3Title: 'Every Moment',
  card3Subtitle: 'IS A FRESH BEGINNING',
  card4Title: 'Chapter One',
  card4Subtitle: 'THE FIRST STEPS',
  endTitle: 'The End',
  endSubtitle: 'THANKS FOR WATCHING',
  cardFill: 0.45,
  darken: 0.45,
};

const SEG = 112;
const OPENER = 135;
export const GOLD_ON_VIDEO_FRAMES = OPENER + 5 + SEG * 6;

export const GoldOnVideo: React.FC<GoldOnVideoProps> = (p) => {
  const base: GoldTitleProps = { ...goldTitleDefaults, background: 'Transparent', cardFill: p.cardFill };
  const shots: Partial<GoldTitleProps>[] = [
    { style: 'Double Square', title: p.card1Title, subtitle: p.card1Subtitle, offsetX: 470, offsetY: -110, scale: 0.75 },
    { style: 'Arch Card', title: p.card2Title, subtitle: p.card2Subtitle, offsetX: 500, offsetY: -30, scale: 0.72 },
    { style: 'Name Corner', title: p.name, subtitle: p.nameRole, offsetX: -420, offsetY: 330, scale: 0.85 },
    { style: 'Glass Card', title: p.card3Title, subtitle: p.card3Subtitle, offsetX: 470, offsetY: -230, scale: 0.72 },
    { style: 'Stacked Cards', title: p.card4Title, subtitle: p.card4Subtitle, offsetX: 500, offsetY: -60, scale: 0.75 },
    { style: 'Deco Ticket', title: p.endTitle, subtitle: p.endSubtitle, offsetX: 0, offsetY: -260, scale: 0.85 },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Video src={staticFile(p.videoFile)} trimBefore={Math.round(p.startAt * 30)} objectFit="cover" style={{ width: '100%', height: '100%' }} muted />
      {/* warm-dark vignette so gold stays readable on a bright field */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(20,12,4,${p.darken * 0.55}) 0%, rgba(10,6,2,${p.darken}) 100%)`,
        }}
      />
      <Sequence from={0} durationInFrames={OPENER}>
        <GoldText {...goldTextDefaults} title={p.openerTitle} subtitle={p.openerSubtitle} transparentBackground particles={0.6} fontSize={140} />
      </Sequence>
      {shots.map((s, i) => (
        <Sequence key={i} from={OPENER + 5 + i * SEG} durationInFrames={SEG - 4}>
          <GoldTitle {...base} {...s} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
