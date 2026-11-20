import type { KineticCaptionProps } from './KineticCaption';

// -----------------------------------------------------------
// 15 ready caption styles (own designs). Each one is a set of
// KineticCaption props; the editor / AI can start from any of
// them and only change the text.
// Marks: [A colour] {B colour} <C colour> _serif_
// -----------------------------------------------------------

export type CaptionPreset = {
  id: string;
  name: string;
  /** Background colour for the vertical demo (duotone plate). */
  plate: string;
  caption: Partial<KineticCaptionProps>;
};

const l = (text: string, size: number, align: 'left' | 'center' | 'right' = 'center') => ({ text, size, align });

export const CAPTION_PRESETS: CaptionPreset[] = [
  {
    id: 'Caption-01-Clean-Blur',
    name: 'Clean Blur',
    plate: '#2d6cdf',
    caption: { animation: 'Blur in', lines: [l('Here is how', 0.5), l('[small habits]', 1), l('change everything.', 0.42, 'right')] },
  },
  {
    id: 'Caption-02-Typewriter',
    name: 'Typewriter',
    plate: '#2f2f33',
    caption: {
      animation: 'Typewriter',
      stagger: 0.045,
      lines: [l('Today, we will', 0.55), l('{build it} from zero', 0.8)],
    },
  },
  {
    id: 'Caption-03-Pop',
    name: 'Pop',
    plate: '#1d8a5e',
    caption: { animation: 'Pop', stagger: 0.12, lines: [l('Nobody', 0.45), l('{tells you}', 0.75), l('[this part]', 1.05)] },
  },
  {
    id: 'Caption-04-Rise-Mask',
    name: 'Rise Mask',
    plate: '#7a1fa2',
    caption: {
      animation: 'Rise mask',
      stagger: 0.07,
      lines: [l('Your time is', 0.5, 'right'), l('[worth more]', 1.1), l('than', 0.4, 'right'), l('{you think.}', 0.75, 'right')],
    },
  },
  {
    id: 'Caption-05-Slide-Sides',
    name: 'Slide Sides',
    plate: '#9b1c1c',
    caption: {
      animation: 'Slide sides',
      stagger: 0.08,
      lines: [l('Most people', 0.5, 'left'), l('{quit}', 1.2), l('right before', 0.45, 'right'), l('[it works.]', 0.7, 'right')],
    },
  },
  {
    id: 'Caption-06-Letter-Drop',
    name: 'Letter Drop',
    plate: '#b8860b',
    caption: { animation: 'Letter drop', stagger: 0.035, lines: [l("Let's _talk about_", 0.6), l('[real money]', 1)] },
  },
  {
    id: 'Caption-07-Focus-Pull',
    name: 'Focus Pull',
    plate: '#1572b6',
    caption: {
      animation: 'Focus pull',
      stagger: 0.13,
      lines: [l("Here's what", 0.45, 'left'), l('_actually_ [matters]', 0.85), l('in the end.', 0.4, 'right')],
    },
  },
  {
    id: 'Caption-08-Highlight-Box',
    name: 'Highlight Box',
    plate: '#c58b00',
    caption: {
      animation: 'Highlight box',
      stagger: 0.1,
      accentA: '#ff2bd6',
      accentB: '#22e3df',
      boxTextColor: '#ffffff',
      lines: [l('This is', 0.45, 'left'), l('{where it}', 0.6, 'left'), l('[gets serious.]', 0.9)],
    },
  },
  {
    id: 'Caption-09-Stretch-In',
    name: 'Stretch In',
    plate: '#111111',
    caption: {
      animation: 'Stretch in',
      sansFont: 'Anton',
      stagger: 0.15,
      lines: [l('[SIMPLE]', 1.5), l('BEATS PERFECT', 0.62)],
    },
  },
  {
    id: 'Caption-10-Wave',
    name: 'Wave',
    plate: '#0f8f8a',
    caption: { animation: 'Wave', stagger: 0.03, lines: [l('It all starts', 0.55), l('_with_ {one step}', 0.95)] },
  },
  {
    id: 'Caption-11-Count-Up',
    name: 'Count Up',
    plate: '#7d1010',
    caption: {
      animation: 'Count up',
      stagger: 0.12,
      lines: [l('How I made', 0.42, 'right'), l('_[$5,000]_', 1.35), l('in one month', 0.55, 'right'), l('without ads.', 0.38, 'left')],
    },
  },
  {
    id: 'Caption-12-Zoom-Punch',
    name: 'Zoom Punch',
    plate: '#4a4a4a',
    caption: { animation: 'Zoom punch', stagger: 0.12, lines: [l('Stop', 0.5), l('[scrolling]', 1.1), l('for one second.', 0.42)] },
  },
  {
    id: 'Caption-13-Flip-Up',
    name: 'Flip Up',
    plate: '#4b2fa0',
    caption: { animation: 'Flip up', stagger: 0.1, lines: [l('Three', 0.5, 'left'), l('{rules} nobody', 0.75), l('[breaks] twice.', 0.6, 'right')] },
  },
  {
    id: 'Caption-14-Split-Reveal',
    name: 'Split Reveal',
    plate: '#0b3b5c',
    caption: {
      animation: 'Split reveal',
      stagger: 0.14,
      serifFont: 'Playfair Display',
      lines: [l('_the_ {secret}', 1), l('is consistency', 0.5)],
    },
  },
  {
    id: 'Caption-15-Glow-In',
    name: 'Glow In',
    plate: '#2a1450',
    caption: {
      animation: 'Glow in',
      stagger: 0.14,
      accentB: '#ffcf5a',
      lines: [l('Dream big,', 0.55, 'left'), l('_start_ {small.}', 1.05)],
    },
  },
];
