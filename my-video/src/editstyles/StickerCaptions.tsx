import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';

const { fontFamily: SANS } = loadArchivo('normal', { weights: ['700', '800'], subsets: ['latin'] });

// -----------------------------------------------------------
// STICKER CAPTIONS
// Stacked caption cards with a thick outline and a hard shadow,
// slightly tilted, popping in one after another. Transparent
// background, so they sit on top of your video.
// -----------------------------------------------------------

export const stickerCaptionsSchema = z.object({
  lines: z
    .array(
      z.object({
        text: z.string().describe('Caption text'),
        style: z.enum(['White', 'Yellow', 'Custom']).describe('Card colour'),
        customColor: zColor(),
        appearAt: z.number().min(0).max(60).step(0.1).describe('Seconds until it pops in'),
      }),
    )
    .describe('Caption cards, top to bottom'),
  position: z
    .enum(['Top left', 'Top center', 'Middle left', 'Center', 'Bottom left', 'Bottom center'])
    .describe('Where the stack sits'),
  size: z.number().min(0.5).max(2.5).step(0.05).describe('Overall size (1 = normal)'),
  tilt: z.number().min(0).max(8).step(0.5).describe('How much the cards lean (degrees)'),
  outlineColor: zColor(),
  textColor: zColor(),
  seconds: z.number().min(1).max(60).step(0.5).describe('Length'),
  exitAtEnd: z.boolean().describe('Cards pop out at the end'),
});

export type StickerCaptionsProps = z.infer<typeof stickerCaptionsSchema>;

export const stickerCaptionsDefaults: StickerCaptionsProps = {
  lines: [
    { text: 'Investors paid a premium for future profits', style: 'White', customColor: '#9BE3FF', appearAt: 0.2 },
    { text: 'Now they want to see them', style: 'Yellow', customColor: '#9BE3FF', appearAt: 1.0 },
  ],
  position: 'Top left',
  size: 1,
  tilt: 2,
  outlineColor: '#1C1A17',
  textColor: '#1C1A17',
  seconds: 4,
  exitAtEnd: true,
};

export const calculateStickerCaptionsMetadata: CalculateMetadataFunction<StickerCaptionsProps> = ({ props }) => ({
  durationInFrames: Math.max(15, Math.round((props.seconds ?? stickerCaptionsDefaults.seconds) * 30)),
});

const FILL = { White: '#FFFFFF', Yellow: '#FFE14D' } as const;

export const StickerCaptions: React.FC<Partial<StickerCaptionsProps>> = (props) => {
  const p = { ...stickerCaptionsDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();
  const s = (width / 1920) * p.size;

  const [vert, horiz] = (() => {
    switch (p.position) {
      case 'Top left':
        return ['flex-start', 'flex-start'];
      case 'Top center':
        return ['flex-start', 'center'];
      case 'Middle left':
        return ['center', 'flex-start'];
      case 'Center':
        return ['center', 'center'];
      case 'Bottom left':
        return ['flex-end', 'flex-start'];
      default:
        return ['flex-end', 'center'];
    }
  })();

  return (
    <AbsoluteFill
      style={{
        justifyContent: vert,
        alignItems: horiz,
        padding: `${90 * (width / 1920)}px ${100 * (width / 1920)}px`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: horiz === 'center' ? 'center' : 'flex-start', gap: 18 * s }}>
        {p.lines.map((line, i) => {
          const start = Math.round(line.appearAt * fps);
          const inP = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
          const outP = p.exitAtEnd
            ? spring({ frame: frame - (durationInFrames - 10 + i * 2), fps, config: { damping: 200 }, durationInFrames: 8 })
            : 0;
          const scale = inP * (1 - outP);
          // Alternate the lean so the stack looks hand-placed.
          const lean = (i % 2 ? 1 : -1) * p.tilt;
          const fill = line.style === 'Custom' ? line.customColor : FILL[line.style];
          return (
            <div
              key={i}
              style={{
                // Indent each next card a little, like a sticker stack.
                marginLeft: horiz === 'flex-start' ? i * 14 * s : 0,
                padding: `${12 * s}px ${22 * s}px`,
                background: fill,
                border: `${4 * s}px solid ${p.outlineColor}`,
                borderRadius: 10 * s,
                boxShadow: `${6 * s}px ${6 * s}px 0 ${p.outlineColor}`,
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 40 * s,
                lineHeight: 1.15,
                color: p.textColor,
                whiteSpace: 'nowrap',
                transform: `rotate(${lean * (2 - inP)}deg) scale(${scale})`,
                transformOrigin: horiz === 'center' ? 'center' : 'left center',
                opacity: Math.min(scale * 2, 1),
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
