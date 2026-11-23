import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { PixelTitleProps, TitleFC } from './common';
import {
  BandWave,
  bandWaveDefaults,
  BlockDissolve,
  blockDissolveDefaults,
  DotBuild,
  dotBuildDefaults,
  MatrixChange,
  matrixChangeDefaults,
  MosaicMotion,
  mosaicMotionDefaults,
  PosterTwo,
  posterTwoDefaults,
} from './TitlesA';
import {
  CircleInspire,
  circleInspireDefaults,
  ColumnCourage,
  columnCourageDefaults,
  DitherPush,
  ditherPushDefaults,
  MosaicLimits,
  mosaicLimitsDefaults,
  SerifSlice,
  serifSliceDefaults,
  StreakDesign,
  streakDesignDefaults,
} from './TitlesB';

export { pixelTitleSchema } from './common';

export const PIXEL_TITLE_PRESETS: { id: string; component: TitleFC; props: PixelTitleProps }[] = [
  { id: 'PixelTitle-BandWave', component: BandWave, props: bandWaveDefaults },
  { id: 'PixelTitle-BlockDissolve', component: BlockDissolve, props: blockDissolveDefaults },
  { id: 'PixelTitle-MosaicMotion', component: MosaicMotion, props: mosaicMotionDefaults },
  { id: 'PixelTitle-DotBuild', component: DotBuild, props: dotBuildDefaults },
  { id: 'PixelTitle-PosterTwo', component: PosterTwo, props: posterTwoDefaults },
  { id: 'PixelTitle-MatrixChange', component: MatrixChange, props: matrixChangeDefaults },
  { id: 'PixelTitle-DitherPush', component: DitherPush, props: ditherPushDefaults },
  { id: 'PixelTitle-SerifSlice', component: SerifSlice, props: serifSliceDefaults },
  { id: 'PixelTitle-MosaicLimits', component: MosaicLimits, props: mosaicLimitsDefaults },
  { id: 'PixelTitle-StreakDesign', component: StreakDesign, props: streakDesignDefaults },
  { id: 'PixelTitle-CircleInspire', component: CircleInspire, props: circleInspireDefaults },
  { id: 'PixelTitle-ColumnCourage', component: ColumnCourage, props: columnCourageDefaults },
];

export const PIXEL_TITLE_REEL_EACH = 75;
export const PIXEL_TITLES_REEL_FRAMES = PIXEL_TITLE_REEL_EACH * PIXEL_TITLE_PRESETS.length;

/** All twelve back to back, like the reference reel. */
export const PixelTitlesReel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    <Series>
      {PIXEL_TITLE_PRESETS.map(({ id, component: C, props }) => (
        <Series.Sequence key={id} durationInFrames={PIXEL_TITLE_REEL_EACH}>
          <C {...props} pixelExit={false} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
