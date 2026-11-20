import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries } from '@remotion/transitions';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';
import { SfxCue, SfxTrack } from '../SfxTrack';
import { makeTransition, packDefaults, TRANSITION_NAMES, TRANSITIONS, TransitionName } from './TransitionsPack';

// -----------------------------------------------------------
// TRANSITIONS SHOWCASE
// Plays a row of scenes joined by the Transitions Pack.
// Pick one transition to repeat, or "All" for a showreel.
// Scenes are colour cards by default; give a scene a video file
// (from public/) to test the cut on real footage.
// -----------------------------------------------------------

const { fontFamily } = loadArchivo('normal', { weights: ['800'], subsets: ['latin'] });

const sceneSchema = z.object({
  title: z.string().describe('Big text on the card'),
  color: zColor().describe('Card background'),
  videoFile: z.string().describe('Optional: a video in public/ (e.g. testvideo.mp4). Empty = colour card'),
});

export const transitionsShowcaseSchema = z.object({
  transition: z.enum(['All (showreel)', ...TRANSITION_NAMES]).describe('Which transition to use between scenes'),
  intensity: z.number().min(0).max(1).step(0.05).describe('How strong the effect is'),
  speed: z.number().min(0.5).max(2).step(0.1).describe('1 = default length, 2 = twice as fast'),
  direction: z.enum(['Left', 'Right', 'Up', 'Down']).describe('Whip pan direction'),
  color: zColor().describe('Light leak / flash colour'),
  sceneSeconds: z.number().min(0.8).max(6).step(0.1).describe('How long each scene is on screen'),
  playSound: z.boolean().describe('Matching whoosh / glitch sound on every cut'),
  soundVolume: z.number().min(0).max(1).step(0.05),
  showLabels: z.boolean().describe('Show the next transition name on each card'),
  scenes: z.array(sceneSchema).min(2).max(10),
});

export type TransitionsShowcaseProps = z.infer<typeof transitionsShowcaseSchema>;

export const transitionsShowcaseDefaults: TransitionsShowcaseProps = {
  transition: 'All (showreel)',
  intensity: packDefaults.intensity,
  speed: 1,
  direction: 'Left',
  color: packDefaults.color,
  sceneSeconds: 1.6,
  playSound: true,
  soundVolume: 0.5,
  showLabels: true,
  scenes: [
    { title: 'START', color: '#1d3fd8', videoFile: '' },
    { title: 'PUNCH', color: '#e8364f', videoFile: '' },
    { title: 'WHIP', color: '#13a37f', videoFile: '' },
    { title: 'GLITCH', color: '#16161d', videoFile: '' },
    { title: 'GLOW', color: '#7a3cf0', videoFile: '' },
    { title: 'ZOOM', color: '#f2a516', videoFile: '' },
    { title: 'SWEEP', color: '#22313a', videoFile: '' },
    { title: 'REVEAL', color: '#0f2a44', videoFile: '' },
  ],
};

/** Which transition goes after scene i */
const transitionAt = (p: TransitionsShowcaseProps, i: number): TransitionName =>
  p.transition === 'All (showreel)' ? TRANSITION_NAMES[i % TRANSITION_NAMES.length] : p.transition;

const buildCuts = (p: TransitionsShowcaseProps, fps: number) => {
  const sceneFrames = Math.round(p.sceneSeconds * fps);
  return p.scenes.slice(0, -1).map((_, i) => {
    const name = transitionAt(p, i);
    const frames = Math.min(
      sceneFrames - 2,
      Math.round(((TRANSITIONS[name].frames / p.speed) * fps) / 30),
    );
    return {
      name,
      ...makeTransition(name, { intensity: p.intensity, direction: p.direction, color: p.color, frames }),
    };
  });
};

export const calculateTransitionsShowcaseMetadata: CalculateMetadataFunction<TransitionsShowcaseProps> = ({ props }) => {
  const fps = 30;
  const sceneFrames = Math.round(props.sceneSeconds * fps);
  const cuts = buildCuts(props, fps);
  return {
    durationInFrames: props.scenes.length * sceneFrames - cuts.reduce((sum, c) => sum + c.frames, 0),
  };
};

const SceneCard: React.FC<{ title: string; color: string; videoFile: string; label: string | null; index: number }> = ({
  title,
  color,
  videoFile,
  label,
  index,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Gentle push-in so the cut is visible even on a plain card.
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  return (
    <AbsoluteFill style={{ backgroundColor: color, overflow: 'hidden' }}>
      {videoFile ? (
        <Video src={staticFile(videoFile)} objectFit="cover" style={{ width: '100%', height: '100%' }} muted />
      ) : (
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          {/* simple pattern so motion and blur are easy to judge */}
          <AbsoluteFill
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 120px), repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 120px)',
            }}
          />
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontFamily, fontWeight: 800, fontSize: 230, color: '#fff', letterSpacing: '-0.02em' }}>
              {title}
            </div>
            <div style={{ fontFamily, fontWeight: 800, fontSize: 40, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
              {String(index + 1).padStart(2, '0')}
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {label ? (
        <div
          style={{
            position: 'absolute',
            right: 60,
            bottom: 60,
            fontFamily,
            fontWeight: 800,
            fontSize: 34,
            color: '#111',
            background: '#fff',
            padding: '12px 26px',
            borderRadius: 999,
          }}
        >
          next: {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const TransitionsShowcase: React.FC<TransitionsShowcaseProps> = (p) => {
  const { fps } = useVideoConfig();
  const sceneFrames = Math.round(p.sceneSeconds * fps);
  const cuts = buildCuts(p, fps);

  // Sound hits land on the middle of each cut.
  const cues: SfxCue[] = [];
  let cutStart = sceneFrames;
  cuts.forEach((c) => {
    cutStart -= c.frames;
    const info = TRANSITIONS[c.name];
    const at = Math.max(0, Math.round(cutStart + c.frames / 2 - (c.name === 'Glitch cut' ? c.frames / 2 : 0)));
    cues.push({ sound: info.sound, at, volume: p.soundVolume, seconds: info.soundSeconds });
    cutStart += sceneFrames;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        {p.scenes.flatMap((s, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={sceneFrames} name={`Scene ${i + 1}`}>
              <SceneCard
                title={s.title}
                color={s.color}
                videoFile={s.videoFile}
                index={i}
                label={p.showLabels && i < cuts.length ? cuts[i].name : null}
              />
            </TransitionSeries.Sequence>,
          ];
          if (i < cuts.length) {
            items.push(
              <TransitionSeries.Transition key={`t${i}`} presentation={cuts[i].presentation} timing={cuts[i].timing} />,
            );
          }
          return items;
        })}
      </TransitionSeries>
      {p.playSound ? <SfxTrack cues={cues} /> : null}
    </AbsoluteFill>
  );
};
