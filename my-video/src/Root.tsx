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
import { CONTENT_GLASS_DURATION, ContentCreationGlass } from './projects/ContentCreationGlass';
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
import { LIQUID_GLASS_PRESETS, LiquidGlassTitle, liquidGlassSchema } from './liquidglass/LiquidGlass';
import { GlassCard, glassCardDefaults, glassCardSchema } from './liquidglass/GlassCard';
import { GlassSidePanel, glassSidePanelDefaults, glassSidePanelSchema } from './liquidglass/GlassSidePanel';
import { GlassDome, glassDomeDefaults, glassDomeSchema } from './liquidglass/GlassDome';
import { GlassWordSelector, glassWordSelectorSchema, WORD_SELECTOR_PRESETS } from './liquidglass/GlassWordSelector';
import { GLASS_BUTTON_PRESETS, GlassButtons, glassButtonsSchema } from './liquidglass/GlassButtons';
import { FACE_CAM_PRESETS, GlassFaceCam, glassFaceCamSchema } from './liquidglass/GlassFaceCam';
import { GlassScreen, glassScreenDefaults, glassScreenSchema } from './liquidglass/GlassScreen';
import { GLASS_STATS_PRESETS, GlassStats, glassStatsSchema } from './liquidglass/GlassStats';
import {
  GlassBottomBar,
  glassBottomBarDefaults,
  glassBottomBarSchema,
  GlassRightPanel,
  glassRightPanelDefaults,
  glassRightPanelSchema,
} from './liquidglass/GlassPanels';
import { SEARCH_BAR_PRESETS, SearchBar, searchBarSchema, SearchBarsGrid } from './searchbars/SearchBar';
import { PIXEL_BUTTON_PRESETS, PixelButton, pixelButtonSchema } from './pixelui/PixelButton';
import { PIXEL_ICON_PRESETS, PixelIcon, pixelIconSchema } from './pixelui/PixelIcon';
import { PixelUIGrid } from './pixelui/PixelUIGrid';
import { GOLD_TEXT_PRESETS, GoldText, goldTextSchema } from './goldtheme/GoldText';
import { HexBadgeWhitePreview, HexMotionLogoFinal, HexMotionLogoSheet } from './brand/HexMotionLogo';
import { RETRO_PRESETS, RetroTitle, retroSchema } from './retro/RetroTitles';
import { GOLD_INFO_PRESETS, GoldInfographic, goldInfoSchema } from './goldtheme/GoldInfographics';
import { GOLD_CONTENT_PRESETS, GoldContentCard, goldContentCardSchema } from './goldtheme/GoldContentCard';
import { GOLD_ON_VIDEO_FRAMES, GoldOnVideo, goldOnVideoDefaults, goldOnVideoSchema } from './goldtheme/GoldOnVideo';
import { GOLD_REEL_FRAMES, GOLD_TITLE_PRESETS, GoldTitle, goldTitleSchema, GoldTitlesReel } from './goldtheme/GoldTitles';
import {
  calculatePixelTransitionMetadata,
  PIXEL_TRANSITION_NAMES,
  PIXEL_TRANSITION_PRESETS,
  PixelTransition,
  pixelTransitionDefaults,
  pixelTransitionId,
  pixelTransitionSchema,
} from './pixeltransitions/PixelTransition';
import { PIXEL_TX_REEL_FRAMES, PixelTransitionsReel } from './pixeltransitions/PixelTransitionsReel';
import { PIXEL_TITLE_PRESETS, PIXEL_TITLES_REEL_FRAMES, pixelTitleSchema, PixelTitlesReel } from './pixeltitles';
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
        <Composition
          id="ContentCreationGlass"
          component={ContentCreationGlass}
          durationInFrames={CONTENT_GLASS_DURATION}
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
      <Folder name="Glass-Stats">
        {GLASS_STATS_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GlassStats}
            schema={glassStatsSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={180}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Glass-FaceCam">
        <Composition
          id="GlassScreen-16x9"
          component={GlassScreen}
          schema={glassScreenSchema}
          defaultProps={glassScreenDefaults}
          calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
          durationInFrames={240}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        {FACE_CAM_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GlassFaceCam}
            schema={glassFaceCamSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={240}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Glass-Buttons">
        {GLASS_BUTTON_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GlassButtons}
            schema={glassButtonsSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={150}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Glass-Words">
        {WORD_SELECTOR_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GlassWordSelector}
            schema={glassWordSelectorSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={240}
            fps={FPS}
            width={preset.vertical ? 1080 : WIDTH}
            height={preset.vertical ? 1920 : HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Liquid-Glass">
        <Composition
          id="LiquidGlass-10-Dome"
          component={GlassDome}
          schema={glassDomeSchema}
          defaultProps={glassDomeDefaults}
          calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
          durationInFrames={240}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="LiquidGlass-08-Bottom-Bar"
          component={GlassBottomBar}
          schema={glassBottomBarSchema}
          defaultProps={glassBottomBarDefaults}
          calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
          durationInFrames={240}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="LiquidGlass-09-Right-Panel"
          component={GlassRightPanel}
          schema={glassRightPanelSchema}
          defaultProps={glassRightPanelDefaults}
          calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
          durationInFrames={240}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="LiquidGlass-07-Side-Panel"
          component={GlassSidePanel}
          schema={glassSidePanelSchema}
          defaultProps={glassSidePanelDefaults}
          calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
          durationInFrames={210}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="LiquidGlass-06-Glass-Card"
          component={GlassCard}
          schema={glassCardSchema}
          defaultProps={glassCardDefaults}
          calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
          durationInFrames={240}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        {LIQUID_GLASS_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={LiquidGlassTitle}
            schema={liquidGlassSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={258}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Brand">
        <Composition id="HexMotion-LogoSheet" component={HexMotionLogoSheet} durationInFrames={30} fps={FPS} width={WIDTH} height={HEIGHT} />
        <Composition id="HexMotion-LogoFinal" component={HexMotionLogoFinal} durationInFrames={30} fps={FPS} width={1024} height={1024} />
        <Composition id="HexMotion-BadgeWhite" component={HexBadgeWhitePreview} durationInFrames={30} fps={FPS} width={WIDTH} height={HEIGHT} />
      </Folder>
      <Folder name="Retro">
        {RETRO_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={RetroTitle}
            schema={retroSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={150}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Gold-Infographics">
        {GOLD_INFO_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GoldInfographic}
            schema={goldInfoSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={210}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Gold-Titles">
        <Composition
          id="GoldTitles-OnVideo"
          component={GoldOnVideo}
          schema={goldOnVideoSchema}
          defaultProps={goldOnVideoDefaults}
          durationInFrames={GOLD_ON_VIDEO_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        {GOLD_CONTENT_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GoldContentCard}
            schema={goldContentCardSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={210}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
        <Composition id="GoldTitlesReel" component={GoldTitlesReel} durationInFrames={GOLD_REEL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
        {GOLD_TITLE_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GoldTitle}
            schema={goldTitleSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={120}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Gold-Theme">
        {GOLD_TEXT_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={GoldText}
            schema={goldTextSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={150}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Pixel-Transitions">
        <Composition id="PixelTransitionsReel" component={PixelTransitionsReel} durationInFrames={PIXEL_TX_REEL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
        {PIXEL_TRANSITION_NAMES.map((name) => (
          <Composition
            key={name}
            id={pixelTransitionId(name)}
            component={PixelTransition}
            schema={pixelTransitionSchema}
            defaultProps={{ ...pixelTransitionDefaults, ...PIXEL_TRANSITION_PRESETS[name], transition: name }}
            calculateMetadata={calculatePixelTransitionMetadata}
            durationInFrames={120}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Pixel-Titles">
        <Composition id="PixelTitlesReel" component={PixelTitlesReel} durationInFrames={PIXEL_TITLES_REEL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
        {PIXEL_TITLE_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={preset.component}
            schema={pixelTitleSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={120}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Pixel-UI">
        <Composition id="PixelUIGrid" component={PixelUIGrid} durationInFrames={210} fps={FPS} width={WIDTH} height={HEIGHT} />
        {PIXEL_BUTTON_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={PixelButton}
            schema={pixelButtonSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={90}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
        {PIXEL_ICON_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={PixelIcon}
            schema={pixelIconSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={90}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </Folder>
      <Folder name="Search-Bars">
        <Composition id="SearchBarsGrid" component={SearchBarsGrid} durationInFrames={240} fps={FPS} width={WIDTH} height={HEIGHT} />
        {SEARCH_BAR_PRESETS.map((preset) => (
          <Composition
            key={preset.id}
            id={preset.id}
            component={SearchBar}
            schema={searchBarSchema}
            defaultProps={preset.props}
            calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.seconds * FPS) })}
            durationInFrames={165}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
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
