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
// PIXEL TITLES  — part A
//  1 BandWave      wavy-sliced headline on a coloured band over footage
//  2 BlockDissolve red condensed title + white pixel blocks flashing
//  3 MosaicMotion  pixel font title over a living halftone square mosaic
//  4 DotBuild      title printed in dots on a dotted colour field
//  5 PosterTwo     split poster: sliced-ellipse image + striped big number
//  6 MatrixChange  dashed LED-matrix title that resolves cell by cell
// -----------------------------------------------------------

// ============ 1. BAND WAVE ============
export const bandWaveDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'CREATE',
  words: 'CHALLENGE, CONVENTIONAL, BOUNDARIES',
  accentColor: '#4dff7a',
  secondColor: '#0f2a2a',
  textColor: '#ffffff',
};

const StudioFallback: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 70%, #a8541d 0%, #4a210c 45%, #140904 100%)' }}>
    {[
      [0.36, 0.55, -24],
      [0.62, 0.48, 18],
      [0.72, 0.62, -12],
      [0.45, 0.35, 70],
    ].map(([x, y, r], i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: 18,
          height: 360,
          borderRadius: 9,
          background: '#ffd9a0',
          boxShadow: '0 0 40px 14px rgba(255,140,40,0.75), 0 0 140px 40px rgba(255,100,20,0.35)',
          transform: `translate(-50%,-50%) rotate(${r + Math.sin(t / 40 + i) * 2}deg)`,
          opacity: 0.85 + Math.sin(t / 3 + i * 2) * 0.05,
        }}
      />
    ))}
  </AbsoluteFill>
);

export const BandWave: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, bandWaveDefaults);
  const bandH = Math.round(height * 0.27);
  const bandIn = ease(t, 0, 10);
  const settle = ease(t, 6, 40, Easing.out(Easing.quad));
  const SL = 16;
  const fontSize = bandH * 0.78;
  const ws = words(p.words);
  const slices = Array.from({ length: SL }, (_, i) => {
    const top = (i / SL) * 100;
    const bottom = 100 - ((i + 1) / SL) * 100;
    const wave = Math.sin(i * 0.8 + t * 0.45) * 160 + (hash(i, Math.floor(t / 2), 4) - 0.5) * 140;
    const dx = wave * (1 - settle) + (1 - ease(t, 4, 24)) * width * 0.6;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `inset(${top}% 0 ${bottom}% 0)`,
          transform: `translateX(${dx}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: width * 0.04,
          gap: bandH * 0.12,
        }}
      >
        <svg width={fontSize * 0.55} height={fontSize * 0.55} viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" fill="none" stroke={p.secondColor} strokeWidth="1.4" />
          <circle cx="5" cy="5" r="1.6" fill={p.secondColor} />
        </svg>
        <span style={{ fontFamily: F.archivoBlack, fontSize, color: p.secondColor, lineHeight: 1, letterSpacing: -2 }}>{p.headline}</span>
      </div>
    );
  });

  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <MediaBg file={p.videoFile} fallback={<StudioFallback t={t} />} style={{ top: bandH }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width, height: bandH, background: p.accentColor, transformOrigin: 'top', transform: `scaleY(${bandIn})`, overflow: 'hidden' }}>
        {slices}
      </div>
      <Body text={p.body} t={t} start={14} cps={3} style={{ position: 'absolute', left: 36, top: bandH + 30, width: 760, color: p.textColor, fontSize: 18 }} />
      {ws.map((w, i) => {
        const a = 26 + i * 8;
        const align = i === 0 ? { left: 36 } : i === ws.length - 1 ? { right: 36 } : { left: width / 2 - 40 * i };
        return (
          <div key={i} style={{ position: 'absolute', bottom: 28, ...align, fontFamily: F.shoulders, fontSize: 58, color: p.accentColor, opacity: t >= a ? 1 : 0, letterSpacing: 1 }}>
            {scramble(w, ease(t, a, a + 14, Easing.linear), frame, i + 2)}
          </div>
        );
      })}
    </TitleShell>
  );
};

// ============ 2. BLOCK DISSOLVE ============
export const blockDissolveDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'CONCEPT',
  words: '11 OCT. 2024',
  accentColor: '#e3101f',
  textColor: '#ffffff',
  backgroundColor: '#9aa0a2',
};

const MistFallback: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg, #d7dadb 0%, #b4b9bb 45%, #4c4f50 75%, #2a2b2b 100%)' }}>
    {[0.08, 0.3, 0.52, 0.66, 0.8].map((x, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x * 100}%`,
          bottom: '22%',
          width: 90 + i * 25,
          height: 220 + hash(i) * 260,
          background: 'linear-gradient(180deg,#6d4a3c,#2a2220)',
          borderRadius: '30% 40% 6% 6%',
          filter: `blur(${1 + i * 0.6}px)`,
          opacity: 0.55 + hash(i, 2) * 0.3,
          transform: `translateX(${Math.sin(t / 90 + i) * 6}px)`,
        }}
      />
    ))}
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(220,224,226,0.55), rgba(220,224,226,0) 60%)' }} />
  </AbsoluteFill>
);

