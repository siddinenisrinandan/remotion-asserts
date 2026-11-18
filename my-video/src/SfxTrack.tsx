import React from 'react';
import { Sequence, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { SfxName, sfxLeadInFrames, sfxPlayFrames, sfxSrc } from './sfx';

export type SfxCue = {
  /** Which sound from src/sfx.ts */
  sound: SfxName;
  /** Frame where the sound should be heard (its silent start is trimmed off) */
  at: number;
  /** 0 to 1 */
  volume?: number;
  /** Optional: play only this many seconds (e.g. a short burst of typing) */
  seconds?: number;
};

/**
 * Plays a list of sound-effect cues. Each sound's silent start is trimmed so it
 * lands exactly on its `at` frame.
 */
export const SfxTrack: React.FC<{ cues: SfxCue[] }> = ({ cues }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues.map((cue, i) => {
        const leadIn = sfxLeadInFrames(cue.sound, fps);
        const length = cue.seconds ? Math.max(1, Math.round(cue.seconds * fps)) : sfxPlayFrames(cue.sound, fps);
        return (
          <Sequence
            key={`${cue.sound}-${cue.at}-${i}`}
            from={cue.at}
            durationInFrames={length}
            name={`SFX ${cue.sound}`}
            layout="none"
          >
            <Audio src={sfxSrc(cue.sound)} trimBefore={leadIn} volume={cue.volume ?? 0.5} />
          </Sequence>
        );
      })}
    </>
  );
};
