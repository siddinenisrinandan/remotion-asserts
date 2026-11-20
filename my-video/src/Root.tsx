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
import {
  calculateTextBehindSubjectMetadata,
  TextBehindSubject,
  textBehindSubjectDefaults,
  textBehindSubjectSchema,
} from './editstyles/TextBehindSubject';
import {
  calculateFilterLookDemoMetadata,
  FilterLookDemo,
  filterLookDemoDefaults,
  filterLookDemoSchema,
} from './editstyles/FilterLookDemo';
import { PaperTextureDemo, paperTextureDemoDefaults, paperTextureDemoSchema } from './editstyles/PaperTextureDemo';
import { calculateCaptionDemoMetadata, CaptionDemo, captionDemoProps, captionDemoSchema } from './captions/CaptionDemo';
import { CAPTION_PRESETS } from './captions/captionPresets';
import { DepthTitles, depthTitlesSchema } from './depthtitles/DepthTitles';
import { DEPTH_PRESETS, DEPTH_REEL_FRAMES, DepthTitlesReel } from './depthtitles/depthPresets';
import { RgbText, rgbTextSchema } from './rgbtext/RgbText';
import {
  MINIMAL_PRESETS,
  MINIMAL_REEL_FRAMES,
  MinimalTitle,
  minimalTitleSchema,
  MinimalTitlesGrid,
  MinimalTitlesReel,
} from './minimaltitles/MinimalTitles';
import { RGB_PRESETS, RGB_REEL_FRAMES, RgbTextReel } from './rgbtext/rgbPresets';
import {
  calculateNotificationStoryMetadata,
  NotificationStory,
  notificationStoryDefaults,
  notificationStorySchema,
} from './notifications/NotificationStory';
import { calculateMatchCutMetadata, MatchCut, matchCutDefaults, matchCutSchema } from './editstyles/MatchCut';
import { CAPTIONS_SHOWCASE_SECONDS, CaptionsShowcase } from './captions/CaptionsShowcase';
import {
  calculateTransitionsShowcaseMetadata,
  TransitionsShowcase,
  transitionsShowcaseDefaults,
  transitionsShowcaseSchema,
} from './transitions/TransitionsShowcase';
import {
  calculateTwoClipMetadata,
  TWO_CLIP_PRESETS,
  TwoClipTransition,
  twoClipDefaults,
  twoClipTransitionSchema,
} from './transitions/TwoClipTransition';
import {
  calculateChapterStoryboardMetadata,
  ChapterStoryboard,
  chapterStoryboardDefaults,
  chapterStoryboardSchema,
} from './transitions/ChapterStoryboard';
import { TRANSITION_NAMES } from './transitions/TransitionsPack';