export const BlockDissolve: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, blockDissolveDefaults);
  const cell = 64;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const blocks: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (hash(x, y, 5) > 0.38) continue;
      const a = hash(x, y, 6) * 26;
      const d = 2 + hash(x, y, 7) * 7;
      if (t >= a && t < a + d) blocks.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#ffffff" />);
    }
  }
  const chars = Array.from(p.headline);
  const date = words(p.words)[0] ?? '';
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <MediaBg file={p.videoFile} fallback={<MistFallback t={t} />} />
      <div style={{ position: 'absolute', left: 70, top: height * 0.5, transform: 'translateY(-50%)', fontFamily: F.anton, fontSize: 290, color: p.accentColor, lineHeight: 1, letterSpacing: 4 }}>
        {chars.map((c, i) => (
          <span key={i} style={{ opacity: t > 4 + hash(i, 11) * 22 ? 1 : 0 }}>
            {c}
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 60, top: 50, fontFamily: F.inter, fontWeight: 400, fontSize: 46, color: p.textColor, letterSpacing: 2 }}>
        {scramble(date, ease(t, 8, 30, Easing.linear), frame, 3)}
      </div>
      <Body text={p.body} t={t} start={12} cps={4} style={{ position: 'absolute', left: 60, bottom: 60, width: 440, color: p.textColor, fontSize: 17, textAlign: 'justify' }} />
      {[
        [width * 0.7, height * 0.86],
        [width * 0.03, height * 0.08],
      ].map(([x, y], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, color: p.textColor, fontFamily: F.inter, fontSize: 30, opacity: ease(t, 10, 16) }}>
          +
        </div>
      ))}
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
        {blocks}
      </svg>
    </TitleShell>
  );
};

// ============ 3. MOSAIC MOTION ============
export const mosaicMotionDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'MOTION',
  words: 'TRY, BOLD, DESIGNS, #CREATIVITY',
  body: 'TRANSFORMING PIXELS INTO CAPTIVATING VISUAL SYMPHONIES, GRAPHIC DESIGN ORCHESTRATES THE DANCE OF BEAUTY ON THE CANVAS OF CREATIVITY.',
  accentColor: '#f4ff1f',
  secondColor: '#1d2dff',
  backgroundColor: '#000000',
};

