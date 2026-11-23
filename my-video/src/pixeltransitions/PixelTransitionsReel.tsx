import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { Clip } from '../transitions/TwoClipTransition';
import { SfxTrack } from '../SfxTrack';
import { HeatGrid, Mosaic, PIXEL_RAMPS, PIXEL_TRANSITION_NAMES, PIXEL_TRANSITION_PRESETS, pixelTransitionDefaults, SOUND } from './PixelTransition';

// All ten pixel transitions chained between colour cards (01 → 11).
const SEG = 45; // frames per clip
const COLORS = ['#14303a', '#3a2a1a', '#1d3fd8', '#0f3d2a', '#2a1440', '#3a1220', '#10302f', '#302a10', '#1a1a2e', '#2e1a1a', '#14303a'];
export const PIXEL_TX_REEL_FRAMES = SEG * (PIXEL_TRANSITION_NAMES.length + 1);

export const PixelTransitionsReel: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = Math.min(PIXEL_TRANSITION_NAMES.length, Math.floor(frame / SEG));
  type Active = { name: (typeof PIXEL_TRANSITION_NAMES)[number]; prog: number; cell: number; mosaic: number; flip: boolean; palette: keyof typeof PIXEL_RAMPS };
  const a: Active | null =
    PIXEL_TRANSITION_NAMES.map((name, i): Active => {
      const pr = { ...pixelTransitionDefaults, ...PIXEL_TRANSITION_PRESETS[name] };
      const len = Math.round(pr.cutSeconds * 30);
      const prog = (frame - ((i + 1) * SEG - len / 2)) / len;
      return { name, prog, cell: pr.pixelSize, mosaic: pr.mosaic * (name === 'Mosaic Cut' ? 1.8 : 1), flip: pr.flip, palette: pr.palette };
    }).find((x) => x.prog > 0 && x.prog < 1) ?? null;
  const mos = a ? a.mosaic * Math.pow(Math.sin(Math.PI * a.prog), 1.5) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Mosaic size={mos} id="ptx-reel-mosaic">
        <Clip videoFile="" startAt={0} title={String(idx + 1).padStart(2, '0')} color={COLORS[idx % COLORS.length]} />
      </Mosaic>
      {a && <HeatGrid name={a.name} p={a.prog} cell={a.cell} ramp={PIXEL_RAMPS[a.palette]} flip={a.flip} frame={frame} />}
      {PIXEL_TRANSITION_NAMES.map((name, i) => (
        <Sequence key={name} from={(i + 1) * SEG - 12} durationInFrames={40} layout="none">
          <SfxTrack cues={[{ sound: SOUND[name], at: 0, volume: 0.45 }]} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
