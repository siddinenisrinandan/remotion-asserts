import { Video } from '@remotion/media';
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  Loop,
  Sequence,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig, staticFile,
} from 'remotion';
import {
  ChunkyPieChart,
  ClaudeLineTextIntro,
  Exploded3DPieChart,
  StarMethodInfographic,
  VerticalTimelineInfographic,
} from '../infografics';
import { LowerThird1, LowerThird1Props } from '../Lowerthird/LowerThird1';
import { Callout4 } from '../callouts';
import { TextAsMask } from '../textstyles';
import {
  Basic3DScene,
  CaptionEffect,
  KaraokeFillSync,
  WordRelayFilmstrip,
} from '../video shortcraft';
import { C, INTER, LightBackground, MONO, Reveal, SceneFade, WordByWord } from './ui';
import { SfxCue, SfxTrack } from '../SfxTrack';

// Scene lengths (30 fps)
export const SCENES = {
  intro: 150,
  built: 240,
  problem: 180,
  solution: 300,
  goal: 240,
  road: 210,
  outro: 210,
};
export const MOTIVATION_DURATION = Object.values(SCENES).reduce((a, b) => a + b, 0);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Renders a full 1920x1080 component shrunk into a box. */
const Mini: React.FC<{ w: number; children: React.ReactNode }> = ({ w, children }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 1920,
      height: 1080,
      transform: `scale(${w / 1920})`,
      transformOrigin: 'top left',
    }}
  >
    {children}
  </div>
);

// -----------------------------------------------------------
// 1. INTRO
// -----------------------------------------------------------
const Intro: React.FC = () => (
  <SceneFade>
    <LightBackground />
    <AbsoluteFill
      style={{ justifyContent: 'center', alignItems: 'center', fontFamily: INTER, color: C.text }}
    >
      <WordByWord text="Every great tool" delay={10} style={{ fontSize: 96, fontWeight: 800 }} />
      <WordByWord
        text="starts with one person."
        delay={34}
        style={{ fontSize: 96, fontWeight: 800, marginTop: 10 }}
        highlight={['one', 'person']}
      />
    </AbsoluteFill>
  </SceneFade>
);

// -----------------------------------------------------------
// 2. WHAT YOU BUILT (live wall of your components)
// -----------------------------------------------------------
const TILES: { node: React.ReactNode; length: number; offset: number }[] = [
  { node: <ClaudeLineTextIntro />, length: 240, offset: 150 },
  { node: <CaptionEffect />, length: 150, offset: 60 },
  { node: <VerticalTimelineInfographic />, length: 300, offset: 120 },
  { node: <ChunkyPieChart />, length: 150, offset: 50 },
  { node: <LowerThird1 />, length: 150, offset: 30 },
  { node: <Callout4 />, length: 150, offset: 40 },
  { node: <TextAsMask />, length: 165, offset: 60 },
  { node: <Basic3DScene />, length: 240, offset: 20 },
  { node: <StarMethodInfographic />, length: 150, offset: 60 },
  { node: <WordRelayFilmstrip />, length: 180, offset: 40 },
  { node: <Exploded3DPieChart />, length: 150, offset: 50 },
  { node: <KaraokeFillSync />, length: 150, offset: 40 },
];