export const MosaicMotion: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, mosaicMotionDefaults);
  const cell = 24;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const fill = ease(t, 4, 40, Easing.inOut(Easing.quad));
  const sq: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const n = noise2(x * 0.12 + t * 0.02, y * 0.12 - t * 0.015, 2);
      const gate = hash(x, y, 8) * 0.6 + (y / rows) * 0.4;
      if (gate > fill * 1.1) continue;
      const s = cell * (0.25 + 0.75 * n);
      const o = (cell - s) / 2;
      sq.push(<rect key={`${x}-${y}`} x={x * cell + o} y={y * cell + o} width={s} height={s} fill={p.secondColor} opacity={0.35 + n * 0.65} />);
    }
  }
  const ws = words(p.words);
  const labels = ws.slice(0, 3);
  const tag = ws[3] ?? '';
  const pad = 30;
  const titleH = height * 0.25;
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} shapeRendering="crispEdges">
        {sq}
      </svg>
      <svg width={width - pad * 2} height={titleH} style={{ position: 'absolute', left: pad, top: 24 }}>
        <text
          x={0}
          y={titleH * 0.86}
          textLength={width - pad * 2}
          lengthAdjust="spacingAndGlyphs"
          fontFamily={F.pixel}
          fontWeight={400}
          fontSize={titleH * 0.95}
          fill={p.accentColor}
        >
          {scramble(p.headline, ease(t, 2, 22, Easing.linear), frame, 4)}
        </text>
      </svg>
      <div style={{ position: 'absolute', left: pad, right: pad, top: titleH + 40, display: 'flex', justifyContent: 'space-between' }}>
        {labels.map((w, i) => (
          <span key={i} style={{ fontFamily: F.inter, fontWeight: 500, fontSize: 56, color: '#ffffff', opacity: ease(t, 14 + i * 5, 22 + i * 5), transform: `translateY(${(1 - ease(t, 14 + i * 5, 24 + i * 5)) * 30}px)` }}>
            {w}
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', left: width * 0.3, width: width * 0.4, top: titleH + 150, textAlign: 'center', fontFamily: F.pixel, fontSize: 17, color: '#ffffff', lineHeight: 1.25 }}>
        {typed(p.body, t, 20, 5)}
      </div>
      <div style={{ position: 'absolute', left: pad, bottom: 40, fontFamily: F.inter, fontSize: 18, color: p.accentColor, opacity: ease(t, 24, 30) }}>{tag}</div>
      <div style={{ position: 'absolute', left: pad + 160, right: pad, bottom: 49, height: 2, background: '#ffffff', transformOrigin: 'left', transform: `scaleX(${ease(t, 26, 50)})` }} />
    </TitleShell>
  );
};

// ============ 4. DOT BUILD ============
export const dotBuildDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'BUILD',
  line2: 'DESIGN',
  words: 'CRAFTING VISUAL POETRY THROUGH DESIGN',
  accentColor: '#e8302c',
  secondColor: '#ffb199',
  textColor: '#ffffff',
  backgroundColor: '#000000',
};

const dotMask = (size: number, r = 38): React.CSSProperties => ({
  WebkitMaskImage: `radial-gradient(circle, #000 ${r}%, transparent ${r + 6}%)`,
  WebkitMaskSize: `${size}px ${size}px`,
  maskImage: `radial-gradient(circle, #000 ${r}%, transparent ${r + 6}%)`,
  maskSize: `${size}px ${size}px`,
});

