import React from 'react';
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadInstrument } from '@remotion/google-fonts/InstrumentSerif';
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';

// -----------------------------------------------------------
// KINETIC CAPTION  (stacked, mixed-size social captions)
// One engine, many styles. Write each line as plain text with
// small marks for colour and font:
//   [word]  → accent colour A      {word} → accent colour B
//   <word>  → accent colour C      _word_ → italic serif font
// Marks can be combined:  _[the logic]_  = serif + accent A
// Example lines:  "This is where" / "[the opportunity]" / "starts"
// Transparent background: put it on top of any video.
// -----------------------------------------------------------

const { fontFamily: INTER_TIGHT } = loadInterTight('normal', { weights: ['600', '800', '900'], subsets: ['latin'] });
const { fontFamily: MONTSERRAT } = loadMontserrat('normal', { weights: ['700', '800', '900'], subsets: ['latin'] });
const { fontFamily: ANTON } = loadAnton('normal', { weights: ['400'], subsets: ['latin'] });
const { fontFamily: INSTRUMENT } = loadInstrument('italic', { weights: ['400'], subsets: ['latin'] });
const { fontFamily: PLAYFAIR } = loadPlayfair('italic', { weights: ['500', '700'], subsets: ['latin'] });

const SANS = { 'Inter Tight': INTER_TIGHT, Montserrat: MONTSERRAT, Anton: ANTON } as const;
const SERIF = { 'Instrument Serif': INSTRUMENT, 'Playfair Display': PLAYFAIR } as const;

export const ANIMATIONS = [
  'Blur in',
  'Typewriter',
  'Pop',
  'Rise mask',
  'Slide sides',
  'Letter drop',
  'Focus pull',
  'Highlight box',
  'Stretch in',
  'Wave',
  'Count up',
  'Zoom punch',
  'Flip up',
  'Split reveal',
  'Glow in',
] as const;
export type CaptionAnimation = (typeof ANIMATIONS)[number];

export const captionLineSchema = z.object({
  text: z.string().describe('Line text. Marks: [A colour] {B colour} <C colour> _serif_'),
  size: z.number().min(0.2).max(4).step(0.05).describe('Size of this line (1 = base size)'),
  align: z.enum(['left', 'center', 'right']).describe('Line alignment inside the block'),
});

export const kineticCaptionSchema = z.object({
  lines: z.array(captionLineSchema).min(1).max(8),
  animation: z.enum(ANIMATIONS),
  x: z.number().min(0).max(100).step(1).describe('Block center, % from left'),
  y: z.number().min(0).max(100).step(1).describe('Block center, % from top'),
  baseSize: z.number().min(10).max(300).step(1).describe('Base text size in px'),
  sansFont: z.enum(['Inter Tight', 'Montserrat', 'Anton']),
  serifFont: z.enum(['Instrument Serif', 'Playfair Display']).describe('Font for _marked_ words'),
  textColor: zColor(),
  accentA: zColor().describe('Colour for [words]'),
  accentB: zColor().describe('Colour for {words}'),
  accentC: zColor().describe('Colour for <words>'),
  boxTextColor: zColor().describe('Text colour inside highlight boxes'),
  shadow: z.boolean().describe('Soft shadow so text reads on busy video'),
  delay: z.number().min(0).max(10).step(0.05).describe('Seconds before the first word'),
  stagger: z.number().min(0.01).max(1).step(0.01).describe('Seconds between words (or letters)'),
  seconds: z.number().min(0.5).max(30).step(0.1).describe('Total length'),
  exitAtEnd: z.boolean().describe('Blur out at the end'),
});
export type KineticCaptionProps = z.infer<typeof kineticCaptionSchema>;

export const kineticCaptionDefaults: KineticCaptionProps = {
  lines: [
    { text: 'This is where', size: 0.55, align: 'center' },
    { text: '[small habits]', size: 1, align: 'center' },
    { text: 'change everything.', size: 0.5, align: 'right' },
  ],
  animation: 'Blur in',
  x: 50,
  y: 50,
  baseSize: 135,
  sansFont: 'Inter Tight',
  serifFont: 'Instrument Serif',
  textColor: '#ffffff',
  accentA: '#22e3df',
  accentB: '#f5e625',
  accentC: '#ff3b30',
  boxTextColor: '#111111',
  shadow: true,
  delay: 0.2,
  stagger: 0.09,
  seconds: 4,
  exitAtEnd: true,
};

