import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { PIXEL_BUTTON_PRESETS, PixelButton } from './PixelButton';
import { PIXEL_ICON_PRESETS, PixelIcon } from './PixelIcon';

// Showcase sheet: every pixel button + icon, staggered in and out.
export const PixelUIGrid: React.FC = () => {
  const { width, height, durationInFrames } = useVideoConfig();
  const buttons = PIXEL_BUTTON_PRESETS.slice(0, 6);
  const icons = PIXEL_ICON_PRESETS;
  const cellW = width / 3;
  const btnRowH = height * 0.22;
  const items: React.ReactNode[] = [];

  buttons.forEach((b, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const from = i * 5;
    const dur = durationInFrames - from - (5 - i) * 4;
    items.push(
      <Sequence key={b.id} from={from} durationInFrames={dur} layout="none">
        <div style={{ position: 'absolute', left: col * cellW, top: height * 0.08 + row * btnRowH, width: cellW, height: btnRowH }}>
          <PixelButton {...b.props} unit={7} frames={dur} transparent />
        </div>
      </Sequence>,
    );
  });

  const iconW = width / icons.length;
  icons.forEach((ic, i) => {
    const from = 30 + i * 5;
    const dur = durationInFrames - from - (icons.length - 1 - i) * 4;
    items.push(
      <Sequence key={ic.id} from={from} durationInFrames={dur} layout="none">
        <div style={{ position: 'absolute', left: i * iconW, top: height * 0.6, width: iconW, height: height * 0.3 }}>
          <PixelIcon {...ic.props} unit={9} frames={dur} transparent />
        </div>
      </Sequence>,
    );
  });

  return <AbsoluteFill style={{ backgroundColor: '#333333' }}>{items}</AbsoluteFill>;
};
