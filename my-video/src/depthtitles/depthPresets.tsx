import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { DepthTitles, depthTitlesDefaults, DepthTitlesProps } from './DepthTitles';

// -----------------------------------------------------------
// 12 Depth Title styles (own text). Each pairs an entrance and an
// exit the way the reference study showed them working together.
// DepthTitlesReel plays all of them back to back.
// -----------------------------------------------------------

const B = (text: string, size = 1) => ({ text, weight: 'Bold' as const, size });
const L = (text: string, size = 1) => ({ text, weight: 'Light' as const, size });
const P = (props: Partial<DepthTitlesProps>): DepthTitlesProps => ({ ...depthTitlesDefaults, ...props });

export const DEPTH_PRESETS: { id: string; props: DepthTitlesProps }[] = [
  {
    id: 'Depth-01-Whip-Build',
    props: P({ enter: 'Whip build', exit: 'Slide out right', lines: [B('START'), B('BEFORE'), B("YOU'RE READY", 0.8)], seconds: 3.2 }),
  },
  {
    id: 'Depth-02-Spring-Drop',
    props: P({
      enter: 'Spring drop',
      exit: 'Fall apart',
      baseSize: 190,
      lines: [B('THINK BIG'), L('START SMALL'), B('MOVE FAST')],
      seconds: 2.8,
    }),
  },
  {
    id: 'Depth-03-Letter-Glow-Pop',
    props: P({ enter: 'Letter glow & pop', exit: 'Split vertical', baseSize: 200, lines: [B('THE ONLY WAY'), L('IS THROUGH')], seconds: 2.6 }),
  },
  {
    id: 'Depth-04-Word-Zoom-Build',
    props: P({
      enter: 'Word zoom build',
      exit: 'Drop out',
      baseSize: 170,
      lines: [B('KEEP GOING', 1.15), B('EVEN WHEN', 0.85), B('NOBODY IS', 0.85), B('WATCHING', 0.85)],
      seconds: 2.8,
    }),
  },
  {
    id: 'Depth-05-RGB-Slide',
    props: P({
      enter: 'RGB slide',
      exit: 'RGB slide out',
      baseSize: 130,
      overlap: 0.26,
      lines: [B('DISCIPLINE BEATS'), B('MOTIVATION'), B('EVERY TIME.')],
      seconds: 3.3,
      seed: 4,
    }),
  },
  {
    id: 'Depth-06-Stack-Fade-Up',
    props: P({ enter: 'Stack fade up', exit: 'Fade down', baseSize: 150, lines: [B('BUILD'), B('THE'), B('LIFE'), B('YOU'), B('WANT')], seconds: 2.6 }),
  },
  {
    id: 'Depth-07-Letter-Pop-Tilt',
    props: P({ enter: 'Letter pop tilt', exit: 'Fade down', baseSize: 200, lines: [B('LEARN DAILY'), L('STAY CURIOUS')], seconds: 2.6 }),
  },
  {
    id: 'Depth-08-Diagonal-Sweep',
    props: P({ enter: 'Diagonal sweep', exit: 'Fly up', baseSize: 200, lines: [B('FOCUS'), L('CREATES'), B('FREEDOM')], seconds: 2.5 }),
  },
  {
    id: 'Depth-09-Tilted-Fade-Build',
    props: P({
      enter: 'Tilted fade build',
      exit: 'Fade down',
      align: 'left',
      baseSize: 150,
      overlap: 0.34,
      lines: [B('#CREATE'), B('#LEARN', 0.9), B('#BUILD'), B('#SHARE', 0.9), B('#REPEAT', 1.1)],
      seconds: 2.9,
    }),
  },
  {
    id: 'Depth-10-Word-Pop-Scatter',
    props: P({
      enter: 'Word pop scatter',
      exit: 'Word pop out',
      baseSize: 140,
      lines: [B('WHAT YOU DO'), B('TODAY SHAPES'), B('EVERY SINGLE'), B('TOMORROW')],
      seconds: 3,
      seed: 7,
    }),
  },
  {
    id: 'Depth-11-Mixed-Reveal',
    props: P({
      enter: 'Mixed reveal',
      exit: 'Spread & drop',
      baseSize: 150,
      lines: [B('TINY HABITS'), L('EVERY MORNING', 1.2), B('BUILD BIG LIVES', 0.65)],
      seconds: 3,
    }),
  },
  {
    id: 'Depth-12-Thanks-Finale',
    props: P({
      enter: 'Whip build',
      exit: 'Anticipate & slide right',
      baseSize: 170,
      lines: [B('THANKS FOR'), B('WATCHING'), B('SEE YOU'), B('NEXT TIME')],
      seconds: 3.6,
    }),
  },
];

const frames = (preset: { props: DepthTitlesProps }) => Math.round(preset.props.seconds * 30);
export const DEPTH_REEL_FRAMES = DEPTH_PRESETS.reduce((s, preset) => s + frames(preset), 0);

/** All styles back to back, like a title pack preview (hard cuts, like the reference). */
export const DepthTitlesReel: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      {DEPTH_PRESETS.map((preset) => {
        const start = from;
        from += frames(preset);
        return (
          <Sequence key={preset.id} from={start} durationInFrames={frames(preset)} name={preset.id}>
            <DepthTitles {...preset.props} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
