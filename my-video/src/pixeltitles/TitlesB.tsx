import React from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import {
  baseDefaults,
  Body,
  ease,
  F,
  hash,
  MediaBg,
  noise2,
  PixelTitleProps,
  scramble,
  TitleFC,
  TitleShell,
  typed,
  useTitle,
  words,
} from './common';

// -----------------------------------------------------------
// PIXEL TITLES  — part B
//  7 DitherPush     white info card + lime title over dithered word rows
//  8 SerifSlice     sliced serif title, drawn ellipse tag, over footage
//  9 MosaicLimits   staircase title over fluid with black pixel mosaic
// 10 StreakDesign   italic title wiped in by gradient pixel streaks
// 11 CircleInspire  jagged pixel circle spins in, letters scramble
// 12 ColumnCourage  three glitching colour columns + scrambled title
// -----------------------------------------------------------

// ============ 7. DITHER PUSH ============
export const ditherPushDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'PUSH',
  line2: 'BOUNDARIES',
  words: 'CONCEPT 01, NORMS',
  accentColor: '#c6ff1a',
  secondColor: '#1f57ff',
  textColor: '#111111',
  backgroundColor: '#ffffff',
};

export const DitherPush: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, ditherPushDefaults);
  const cardH = Math.round(height * 0.32);
  const ws = words(p.words);
  const label = ws[0] ?? '';
  const bgWord = ws[1] ?? 'NORMS';
  const cardIn = ease(t, 0, 16);
  const rowH = 150;
  const rows = Math.ceil((height - cardH) / rowH) + 1;
  const dots = {
    WebkitMaskImage: 'radial-gradient(circle, #000 45%, transparent 52%)',
    WebkitMaskSize: '7px 7px',
    maskImage: 'radial-gradient(circle, #000 45%, transparent 52%)',
    maskSize: '7px 7px',
  } as React.CSSProperties;
  const titleFont = 270;
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.secondColor}>
      <div style={{ position: 'absolute', left: 0, top: cardH, width, height: height - cardH, overflow: 'hidden', opacity: ease(t, 4, 18) }}>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            style={{
              position: 'absolute',
              top: r * rowH - 20,
              left: 0,
              whiteSpace: 'nowrap',
              fontFamily: F.shoulders,
              fontSize: 190,
              lineHeight: 1,
              color: '#050a33',
              transform: `translateX(${(r % 2 ? -1 : 1) * t * 3 - 400}px) skewX(${Math.sin(t / 7 + r) * 4}deg)`,
              ...dots,
            }}
          >
            {`${bgWord} `.repeat(8)}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, top: cardH + 10, width, padding: '0 20px', fontFamily: F.shoulders, fontSize: titleFont, lineHeight: 0.86, color: p.accentColor }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ clipPath: `inset(0 ${(1 - ease(t, 8, 22)) * 100}% 0 0)` }}>{p.headline}</span>
          <div style={{ flex: 1, height: 14, background: p.accentColor, transformOrigin: 'left', transform: `scaleX(${ease(t, 18, 38)})` }} />
        </div>
        <div style={{ clipPath: `inset(0 ${(1 - ease(t, 14, 32)) * 100}% 0 0)` }}>{p.line2}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width, height: cardH, background: p.backgroundColor, transform: `translateY(${(cardIn - 1) * cardH}px)` }}>
        <div style={{ position: 'absolute', left: 40, top: 50, fontFamily: F.inter, fontWeight: 400, fontSize: 64, color: p.textColor }}>{scramble(label, ease(t, 8, 24, Easing.linear), frame, 7)}</div>
        <Body text={p.body} t={t} start={12} cps={6} style={{ position: 'absolute', left: 42, top: 140, width: 640, color: '#333', fontSize: 19 }} />
        <div style={{ position: 'absolute', left: width * 0.78, top: 0, bottom: 0, borderLeft: '3px dashed #111', transformOrigin: 'top', transform: `scaleY(${ease(t, 10, 24)})` }} />
        <svg width={170} height={170} viewBox="0 0 20 20" style={{ position: 'absolute', right: 70, top: cardH / 2 - 85, transform: `rotate(${(1 - ease(t, 12, 34)) * 220}deg)` }}>
          <circle cx={10} cy={10} r={9} fill="none" stroke="#111" strokeWidth={0.8} />
          <circle cx={10} cy={10} r={7.6} fill="#111" />
          <path d="M8 5 H13 V12.5 Q13 15 10.5 15 H7 V12.5 H10 V7.5 H8Z" fill="#fff" />
        </svg>
      </div>
    </TitleShell>
  );
};

