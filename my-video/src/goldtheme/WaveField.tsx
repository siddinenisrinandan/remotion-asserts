import React, { useLayoutEffect, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

// -----------------------------------------------------------
// WAVE FIELD — flowing ribbons of tiny dots (gold + lilac) on navy.
// Drawn on a canvas each frame: every ribbon is a stack of dotted
// sine "strands" that twist through each other like a silk scarf.
// -----------------------------------------------------------

type Ribbon = { y: number; amp: number; freq: number; speed: number; phase: number; twist: number; color: [number, number, number]; width: number };

const RIBBONS: Ribbon[] = [
  { y: 0.62, amp: 0.16, freq: 1.6, speed: 0.012, phase: 0.0, twist: 0.22, color: [214, 186, 110], width: 1 },
  { y: 0.55, amp: 0.2, freq: 1.2, speed: -0.009, phase: 1.7, twist: 0.26, color: [176, 140, 196], width: 0.9 },
  { y: 0.72, amp: 0.12, freq: 2.1, speed: 0.015, phase: 3.1, twist: 0.17, color: [232, 206, 140], width: 0.8 },
  { y: 0.4, amp: 0.1, freq: 1.4, speed: 0.008, phase: 4.4, twist: 0.14, color: [150, 120, 190], width: 0.7 },
];

export const WaveField: React.FC<{ base?: string; intensity?: number }> = ({ base = '#1b1546', intensity = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const STRANDS = 40;
    const STEP = 7; // px between dots along a strand
    for (const r of RIBBONS) {
      const t = frame * r.speed;
      for (let s = 0; s < STRANDS; s++) {
        const k = s / (STRANDS - 1) - 0.5; // -0.5..0.5 across the ribbon
        for (let x = -20; x < width + 20; x += STEP) {
          const u = x / width;
          const centre = Math.sin(u * Math.PI * r.freq + r.phase + t * 6) * r.amp + Math.sin(u * 5.3 + t * 3 + r.phase) * 0.03;
          // ribbon thickness breathes and flips (twist) along x
          const thick = Math.sin(u * Math.PI * 2.2 + r.phase * 1.3 + t * 4) * r.twist * r.width;
          const y = (r.y + centre + k * thick) * height;
          // brighter where the ribbon is folded thin (facing the light)
          const face = 1 - Math.min(1, Math.abs(thick) / (r.twist * r.width));
          const edge = 1 - Math.abs(k) * 1.1;
          const a = Math.max(0, (0.16 + face * 0.5) * edge) * intensity;
          if (a < 0.03) continue;
          ctx.fillStyle = `rgba(${r.color[0]},${r.color[1]},${r.color[2]},${a.toFixed(3)})`;
          const d = 1.3 + face * 1.2;
          ctx.fillRect(x, y, d, d);
        }
      }
    }
  }, [frame, width, height, intensity]);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${base} 0%, #0d0a2a 70%, #07061a 100%)` }}>
      <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', inset: 0, filter: 'blur(0.4px)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(4,3,16,0.65) 100%)' }} />
    </AbsoluteFill>
  );
};
