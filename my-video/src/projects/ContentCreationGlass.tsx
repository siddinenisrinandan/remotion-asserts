import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { SfxCue, SfxTrack } from '../SfxTrack';
import { BgOffset } from '../liquidglass/bgClock';
import { Background, LiquidGlassTitle, liquidGlassDefaults } from '../liquidglass/LiquidGlass';
import { GlassWordSelector } from '../liquidglass/GlassWordSelector';
import { GlassCard } from '../liquidglass/GlassCard';
import { GlassSidePanel } from '../liquidglass/GlassSidePanel';
import { GlassRightPanel } from '../liquidglass/GlassPanels';
import { GlassStats } from '../liquidglass/GlassStats';
import { GlassDome } from '../liquidglass/GlassDome';
import { GlassScreen } from '../liquidglass/GlassScreen';
import { GlassButtons } from '../liquidglass/GlassButtons';
import { SearchBar } from '../searchbars/SearchBar';

// -----------------------------------------------------------
// HOW TO START CONTENT CREATION  (≈1 minute, liquid glass only)
// Every scene is just props on a liquid-glass asset. One long
// background video runs through the whole film: each scene gets the
// right start offset (BgOffset), so the background never jumps at a
// cut — only the glass changes. Sound cues follow the action.
// -----------------------------------------------------------

const FPS = 30;
const BG = 'bg_liquid_long.mp4';

/** Background video + a transparent search bar on top. */
const SearchScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background p={{ ...liquidGlassDefaults, videoFile: BG }} frame={frame} W={width} H={height} />
      <SearchBar
        transparent
        theme="Light"
        border="Rainbow"
        icon="Sparkle"
        button="Send arrow"
        placeholder="Ask anything"
        query="How do I start content creation?"
        typeStart={0.6}
        lettersPerSecond={18}
        width={1350}
        height={140}
        fontSize={50}
        seconds={seconds}
      />
    </AbsoluteFill>
  );
};

type Scene = { seconds: number; render: (seconds: number) => React.ReactNode; cues?: (start: number) => SfxCue[] };

const QUERY_LEN = 'How do I start content creation?'.length;