// ============ 8. SERIF SLICE ============
export const serifSliceDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'INSPIRE',
  line2: 'OTHERS',
  words: 'EMBRACE AUTHENTICITY, EXPLORE IDEAS, REFINE DETAILS, #NOVEMBER',
  accentColor: '#ff2d7a',
  textColor: '#ffffff',
  backgroundColor: '#0f2229',
};

const StormFallback: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 30%, #3f6f7c 0%, #1c3a44 50%, #0b1a1f 100%)' }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${50 + Math.sin(t / 9) * 2}% 78%, rgba(255,170,60,${0.7 + Math.sin(t / 2.3) * 0.08}) 0%, rgba(255,90,20,0.35) 18%, transparent 40%)`,
      }}
    />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 75%, #120d0a 92%)' }} />
  </AbsoluteFill>
);

export const SerifSlice: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, serifSliceDefaults);
  const ws = words(p.words);
  const SL = 12;
  const line = (text: string, start: number, y: number, italicShift: number) => (
    <div style={{ position: 'absolute', left: 0, top: y, width, height: 230 }}>
      {Array.from({ length: SL }, (_, i) => {
        const settle = ease(t, start + i * 0.7, start + 18 + i * 0.7, Easing.out(Easing.poly(4)));
        const off = (i % 2 ? 1 : -1) * (120 + hash(i, start) * 220) * (1 - settle);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: `inset(${(i / SL) * 100}% 0 ${100 - ((i + 1) / SL) * 100}% 0)`,
              transform: `translateX(${off + italicShift}px)`,
              opacity: settle > 0 ? 0.4 + settle * 0.6 : 0,
              textAlign: 'center',
              fontFamily: F.serif,
              fontSize: 220,
              lineHeight: '230px',
              color: p.textColor,
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
  const ellP = ease(t, 16, 40);
  const ellLen = 2 * Math.PI * 300;
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <MediaBg file={p.videoFile} fallback={<StormFallback t={t} />} />
      {line(p.headline, 2, height * 0.5 - 220, -20)}
      {line(p.line2, 8, height * 0.5 - 30, 10)}
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <ellipse
          cx={width / 2}
          cy={height * 0.5}
          rx={300}
          ry={36}
          fill="none"
          stroke={p.accentColor}
          strokeWidth={3}
          strokeDasharray={ellLen}
          strokeDashoffset={ellLen * (1 - ellP)}
          transform={`rotate(-4 ${width / 2} ${height * 0.5})`}
        />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.5 - 14, textAlign: 'center', fontFamily: F.inter, fontWeight: 500, fontSize: 24, color: p.textColor, letterSpacing: 1 }}>
        {typed(ws[0] ?? '', t, 20, 2)}
      </div>
      <div style={{ position: 'absolute', left: 40, top: 36, fontFamily: F.inter, fontWeight: 500, fontSize: 22, color: p.textColor, opacity: ease(t, 10, 18), width: 120 }}>{ws[1]}</div>
      <div style={{ position: 'absolute', right: 40, top: 36, fontFamily: F.inter, fontWeight: 500, fontSize: 22, color: p.textColor, opacity: ease(t, 13, 21), width: 120, textAlign: 'right' }}>{ws[2]}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 24, textAlign: 'center', fontFamily: F.inter, fontSize: 13, color: p.textColor, opacity: ease(t, 20, 28) }}>{ws[3]}</div>
    </TitleShell>
  );
};