// -----------------------------------------------------------
// Parsing the marks
// -----------------------------------------------------------
type Tone = 'text' | 'a' | 'b' | 'c';
type Seg = { text: string; tone: Tone; serif: boolean };
type Word = Seg[];

export const parseLine = (line: string): Word[] => {
  const words: Word[] = [];
  let word: Word = [];
  let cur = '';
  let tone: Tone = 'text';
  let serif = false;
  const flush = () => {
    if (cur) word.push({ text: cur, tone, serif });
    cur = '';
  };
  const endWord = () => {
    flush();
    if (word.length) words.push(word);
    word = [];
  };
  for (const ch of line) {
    if (ch === '[' || ch === '{' || ch === '<') {
      flush();
      tone = ch === '[' ? 'a' : ch === '{' ? 'b' : 'c';
    } else if (ch === ']' || ch === '}' || ch === '>') {
      flush();
      tone = 'text';
    } else if (ch === '_') {
      flush();
      serif = !serif;
    } else if (ch === ' ') {
      endWord();
    } else {
      cur += ch;
    }
  }
  endWord();
  return words;
};

// -----------------------------------------------------------
// Animation helpers
// -----------------------------------------------------------
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const easeOut = Easing.out(Easing.cubic);
const LETTER_ANIMS: CaptionAnimation[] = ['Typewriter', 'Letter drop', 'Wave'];
const LINE_ANIMS: CaptionAnimation[] = ['Rise mask', 'Slide sides'];

const NUMBER = /^(\D*?)(\d[\d,]*\.?\d*)(.*)$/;

/** Style for one word (or letter) given how far into its animation it is. */
const animateUnit = (
  anim: CaptionAnimation,
  local: number, // frames since this unit started
  fps: number,
  seed: string,
  isAccent: boolean,
): React.CSSProperties => {
  const t = (s: number) => interpolate(local, [0, s * fps], [0, 1], clamp);
  switch (anim) {
    case 'Blur in': {
      const p = easeOut(t(0.45));
      return { opacity: p, filter: `blur(${(1 - p) * 16}px)`, transform: `translateY(${(1 - p) * 0.3}em)` };
    }
    case 'Pop': {
      const s = spring({ frame: local, fps, config: { damping: 9, stiffness: 180 } });
      return { opacity: Math.min(1, local / 3), transform: `scale(${s})` };
    }
    case 'Focus pull': {
      const p = easeOut(t(0.35));
      return { opacity: 0.28 + 0.72 * p, filter: `blur(${(1 - p) * 12}px)` };
    }
    case 'Highlight box':
    case 'Count up':
    case 'Glow in': {
      const p = easeOut(t(0.35));
      return { opacity: p, filter: `blur(${(1 - p) * 10}px)` };
    }
    case 'Stretch in': {
      const p = easeOut(t(0.6));
      return { opacity: p, letterSpacing: `${(1 - p) * 0.6}em`, filter: `blur(${(1 - p) * 8}px)` };
    }
    case 'Zoom punch': {
      if (isAccent) {
        const s = spring({ frame: local, fps, config: { damping: 14, stiffness: 120 } });
        return { opacity: Math.min(1, local / 2), transform: `scale(${3 - 2 * s})`, filter: `blur(${(1 - s) * 14}px)` };
      }
      const p = easeOut(t(0.3));
      return { opacity: p, filter: `blur(${(1 - p) * 8}px)` };
    }
    case 'Flip up': {
      const s = spring({ frame: local, fps, config: { damping: 13, stiffness: 140 } });
      return { opacity: Math.min(1, local / 3), transform: `rotateX(${(1 - s) * 95}deg)`, transformOrigin: '50% 100%' };
    }
    case 'Split reveal': {
      const p = Easing.inOut(Easing.cubic)(t(0.5));
      return { clipPath: `inset(-20% ${(1 - p) * 50}% -20% ${(1 - p) * 50}%)`, transform: `scale(${1.15 - 0.15 * p})` };
    }
    case 'Letter drop': {
      const s = spring({ frame: local, fps, config: { damping: 11, stiffness: 160 } });
      const rot = (random(seed) - 0.5) * 50;
      return { opacity: Math.min(1, local / 2), transform: `translateY(${(1 - s) * -1.1}em) rotate(${(1 - s) * rot}deg)` };
    }
    case 'Wave': {
      const s = spring({ frame: local, fps, config: { damping: 6, stiffness: 120 } });
      return { opacity: Math.min(1, local / 3), transform: `translateY(${(1 - s) * 0.7}em)` };
    }
    default:
      return {};
  }
};