export const DotBuild: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, dotBuildDefaults);
  const fieldH = height * 0.78;
  const inP = ease(t, 0, 26);
  const blobs = [0, 1, 2, 3, 4].map((i) => {
    const x = 50 + Math.sin(t / 30 + i * 1.7) * 40;
    const y = 50 + Math.cos(t / 36 + i * 2.3) * 40;
    const c = i % 2 === 0 ? p.accentColor : p.secondColor;
    return `radial-gradient(circle at ${x}% ${y}%, ${c} 0%, transparent ${30 + i * 6}%)`;
  });
  const dot = Math.round(interpolate(inP, [0, 1], [46, 17]));
  const caption = p.words;
  const letters = (s: string, base: number) =>
    Array.from(s).map((c, i) => (
      <span key={i} style={{ opacity: t > base + hash(i, base, 3) * 16 ? 1 : 0.06 }}>
        {c}
      </span>
    ));
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <div style={{ position: 'absolute', left: 0, top: 0, width, height: fieldH, ...dotMask(dot), opacity: inP }}>
        <div style={{ position: 'absolute', inset: 0, background: `${blobs.join(',')}, #5a0d0d` }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 30,
            fontFamily: F.archivoBlack,
            fontSize: 215,
            lineHeight: 0.92,
            color: '#0a0303',
            letterSpacing: 12,
          }}
        >
          <div>{letters(p.headline, 10)}</div>
          <div>{letters(p.line2, 18)}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: fieldH + 20, width: 520, fontFamily: F.inter, fontWeight: 500, fontSize: 34, color: p.textColor, lineHeight: 1.2, textTransform: 'uppercase' }}>
        {typed(caption, t, 18, 2.5)}
      </div>
      <svg width={120} height={120} viewBox="-10 -10 20 20" style={{ position: 'absolute', right: 80, top: fieldH + 30, transform: `rotate(${(1 - ease(t, 10, 34)) * -180}deg) scale(${ease(t, 10, 30)})` }}>
        <path d="M0 -9 C1 -2 2 -1 9 0 C2 1 1 2 0 9 C-1 2 -2 1 -9 0 C-2 -1 -1 -2 0 -9Z" fill="none" stroke={p.textColor} strokeWidth={0.7} />
      </svg>
    </TitleShell>
  );
};

// ============ 5. POSTER TWO ============
export const posterTwoDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'Create',
  line2: '2',
  accentColor: '#ffa21a',
  secondColor: '#18203a',
  textColor: '#ffffff',
  backgroundColor: '#000000',
};

const SunsetFallback: React.FC = () => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg,#4a2a6b 0%,#c46aa8 55%,#f6b7c9 100%)' }}>
    <div style={{ position: 'absolute', left: '50%', top: '58%', width: 140, height: 120, transform: 'translate(-50%,-50%)', background: '#e9e2d3', borderRadius: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
      <div style={{ position: 'absolute', inset: 16, bottom: 34, background: '#2a2340', borderRadius: 4 }} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '26%', background: '#efe6f2' }} />
  </AbsoluteFill>
);