// ============ 9. MOSAIC LIMITS ============
export const mosaicLimitsDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'PUSH LIMITS IN DESIGN',
  words: '01',
  body: 'Understanding the intricacies of inspiration unveils its profound influence on both personal creativity and collective progress, prompting us to cultivate environments that foster its emergence.',
  accentColor: '#d8102a',
  secondColor: '#ff9aa8',
  textColor: '#ffffff',
  backgroundColor: '#000000',
};

const FluidFallback: React.FC<{ t: number; a: string; b: string }> = ({ t, a, b }) => (
  <AbsoluteFill style={{ background: a }}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${50 + Math.sin(t / 25 + i * 1.3) * 45}%`,
          top: `${50 + Math.cos(t / 31 + i * 2.1) * 45}%`,
          width: 700 - i * 60,
          height: 220 + i * 30,
          borderRadius: '50%',
          border: `${18 + i * 4}px solid ${i % 2 ? b : '#ffffff'}`,
          opacity: i % 2 ? 0.55 : 0.35,
          filter: 'blur(18px)',
          transform: `translate(-50%,-50%) rotate(${t * (i % 2 ? 0.6 : -0.4) + i * 30}deg)`,
        }}
      />
    ))}
  </AbsoluteFill>
);

export const MosaicLimits: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, mosaicLimitsDefaults);
  const cell = 54;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const grow = ease(t, 0, 30, Easing.inOut(Easing.quad));
  const blocks: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.16 + t * 0.015, y * 0.2 - t * 0.01, 5);
      const thr = interpolate(grow, [0, 1], [1.05, 0.55]);
      if (n > thr) {
        const shade = hash(x, y, Math.floor(t / 4)) < 0.15 ? 0.6 : 1;
        blocks.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#000" opacity={shade} />);
      }
    }
  }
  const lines = p.headline.split(' ');
  const steps = [0, 0.37, 0, 0.42, 0.1, 0.5];
  const fs = 175;
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <MediaBg file={p.videoFile} fallback={<FluidFallback t={t} a={p.accentColor} b={p.secondColor} />} />
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
        {blocks}
      </svg>
      {lines.map((w, i) => {
        const a = 4 + i * 5;
        const pr = ease(t, a, a + 16, Easing.out(Easing.poly(4)));
        return (
          <div key={i} style={{ position: 'absolute', left: width * steps[i % steps.length], top: -10 + i * fs * 0.72, height: fs, overflow: 'hidden' }}>
            <div style={{ fontFamily: F.inter, fontWeight: 500, fontSize: fs, lineHeight: `${fs}px`, letterSpacing: -6, color: p.textColor, transform: `translateY(${(1 - pr) * fs}px)` }}>{w}</div>
          </div>
        );
      })}
      <Body text={p.body} t={t} start={14} cps={6} style={{ position: 'absolute', right: 50, top: 30, width: 360, color: p.textColor, fontFamily: F.serif, fontSize: 18 }} />
      <div style={{ position: 'absolute', left: 30, bottom: 30, fontFamily: F.inter, fontSize: 18, color: p.textColor, opacity: ease(t, 16, 24) }}>{p.words}</div>
    </TitleShell>
  );
};

// ============ 10. STREAK DESIGN ============
export const streakDesignDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'DESIGN',
  body: 'Motion graphic design, also known as motion design, is a subset of graphic design which combines design with animation.',
  accentColor: '#1fffb0',
  secondColor: '#2a6bff',
  textColor: '#ffffff',
  backgroundColor: '#000000',
};

export const StreakDesign: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, streakDesignDefaults);
  const cx = width / 2;
  const cy = height / 2;
  const wipe = ease(t, 6, 22, Easing.inOut(Easing.cubic));
  const sweep = ease(t, 10, 34);
  const fs = 230;
  const streaks = Array.from({ length: 9 }, (_, i) => {
    const a = 4 + hash(i, 1) * 16;
    const pr = ease(t, a, a + 14 + hash(i, 2) * 10, Easing.out(Easing.quad));
    const fade = 1 - ease(t, a + 18, a + 30);
    const y = cy - 100 + hash(i, 3) * 200 + (i % 3 === 0 ? 120 : 0);
    const len = 160 + hash(i, 4) * 420;
    const h = [6, 10, 16, 26, 40][i % 5];
    const x = interpolate(pr, [0, 1], [cx - 700, cx - 200 + hash(i, 5) * 500]);
    if (pr <= 0 || fade <= 0) return null;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: len * (0.4 + pr * 0.6),
          height: h,
          background: `linear-gradient(90deg, ${p.secondColor}, ${p.accentColor})`,
          opacity: fade,
          clipPath: `polygon(0 30%, 10% 30%, 10% 0, 100% 0, 100% 70%, 85% 70%, 85% 100%, 0 100%)`,
        }}
      />
    );
  });
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, opacity: ease(t, 0, 14) }}>
        <g transform={`rotate(${t * 0.4} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={470} fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={1.2} strokeDasharray="900 200 400 300" />
        </g>
        <line x1={cx + 380} y1={cy - 120} x2={width} y2={cy - 260} stroke="#fff" strokeOpacity={0.5} />
        <line x1={0} y1={cy + 330} x2={cx - 300} y2={cy + 150} stroke="#fff" strokeOpacity={0.5} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy - fs * 0.6, textAlign: 'center' }}>
        {[-1, 0, 1].map((k) => (
          <div
            key={k}
            style={{
              position: k === 0 ? 'relative' : 'absolute',
              inset: k === 0 ? undefined : 0,
              fontFamily: F.archivoItalic,
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: fs,
              lineHeight: 1.2,
              letterSpacing: -4,
              backgroundImage: `linear-gradient(90deg, ${p.textColor} ${sweep * 100}%, ${p.secondColor} ${sweep * 100 + 25}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              clipPath: k === 0 ? `inset(0 ${(1 - wipe) * 100}% 0 0)` : `inset(${k < 0 ? '20% 0 62% 0' : '64% 0 18% 0'})`,
              transform: k === 0 ? undefined : `translateX(${(1 - ease(t, 8, 26)) * k * 60}px)`,
              opacity: k === 0 ? 1 : wipe * (1 - ease(t, 22, 30)),
            }}
          >
            {p.headline}
          </div>
        ))}
      </div>
      {streaks}
      <Body text={p.body} t={t} start={20} cps={6} style={{ position: 'absolute', right: 30, bottom: 30, width: 520, color: '#9a9a9a', fontSize: 13, textAlign: 'right' }} />
    </TitleShell>
  );
};

// ============ 11. CIRCLE INSPIRE ============
export const circleInspireDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'INSPIRE',
  words: 'TITLE ANIMATION 002',
  body: 'Understanding the intricacies of inspiration unveils its profound influence on both personal creativity and collective progress, prompting us to cultivate environments that foster its emergence.',
  accentColor: '#000000',
  secondColor: '#1d22d6',
  textColor: '#ffffff',
  backgroundColor: '#121514',
};

export const CircleInspire: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, circleInspireDefaults);
  const cx = width / 2;
  const cy = height / 2 + 20;
  const pr = ease(t, 0, 24, Easing.out(Easing.back(1.2)));
  const jag = 1 - ease(t, 4, 26);
  const R = 400 * pr;
  const N = 96;
  const step = 28;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const j = Math.round(((hash(Math.floor(i / 4), Math.floor(t / 2), 21) - 0.5) * 160 * jag) / step) * step;
    const r = Math.max(0, R + j);
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  const rot = (1 - ease(t, 0, 30)) * -120 + t * 0.15;
  const ringR = 430 * pr;
  const ringC = 2 * Math.PI * ringR;
  const scr = ease(t, 8, 34, Easing.linear);
  const letters = Array.from(scramble(p.headline, scr, frame, 11, 'random'));
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <polygon points={pts.join(' ')} fill={p.secondColor} />
        </g>
        <circle
          cx={cx}
          cy={cy}
          r={ringR}
          fill="none"
          stroke={p.accentColor}
          strokeWidth={70}
          strokeDasharray={`${ringC * 0.32} ${ringC}`}
          transform={`rotate(${-rot * 1.6 + 120} ${cx} ${cy})`}
        />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: cy - 110, textAlign: 'center', transform: 'rotate(-8deg)', fontFamily: F.shoulders, fontSize: 200, lineHeight: '220px', color: p.textColor }}>
        {letters.map((c, i) => (
          <span key={i} style={{ opacity: scr >= 1 ? 1 : 0.45 + hash(i, Math.floor(frame / 3)) * 0.55 }}>
            {c}
          </span>
        ))}
      </div>
      <Body text={p.body} t={t} start={6} cps={8} style={{ position: 'absolute', left: 40, top: 40, width: 420, color: '#e8e8e8', fontSize: 14 }} />
      <Body text={p.body} t={t} start={14} cps={8} style={{ position: 'absolute', right: 40, bottom: 40, width: 420, color: '#e8e8e8', fontSize: 14 }} />
      <div style={{ position: 'absolute', right: 30, top: 60, writingMode: 'vertical-rl', fontFamily: F.inter, fontSize: 12, color: '#e8e8e8', letterSpacing: 1, opacity: ease(t, 10, 18) }}>{p.words}</div>
      <div style={{ position: 'absolute', left: 30, bottom: 60, writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: F.inter, fontSize: 12, color: '#e8e8e8', letterSpacing: 1, opacity: ease(t, 12, 20) }}>{p.words}</div>
    </TitleShell>
  );
};

// ============ 12. COLUMN COURAGE ============
export const columnCourageDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'COURAGE',
  body: 'Inspiration strikes suddenly, often in the quiet moments when the mind roams freely. It can spring from nature’s beauty or the smallest interactions.',
  accentColor: '#c8102e',
  secondColor: '#cfc9c4',
  textColor: '#ffffff',
  backgroundColor: '#1c2123',
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

export const ColumnCourage: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, columnCourageDefaults);
  const cols = [
    { x: 0, w: 0.34, c: p.backgroundColor },
    { x: 0.34, w: 0.18, c: p.accentColor },
    { x: 0.52, w: 0.48, c: p.secondColor },
  ];
  const ROW = 18;
  const nRows = Math.ceil(height / ROW);
  const glitch = 1 - ease(t, 6, 34);
  const rects: React.ReactNode[] = [];
  cols.forEach((col, ci) => {
    const x0 = col.x * width;
    const w = col.w * width;
    const drop = ease(t, ci * 3, 14 + ci * 3, Easing.out(Easing.cubic));
    for (let r = 0; r < nRows; r++) {
      const live = hash(r, ci, Math.floor(t / 2)) < 0.35 * glitch + 0.03;
      const k = live ? 0.75 + hash(r, ci, Math.floor(t / 2) + 1) * 0.5 : r % 17 < 2 ? 0.9 : 1;
      const dx = live ? (hash(r, ci, Math.floor(t / 2) + 2) - 0.5) * 80 * glitch : 0;
      const ww = live ? w * (0.5 + hash(r, ci, Math.floor(t / 2) + 3) * 0.5) : w;
      const y = r * ROW - (1 - drop) * height;
      rects.push(<rect key={`${ci}-${r}`} x={x0 + dx} y={y} width={ww + 1} height={ROW + 1} fill={shade(col.c, k)} />);
    }
    // soft centre highlight band (the "lighter strip" look)
    rects.push(<rect key={`${ci}-hl`} x={x0} y={height * 0.36 - (1 - drop) * height} width={w} height={height * 0.17} fill="#ffffff" opacity={0.12} />);
  });
  const scr = ease(t, 10, 30, Easing.linear);
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg="#111">
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
        {rects}
      </svg>
      <div style={{ position: 'absolute', left: width * 0.035, top: height * 0.15, fontFamily: F.anton, fontSize: 330, lineHeight: 1, color: p.textColor, letterSpacing: 2 }}>
        {scramble(p.headline, scr, frame, 12)}
      </div>
      <Body text={p.body} t={t} start={22} cps={8} style={{ position: 'absolute', left: width * 0.037, top: height * 0.65, width: width * 0.75, color: p.textColor, fontSize: 18 }} />
    </TitleShell>
  );
};
