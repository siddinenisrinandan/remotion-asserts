import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, staticFile } from 'remotion';
import { TransitionSeries } from '@remotion/transitions';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';
import { SfxTrack } from '../SfxTrack';
import { makeTransition, packDefaults, TRANSITION_NAMES, TRANSITIONS } from './TransitionsPack';

// -----------------------------------------------------------
// TWO-CLIP TRANSITION
// Clip A → one transition → Clip B. One composition per transition
// is registered in Root.tsx so each can be previewed on its own.
// -----------------------------------------------------------

const { fontFamily } = loadArchivo('normal', { weights: ['800'], subsets: ['latin'] });

/** A video from public/, or a colour card with a title when no file is given. */
export const clipSchema = z.object({
  videoFile: z.string().describe('Video in public/ (e.g. testvideo3.mp4). Empty = colour card'),
  startAt: z.number().min(0).step(0.1).describe('Start this many seconds into the video'),
  title: z.string().describe('Shown on the colour card (when no video)'),
  color: zColor().describe('Colour card background'),
});
export type ClipProps = z.infer<typeof clipSchema>;

export const Clip: React.FC<ClipProps> = ({ videoFile, startAt, title, color }) => {
  if (videoFile) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000' }}>
        <Video
          src={staticFile(videoFile)}
          trimBefore={Math.round(startAt * 30)}
          objectFit="cover"
          style={{ width: '100%', height: '100%' }}
          muted
        />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      {/* faint grid so motion, blur and zoom are easy to see */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 120px), repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 120px)',
        }}
      />
      <div style={{ fontFamily, fontWeight: 800, fontSize: 300, color: '#fff', letterSpacing: '-0.02em' }}>{title}</div>
    </AbsoluteFill>
  );
};

export const twoClipTransitionSchema = z.object({
  transition: z.enum(TRANSITION_NAMES),
  clipA: clipSchema,
  clipB: clipSchema,
  secondsA: z.number().min(0.5).max(10).step(0.1).describe('How long clip A plays before the cut ends'),
  secondsB: z.number().min(0.5).max(10).step(0.1).describe('How long clip B plays (including the cut)'),
  intensity: z.number().min(0).max(1).step(0.05),
  speed: z.number().min(0.5).max(2).step(0.1).describe('1 = default length, 2 = twice as fast'),
  direction: z.enum(['Left', 'Right', 'Up', 'Down']).describe('Whip pan / Color sweep direction'),
  color: zColor().describe('Accent colour (light leak, sweep band, wave marks)'),
  playSound: z.boolean(),
  soundVolume: z.number().min(0).max(1).step(0.05),
});
export type TwoClipTransitionProps = z.infer<typeof twoClipTransitionSchema>;

export const twoClipDefaults: TwoClipTransitionProps = {
  transition: 'Zoom punch',
  clipA: { videoFile: '', startAt: 0, title: '01', color: '#1d3fd8' },
  clipB: { videoFile: '', startAt: 0, title: '02', color: '#e8364f' },
  secondsA: 2,
  secondsB: 2.2,
  intensity: packDefaults.intensity,
  speed: 1,
  direction: 'Left',
  color: packDefaults.color,
  playSound: true,
  soundVolume: 0.5,
};

const cutFrames = (p: TwoClipTransitionProps) => {
  const a = Math.round(p.secondsA * 30);
  const b = Math.round(p.secondsB * 30);
  return Math.max(2, Math.min(a - 1, b - 1, Math.round(TRANSITIONS[p.transition].frames / p.speed)));
};

export const calculateTwoClipMetadata: CalculateMetadataFunction<TwoClipTransitionProps> = ({ props }) => ({
  durationInFrames: Math.round(props.secondsA * 30) + Math.round(props.secondsB * 30) - cutFrames(props),
});

export const TwoClipTransition: React.FC<TwoClipTransitionProps> = (p) => {
  const a = Math.round(p.secondsA * 30);
  const b = Math.round(p.secondsB * 30);
  const frames = cutFrames(p);
  const t = makeTransition(p.transition, { intensity: p.intensity, direction: p.direction, color: p.color, frames });
  const info = TRANSITIONS[p.transition];
  const cutStart = a - frames;
  const soundAt = p.transition === 'Glitch cut' ? cutStart : Math.round(cutStart + frames / 2);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={a} name="Clip A">
          <Clip {...p.clipA} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={t.presentation} timing={t.timing} />
        <TransitionSeries.Sequence durationInFrames={b} name="Clip B">
          <Clip {...p.clipB} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {p.playSound ? (
        <SfxTrack cues={[{ sound: info.sound, at: soundAt, volume: p.soundVolume, seconds: info.soundSeconds }]} />
      ) : null}
    </AbsoluteFill>
  );
};

/** Per-transition defaults, so each composition starts on a fitting setting. */
export const TWO_CLIP_PRESETS: Record<(typeof TRANSITION_NAMES)[number], Partial<TwoClipTransitionProps>> = {
  'Zoom punch': {},
  'Whip pan': { direction: 'Left' },
  'Glitch cut': {},
  'Light leak': { color: '#ff9a3c' },
  'Zoom-through': {
    clipA: { videoFile: '', startAt: 0, title: '01', color: '#7a3cf0' },
    clipB: { videoFile: '', startAt: 0, title: '02', color: '#f2a516' },
  },
  'Color sweep': {
    direction: 'Up',
    color: '#e8b33d',
    clipA: { videoFile: '', startAt: 0, title: '01', color: '#22313a' },
    clipB: { videoFile: '', startAt: 0, title: '02', color: '#13a37f' },
  },
  'Center reveal': {
    color: '#f3ead8',
    clipA: { videoFile: '', startAt: 0, title: '01', color: '#16161d' },
    clipB: { videoFile: '', startAt: 0, title: '02', color: '#0f2a44' },
  },
};
