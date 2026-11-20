import React from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadAnton } from '@remotion/google-fonts/Anton';
import { loadFont as loadBebas } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadBeauRivage } from '@remotion/google-fonts/BeauRivage';

const { fontFamily: ANTON } = loadAnton('normal', { weights: ['400'], subsets: ['latin'] });
const { fontFamily: BEBAS } = loadBebas('normal', { weights: ['400'], subsets: ['latin'] });
const { fontFamily: MONTSERRAT } = loadMontserrat('normal', { weights: ['300', '400', '700', '900'], subsets: ['latin'] });
const { fontFamily: SCRIPT } = loadBeauRivage('normal', { weights: ['400'], subsets: ['latin'] });
// Mixed style (like TextStyle5): small words cycle through these weights.
const MIXED_WEIGHTS = [300, 900, 400, 700];
const FONTS = { Anton: ANTON, 'Bebas Neue': BEBAS, Impact: 'Impact, "Arial Black", sans-serif' } as const;

// -----------------------------------------------------------
// TEXT BEHIND SUBJECT
// Big text sits BETWEEN the background and the person:
//   bottom = original video, middle = text, top = person cut-out.
// The cut-out is a transparent WebM made once with
//   python tools/matting/modnet_cutout.py public/<clip>.mp4   (MODNet, Apache-2.0)
// which writes public/<clip>_person.webm next to it.
// Both files must come from the same clip so they line up.
// -----------------------------------------------------------

export const textBehindSubjectSchema = z.object({
  videoFile: z.string().describe('Original clip in public/ (e.g. testvideo.mp4)'),
  cutoutFile: z.string().describe('Transparent cut-out in public/ (e.g. testvideo_person.webm)'),
  text: z.string().describe('The word(s). In "Mixed script" the LAST word becomes the big handwritten word'),
  textStyle: z
    .enum(['Bold block', 'Mixed script (Style 5)'])
    .describe('"Bold block" = one heavy word. "Mixed script" = thin/heavy small words + a big handwritten last word'),
  textColor: zColor(),
  font: z.enum(['Anton', 'Bebas Neue', 'Impact']).describe('Font (Bold block only)'),
  textSize: z.number().min(0.2).max(1.5).step(0.05).describe('Text size (1 = normal)'),
  wordGap: z.number().min(0.1).max(2).step(0.05).describe('Mixed script: seconds between each word popping in'),
  textPositionY: z.number().min(0).max(100).step(1).describe('Vertical position of the text (% from top)'),
  letterSpacing: z.number().min(-0.1).max(0.3).step(0.01).describe('Space between letters'),
  animation: z.enum(['Pop', 'Rise from behind', 'Letters drop', 'None']).describe('How the text appears'),
  appearAt: z.number().min(0).max(60).step(0.1).describe('Seconds until the text appears'),
  exitAtEnd: z.boolean().describe('Text fades out at the end'),
  dimBackground: z.number().min(0).max(0.8).step(0.05).describe('Darken the background behind the text (0 = off)'),
  personShadow: z.boolean().describe('Soft shadow around the person so they lift off the text'),
  seconds: z.number().min(1).max(120).step(0.5).describe('Length (match your clip)'),
});

export type TextBehindSubjectProps = z.infer<typeof textBehindSubjectSchema>;

export const textBehindSubjectDefaults: TextBehindSubjectProps = {
  videoFile: 'testvideo2.mp4',
  cutoutFile: 'testvideo2_person.webm',
  text: 'TEXT',
  textStyle: 'Bold block',
  textColor: '#FFFFFF',
  font: 'Anton',
  textSize: 1,
  wordGap: 0.35,
  textPositionY: 42,
  letterSpacing: 0.02,
  animation: 'Rise from behind',
  appearAt: 0.2,
  exitAtEnd: false,
  dimBackground: 0.15,
  personShadow: true,
  seconds: 2.5,
};

export const calculateTextBehindSubjectMetadata: CalculateMetadataFunction<TextBehindSubjectProps> = ({ props }) => ({
  durationInFrames: Math.max(15, Math.round((props.seconds ?? textBehindSubjectDefaults.seconds) * 30)),
});

