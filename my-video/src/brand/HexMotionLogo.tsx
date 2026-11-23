import React from 'react';
import { AbsoluteFill } from 'remotion';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';

// -----------------------------------------------------------
// HEXMOTION LOGO — cleaned-up version of the user's sketch.
// It reads as "H" + "M":
//   • H on the left; its right bar is shared with…
//   • a sideways M: the top and bottom arms are M's legs, and the
//     V of the M starts at those corners and points right (= play),
//   • a red play triangle sits inside the V.
// Everything is drawn on a 100x100 grid.
// -----------------------------------------------------------

const MONT = loadMontserrat('normal', { weights: ['500', '800'], subsets: ['latin'] }).fontFamily;

export type LogoColors = { ink: string; play: string; playDark?: string };

/** The mark's shapes as an SVG group (0..100 grid). */
export const MarkShapes: React.FC<{ ink: string; play: string }> = ({ ink, play }) => (
  <g>
    {/* H */}
    <rect x={8} y={14} width={10} height={72} fill={ink} />
    <rect x={17} y={45} width={24} height={10} fill={ink} />
    <rect x={40} y={14} width={10} height={72} fill={ink} />
    {/* sideways M: legs (top/bottom arms) … */}
    <rect x={49} y={14} width={43} height={9} fill={ink} />
    <rect x={49} y={77} width={43} height={9} fill={ink} />
    {/* … and the V, starting at the corners and pointing right */}
    <polygon points="50,14 90,50 50,86 50,74 77,50 50,26" fill={ink} />
    {/* play */}
    <path d="M55 37 L70 50 L55 63 Z" fill={play} />
  </g>
);

/** The mark itself (no background). `ink` may be a colour or url(#gradient). */
export const LogoMark: React.FC<{ size: number; colors: LogoColors; id?: string; defs?: React.ReactNode }> = ({ size, colors, id = 'hm', defs }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id={`${id}play`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={colors.play} />
        <stop offset="1" stopColor={colors.playDark ?? colors.play} />
      </linearGradient>
      {defs}
    </defs>
    <MarkShapes ink={colors.ink} play={`url(#${id}play)`} />
  </svg>
);

const GOLD_DEFS = (
  <linearGradient id="hmgold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#fff4cf" />
    <stop offset="0.3" stopColor="#f2cf78" />
    <stop offset="0.52" stopColor="#c8973c" />
    <stop offset="0.6" stopColor="#8d6420" />
    <stop offset="0.78" stopColor="#f6dd96" />
    <stop offset="1" stopColor="#b0812f" />
  </linearGradient>
);

const hexPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(' ');

const Tile: React.FC<{ label: string; bg: string; dark?: boolean; children: React.ReactNode }> = ({ label, bg, dark, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
    <div style={{ width: 520, height: 360, background: bg, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>{children}</div>
    <div style={{ fontFamily: MONT, fontWeight: 500, fontSize: 22, color: '#333', letterSpacing: 1 }}>{label}</div>
  </div>
);

const Wordmark: React.FC<{ ink: string; ai: string }> = ({ ink, ai }) => (
  <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 62, color: ink, letterSpacing: -1, lineHeight: 1 }}>
    HexMotion
    <span style={{ fontWeight: 500, fontSize: 28, color: ai, marginLeft: 8, verticalAlign: 'super' }}>AI</span>
  </div>
);

/** Preview sheet with the main variations. */
export const HexMotionLogoSheet: React.FC = () => (
  <AbsoluteFill style={{ background: '#e9e9ee', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 520px)', gap: '40px 50px' }}>
      <Tile label="1 · Original (from your sketch)" bg="#ffffff">
        <LogoMark size={260} colors={{ ink: '#111111', play: '#e8202a', playDark: '#b0101a' }} id="a" />
      </Tile>
      <Tile label="2 · Dark" bg="#111216" dark>
        <LogoMark size={260} colors={{ ink: '#ffffff', play: '#ff3b47', playDark: '#c8101e' }} id="b" />
      </Tile>
      <Tile label="3 · Gold" bg="#1b1546" dark>
        <LogoMark size={260} colors={{ ink: 'url(#hmgold)', play: '#ff3b47', playDark: '#b0101a' }} id="c" defs={GOLD_DEFS} />
      </Tile>
      <Tile label="4 · Hexagon badge" bg="#111216" dark>
        <svg width={300} height={300} viewBox="0 0 100 100">
          <polygon points={hexPoints(50, 50, 47)} fill="#1c1d24" stroke="#ff3b47" strokeWidth={2.5} />
          <g transform="translate(22 22) scale(0.56)">
            <MarkShapes ink="#ffffff" play="#ff3b47" />
          </g>
        </svg>
      </Tile>
      <Tile label="5 · App icon" bg="#e9e9ee">
        <div style={{ width: 240, height: 240, borderRadius: 54, background: 'linear-gradient(145deg, #23242c, #0c0d11)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
          <LogoMark size={170} colors={{ ink: '#ffffff', play: '#ff4d57', playDark: '#c8101e' }} id="e" />
        </div>
      </Tile>
      <Tile label="6 · Logo + name" bg="#ffffff">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoMark size={104} colors={{ ink: '#111111', play: '#e8202a', playDark: '#b0101a' }} id="f" />
          <Wordmark ink="#111111" ai="#e8202a" />
        </div>
      </Tile>
    </div>
  </AbsoluteFill>
);

/** Favourite: white hexagon, black H+M mark, red outline + red play. */
export const HexBadgeWhite: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <polygon points={hexPoints(50, 50, 47)} fill="#ffffff" stroke="#ff3b47" strokeWidth={2.5} />
    <g transform="translate(22 22) scale(0.56)">
      <MarkShapes ink="#111111" play="#e8202a" />
    </g>
  </svg>
);

export const HexBadgeWhitePreview: React.FC = () => (
  <AbsoluteFill style={{ background: '#e9e9ee', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 60 }}>
    <div style={{ width: 520, height: 480, borderRadius: 24, background: '#111216', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <HexBadgeWhite size={360} />
    </div>
    <div style={{ width: 520, height: 480, borderRadius: 24, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
      <HexBadgeWhite size={360} />
    </div>
    <div style={{ width: 640, height: 480, borderRadius: 24, background: '#111216', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <HexBadgeWhite size={150} />
      <Wordmark ink="#ffffff" ai="#ff3b47" />
    </div>
  </AbsoluteFill>
);

/** FINAL logo: white rounded tile + red hexagon outline + black H+M + red play. */
export const HexMotionLogoFinal: React.FC = () => (
  <AbsoluteFill style={{ background: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="100%" height="100%" viewBox="0 0 100 100">
      <rect x={0} y={0} width={100} height={100} rx={12} fill="#ffffff" />
      <polygon points={hexPoints(50, 50, 40)} fill="#ffffff" stroke="#ff3b47" strokeWidth={2.4} />
      <g transform="translate(29 29) scale(0.42)">
        <MarkShapes ink="#111111" play="#e8202a" />
      </g>
    </svg>
  </AbsoluteFill>
);