const Built: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const TW = 400;
  const TH = 225;
  const GAP = 16;

  const dim = interpolate(frame, [105, 130], [0, 0.82], clamp);
  const count = Math.round(interpolate(frame, [115, 165], [0, 71], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const countPop = spring({ frame: frame - 112, fps, config: { damping: 14, stiffness: 120 } });

  return (
    <SceneFade>
      <AbsoluteFill style={{ fontFamily: INTER, color: C.text }}>
        <div style={{ position: 'absolute', top: 70, width: '100%' }}>
          <WordByWord
            text="Look at what you've already built."
            delay={0}
            every={3}
            style={{ fontSize: 54, fontWeight: 800 }}
            highlight={['built']}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 190,
            left: (1920 - (TW * 4 + GAP * 3)) / 2,
            display: 'grid',
            gridTemplateColumns: `repeat(4, ${TW}px)`,
            gap: GAP,
          }}
        >
          {TILES.map((tile, i) => {
            const p = spring({ frame: frame - 8 - i * 4, fps, config: { damping: 16 } });
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  width: TW,
                  height: TH,
                  overflow: 'hidden',
                  borderRadius: 14,
                  background: '#0b0f16',
                  border: `1px solid ${C.panelBorder}`,
                  opacity: p,
                  transform: `scale(${interpolate(p, [0, 1], [0.8, 1])})`,
                }}
              >
                <Mini w={TW}>
                  <Sequence from={-tile.offset}>
                    <Loop durationInFrames={tile.length}>{tile.node}</Loop>
                  </Sequence>
                </Mini>
              </div>
            );
          })}
        </div>

        {/* Dim + counter */}
        <AbsoluteFill style={{ backgroundColor: `rgba(6,8,13,${dim})` }} />
        {frame >= 110 && (
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 300,
                fontWeight: 900,
                lineHeight: 1,
                color: C.teal,
                transform: `scale(${interpolate(countPop, [0, 1], [0.6, 1])})`,
                opacity: countPop,
                textShadow: '0 0 80px rgba(45,212,191,0.35)',
              }}
            >
              {count}
            </div>
            <Reveal delay={140} style={{ fontSize: 60, fontWeight: 800, marginTop: 10 }}>
              animated components.
            </Reveal>
            <Reveal delay={165} style={{ fontSize: 34, color: C.muted, marginTop: 24, fontWeight: 600 }}>
              Lower thirds · Callouts · Charts · Text styles · Backgrounds · 3D
            </Reveal>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </SceneFade>
  );
};

// -----------------------------------------------------------
// 3. THE PROBLEM
// -----------------------------------------------------------
const CODE_LINES = [
  { t: '// LowerThird1.tsx', c: C.muted },
  { t: "backgroundColor: '#00897B',", c: C.text },
  { t: 'fontSize: 42,', c: C.text },
  { t: "headlineText = 'SAMPLE TEXT HERE'", c: C.text },
];

