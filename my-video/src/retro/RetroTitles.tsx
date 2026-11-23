import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadKanit } from '@remotion/google-fonts/Kanit';
import { loadFont as loadYellowtail } from '@remotion/google-fonts/Yellowtail';
import { loadFont as loadVT } from '@remotion/google-fonts/VT323';
import { loadFont as loadShrikhand } from '@remotion/google-fonts/Shrikhand';
import { loadFont as loadNeonderthaw } from '@remotion/google-fonts/Neonderthaw';
import { loadFont as loadTiltNeon } from '@remotion/google-fonts/TiltNeon';
import { loadFont as loadLimelight } from '@remotion/google-fonts/Limelight';
import { loadFont as loadPoiret } from '@remotion/google-fonts/PoiretOne';
import { loadFont as loadBowlby } from '@remotion/google-fonts/BowlbyOneSC';

// -----------------------------------------------------------
// RETRO TITLES — six decades-flavoured title looks
//   Synthwave 80s · VHS Tape · Groovy 70s · Neon Sign · Silent Film · Memphis 90s
// Each is a full animated title; VHS Tape and Silent Film can also
// sit over your own video. Exit = the entry played backwards.
// -----------------------------------------------------------

const F = {
  kanit: loadKanit('italic', { weights: ['900'], subsets: ['latin'] }).fontFamily,
  script: loadYellowtail('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  vt: loadVT('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  groovy: loadShrikhand('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  neon: loadNeonderthaw('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  tilt: loadTiltNeon('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  deco: loadLimelight('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  poiret: loadPoiret('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
  memphis: loadBowlby('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily,
};

export const RETRO_STYLES = ['Synthwave 80s', 'VHS Tape', 'Groovy 70s', 'Neon Sign', 'Silent Film', 'Memphis 90s'] as const;
export type RetroStyle = (typeof RETRO_STYLES)[number];

export const retroSchema = z.object({
  style: z.enum(RETRO_STYLES),
  title: z.string(),
  subtitle: z.string(),
  extra: z.string().describe('VHS: date line · Silent Film: chapter line · others: unused'),
  colorA: zColor().describe('Main colour of the look'),
  colorB: zColor().describe('Second colour'),
  colorC: zColor().describe('Accent colour'),
  videoFile: z.string().describe('VHS Tape / Silent Film: your video in public/ (empty = drawn background)'),
  titleSize: z.number().min(40).max(400).step(2),
  speed: z.number().min(0.3).max(3).step(0.1),
  seconds: z.number().min(2).max(30).step(0.1),
});
export type RetroProps = z.infer<typeof retroSchema>;

export const retroDefaults: RetroProps = {
  style: 'Synthwave 80s',
  title: 'NIGHT DRIVE',
  subtitle: 'Outrun',
  extra: '',
  colorA: '#ff2a6d',
  colorB: '#05d9e8',
  colorC: '#ffe14d',
  videoFile: '',
  titleSize: 190,
  speed: 1,
  seconds: 5,
};

// ---------- helpers ----------
const clampO = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const E = (t: number, a: number, b: number, e = Easing.out(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clampO, easing: e });
const hash = (x: number, y = 0, s = 0) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
type Ctx = { t: number; frame: number; p: RetroProps; fps: number; uid: string };

const MediaFill: React.FC<{ file: string; style?: React.CSSProperties }> = ({ file, style }) => {
  const src = /^https?:/.test(file) ? file : staticFile(file);
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(file) ? (
    <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
  ) : (
    <Video src={src} objectFit="cover" style={{ width: '100%', height: '100%', ...style }} muted />
  );
};

const Grain: React.FC<{ frame: number; opacity: number; id: string; freq?: number }> = ({ frame, opacity, id, freq = 0.85 }) => (
  <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={frame % 97} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

// ============ 1. SYNTHWAVE 80s ============
const Synthwave: React.FC<Ctx> = ({ t, frame, p, uid }) => {
  const H = 640;
  const rise = E(t, 0, 34, Easing.out(Easing.quad));
  const sunY = 560 + (1 - rise) * 320;
  const phase = (frame * 0.025) % 1;
  const floorLines: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const d = (i + phase) / 14;
    const y = H + (1080 - H) * Math.pow(d, 2.1);
    floorLines.push(<line key={`h${i}`} x1={0} x2={1920} y1={y} y2={y} stroke={p.colorA} strokeWidth={1 + d * 3} opacity={0.25 + d * 0.75} />);
  }
  for (let k = -16; k <= 16; k++) {
    floorLines.push(<line key={`v${k}`} x1={960 + k * 10} y1={H} x2={960 + k * 230} y2={1080} stroke={p.colorA} strokeWidth={2} opacity={0.8} />);
  }
  const stripes: React.ReactNode[] = [];
  for (let j = 0; j < 7; j++) {
    const gap = 34;
    const y = sunY + 20 + j * gap + ((frame * 0.6) % gap);
    stripes.push(<rect key={j} x={600} y={y} width={720} height={2 + j * 2.6} fill="#000" />);
  }
  const titleIn = E(t, 8, 30, Easing.out(Easing.back(1.4)));
  const neon = t < 26 ? 0 : t < 40 ? (hash(1, Math.floor(t)) > 0.4 ? 1 : 0.2) : 1;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, #07011a 0%, #1a0536 40%, #4a0b5e 58%, #0b0221 59.3%, #0b0221 100%)' }}>
      {Array.from({ length: 120 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: hash(i, 1) * 1920,
            top: hash(i, 2) * 560,
            width: 2 + hash(i, 3) * 2,
            height: 2 + hash(i, 3) * 2,
            borderRadius: '50%',
            background: '#fff',
            opacity: (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / (6 + hash(i, 4) * 10) + i))) * E(t, 0, 20),
          }}
        />
      ))}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}sun`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.colorC} />
            <stop offset="0.55" stopColor="#ff8a3d" />
            <stop offset="1" stopColor={p.colorA} />
          </linearGradient>
          <mask id={`${uid}sunMask`}>
            <rect x={0} y={0} width={1920} height={1080} fill="#fff" />
            {stripes}
          </mask>
          <clipPath id={`${uid}sky`}>
            <rect x={0} y={0} width={1920} height={H} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}sky)`}>
          <circle cx={960} cy={sunY} r={300} fill={p.colorA} opacity={0.25} style={{ filter: 'blur(40px)' }} />
          <circle cx={960} cy={sunY} r={260} fill={`url(#${uid}sun)`} mask={`url(#${uid}sunMask)`} />
          {/* distant mountains */}
          <path d={`M0 ${H} L220 520 L380 600 L560 470 L760 ${H} Z M1160 ${H} L1380 480 L1540 580 L1720 500 L1920 ${H} Z`} fill="#12052b" stroke={p.colorB} strokeWidth={2} opacity={0.95} />
        </g>
        <g style={{ filter: `drop-shadow(0 0 6px ${p.colorA})` }}>{floorLines}</g>
        <line x1={0} x2={1920} y1={H} y2={H} stroke={p.colorB} strokeWidth={3} style={{ filter: `drop-shadow(0 0 10px ${p.colorB})` }} />
      </svg>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 260 }}>
        <div
          style={{
            fontFamily: F.kanit,
            fontStyle: 'italic',
            fontWeight: 900,
            fontSize: p.titleSize,
            lineHeight: 1,
            letterSpacing: '0.02em',
            backgroundImage: 'linear-gradient(180deg, #f4fbff 0%, #9be2ff 38%, #253a8a 49%, #fbfbff 51%, #ffb3ec 72%, #ff2a6d 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextStroke: '2px rgba(255,255,255,0.85)',
            filter: `drop-shadow(0 0 18px ${p.colorA}aa) drop-shadow(0 6px 0 #1a0536)`,
            transform: `scale(${interpolate(titleIn, [0, 1], [1.6, 1])}) skewX(-6deg)`,
            opacity: E(t, 8, 16),
          }}
        >
          {p.title}
        </div>
        <div
          style={{
            fontFamily: F.script,
            fontSize: p.titleSize * 0.62,
            color: '#fff0fb',
            marginTop: -p.titleSize * 0.22,
            marginLeft: p.titleSize * 1.4,
            transform: 'rotate(-8deg)',
            opacity: neon,
            textShadow: `0 0 6px #fff, 0 0 18px ${p.colorA}, 0 0 40px ${p.colorA}, 0 0 70px ${p.colorA}`,
          }}
        >
          {p.subtitle}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 4px)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