const SCENES: Scene[] = [
  {
    seconds: 4.2,
    render: (seconds) => <SearchScene seconds={seconds} />,
    cues: (s) => [
      { sound: 'keyboard-typing', at: s + 18, volume: 0.35, seconds: QUERY_LEN / 18 },
      { sound: 'click-mouse', at: s + Math.round((0.6 + QUERY_LEN / 18 + 0.45) * FPS), volume: 0.5 },
    ],
  },
  {
    seconds: 5.5,
    render: (seconds) => (
      <LiquidGlassTitle
        {...liquidGlassDefaults}
        videoFile={BG}
        shade={0.22}
        tint={0.06}
        frost={12}
        title="START CREATING"
        body="Your first steps to making videos people love — no fancy gear, no big team, just a clear plan."
        badge={'Beginner\nGuide'}
        seconds={seconds}
      />
    ),
    cues: (s) => [{ sound: 'sparkle-wink', at: s + 4, volume: 0.45 }],
  },
  {
    seconds: 6.5,
    render: (seconds) => (
      <GlassWordSelector
        mode="Scroll vertical"
        words={['PICK A NICHE', 'PLAN', 'RECORD', 'EDIT', 'POST', 'GROW']}
        videoFile={BG}
        darken={0}
        fontSize={84}
        holdSeconds={0.6}
        moveSeconds={0.38}
        seconds={seconds}
      />
    ),
  },
  {
    seconds: 6,
    render: (seconds) => (
      <GlassCard videoFile={BG} header="Step 1" title="PICK|ONE|TOPIC|YOU|LOVE|TALKING|ABOUT" sideText="Be the go-to person" seconds={seconds} />
    ),
  },
  {
    seconds: 6,
    render: (seconds) => (
      <GlassSidePanel
        videoFile={BG}
        header="Step 2"
        title="PLAN BEFORE YOU SHOOT"
        body="Write a simple hook, three main|points and one clear ending.|Ten minutes of planning saves|an hour of editing — and keeps|people watching."
        seconds={seconds}
      />
    ),
  },
  {
    seconds: 6,
    render: (seconds) => (
      <GlassScreen
        backgroundFile={BG}
        screenFile="testvideo4.mp4"
        screenStart={2}
        caption="Step 3 · Your phone is enough — just press record"
        darken={0}
        seconds={seconds}
      />
    ),
  },
  {
    seconds: 5,
    render: (seconds) => (
      <GlassStats
        widget="Step progress"
        title="Step 4 · Keep your edit simple"
        value={4}
        note="Cut|Captions|Music|Export"
        background="Video"
        videoFile={BG}
        seconds={seconds}
        scale={1.15}
      />
    ),
    cues: (s) => [{ sound: 'ding-correct', at: s + 52, volume: 0.35 }],
  },
  {
    seconds: 5,
    render: (seconds) => <GlassButtons element="Action stack" videoFile={BG} darken={0} clickAt={1.6} scale={1.5} seconds={seconds} />,
    cues: (s) => [0, 1, 2].map((i) => ({ sound: 'pop-bubble' as const, at: s + 48 + i * 6, volume: 0.35 })),
  },
  {
    seconds: 6,
    render: (seconds) => (
      <GlassStats widget="Growth line" title="Followers after 90 days of posting" value={12400} target={48} background="Video" videoFile={BG} seconds={seconds} scale={1.1} />
    ),
    cues: (s) => [{ sound: 'cash-register', at: s + 50, volume: 0.25 }],
  },
  {
    seconds: 6,
    render: (seconds) => (
      <GlassRightPanel
        videoFile={BG}
        title="POST|EVERY|WEEK,|NOT EVERY|HOUR"
        body="Pick a schedule you can keep —|two videos a week is plenty.|Showing up again and again|is what makes people|trust you and follow."
        sideText="CONSISTENCY WINS OVER PERFECTION"
        seconds={seconds}
      />
    ),
  },
  {
    seconds: 4,
    render: (seconds) => (
      <GlassButtons element="Channel pill" name="Your Channel" handle="@yourname" videoFile={BG} darken={0} clickAt={1.6} scale={1.6} seconds={seconds} />
    ),
    cues: (s) => [{ sound: 'click-mouse', at: s + 48, volume: 0.5 }],
  },
  {
    seconds: 7,
    render: (seconds) => (
      <GlassDome
        videoFile={BG}
        arcText="YOUR FIRST VIDEO STARTS TODAY"
        label="JUST PRESS RECORD"
        body="It will not be perfect —|and that is exactly how|every creator started."
        shade={0.38}
        seconds={seconds}
      />
    ),
    cues: (s) => [{ sound: 'chime-magic-reveal', at: s + 30, volume: 0.35 }],
  },
];

export const CONTENT_GLASS_DURATION = SCENES.reduce((sum, sc) => sum + Math.round(sc.seconds * FPS), 0);

export const ContentCreationGlass: React.FC = () => {
  let from = 0;
  const cues: SfxCue[] = [];
  const seqs = SCENES.map((sc, i) => {
    const start = from;
    const len = Math.round(sc.seconds * FPS);
    from += len;
    // soft whoosh on every cut (except the very first frame)
    if (i > 0) cues.push({ sound: 'whoosh-soft', at: Math.max(0, start - 4), volume: 0.4 });
    if (sc.cues) cues.push(...sc.cues(start));
    return (
      <Sequence key={i} from={start} durationInFrames={len} name={`Scene ${i + 1}`}>
        <BgOffset.Provider value={start}>{sc.render(sc.seconds)}</BgOffset.Provider>
      </Sequence>
    );
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {seqs}
      <SfxTrack cues={cues} />
    </AbsoluteFill>
  );
};