// "Zoom-through" -> "TransitionZoomThrough"
const transitionId = (name: string) => `Transition${name.replace(/(^|[^a-zA-Z])([a-z])/g, (_, __, c: string) => c.toUpperCase()).replace(/[^a-zA-Z]/g, '')}`;

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
        <Composition
          id="TextBehindSubject"
          component={TextBehindSubject}
          schema={textBehindSubjectSchema}
          defaultProps={textBehindSubjectDefaults}
          calculateMetadata={calculateTextBehindSubjectMetadata}
          durationInFrames={90}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="TextBehindSubjectShort"
          component={TextBehindSubject}
          schema={textBehindSubjectSchema}
          defaultProps={{
            ...textBehindSubjectDefaults,
            videoFile: 'stairs_short.mp4',
            cutoutFile: 'stairs_short_person.webm',
            text: 'how to use Claude',
            textStyle: 'Mixed script (Style 5)' as const,
            textSize: 1,
            textPositionY: 33,
            letterSpacing: 0,
            appearAt: 0.4,
            wordGap: 0.35,
            dimBackground: 0.1,
            seconds: 11,
          }}
          calculateMetadata={calculateTextBehindSubjectMetadata}
          durationInFrames={330}
          fps={FPS}
          width={1080}
          height={1920}
        />
        <Composition
          id="TextBehindSubjectRun"
          component={TextBehindSubject}
          schema={textBehindSubjectSchema}
          defaultProps={{
            ...textBehindSubjectDefaults,
            videoFile: 'testvideo3.mp4',
            cutoutFile: 'testvideo3_person.webm',
            text: 'RUN',
            textSize: 1.25,
            textPositionY: 38,
            letterSpacing: 0.04,
            animation: 'Rise from behind' as const,
            appearAt: 0.3,
            dimBackground: 0.1,
            seconds: 5.9,
          }}
          calculateMetadata={calculateTextBehindSubjectMetadata}
          durationInFrames={177}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="TextBehindSubjectWalk"
          component={TextBehindSubject}
          schema={textBehindSubjectSchema}
          defaultProps={{
            ...textBehindSubjectDefaults,
            videoFile: 'testvideo4.mp4',
            cutoutFile: 'testvideo4_person.webm',
            text: 'SUMMER',
            textSize: 0.9,
            textPositionY: 32,
            letterSpacing: 0.04,
            animation: 'Rise from behind' as const,
            appearAt: 0.4,
            dimBackground: 0.1,
            seconds: 10,
          }}
          calculateMetadata={calculateTextBehindSubjectMetadata}
          durationInFrames={300}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="FilterLook"
          component={FilterLookDemo}
          schema={filterLookDemoSchema}
          defaultProps={filterLookDemoDefaults}
          calculateMetadata={calculateFilterLookDemoMetadata}
          durationInFrames={300}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="PaperTexture"
          component={PaperTextureDemo}
          schema={paperTextureDemoSchema}
          defaultProps={paperTextureDemoDefaults}
          durationInFrames={150}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="MatchCut"
          component={MatchCut}
          schema={matchCutSchema}
          defaultProps={matchCutDefaults}
          calculateMetadata={calculateMatchCutMetadata}
          durationInFrames={200}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="MatchCutVertical"
          component={MatchCut}
          schema={matchCutSchema}
          defaultProps={matchCutDefaults}
          calculateMetadata={calculateMatchCutMetadata}
          durationInFrames={200}
          fps={FPS}
          width={1080}
          height={1920}
        />
        <Composition
          id="PaperTextureVideo"
          component={PaperTextureDemo}
          schema={paperTextureDemoSchema}
          defaultProps={{ ...paperTextureDemoDefaults, videoFile: 'testvideo3.mp4', compare: true, preset: 'Texture only' }}
          durationInFrames={177}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>
      <Folder name="Minimal-Titles">
        <Composition id="MinimalTitlesReel" component={MinimalTitlesReel} durationInFrames={MINIMAL_REEL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="MinimalTitlesGrid" component={MinimalTitlesGrid} durationInFrames={180} fps={FPS} width={WIDTH} height={HEIGHT} />
        {MINIMAL_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={MinimalTitle}
            schema={minimalTitleSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={100}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="RGB-Text">
        <Composition id="RgbTextReel" component={RgbTextReel} durationInFrames={RGB_REEL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
        {RGB_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={RgbText}
            schema={rgbTextSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={90}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Notifications">
        {(['Full story', 'Card stack only', 'Phone only'] as const).map((section) => (
          <Composition
            key={section}
            id={section === 'Full story' ? 'NotificationStory' : section === 'Card stack only' ? 'NotificationStack' : 'NotificationPhone'}
            component={NotificationStory}
            schema={notificationStorySchema}
            defaultProps={{ ...notificationStoryDefaults, section }}
            calculateMetadata={calculateNotificationStoryMetadata}
            durationInFrames={300}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Depth-Titles">
        <Composition
          id="DepthTitlesReel"
          component={DepthTitlesReel}
          durationInFrames={DEPTH_REEL_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        {DEPTH_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={DepthTitles}
            schema={depthTitlesSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={120}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Captions">
        <Composition
          id="CaptionsShowcase"
          component={CaptionsShowcase}
          durationInFrames={CAPTIONS_SHOWCASE_SECONDS * FPS}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        {CAPTION_PRESETS.map((preset, i) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={CaptionDemo}
            schema={captionDemoSchema}
            defaultProps={captionDemoProps(i)}
            calculateMetadata={calculateCaptionDemoMetadata}
            durationInFrames={120}
            fps={FPS}
            width={1080}
            height={1920}
          />
        ))}
      </Folder>
      <Folder name="Transitions">
        <Composition
          id="TransitionsShowcase"
          component={TransitionsShowcase}
          schema={transitionsShowcaseSchema}
          defaultProps={transitionsShowcaseDefaults}
          calculateMetadata={calculateTransitionsShowcaseMetadata}
          durationInFrames={200}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="ChapterStoryboard"
          component={ChapterStoryboard}
          schema={chapterStoryboardSchema}
          defaultProps={chapterStoryboardDefaults}
          calculateMetadata={calculateChapterStoryboardMetadata}
          durationInFrames={200}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        {TRANSITION_NAMES.map((name) => (
          <Composition
            key={name}
            id={transitionId(name)}
            component={TwoClipTransition}
            schema={twoClipTransitionSchema}
            defaultProps={{ ...twoClipDefaults, ...TWO_CLIP_PRESETS[name], transition: name }}
            calculateMetadata={calculateTwoClipMetadata}
            durationInFrames={120}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
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
