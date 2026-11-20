import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction, staticFile } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { KineticCaption, kineticCaptionDefaults, kineticCaptionSchema } from './KineticCaption';
import { CAPTION_PRESETS } from './captionPresets';

// -----------------------------------------------------------
// CAPTION DEMO (vertical 1080x1920)
// One caption style on a colour plate, or on your own video
// with a one-colour (duotone) grade like social-media edits.
// -----------------------------------------------------------

const { fontFamily } = loadInterTight('normal', { weights: ['600', '800'], subsets: ['latin'] });

export const captionDemoSchema = kineticCaptionSchema.extend({
  plateColor: zColor().describe('Background colour (or duotone colour on video)'),
  videoFile: z.string().describe('Optional video in public/. Empty = colour plate'),
  duotone: z.boolean().describe('Tint the video with the plate colour'),
});
export type CaptionDemoProps = z.infer<typeof captionDemoSchema>;

export const captionDemoProps = (index: number): CaptionDemoProps => {
  const preset = CAPTION_PRESETS[index];
  return {
    ...kineticCaptionDefaults,
    ...preset.caption,
    plateColor: preset.plate,
    videoFile: '',
    duotone: true,
  };
};

export const calculateCaptionDemoMetadata: CalculateMetadataFunction<CaptionDemoProps> = ({ props }) => ({
  durationInFrames: Math.max(15, Math.round(props.seconds * 30)),
});

export const CaptionBackground: React.FC<{ color: string; videoFile: string; duotone: boolean }> = ({ color, videoFile, duotone }) => {
  if (videoFile) {
    return (
      <AbsoluteFill>
        <Video
          src={staticFile(videoFile)}
          objectFit="cover"
          style={{ width: '100%', height: '100%', filter: duotone ? 'grayscale(1) contrast(1.1)' : undefined }}
          muted
        />
        {duotone ? <AbsoluteFill style={{ backgroundColor: color, mixBlendMode: 'multiply', opacity: 0.9 }} /> : null}
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.35))' }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.14), rgba(0,0,0,0.45))',
      }}
    />
  );
};

export const CaptionDemo: React.FC<CaptionDemoProps & { styleName?: string }> = ({ plateColor, videoFile, duotone, styleName, ...caption }) => (
  <AbsoluteFill>
    <CaptionBackground color={plateColor} videoFile={videoFile} duotone={duotone} />
    <KineticCaption {...caption} />
    {styleName ? (
      <div
        style={{
          position: 'absolute',
          top: 70,
          width: '100%',
          textAlign: 'center',
          fontFamily,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: '0.25em',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        {styleName.toUpperCase()}
      </div>
    ) : null}
  </AbsoluteFill>
);