// ============ 2. VHS TAPE ============
const VhsTape: React.FC<Ctx> = ({ t, frame, p, fps, uid }) => {
  const jump = hash(Math.floor(frame / 3), 7) > 0.88 ? (hash(frame, 8) - 0.5) * 30 : 0;
  const bandY = ((frame * 9) % 1400) - 200;
  const secs = Math.floor(frame / fps);
  const tc = `${String(Math.floor(secs / 3600)).padStart(1, '0')}:${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const chars = Array.from(p.title);
  const shown = Math.floor(E(t, 10, 40, Easing.linear) * chars.length);
  const sh = 4 + (jump !== 0 ? 10 : 0) + Math.sin(frame / 3) * 1.5;
  const titleStyle: React.CSSProperties = { fontFamily: F.vt, fontSize: p.titleSize, lineHeight: 1, letterSpacing: '0.04em', whiteSpace: 'nowrap' };
  const tx = chars.slice(0, shown).join('') + (shown < chars.length && Math.floor(frame / 4) % 2 ? '█' : '');
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translateX(${jump}px)` }}>
        {p.videoFile ? (
          <MediaFill file={p.videoFile} style={{ filter: 'saturate(1.45) contrast(1.15) brightness(0.95) blur(0.8px) hue-rotate(-8deg)' }} />
        ) : (
          <AbsoluteFill style={{ background: `linear-gradient(160deg, ${p.colorA} 0%, #1b0f3a 55%, ${p.colorB} 120%)` }} />
        )}
        {/* colour bleed */}
        <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(255,0,80,0.08), rgba(0,200,255,0.08))`, mixBlendMode: 'screen' }} />
      </AbsoluteFill>
      {/* rolling tracking band */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: bandY, height: 70, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.03), transparent)', transform: `translateX(${Math.sin(frame) * 14}px)` }} />
      {/* bottom tracking noise */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 18,
          height: 26,
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,${0.3 + hash(frame) * 0.4}) 0 ${2 + hash(frame, 2) * 6}px, transparent 0 ${10 + hash(frame, 3) * 30}px)`,
          opacity: 0.55,
          filter: 'blur(1px)',
        }}
      />
      {/* title with RGB split */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ ...titleStyle, position: 'absolute', left: -sh, top: 0, color: '#ff1f4b', mixBlendMode: 'screen', opacity: 0.85 }}>{tx}</div>
          <div style={{ ...titleStyle, position: 'absolute', left: sh, top: 0, color: '#18e0ff', mixBlendMode: 'screen', opacity: 0.85 }}>{tx}</div>
          <div style={{ ...titleStyle, position: 'relative', color: '#ffffff', textShadow: '0 0 12px rgba(255,255,255,0.5)' }}>{tx || ' '}</div>
        </div>
        <div style={{ fontFamily: F.vt, fontSize: p.titleSize * 0.32, color: '#fff', letterSpacing: '0.2em', opacity: E(t, 38, 48), textShadow: `2px 0 #ff1f4b, -2px 0 #18e0ff`, marginTop: 10 }}>
          {p.subtitle}
        </div>
      </AbsoluteFill>
      {/* OSD */}
      <div style={{ position: 'absolute', left: 70, top: 56, fontFamily: F.vt, fontSize: 64, color: '#fff', textShadow: '3px 3px 0 rgba(0,0,0,0.6)', opacity: Math.floor(frame / 15) % 2 || t > 40 ? 1 : 0.15 }}>PLAY ▶</div>
      <div style={{ position: 'absolute', right: 70, top: 56, fontFamily: F.vt, fontSize: 56, color: '#fff', textShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}>SP</div>
      <div style={{ position: 'absolute', left: 70, bottom: 64, fontFamily: F.vt, fontSize: 52, color: '#fff', lineHeight: 1, textShadow: '3px 3px 0 rgba(0,0,0,0.6)', whiteSpace: 'pre' }}>{p.extra}</div>
      <div style={{ position: 'absolute', right: 70, bottom: 64, fontFamily: F.vt, fontSize: 52, color: '#fff', textShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}>{tc}</div>
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 4px)' }} />
      <Grain frame={frame} opacity={0.22} id={`${uid}g`} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)' }} />
    </AbsoluteFill>
  );
};