// -----------------------------------------------------------
// Component
// -----------------------------------------------------------
export const KineticCaption: React.FC<Partial<KineticCaptionProps>> = (props) => {
  const p = { ...kineticCaptionDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anim = p.animation;
  const perLetter = LETTER_ANIMS.includes(anim);
  const perLine = LINE_ANIMS.includes(anim);
  const delay = p.delay * fps;
  const step = p.stagger * fps;

  const lines = p.lines.map((l) => ({ ...l, words: parseLine(l.text) }));

  // Typewriter shows the cursor after the last visible letter.
  const totalLetters = lines.reduce((n, l) => n + l.words.reduce((m, w) => m + w.reduce((k, s) => k + s.text.length, 0), 0), 0);
  const typed = Math.floor((frame - delay) / step) + 1;
  const typingDone = typed >= totalLetters;
  const cursorOn = !typingDone || Math.floor(frame / (fps * 0.5)) % 2 === 0;

  // Exit
  const exitLen = 0.35 * fps;
  const exitStart = p.seconds * fps - exitLen;
  const out = p.exitAtEnd ? interpolate(frame, [exitStart, exitStart + exitLen], [0, 1], clamp) : 0;

  const colorOf = (tone: Tone) =>
    tone === 'a' ? p.accentA : tone === 'b' ? p.accentB : tone === 'c' ? p.accentC : p.textColor;
  const sans = SANS[p.sansFont];
  const serif = SERIF[p.serifFont];

  let wordIndex = 0;
  let letterIndex = 0;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          transform: `translate(-50%, -50%) translateY(${-out * 20}px)`,
          display: 'flex',
          flexDirection: 'column',
          opacity: 1 - out,
          filter: out > 0 ? `blur(${out * 12}px)` : undefined,
          textShadow: p.shadow ? '0 4px 24px rgba(0,0,0,0.35)' : undefined,
          perspective: anim === 'Flip up' ? 800 : undefined,
        }}
      >
        {lines.map((line, li) => {
          const fontSize = p.baseSize * line.size;
          const lineStart = delay + li * step * 3;
          const lineLocal = frame - lineStart;
          let lineStyle: React.CSSProperties = {};
          let innerStyle: React.CSSProperties = {};
          if (anim === 'Rise mask') {
            const q = Easing.out(Easing.exp)(interpolate(lineLocal, [0, 0.6 * fps], [0, 1], clamp));
            lineStyle = { overflow: 'hidden', paddingBottom: '0.14em', marginBottom: '-0.14em' };
            innerStyle = { transform: `translateY(${(1 - q) * 115}%)` };
          } else if (anim === 'Slide sides') {
            const q = easeOut(interpolate(lineLocal, [0, 0.5 * fps], [0, 1], clamp));
            const dir = li % 2 === 0 ? -1 : 1;
            innerStyle = { opacity: q, transform: `translateX(${(1 - q) * dir * 220}px)`, filter: `blur(${(1 - q) * 10}px)` };
          }
          return (
            <div
              key={li}
              style={{
                alignSelf: line.align === 'left' ? 'flex-start' : line.align === 'right' ? 'flex-end' : 'center',
                fontSize,
                lineHeight: 1.02,
                whiteSpace: 'nowrap',
                ...lineStyle,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', ...innerStyle }}>
                {line.words.map((word, wi) => {
                  const wIndex = wordIndex++;
                  const wordLocal = frame - (delay + wIndex * step);
                  const isAccent = word.some((s) => s.tone !== 'text');
                  const boxed = anim === 'Highlight box' && isAccent;
                  // Join the box with the next word's box so a boxed phrase reads as one strip.
                  const next = line.words[wi + 1];
                  const joinNext = boxed && next !== undefined && next[0].tone === word[word.length - 1].tone;
                  const boxP = boxed ? Easing.inOut(Easing.cubic)(interpolate(wordLocal, [2, 2 + 0.3 * fps], [0, 1], clamp)) : 0;
                  const wordAnim = perLetter || perLine ? {} : animateUnit(anim, wordLocal, fps, `w${wIndex}`, isAccent);
                  const glow =
                    anim === 'Glow in'
                      ? `0 0 ${interpolate(wordLocal, [0, 0.9 * fps], [40, 0], clamp)}px ${colorOf(word[0].tone)}`
                      : undefined;
                  return (
                    <span
                      key={wi}
                      style={{
                        display: 'inline-block',
                        position: 'relative',
                        marginRight: wi < line.words.length - 1 ? '0.24em' : 0,
                        willChange: 'transform',
                        ...wordAnim,
                      }}
                    >
                      {boxed ? (
                        <span
                          style={{
                            position: 'absolute',
                            left: '-0.1em',
                            right: joinNext ? '-0.26em' : '-0.1em',
                            top: '0.06em',
                            bottom: '-0.02em',
                            background: colorOf(word[0].tone),
                            transform: `scaleX(${boxP})`,
                            transformOrigin: '0 50%',
                          }}
                        />
                      ) : null}
                      {word.map((seg, si) => {
                        const font: React.CSSProperties = seg.serif
                          ? { fontFamily: serif, fontStyle: 'italic', fontWeight: p.serifFont === 'Playfair Display' ? 500 : 400, fontSize: '1.12em' }
                          : { fontFamily: sans, fontWeight: p.sansFont === 'Anton' ? 400 : 800, letterSpacing: p.sansFont === 'Anton' ? '0.01em' : '-0.02em' };
                        const color = boxed && boxP > 0.5 ? p.boxTextColor : colorOf(seg.tone);
                        let text: React.ReactNode = seg.text;
                        let countGlow: string | undefined;
                        if (anim === 'Count up') {
                          const m = seg.text.match(NUMBER);
                          if (m) {
                            const target = parseFloat(m[2].replace(/,/g, ''));
                            const c = Easing.out(Easing.cubic)(interpolate(wordLocal, [0, 1.3 * fps], [0, 1], clamp));
                            const decimals = (m[2].split('.')[1] ?? '').length;
                            const value = (target * c).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
                            text = `${m[1]}${value}${m[3]}`;
                            countGlow = `0 0 ${(1 - c) * 50 + 12}px rgba(255,255,255,${0.25 + (1 - c) * 0.5})`;
                          }
                        }
                        if (perLetter) {
                          return (
                            <span key={si} style={{ ...font, color, position: 'relative' }}>
                              {Array.from(seg.text).map((ch, ci) => {
                                const lIndex = letterIndex++;
                                const local = frame - (delay + lIndex * step);
                                if (anim === 'Typewriter') {
                                  const shown = lIndex < typed;
                                  const isLast = lIndex === Math.min(typed, totalLetters) - 1;
                                  return (
                                    <span key={ci} style={{ opacity: shown ? 1 : 0, position: 'relative' }}>
                                      {ch}
                                      {isLast && cursorOn ? (
                                        <span
                                          style={{
                                            position: 'absolute',
                                            right: '-0.12em',
                                            top: '0.1em',
                                            bottom: '0.05em',
                                            width: '0.07em',
                                            background: p.textColor,
                                          }}
                                        />
                                      ) : null}
                                    </span>
                                  );
                                }
                                return (
                                  <span key={ci} style={{ display: 'inline-block', ...animateUnit(anim, local, fps, `l${lIndex}`, false) }}>
                                    {ch}
                                  </span>
                                );
                              })}
                            </span>
                          );
                        }
                        return (
                          <span
                            key={si}
                            style={{
                              ...font,
                              color,
                              position: 'relative',
                              textShadow: countGlow ?? glow,
                              fontVariantNumeric: anim === 'Count up' ? 'tabular-nums' : undefined,
                            }}
                          >
                            {text}
                          </span>
                        );
                      })}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
