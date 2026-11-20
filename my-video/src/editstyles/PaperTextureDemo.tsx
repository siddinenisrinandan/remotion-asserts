import React from 'react';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';
import { PAPER_PRESETS, PaperTexture, paperTextureDefaults, paperTextureSchema } from './PaperTexture';

// -----------------------------------------------------------
// PAPER TEXTURE DEMO
// A simple colour scene (or your own video) under the paper look,
// with an optional before/after split.
// -----------------------------------------------------------

const { fontFamily } = loadArchivo('normal', { weights: ['800'], subsets: ['latin'] });

const PRESET_NAMES = Object.keys(PAPER_PRESETS) as [string, ...string[]];

export const paperTextureDemoSchema = paperTextureSchema.extend({
  preset: z.enum([...PRESET_NAMES, 'Custom']).describe('Pick a ready look, or "Custom" to use the sliders below'),
  compare: z.boolean().describe('Split screen: left = original, right = paper look'),
  backgroundColor: zColor(),
  title: z.string(),
  videoFile: z.string().describe('Optional video in public/. Empty = colour scene'),
});
export type PaperTextureDemoProps = z.infer<typeof paperTextureDemoSchema>;

export const paperTextureDemoDefaults: PaperTextureDemoProps = {
  ...paperTextureDefaults,
  preset: 'Blue poster',
  compare: false,
  backgroundColor: '#1aa7c9',
  title: 'PAPER',
  videoFile: '',
};

const Scene: React.FC<{ color: string; title: string; videoFile: string }> = ({ color, title, videoFile }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (videoFile) {
    return <Video src={staticFile(videoFile)} objectFit="cover" style={{ width: '100%', height: '100%' }} muted />;
  }
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const drift = interpolate(frame, [0, 150], [0, 1]);
  return (
    <AbsoluteFill style={{ backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      {/* road stripes moving toward the camera, like the reference */}
      {[0, 1, 2, 3].map((i) => {
        const t = (drift * 2 + i / 4) % 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${52 + t * 40}%`,
              top: `${58 + t * 30}%`,
              width: 40 + t * 280,
              height: 8 + t * 50,
              background: '#fff',
              transform: 'skewX(-35deg) rotate(18deg)',
              opacity: Math.min(1, t * 4),
            }}
          />
        );
      })}
      <div
        style={{
          width: 640,
          height: 360,
          borderRadius: 28,
          background: '#fff',
          boxShadow: '0 40px 60px rgba(0,0,0,0.35)',
          transform: `scale(${pop}) rotate(${interpolate(frame, [0, 150], [-3, 3])}deg)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily,
          fontWeight: 800,
          fontSize: 150,
          color,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};

export const PaperTextureDemo: React.FC<PaperTextureDemoProps> = (p) => {
  const look = p.preset === 'Custom' ? p : { ...p, ...paperTextureDefaults, ...PAPER_PRESETS[p.preset] };
  const scene = <Scene color={p.backgroundColor} title={p.title} videoFile={p.videoFile} />;
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <PaperTexture {...look}>{scene}</PaperTexture>
      {p.compare ? (
        <>
          <AbsoluteFill style={{ clipPath: 'inset(0 50% 0 0)' }}>{scene}</AbsoluteFill>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4, marginLeft: -2, background: '#fff' }} />
          <div style={{ position: 'absolute', left: 40, top: 30, fontFamily, fontWeight: 800, fontSize: 34, color: '#fff' }}>ORIGINAL</div>
          <div style={{ position: 'absolute', right: 40, top: 30, fontFamily, fontWeight: 800, fontSize: 34, color: '#fff' }}>
            {p.preset.toUpperCase()}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