const src = (file: string) => (/^https?:\/\//.test(file) ? file : staticFile(file));

const FILL: React.CSSProperties = { width: '100%', height: '100%' };

export const TextBehindSubject: React.FC<Partial<TextBehindSubjectProps>> = (props) => {
  const p = { ...textBehindSubjectDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const start = Math.round(p.appearAt * fps);
  const f = frame - start;
  // Based on the short side, so it works for 16:9 and vertical shorts alike.
  const base = Math.min(width, height) * p.textSize;
  const fontSize = base * 0.45;
  const exit = p.exitAtEnd
    ? interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  // Whole-word animations
  let wordTransform = 'none';
  let wordOpacity = f >= 0 ? 1 : 0;
  if (p.animation === 'Pop') {
    const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 160 } });
    wordTransform = `scale(${0.6 + 0.4 * s})`;
    wordOpacity = interpolate(f, [0, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  } else if (p.animation === 'Rise from behind') {
    const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 120 } });
    wordTransform = `translateY(${(1 - s) * fontSize * 0.9}px)`;
    wordOpacity = interpolate(f, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }

  const letters = Array.from(p.text);

  // Mixed script (Style 5): words pop in one by one, last word is big handwriting,
  // and the whole block drifts in slowly like a camera push.
  const mixedWords = p.text.trim().split(/\s+/).filter(Boolean);
  const smallWords = mixedWords.slice(0, -1);
  const scriptWord = mixedWords[mixedWords.length - 1] ?? '';
  const wordIntro = (i: number) => {
    const wf = f - Math.round(i * p.wordGap * fps);
    const s = spring({ frame: wf, fps, config: { stiffness: 70, damping: 16 } });
    return {
      display: 'inline-block',
      opacity: wf >= 0 ? interpolate(s, [0, 1], [0, 1]) : 0,
      transform: `translateY(${interpolate(s, [0, 1], [base * 0.04, 0])}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
    } as React.CSSProperties;
  };
  const push = interpolate(frame, [start, durationInFrames], [1, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const mixedText = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: p.textColor,
        transform: `scale(${push})`,
        textShadow: '0 6px 30px rgba(0,0,0,0.25)',
      }}
    >
      {smallWords.length ? (
        <div style={{ display: 'flex', gap: base * 0.035, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
          {smallWords.map((w, i) => (
            <span
              key={i}
              style={{
                ...wordIntro(i),
                fontFamily: MONTSERRAT,
                fontWeight: MIXED_WEIGHTS[i % MIXED_WEIGHTS.length],
                fontSize: base * (MIXED_WEIGHTS[i % MIXED_WEIGHTS.length] >= 700 ? 0.15 : 0.11),
                lineHeight: 1,
                letterSpacing: `${p.letterSpacing}em`,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      ) : null}
      <span
        style={{
          ...wordIntro(smallWords.length),
          fontFamily: SCRIPT,
          fontSize: base * 0.42,
          lineHeight: 1,
          marginTop: -base * 0.06,
          whiteSpace: 'nowrap',
          padding: `0 ${base * 0.05}px`, // room for the script's swashes
        }}
      >
        {scriptWord}
      </span>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* 1. original clip (bottom) */}
      {p.videoFile ? (
        <AbsoluteFill>
          <Video src={src(p.videoFile)} objectFit="cover" style={FILL} />
        </AbsoluteFill>
      ) : null}

      {p.dimBackground > 0 ? <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${p.dimBackground})` }} /> : null}

      {/* 2. the big text (middle) */}
      <AbsoluteFill style={{ opacity: exit }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${p.textPositionY}%`,
            transform: 'translateY(-50%)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {p.textStyle === 'Mixed script (Style 5)' ? mixedText : (
          <div
            style={{
              fontFamily: FONTS[p.font],
              fontSize,
              lineHeight: 1,
              color: p.textColor,
              letterSpacing: `${p.letterSpacing}em`,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              transform: wordTransform,
              opacity: p.animation === 'Letters drop' ? 1 : wordOpacity,
            }}
          >
            {p.animation === 'Letters drop'
              ? letters.map((ch, i) => {
                  const lf = f - i * 3;
                  const s = spring({ frame: lf, fps, config: { damping: 12, stiffness: 170 } });
                  return (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        transform: `translateY(${(s - 1) * fontSize * 0.8}px)`,
                        opacity: lf >= 0 ? 1 : 0,
                        whiteSpace: 'pre',
                      }}
                    >
                      {ch}
                    </span>
                  );
                })
              : p.text}
          </div>
          )}
        </div>
      </AbsoluteFill>

      {/* 3. person cut-out (top) */}
      {p.cutoutFile ? (
        <AbsoluteFill>
          <Video
            src={src(p.cutoutFile)}
            muted
            objectFit="cover"
            showInTimeline={false}
            fallbackOffthreadVideoProps={{ transparent: true }}
            style={{ ...FILL, filter: p.personShadow ? 'drop-shadow(0 0 18px rgba(0,0,0,0.45))' : undefined }}
          />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
