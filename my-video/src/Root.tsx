import React from 'react';
import { Composition, Folder } from 'remotion';
import * as Backgrounds from './backgroundefffects';
import * as Callouts from './callouts';
import * as Infographics from './infografics';
import * as LowerThirds from './Lowerthird';
import * as TextStyles from './textstyles';
import * as Shortcraft from './video shortcraft';
import { lowerThird1Schema } from './Lowerthird/LowerThird1';
import { MOTIVATION_DURATION, MotivationVideo } from './motivation/MotivationVideo';
import {
  CurvedCardCarousel,
  curvedCardCarouselDefaults,
  curvedCardCarouselSchema,
} from './editstyles/CurvedCardCarousel';
import {
  calculateListDetailMetadata,
  ListDetailSlide,
  listDetailSlideDefaults,
  listDetailSlideSchema,
} from './editstyles/ListDetailSlide';
import {
  calculateIconExplainerMetadata,
  IconExplainer,
  iconExplainerDefaults,
  iconExplainerSchema,
} from './icons/IconExplainer';
import { IconLibrary } from './icons/IconLibrary';
import { GOV_SPENDING_DURATION, GovSpendingVideo } from './projects/GovSpendingVideo';
import {
  calculateStickerCaptionsMetadata,
  StickerCaptions,
  stickerCaptionsDefaults,
  stickerCaptionsSchema,
} from './editstyles/StickerCaptions';
import {
  BrowserFrame,
  browserFrameDefaults,
  browserFrameSchema,
  calculateBrowserFrameMetadata,
} from './editstyles/BrowserFrame';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const DEFAULT_DURATION = 150; // 5 seconds

// Components whose animation needs more (or less) than the default length.
const DURATION_OVERRIDES: Record<string, number> = {
  // Backgrounds loop, so give them a longer preview.
  BinaryRainBackground: 300,
  GridWaveBackground: 300,
  MatrixRainBackground: 300,
  TsunamiWaveBackground: 300,
  // Infographics with long staggered entrances.
  ClaudeLineTextIntro: 240,
  CircularProcessInfographic: 300,
  VerticalTimelineInfographic: 300,
  // Text styles.
  TextAsMask: 165,
  // Shortcraft effects.
  Basic3DScene: 240,
  CrossOutText: 90,
  FontWeightPump: 180,
  WordRelayFilmstrip: 180,
};

type ComponentMap = Record<string, React.ComponentType<Record<string, unknown>>>;

const GROUPS: { folder: string; components: ComponentMap }[] = [
  { folder: 'Backgrounds', components: Backgrounds as unknown as ComponentMap },
  { folder: 'Callouts', components: Callouts as unknown as ComponentMap },
  { folder: 'Infographics', components: Infographics as unknown as ComponentMap },
  { folder: 'LowerThirds', components: LowerThirds as unknown as ComponentMap },
  { folder: 'TextStyles', components: TextStyles as unknown as ComponentMap },
  { folder: 'Shortcraft', components: Shortcraft as unknown as ComponentMap },
];

// Components that have editable settings in the Studio's Props panel.
// They are registered by hand below (so the Studio's Save button can
// write changes back into this file) and skipped by the automatic list.
const EDITABLE_IDS = new Set(['LowerThird1']);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Projects">
        <Composition
          id="MotivationVideo"
          component={MotivationVideo}
          durationInFrames={MOTIVATION_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="GovSpendingVideo"
          component={GovSpendingVideo}
          durationInFrames={GOV_SPENDING_DURATION}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
      <Folder name="Editable">
        <Composition
          id="LowerThird1"
          component={LowerThirds.LowerThird1}
          schema={lowerThird1Schema}
          defaultProps={{
            bigText: 'how to start create a game ',
            smallTabText: 'placeholder',
            bannerAndLineColor: '#00897B',
            bigTextColor: '#FFFFFF',
            smallTabColor: '#E0E0E0',
            smallTabTextColor: '#111111',
            position: 'Bottom left' as const,
            size: 1,
            font: 'Impact' as const,
            showStripes: true,
          }}
          durationInFrames={DEFAULT_DURATION}
          fps={24}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="CurvedCardCarousel"
          component={CurvedCardCarousel}
          schema={curvedCardCarouselSchema}
          defaultProps={curvedCardCarouselDefaults}
          durationInFrames={180}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="ListDetailSlide"
          component={ListDetailSlide}
          schema={listDetailSlideSchema}
          defaultProps={listDetailSlideDefaults}
          calculateMetadata={calculateListDetailMetadata}
          durationInFrames={210}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="IconExplainer"
          component={IconExplainer}
          schema={iconExplainerSchema}
          defaultProps={iconExplainerDefaults}
          calculateMetadata={calculateIconExplainerMetadata}
          durationInFrames={240}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="StickerCaptions"
          component={StickerCaptions}
          schema={stickerCaptionsSchema}
          defaultProps={stickerCaptionsDefaults}
          calculateMetadata={calculateStickerCaptionsMetadata}
          durationInFrames={120}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="BrowserFrame"
          component={BrowserFrame}
          schema={browserFrameSchema}
          defaultProps={browserFrameDefaults}
          calculateMetadata={calculateBrowserFrameMetadata}
          durationInFrames={150}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
      <Folder name="Icons">
        <Composition
          id="IconLibrary"
          component={IconLibrary}
          durationInFrames={120}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
      {GROUPS.map(({ folder, components }) => (
        <Folder key={folder} name={folder}>
          {Object.entries(components)
            .filter(([id, component]) => typeof component === 'function' && !EDITABLE_IDS.has(id))
            .map(([id, component]) => (
              <Composition
                key={id}
                id={id}
                component={component}
                durationInFrames={DURATION_OVERRIDES[id] ?? DEFAULT_DURATION}
                fps={FPS}
                width={WIDTH}
                height={HEIGHT}
              />
            ))}
        </Folder>
      ))}
    </>
  );
};