const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const charsShown = Math.floor(interpolate(frame, [25, 95], [0, 120], clamp));
  const strike = spring({ frame: frame - 105, fps, config: { damping: 200 } });
  const shake = frame >= 105 && frame < 118 ? Math.sin(frame * 2.5) * 6 : 0;

  let remaining = charsShown;
  return (
    <SceneFade>
      <AbsoluteFill style={{ fontFamily: INTER, color: C.text, alignItems: 'center' }}>
        <div style={{ marginTop: 150 }}>
          <WordByWord
            text="But every new video meant this:"
            every={3}
            style={{ fontSize: 64, fontWeight: 800 }}
          />
        </div>
        <div
          style={{
            position: 'relative',
            marginTop: 70,
            width: 1000,
            padding: '36px 48px',
            background: C.panel,
            border: `1px solid ${C.panelBorder}`,
            borderRadius: 18,
            fontFamily: MONO,
            fontSize: 36,
            lineHeight: 1.7,
            transform: `translateX(${shake}px)`,
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          }}
        >
          {CODE_LINES.map((line, i) => {
            const shown = line.t.slice(0, Math.max(0, remaining));
            remaining -= line.t.length;
            return (
              <div key={i} style={{ color: line.c, minHeight: 61, whiteSpace: 'pre' }}>
                {shown}
              </div>
            );
          })}
          {/* Red strike */}
          <div
            style={{
              position: 'absolute',
              left: 30,
              right: 30,
              top: '52%',
              height: 10,
              borderRadius: 5,
              background: C.red,
              transform: `scaleX(${strike}) rotate(-4deg)`,
              transformOrigin: 'left center',
              boxShadow: `0 0 30px ${C.red}`,
            }}
          />
        </div>
        <div style={{ marginTop: 60, display: 'flex', gap: 28, fontSize: 40, fontWeight: 700 }}>
          {['Open the code.', 'Find the line.', 'Change it.'].map((s, i) => (
            <Reveal key={s} delay={118 + i * 8} style={{ color: C.muted }}>
              {s}
            </Reveal>
          ))}
          <Reveal delay={142} style={{ color: C.red }}>
            Repeat.
          </Reveal>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// -----------------------------------------------------------
// 4. THE FIX (live editable lower third + props panel)
// -----------------------------------------------------------
const STATES: { start: number; props: Partial<LowerThird1Props>; changed: string }[] = [
  {
    start: 20,
    changed: 'bigText',
    props: { bigText: 'EDIT WITHOUT CODE', smallTabText: 'STEP 01', bannerAndLineColor: '#0d9488', position: 'Bottom left' },
  },
  {
    start: 105,
    changed: 'bannerAndLineColor',
    props: { bigText: 'ANY COLOR. ONE CLICK.', smallTabText: 'STEP 02', bannerAndLineColor: '#e11d48', position: 'Bottom left' },
  },
  {
    start: 190,
    changed: 'position',
    props: { bigText: 'PUT IT ANYWHERE', smallTabText: 'STEP 03', bannerAndLineColor: '#7c3aed', position: 'Top right' },
  },
];

const PropRow: React.FC<{ label: string; active: number; children: React.ReactNode }> = ({
  label,
  active,
  children,
}) => (
  <div style={{ marginBottom: 26 }}>
    <div style={{ fontFamily: MONO, fontSize: 22, color: C.muted, marginBottom: 10 }}>{label}:</div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        borderRadius: 10,
        background: '#141a24',
        border: `2px solid ${active > 0 ? C.teal : C.panelBorder}`,
        boxShadow: active > 0 ? `0 0 ${24 * active}px rgba(45,212,191,${0.5 * active})` : 'none',
        fontSize: 26,
        fontWeight: 600,
        minHeight: 34,
      }}
    >
      {children}
    </div>
  </div>
);