export const PosterTwo: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, posterTwoDefaults);
  const leftW = width * 0.48;
  const ellW = leftW - 120;
  const ellH = 170;
  const gap = 0.9; // overlap
  const stripeIn = ease(t, 6, 34);
  const gapPct = interpolate(stripeIn, [0, 1], [44, 9]);
  const drift = t * 0.6;
  const stripes = `repeating-linear-gradient(135deg, #000 0px, #000 ${100 - gapPct}px, transparent ${100 - gapPct}px, transparent 100px)`;
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <div style={{ position: 'absolute', left: 60, top: 40, fontFamily: F.oswald, fontWeight: 600, fontSize: 210, color: p.textColor, lineHeight: 1, letterSpacing: -4, clipPath: `inset(0 ${(1 - ease(t, 0, 18)) * 100}% 0 0)` }}>
        {p.headline}
      </div>
      <Body text={p.body} t={t} start={8} cps={5} style={{ position: 'absolute', left: 64, top: 300, width: leftW - 140, color: '#cfcfcf', fontSize: 16 }} />
      {[0, 1, 2].map((i) => {
        const s = ease(t, 10 + i * 5, 28 + i * 5, Easing.out(Easing.back(1.3)));
        const top = 430 + i * ellH * gap * 0.62;
        return (
          <div key={i} style={{ position: 'absolute', left: 60, top, width: ellW, height: ellH, borderRadius: '50%', overflow: 'hidden', transform: `scaleX(${s})`, zIndex: 3 - i }}>
            <div style={{ position: 'absolute', left: 0, top: -(top - 430), width: ellW, height: ellH * 2.4 }}>
              <MediaBg file={p.videoFile} fallback={<SunsetFallback />} />
            </div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: leftW, top: 0, width: width - leftW, height, background: p.secondColor, clipPath: `inset(0 0 ${(1 - ease(t, 0, 14)) * 100}% 0)` }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', fontFamily: F.archivoBlack, fontSize: 900, lineHeight: 1, transform: `scale(${interpolate(ease(t, 4, 30), [0, 1], [0.85, 1])})` }}>
            <span style={{ color: p.accentColor }}>{p.line2}</span>
            <span
              style={{
                position: 'absolute',
                left: -18,
                top: -10,
                color: '#f2f2f2',
                WebkitMaskImage: stripes,
                maskImage: stripes,
                WebkitMaskPosition: `${drift}px 0`,
                maskPosition: `${drift}px 0`,
              }}
            >
              {p.line2}
            </span>
          </div>
        </div>
      </div>
    </TitleShell>
  );
};

// ============ 6. MATRIX CHANGE ============
export const matrixChangeDefaults: PixelTitleProps = {
  ...baseDefaults,
  headline: 'CHANGE',
  line2: 'CREATE FREELY',
  words: '#CREATIVITY',
  body: 'TRANSFORMING PIXELS INTO CAPTIVATING VISUAL SYMPHONIES, GRAPHIC DESIGN ORCHESTRATES THE DANCE OF BEAUTY ON THE CANVAS OF CREATIVITY.',
  accentColor: '#c6ff1a',
  secondColor: '#2fb84a',
  backgroundColor: '#050505',
};

export const MatrixChange: TitleFC = (props) => {
  const { p, frame, t, width, height, durationInFrames } = useTitle(props, matrixChangeDefaults);
  const titleH = height * 0.72;
  const titleW = width - 60;
  const cell = 24;
  const cols = Math.ceil(titleW / cell);
  const rows = Math.ceil(titleH / cell);
  const rev = ease(t, 0, 30, Easing.inOut(Easing.quad));
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const col = hash(x, 0, 12) * 0.7 + hash(x, y, 13) * 0.3;
      if (col <= rev * 1.05) cells.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#fff" />);
    }
  }
  const dashW = interpolate(ease(t, 14, 44), [0, 1], [4, 10.5]);
  const lw = p.line2.split(' ');
  const id = 'mc';
  return (
    <TitleShell p={p} frame={frame} duration={durationInFrames} bg={p.backgroundColor}>
      <svg width={titleW} height={titleH} style={{ position: 'absolute', left: 30, top: 10 }}>
        <defs>
          <pattern id={`${id}-dash`} width={12} height={9} patternUnits="userSpaceOnUse">
            <rect x={0} y={0} width={dashW} height={interpolate(dashW, [4, 10.5], [4, 8])} fill={p.secondColor} />
          </pattern>
          <mask id={`${id}-text`}>
            <text x={0} y={titleH * 0.95} textLength={titleW} lengthAdjust="spacingAndGlyphs" fontFamily={F.anton} fontSize={titleH * 1.12} fill="#fff">
              {p.headline}
            </text>
          </mask>
          <mask id={`${id}-rev`}>{cells}</mask>
        </defs>
        <g mask={`url(#${id}-text)`}>
          <g mask={`url(#${id}-rev)`}>
            <rect width={titleW} height={titleH} fill={`url(#${id}-dash)`} />
          </g>
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 40, top: 40, width: 330, fontFamily: F.inter, fontWeight: 600, fontSize: 14, color: '#ffffff', lineHeight: 1.2 }}>{typed(p.body, t, 6, 6)}</div>
      <div style={{ position: 'absolute', left: width / 2, top: titleH * 0.8, fontFamily: F.inter, fontWeight: 600, fontSize: 13, color: '#ffffff', opacity: ease(t, 20, 26) }}>{p.words}</div>
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 30, display: 'flex', justifyContent: 'space-between', fontFamily: F.archivoBlack, fontSize: 150, lineHeight: 1, letterSpacing: -3 }}>
        {lw.map((w, i) => (
          <span key={i} style={{ color: p.accentColor, opacity: i === 0 ? ease(t, 4, 10) : interpolate(ease(t, 18 + i * 8, 30 + i * 8), [0, 1], [0.15, 1]) }}>
            {w}
          </span>
        ))}
      </div>
    </TitleShell>
  );
};
