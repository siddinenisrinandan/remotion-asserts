import React from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { loadFont as loadInterTight } from '@remotion/google-fonts/InterTight';
import { KineticCaption, kineticCaptionDefaults } from './KineticCaption';
import { CAPTION_PRESETS } from './captionPresets';

// -----------------------------------------------------------
// CAPTIONS SHOWCASE (1920x1080)
// All 15 caption styles playing at once in a 5x3 grid,
// each with its name underneath.
// -----------------------------------------------------------

const { fontFamily } = loadInterTight('normal', { weights: ['500', '700'], subsets: ['latin'] });

export const CAPTIONS_SHOWCASE_SECONDS = 6;

const COLS = 5;
const CELL_W = 1920 / COLS;
const TOP = 190;
const CELL_H = (1080 - TOP - 20) / 3;

export const CaptionsShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const titleIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#050505' }}>
      <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', opacity: titleIn }}>
        <div style={{ fontFamily, fontWeight: 700, fontSize: 72, color: '#fff', letterSpacing: '-0.02em' }}>15 Captions</div>
        <div style={{ fontFamily, fontWeight: 500, fontSize: 30, color: 'rgba(255,255,255,0.55)' }}>styles for shorts &amp; explainers</div>
      </div>
      {CAPTION_PRESETS.map((preset, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        return (
          <div
            key={preset.id}
            style={{ position: 'absolute', left: col * CELL_W, top: TOP + row * CELL_H, width: CELL_W, height: CELL_H }}
          >
            {/* start the cells a little apart so the grid feels alive */}
            <Sequence from={10 + i * 4} layout="none">
              <KineticCaption
                {...kineticCaptionDefaults}
                {...preset.caption}
                baseSize={46}
                y={46}
                delay={0}
                seconds={CAPTIONS_SHOWCASE_SECONDS - (10 + i * 4) / 30}
              />
            </Sequence>
            <div
              style={{
                position: 'absolute',
                bottom: 14,
                width: '100%',
                textAlign: 'center',
                fontFamily,
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              {String(i + 1).padStart(2, '0')} · {preset.name.toUpperCase()}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
