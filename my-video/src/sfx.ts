import { staticFile } from 'remotion';

/**
 * Sound effect library. Files live in public/sfx/ (licenses in public/sfx/LICENSES.md).
 *
 * leadInSeconds = time before the sound's main hit (silence or a quiet lead-up).
 *   SfxTrack trims this off, so the hit lands exactly on the cue frame.
 * playSeconds   = optional: only play this much after the hit (e.g. to skip a
 *   second pop at the end of a file).
 */
type SfxInfo = {
  file: string;
  category: 'whoosh' | 'ui' | 'pop' | 'success' | 'money' | 'glitch' | 'camera' | 'reveal' | 'alert';
  duration: number;
  leadInSeconds: number;
  playSeconds?: number;
};

export const SFX = {
  'whoosh-synth-whip': { file: 'sfx/whoosh/whoosh-synth-whip.mp3', category: 'whoosh', duration: 0.86, leadInSeconds: 0.2 },
  'whoosh-air': { file: 'sfx/whoosh/whoosh-air.mp3', category: 'whoosh', duration: 0.47, leadInSeconds: 0 },
  'whoosh-soft': { file: 'sfx/whoosh/whoosh-soft.mp3', category: 'whoosh', duration: 1.75, leadInSeconds: 0.12 },
  'click-mouse': { file: 'sfx/ui/click-mouse.mp3', category: 'ui', duration: 2.35, leadInSeconds: 0.1 },
  // Tiny tick at 0.13s, real pop at 0.85s, second pop at 2.19s: play the first pop only.
  'pop-bubble': { file: 'sfx/pop/pop-bubble.mp3', category: 'pop', duration: 2.22, leadInSeconds: 0.85, playSeconds: 0.6 },
  'ding-correct': { file: 'sfx/success/ding-correct.mp3', category: 'success', duration: 1.08, leadInSeconds: 0.08 },
  'chime-magic-reveal': { file: 'sfx/success/chime-magic-reveal.mp3', category: 'success', duration: 1.99, leadInSeconds: 0 },
  'cash-register': { file: 'sfx/money/cash-register.mp3', category: 'money', duration: 2.8, leadInSeconds: 0.06 },
  'glitch-digital-error': { file: 'sfx/glitch/glitch-digital-error.mp3', category: 'glitch', duration: 2.04, leadInSeconds: 0 },
  // Real shutter snap starts at 0.55s.
  'camera-flash-vintage': { file: 'sfx/camera/camera-flash-vintage.mp3', category: 'camera', duration: 2.85, leadInSeconds: 0.55 },
  // --- added 2026-11-18 ---
  // Roll starts at 0.8s; the cymbal crash lands 3.3s after the cue.
  'drumroll-cymbal': { file: 'sfx/reveal/drumroll-cymbal.mp3', category: 'reveal', duration: 5.97, leadInSeconds: 0.8, playSeconds: 4.9 },
  'sparkle-wink': { file: 'sfx/success/sparkle-wink.mp3', category: 'success', duration: 1.27, leadInSeconds: 0, playSeconds: 0.7 },
  // Builds up: loudest point is 0.75s after the cue, so cue it slightly before a cut.
  'whoosh-transition': { file: 'sfx/whoosh/whoosh-transition.mp3', category: 'whoosh', duration: 2.32, leadInSeconds: 0.35, playSeconds: 1.5 },
  'whoosh-swipe-clean': { file: 'sfx/whoosh/whoosh-swipe-clean.mp3', category: 'whoosh', duration: 0.45, leadInSeconds: 0 },
  // 15s of typing: always give the cue a `seconds` length.
  'keyboard-typing': { file: 'sfx/ui/keyboard-typing.mp3', category: 'ui', duration: 15.53, leadInSeconds: 0, playSeconds: 2 },
  'school-bell': { file: 'sfx/alert/school-bell.mp3', category: 'alert', duration: 3.68, leadInSeconds: 0.2, playSeconds: 3.3 },
  'hint-two-tone': { file: 'sfx/alert/hint-two-tone.mp3', category: 'alert', duration: 0.27, leadInSeconds: 0 },
  'buzzer-wrong': { file: 'sfx/alert/buzzer-wrong.mp3', category: 'alert', duration: 1.92, leadInSeconds: 0 },
  'game-success': { file: 'sfx/success/game-success.mp3', category: 'success', duration: 3.3, leadInSeconds: 0, playSeconds: 2.1 },
} satisfies Record<string, SfxInfo>;

export type SfxName = keyof typeof SFX;

/** All sound names, e.g. for a dropdown in a component's settings. */
export const SFX_NAMES = Object.keys(SFX) as SfxName[];

export const sfxInfo = (name: SfxName): SfxInfo => SFX[name];

export const sfxSrc = (name: SfxName) => staticFile(SFX[name].file);

/** Frames to trim from the start so the main hit lands on the cue. */
export const sfxLeadInFrames = (name: SfxName, fps: number) =>
  Math.round(SFX[name].leadInSeconds * fps);

/** How many frames to play after the trimmed start. */
export const sfxPlayFrames = (name: SfxName, fps: number) => {
  const info = sfxInfo(name);
  const seconds = info.playSeconds ?? info.duration - info.leadInSeconds;
  return Math.max(1, Math.ceil(seconds * fps));
};
