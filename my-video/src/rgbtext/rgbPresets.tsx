import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { RgbText, rgbTextDefaults, RgbTextProps } from './RgbText';

// -----------------------------------------------------------
// 12 RGB title styles (own text) + a reel with hard cuts.
// -----------------------------------------------------------
const P = (props: Partial<RgbTextProps>): RgbTextProps => ({ ...rgbTextDefaults, ...props });

export const RGB_PRESETS: { id: string; props: RgbTextProps }[] = [
  { id: 'RGB-01-Wave-Ribbon', props: P({ effect: 'Wave ribbon', lines: ['FRESH IDEAS'], size: 120, seconds: 1.6 }) },
  { id: 'RGB-02-RGB-Rise', props: P({ effect: 'RGB rise', lines: ['LIGHT SPEED'], size: 120, seconds: 1.5 }) },
  { id: 'RGB-03-Zoom-Split', props: P({ effect: 'Zoom split', lines: ['BOLD', 'MOVES'], size: 190, seconds: 1.5 }) },
  { id: 'RGB-04-Chromatic-Focus', props: P({ effect: 'Chromatic focus', lines: ['FOCUS'], size: 210, seconds: 1.7 }) },
  { id: 'RGB-05-Echo-Tunnel', props: P({ effect: 'Echo tunnel', lines: ['ENERGY'], size: 200, seconds: 2.6 }) },
  { id: 'RGB-06-Bloom-Focus', props: P({ effect: 'Bloom focus', lines: ['glow'], size: 230, seconds: 2.3 }) },
  { id: 'RGB-07-Light-Streaks', props: P({ effect: 'Light streaks', lines: ['VELOCITY'], size: 110, seconds: 2.3 }) },
  { id: 'RGB-08-Datamosh', props: P({ effect: 'Datamosh', lines: ['Pure', 'Signal'], size: 190, seconds: 1.4 }) },
  { id: 'RGB-09-Slit-Scan', props: P({ effect: 'Slit-scan', lines: ['SPECTRA'], size: 150, seconds: 2.2 }) },
  { id: 'RGB-10-Echo-Tunnel-2', props: P({ effect: 'Echo tunnel', lines: ['NEXT', 'LEVEL'], size: 200, seconds: 3.3 }) },
  { id: 'RGB-11-Rainbow-Trail', props: P({ effect: 'Rainbow trail', lines: ['PRISM'], size: 150, seconds: 2.9 }) },
  { id: 'RGB-12-Streaks-Finale', props: P({ effect: 'Light streaks', lines: ['THANKS', 'FOR WATCHING'], size: 110, seconds: 2.6 }) },
];

const frames = (preset: { props: RgbTextProps }) => Math.round(preset.props.seconds * 30);
export const RGB_REEL_FRAMES = RGB_PRESETS.reduce((s, preset) => s + frames(preset), 0);

export const RgbTextReel: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      {RGB_PRESETS.map((preset) => {
        const start = from;
        from += frames(preset);
        return (
          <Sequence key={preset.id} from={start} durationInFrames={frames(preset)} name={preset.id}>
            <RgbText {...preset.props} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