const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const win = spring({ frame: frame - 10, fps, config: { damping: 200 } });

  const idx = frame >= STATES[2].start ? 2 : frame >= STATES[1].start ? 1 : 0;
  const state = STATES[idx];
  const glow = interpolate(frame - state.start, [0, 6, 40], [0, 1, 0], clamp);
  const isActive = (key: string) => (state.changed === key ? glow : 0);

  const PW = 1100;
  const PH = (PW * 9) / 16;

  return (
    <SceneFade>
      <AbsoluteFill style={{ fontFamily: INTER, color: C.text }}>
        <div style={{ position: 'absolute', top: 70, width: '100%' }}>
          <WordByWord
            text="So we're making it editable."
            every={3}
            style={{ fontSize: 64, fontWeight: 800 }}
            highlight={['editable']}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 220,
            left: 90,
            display: 'flex',
            gap: 40,
            opacity: win,
            transform: `translateY(${interpolate(win, [0, 1], [60, 0])}px)`,
          }}
        >
          {/* Preview window */}
          <div
            style={{
              width: PW,
              borderRadius: 16,
              overflow: 'hidden',
              border: `1px solid ${C.panelBorder}`,
              background: C.panel,
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px' }}>
              {[C.red, C.gold, C.teal].map((c) => (
                <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
              ))}
              <div style={{ marginLeft: 14, fontSize: 20, color: C.muted, fontWeight: 600 }}>Preview</div>
            </div>
            <div style={{ position: 'relative', width: PW, height: PH, overflow: 'hidden' }}>
              <Mini w={PW}>
                <LightBackground glow="rgba(167,139,250,0.22)" dots={0.12} />
                {STATES.map((s, i) => {
                  const isLast = i === STATES.length - 1;
                  const end = isLast ? SCENES.solution : STATES[i + 1].start;
                  // Each step gets 30 extra frames so its exit animation never starts;
                  // it is swapped out the moment the next step (or the scene) ends.
                  if (frame >= end) return null;
                  return (
                    <Sequence
                      key={i}
                      from={s.start}
                      durationInFrames={end - s.start + 30}
                    >
                      <LowerThird1 {...s.props} size={1.25} />
                    </Sequence>
                  );
                })}
              </Mini>
            </div>
          </div>

          {/* Props panel */}
          <div
            style={{
              width: 560,
              padding: '28px 30px',
              borderRadius: 16,
              background: C.panel,
              border: `1px solid ${C.panelBorder}`,
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}>Props</div>
            <PropRow label="bigText" active={isActive('bigText')}>
              {state.props.bigText}
            </PropRow>
            <PropRow label="bannerAndLineColor" active={isActive('bannerAndLineColor')}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: state.props.bannerAndLineColor,
                  border: '2px solid #2a3342',
                }}
              />
              <span style={{ fontFamily: MONO }}>{state.props.bannerAndLineColor}</span>
            </PropRow>
            <PropRow label="position" active={isActive('position')}>
              {state.props.position} <span style={{ color: C.muted, marginLeft: 'auto' }}>▾</span>
            </PropRow>
            <PropRow label="size" active={0}>
              1.25
            </PropRow>
            <div style={{ fontSize: 22, color: C.teal, fontWeight: 700, marginTop: 6 }}>
              ✓ Saved automatically
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// -----------------------------------------------------------
// 5. THE GOAL
// -----------------------------------------------------------
const STEPS = [
  { n: '1', title: 'Pick a template', sub: '71+ animated designs', color: C.teal },
  { n: '2', title: 'Edit with clicks', sub: 'Colors, text, data. No code.', color: C.gold },
  { n: '3', title: 'Ask the AI', sub: '"Make the title red"', color: C.purple },
  { n: '4', title: 'Export', sub: 'MP4 for YouTube & Shorts', color: C.red },
];

const Goal: React.FC = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [80, 160], [0, 1], clamp);
  return (
    <SceneFade>
      <AbsoluteFill style={{ fontFamily: INTER, color: C.text, alignItems: 'center' }}>
        <Reveal delay={0} style={{ marginTop: 120, fontSize: 28, fontWeight: 800, letterSpacing: 8, color: C.gold }}>
          THE FINAL GOAL
        </Reveal>
        <Reveal delay={10} style={{ fontSize: 110, fontWeight: 900, marginTop: 24 }}>
          Paste a script.
        </Reveal>
        <Reveal delay={30} style={{ fontSize: 110, fontWeight: 900, color: C.teal, marginTop: -6 }}>
          Get a video.
        </Reveal>
        <Reveal delay={50} style={{ fontSize: 32, color: C.muted, marginTop: 20, fontWeight: 600 }}>
          A desktop editor where nobody ever has to touch code.
        </Reveal>

        <div style={{ position: 'relative', marginTop: 80, display: 'flex', gap: 40 }}>
          <div
            style={{
              position: 'absolute',
              top: 46,
              left: 180,
              width: 3 * 380,
              height: 4,
              background: `linear-gradient(90deg, ${C.teal}, ${C.gold}, ${C.purple}, ${C.red})`,
              transform: `scaleX(${line})`,
              transformOrigin: 'left',
              borderRadius: 2,
            }}
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={75 + i * 18} style={{ width: 340, textAlign: 'center' }}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  margin: '0 auto',
                  borderRadius: 46,
                  background: C.bg,
                  border: `4px solid ${s.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 42,
                  fontWeight: 900,
                  color: s.color,
                  position: 'relative',
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, marginTop: 22 }}>{s.title}</div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 8, fontWeight: 600 }}>{s.sub}</div>
            </Reveal>
          ))}
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// -----------------------------------------------------------
// 6. THE ROAD
// -----------------------------------------------------------
const STAGES = ['Core editor', 'Make it easy', 'AI + voice', 'Polish & share'];
const DONE = [
  'Library cleaned up: 71 components in the Studio',
  'Flicker and render bugs fixed',
  'First component with live, no-code controls',
];

const Check: React.FC = () => (
  <svg width="34" height="34" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill={C.teal} />
    <path d="M6.5 12.5l3.5 3.5 7.5-8" stroke={C.bg} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Road: React.FC = () => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [30, 80], [0, 0.12], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const pulse = 1 + 0.12 * Math.sin(frame / 5);
  const X0 = 260;
  const LEN = 1400;
  return (
    <SceneFade>
      <AbsoluteFill style={{ fontFamily: INTER, color: C.text }}>
        <Reveal delay={0} style={{ position: 'absolute', top: 110, width: '100%', textAlign: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 8, color: C.gold }}>
          THE ROAD
        </Reveal>
        <div style={{ position: 'absolute', top: 160, width: '100%' }}>
          <WordByWord text="Four stages. One builder." delay={8} every={4} style={{ fontSize: 76, fontWeight: 900 }} highlight={['One', 'builder']} />
        </div>

        {/* Track */}
        <div style={{ position: 'absolute', top: 440, left: X0, width: LEN, height: 6, background: C.panelBorder, borderRadius: 3 }} />
        <div style={{ position: 'absolute', top: 440, left: X0, width: LEN * fill, height: 6, background: C.teal, borderRadius: 3, boxShadow: `0 0 20px ${C.teal}` }} />
        {STAGES.map((s, i) => {
          const x = X0 + (LEN / 3) * i;
          const here = i === 0;
          return (
            <Reveal key={s} delay={30 + i * 10} y={20}>
              <div
                style={{
                  position: 'absolute',
                  top: 443 - 22,
                  left: x - 22,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: here ? C.teal : C.bg,
                  border: `4px solid ${here ? C.teal : '#3a4558'}`,
                  transform: here ? `scale(${pulse})` : undefined,
                  boxShadow: here ? `0 0 40px ${C.teal}` : 'none',
                }}
              />
              <div style={{ position: 'absolute', top: 490, left: x - 160, width: 320, textAlign: 'center' }}>
                <div style={{ fontSize: 22, color: C.muted, fontWeight: 700, letterSpacing: 2 }}>STAGE {i + 1}</div>
                <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6, color: here ? C.teal : C.text }}>{s}</div>
              </div>
              {here && (
                <div
                  style={{
                    position: 'absolute',
                    top: 350,
                    left: x - 110,
                    width: 220,
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 3,
                    color: C.bg,
                    background: C.teal,
                    borderRadius: 10,
                    padding: '8px 0',
                  }}
                >
                  YOU ARE HERE
                </div>
              )}
            </Reveal>
          );
        })}

        <div style={{ position: 'absolute', top: 650, left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <Reveal delay={80} style={{ fontSize: 26, fontWeight: 800, color: C.muted, letterSpacing: 4 }}>
            ALREADY DONE
          </Reveal>
          {DONE.map((d, i) => (
            <Reveal key={d} delay={95 + i * 14} style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 36, fontWeight: 700, width: 1000 }}>
              <Check />
              {d}
            </Reveal>
          ))}
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

// -----------------------------------------------------------
// 7. OUTRO
// -----------------------------------------------------------
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const firstOut = interpolate(frame, [95, 115], [1, 0], clamp);
  const underline = spring({ frame: frame - 140, fps, config: { damping: 200 } });
  return (
    <SceneFade out={25}>
      <LightBackground glow="rgba(45,212,191,0.28)" />
      <AbsoluteFill style={{ fontFamily: INTER, color: C.text, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ position: 'absolute', opacity: firstOut, textAlign: 'center', marginTop: -120 }}>
          <WordByWord text="A team of one" delay={8} every={5} style={{ fontSize: 120, fontWeight: 900 }} highlight={['one']} />
          <WordByWord text="is enough to start." delay={36} every={4} style={{ fontSize: 64, fontWeight: 700, color: C.muted, marginTop: 16 }} />
        </div>
        {frame >= 112 && (
          <div style={{ position: 'absolute', textAlign: 'center', marginTop: -120 }}>
            <WordByWord text="Keep building." delay={115} every={6} style={{ fontSize: 170, fontWeight: 900 }} highlight={['building']} />
            <div
              style={{
                margin: '18px auto 0',
                width: 760,
                height: 10,
                borderRadius: 5,
                background: `linear-gradient(90deg, ${C.teal}, ${C.gold})`,
                transform: `scaleX(${underline})`,
              }}
            />
            <Reveal delay={155} style={{ fontSize: 34, color: C.muted, marginTop: 34, fontWeight: 600 }}>
              Next up: the editor.
            </Reveal>
          </div>
        )}
      </AbsoluteFill>
    </SceneFade>
  );
};

// -----------------------------------------------------------
// SOUND EFFECTS
// Each cue: which sound, the frame inside its scene, and volume (0–1).
// To change a sound, edit only this list.
// -----------------------------------------------------------
const SCENE_START = (() => {
  let t = 0;
  const starts = {} as Record<keyof typeof SCENES, number>;
  (Object.keys(SCENES) as (keyof typeof SCENES)[]).forEach((k) => {
    starts[k] = t;
    t += SCENES[k];
  });
  return starts;
})();

const cue = (scene: keyof typeof SCENES, frame: number, sound: SfxCue['sound'], volume: number): SfxCue => ({
  at: SCENE_START[scene] + frame,
  sound,
  volume,
});

const SFX_CUES: SfxCue[] = [
  // 1. Intro
  cue('intro', 10, 'whoosh-soft', 0.35),
  cue('intro', 42, 'chime-magic-reveal', 0.45), // "one person"
  // 2. What you built
  cue('built', 8, 'whoosh-synth-whip', 0.5), // wall flies in
  cue('built', 112, 'pop-bubble', 0.5), // counter pops up
  cue('built', 165, 'cash-register', 0.55), // counter lands on 71
  // 3. The problem
  cue('problem', 25, 'click-mouse', 0.3), // code typing
  cue('problem', 62, 'click-mouse', 0.3),
  cue('problem', 105, 'glitch-digital-error', 0.5), // red strike
  cue('problem', 142, 'pop-bubble', 0.35), // "Repeat."
  // 4. The fix (editor demo)
  cue('solution', 10, 'whoosh-air', 0.45), // editor window
  ...STATES.flatMap((s, i) => [
    cue('solution', s.start, 'whoosh-synth-whip', 0.45), // banner slides in
    ...(i > 0 ? [cue('solution', s.start, 'click-mouse', 0.3)] : []), // a setting changes
  ]),
  // 5. The goal
  cue('goal', 10, 'whoosh-air', 0.45), // "Paste a script."
  cue('goal', 30, 'camera-flash-vintage', 0.5), // "Get a video."
  ...STEPS.map((_, i) => cue('goal', 75 + i * 18, 'pop-bubble', 0.3)), // steps 1–4
  // 6. The road
  cue('road', 8, 'whoosh-soft', 0.35),
  ...DONE.map((_, i) => cue('road', 95 + i * 14, 'ding-correct', 0.35)), // checkmarks
  // 7. Outro
  cue('outro', 115, 'whoosh-soft', 0.4), // "Keep building."
  cue('outro', 118, 'chime-magic-reveal', 0.5),
];

// -----------------------------------------------------------
// MAIN
// -----------------------------------------------------------
export const MotivationVideo: React.FC = () => {
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: C.bg }}>
        {/* Light dot-grid background behind the middle scenes for continuity */}
        <Sequence from={SCENES.intro} durationInFrames={MOTIVATION_DURATION - SCENES.intro - SCENES.outro}>
          <LightBackground glow="rgba(45,212,191,0.08)" dots={0.06} />
        </Sequence>
        <Series>
          <Series.Sequence durationInFrames={SCENES.intro}>
            <Intro />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.built}>
            <Built />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.problem}>
            <Problem />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.solution}>
            <Solution />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.goal}>
            <Goal />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.road}>
            <Road />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.outro}>
            <Outro />
          </Series.Sequence>
        </Series>
      </AbsoluteFill>
      <SfxTrack cues={SFX_CUES} />
    </>
  );
};