// ============ 3. GROOVY 70s ============
const Groovy: React.FC<Ctx> = ({ t, frame, p }) => {
  const bands = [p.colorA, p.colorC, '#f6c85f', p.colorB, '#c2452d'];
  const wave = (yOff: number, ph: number) => {
    let d = '';
    for (let x = -100; x <= 2020; x += 40) {
      const y = 540 + yOff + Math.sin(x / 260 + ph) * 90;
      d += `${x === -100 ? 'M' : 'L'}${x} ${y} `;
    }
    return d;
  };
  const draw = E(t, 0, 30, Easing.inOut(Easing.cubic));
  const chars = Array.from(p.title);
  const flower = (cx: number, cy: number, r: number, col: string, k: number, rot: number) =>
    k <= 0 ? null : (
      <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${k})`}>
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx={0} cy={-r * 0.55} rx={r * 0.32} ry={r * 0.5} fill={col} transform={`rotate(${i * 45})`} />
        ))}
        <circle r={r * 0.35} fill="#fff4de" />
        <circle r={r * 0.2} fill={p.colorB} />
      </g>
    );
  return (
    <AbsoluteFill style={{ backgroundColor: '#f4e4c1' }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {bands.map((c, i) => (
          <path
            key={i}
            d={wave((i - 2) * 72, frame / 30 + i * 0.25)}
            fill="none"
            stroke={c}
            strokeWidth={74}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - draw}
          />
        ))}
        {flower(240, 190, 120, p.colorA, E(t, 14, 30, Easing.out(Easing.back(2))), frame * 0.6)}
        {flower(1700, 900, 140, p.colorC, E(t, 18, 34, Easing.out(Easing.back(2))), -frame * 0.5)}
        {flower(1660, 170, 70, '#c2452d', E(t, 22, 36, Easing.out(Easing.back(2))), frame)}
      </svg>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontFamily: F.groovy, fontSize: p.titleSize, lineHeight: 1.05, whiteSpace: 'nowrap' }}>
          {chars.map((ch, i) => {
            const a = 8 + i * 2.5;
            const k = E(t, a, a + 16, Easing.out(Easing.back(2.2)));
            const wob = Math.sin(frame / 8 + i) * 3;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  color: '#fff4de',
                  textShadow: `5px 5px 0 ${p.colorA}, 10px 10px 0 ${p.colorC}, 15px 15px 0 ${p.colorB}`,
                  transform: `translateY(${(1 - k) * 120 + wob}px) rotate(${(1 - k) * 25 + wob}deg) scale(${k})`,
                  opacity: Math.min(1, k * 2),
                }}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: F.groovy,
            fontSize: p.titleSize * 0.34,
            color: p.colorB,
            background: '#fff4de',
            padding: '6px 34px',
            borderRadius: 999,
            border: `5px solid ${p.colorB}`,
            marginTop: 30,
            transform: `rotate(-3deg) scale(${E(t, 26, 40, Easing.out(Easing.back(2)))})`,
          }}
        >
          {p.subtitle}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(90,50,20,0.35) 100%)' }} />
    </AbsoluteFill>
  );
};

// ============ 4. NEON SIGN ============
const NeonSign: React.FC<Ctx> = ({ t, frame, p, uid }) => {
  const chars = Array.from(p.title);
  const lit = (i: number, start: number) => {
    if (t < start) return 0;
    if (t < start + 18) return hash(i, Math.floor(t), 3) > 0.45 ? 1 : 0.12;
    if (hash(i, Math.floor(frame / 3), 9) > 0.985) return 0.25; // the odd buzzing letter
    return 1;
  };
  const allOn = chars.reduce((s, _, i) => s + lit(i, 10 + i * 1.5), 0) / Math.max(1, chars.length);
  const subOn = lit(99, 34);
  const glow = (c: string) => `0 0 4px #fff, 0 0 10px #fff, 0 0 20px ${c}, 0 0 42px ${c}, 0 0 80px ${c}, 0 0 120px ${c}`;
  return (
    <AbsoluteFill style={{ backgroundColor: '#140b0d' }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id={`${uid}brick`} width={160} height={80} patternUnits="userSpaceOnUse">
            <rect width={160} height={80} fill="#0d0708" />
            <rect x={3} y={3} width={154} height={34} fill="#2a1519" />
            <rect x={-77} y={43} width={154} height={34} fill="#26131a" />
            <rect x={83} y={43} width={154} height={34} fill="#2c1618" />
          </pattern>
        </defs>
        <rect width={1920} height={1080} fill={`url(#${uid}brick)`} />
      </svg>
      {/* light spill on the wall */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 48%, ${p.colorA}${Math.round(allOn * 70).toString(16).padStart(2, '0')} 0%, transparent 55%)` }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.75) 100%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontFamily: F.neon, fontSize: p.titleSize, lineHeight: 1.1, whiteSpace: 'nowrap', transform: 'rotate(-4deg)' }}>
          {chars.map((ch, i) => {
            const on = lit(i, 10 + i * 1.5);
            return (
              <span key={i} style={{ color: on > 0.5 ? '#fff4fb' : `${p.colorA}55`, textShadow: on > 0.5 ? glow(p.colorA) : 'none', opacity: 0.35 + on * 0.65 }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: F.tilt,
            fontSize: p.titleSize * 0.3,
            letterSpacing: '0.3em',
            paddingLeft: '0.3em',
            marginTop: 20,
            color: subOn > 0.5 ? '#effeff' : `${p.colorB}55`,
            textShadow: subOn > 0.5 ? glow(p.colorB) : 'none',
            border: `4px solid ${subOn > 0.5 ? '#effeff' : `${p.colorB}55`}`,
            boxShadow: subOn > 0.5 ? `0 0 10px #fff, 0 0 24px ${p.colorB}, 0 0 50px ${p.colorB}, inset 0 0 20px ${p.colorB}` : 'none',
            borderRadius: 18,
            padding: '8px 40px',
          }}
        >
          {p.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 5. SILENT FILM ============
const SilentFilm: React.FC<Ctx> = ({ t, frame, p, uid }) => {
  const weaveX = (hash(frame, 1) - 0.5) * 3;
  const weaveY = (hash(frame, 2) - 0.5) * 3;
  const flick = 0.08 + hash(frame, 3) * 0.12;
  const iris = E(t, 0, 22, Easing.inOut(Easing.cubic));
  const cardIn = E(t, 14, 34);
  const scratches = Array.from({ length: 3 }, (_, i) => (hash(frame, i + 10) > 0.55 ? hash(frame, i + 20) * 1920 : -10));
  const dust = Array.from({ length: 10 }, (_, i) => [hash(frame, i + 30) * 1920, hash(frame, i + 40) * 1080, 1 + hash(frame, i + 50) * 5]);
  const cream = p.colorA;
  const fan = (x: number, y: number, rot: number) => (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={cardIn}>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={0} y1={0} x2={Math.cos((i * Math.PI) / 8) * 60} y2={Math.sin((i * Math.PI) / 8) * 60} stroke={cream} strokeWidth={2} />
      ))}
      <path d="M70 0 A70 70 0 0 1 0 70" fill="none" stroke={cream} strokeWidth={2} />
    </g>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${weaveX}px, ${weaveY}px)`, clipPath: `circle(${iris * 75}% at 50% 50%)` }}>
        {p.videoFile ? (
          <MediaFill file={p.videoFile} style={{ filter: 'grayscale(1) sepia(0.85) contrast(1.25) brightness(0.9)' }} />
        ) : (
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, #2b2219 0%, #0e0b08 80%)' }} />
        )}
        {/* intertitle card */}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 1180, padding: '80px 60px', textAlign: 'center', background: p.videoFile ? 'rgba(10,8,6,0.72)' : 'transparent', opacity: cardIn }}>
            <svg width={1180} height="100%" viewBox="0 0 1180 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, height: '100%' }}>
              <rect x={6} y={6} width={1168} height={388} fill="none" stroke={cream} strokeWidth={3} vectorEffect="non-scaling-stroke" />
              <rect x={22} y={22} width={1136} height={356} fill="none" stroke={cream} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            </svg>
            <svg width={1180} height={200} viewBox="0 0 1180 200" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
              {fan(22, 22, 0)}
              {fan(1158, 22, 90)}
            </svg>
            <div style={{ fontFamily: F.poiret, fontSize: 34, letterSpacing: '0.5em', color: cream, marginBottom: 18 }}>{p.extra}</div>
            <div style={{ fontFamily: F.deco, fontSize: p.titleSize * 0.75, color: cream, lineHeight: 1.05, letterSpacing: '0.04em' }}>{p.title}</div>
            <div style={{ width: 260, height: 2, background: cream, margin: '26px auto' }} />
            <div style={{ fontFamily: F.poiret, fontSize: 40, color: cream, letterSpacing: '0.12em' }}>{p.subtitle}</div>
          </div>
        </AbsoluteFill>
        {/* sepia wash + flicker */}
        <AbsoluteFill style={{ background: 'rgba(112,66,20,0.18)', mixBlendMode: 'multiply' }} />
        <AbsoluteFill style={{ background: `rgba(0,0,0,${flick})` }} />
        {scratches.map((x, i) => (
          <div key={i} style={{ position: 'absolute', left: x, top: 0, bottom: 0, width: 1.5, background: 'rgba(240,225,190,0.45)' }} />
        ))}
        {dust.map(([x, y, s], i) => (
          <div key={`d${i}`} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: i % 3 ? 'rgba(0,0,0,0.7)' : 'rgba(250,240,210,0.7)' }} />
        ))}
        <Grain frame={frame} opacity={0.35} id={`${uid}g`} freq={0.95} />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)' }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ============ 6. MEMPHIS 90s ============
const Memphis: React.FC<Ctx> = ({ t, frame, p }) => {
  const cols = [p.colorA, p.colorB, p.colorC, '#3a86ff', '#222222'];
  const shapes = Array.from({ length: 18 }, (_, i) => {
    const x = 120 + hash(i, 1) * 1680;
    const y = 90 + hash(i, 2) * 900;
    if (Math.abs(x - 960) < 520 && Math.abs(y - 540) < 220) return null; // keep the centre clear
    const a = 4 + i * 1.6;
    const k = E(t, a, a + 14, Easing.out(Easing.back(2.4)));
    if (k <= 0) return null;
    const rot = hash(i, 3) * 360 + Math.sin(frame / 30 + i) * 12;
    const fl = Math.sin(frame / 20 + i) * 8;
    const c = cols[i % cols.length];
    const kind = i % 6;
    const el =
      kind === 0 ? (
        <polygon points="0,-50 45,35 -45,35" fill={c} />
      ) : kind === 1 ? (
        <circle r={38} fill="none" stroke={c} strokeWidth={12} />
      ) : kind === 2 ? (
        <path d="M-80 0 L-50 -25 L-20 0 L10 -25 L40 0 L70 -25" fill="none" stroke={c} strokeWidth={10} strokeLinejoin="round" />
      ) : kind === 3 ? (
        <g fill={c}>
          {Array.from({ length: 16 }, (_, j) => (
            <circle key={j} cx={(j % 4) * 22 - 33} cy={Math.floor(j / 4) * 22 - 33} r={5} />
          ))}
        </g>
      ) : kind === 4 ? (
        <path d="M-50 0 A50 50 0 0 1 50 0 Z" fill={c} />
      ) : (
        <rect x={-40} y={-40} width={80} height={80} fill="none" stroke={c} strokeWidth={10} />
      );
    return (
      <g key={i} transform={`translate(${x} ${y + fl}) rotate(${rot}) scale(${k})`}>
        {el}
      </g>
    );
  });
  const chars = Array.from(p.title);
  return (
    <AbsoluteFill style={{ backgroundColor: '#fdf6e3' }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {shapes}
      </svg>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ fontFamily: F.memphis, fontSize: p.titleSize, lineHeight: 1, whiteSpace: 'nowrap', transform: 'rotate(-3deg)' }}>
          {chars.map((ch, i) => {
            const a = 10 + i * 2;
            const k = E(t, a, a + 14, Easing.out(Easing.back(2.6)));
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  color: '#222',
                  textShadow: `8px 8px 0 ${cols[i % 3]}`,
                  transform: `scale(${k}) rotate(${(1 - k) * -30}deg)`,
                }}
              >
                {ch === ' ' ? ' ' : ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: F.memphis,
            fontSize: p.titleSize * 0.26,
            color: p.colorC,
            background: '#222',
            padding: '10px 30px',
            marginTop: 26,
            transform: `rotate(2deg) translateX(${(1 - E(t, 28, 40, Easing.out(Easing.back(1.8)))) * -1400}px)`,
            boxShadow: `8px 8px 0 ${p.colorA}`,
          }}
        >
          {p.subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const RENDER: Record<RetroStyle, React.FC<Ctx>> = {
  'Synthwave 80s': Synthwave,
  'VHS Tape': VhsTape,
  'Groovy 70s': Groovy,
  'Neon Sign': NeonSign,
  'Silent Film': SilentFilm,
  'Memphis 90s': Memphis,
};

export const RetroTitle: React.FC<Partial<RetroProps>> = (props) => {
  const p = { ...retroDefaults, ...props };
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const t = Math.min(frame, durationInFrames - 1 - frame) * p.speed;
  const uid = `rt${React.useId().replace(/:/g, '')}`;
  const C = RENDER[p.style as RetroStyle] ?? Synthwave;
  return <C t={t} frame={frame} p={p} fps={fps} uid={uid} />;
};

const P = (style: RetroStyle, over: Partial<RetroProps>) => ({
  id: `Retro-${style.replace(/\s+/g, '')}`,
  props: { ...retroDefaults, style, ...over } as RetroProps,
});

export const RETRO_PRESETS = [
  P('Synthwave 80s', { title: 'NIGHT DRIVE', subtitle: 'Outrun', colorA: '#ff2a6d', colorB: '#05d9e8', colorC: '#ffe14d', titleSize: 190 }),
  P('VHS Tape', { title: 'SUMMER 94', subtitle: 'HOME VIDEO', extra: 'AM 10:24\nJUN. 21 1994', videoFile: 'testvideo4.mp4', colorA: '#e8364f', colorB: '#18e0ff', colorC: '#ffffff', titleSize: 200 }),
  P('Groovy 70s', { title: 'Far Out!', subtitle: 'Good Vibes Only', colorA: '#e85d2a', colorB: '#7a3f1d', colorC: '#f2a33a', titleSize: 200, seconds: 5 }),
  P('Neon Sign', { title: 'Open Late', subtitle: 'BAR & DINER', colorA: '#ff2fb0', colorB: '#2ff3ff', colorC: '#ffffff', titleSize: 220, seconds: 5 }),
  P('Silent Film', { title: 'THE GOLDEN ROAD', subtitle: 'a picture in three acts', extra: 'CHAPTER I', colorA: '#efe3c6', colorB: '#000000', colorC: '#000000', titleSize: 150, seconds: 6 }),
  P('Memphis 90s', { title: 'TOTALLY RAD', subtitle: 'BACK TO THE 90s', colorA: '#ff6b9d', colorB: '#2ec4b6', colorC: '#ffbf00', titleSize: 170 }),
];
