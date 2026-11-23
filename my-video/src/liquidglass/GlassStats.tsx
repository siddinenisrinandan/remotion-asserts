import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBgTrim } from './bgClock';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';

// -----------------------------------------------------------
// GLASS STATS  (glass infographic widgets)
// A frosted glass card fades/scales in, then its numbers count up and
// its charts draw in. 12 widgets from the reference pack (own designs
// and own numbers) + 5 extra ones. Backgrounds: grey studio with a
// neon colour bar sliding behind the glass (so the frost shows it),
// your video, or a dark gradient.
// -----------------------------------------------------------

const FONT = loadPoppins('normal', { weights: ['300', '400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;

export const STAT_WIDGETS = [
  'Gauge',
  'Balance sparkline',
  'Exchange',
  'Target slider',
  'Progress ring',
  'Wallet card',
  'Counter',
  'Text and number',
  'Sales bars',
  'KPI percent',
  'Visitors',
  'Funds card',
  'Donut breakdown',
  'Growth line',
  'Compare bars',
  'Star rating',
  'Step progress',
] as const;
export type StatWidget = (typeof STAT_WIDGETS)[number];

export const FUNDS_THEMES = ['Glass', 'Mint', 'Ember', 'Midnight', 'Peach', 'Ocean', 'Neon', 'Halo', 'Galaxy'] as const;

export const glassStatsSchema = z.object({
  widget: z.enum(STAT_WIDGETS),
  title: z.string().describe('Small label / title'),
  value: z.number().describe('Main number'),
  target: z.number().describe('Second number (target, max, initial …)'),
  prefix: z.string(),
  suffix: z.string(),
  decimals: z.number().int().min(0).max(3),
  note: z.string().describe('Sentence / caption text'),
  theme: z.enum(FUNDS_THEMES).describe('Funds card colour theme'),
  accentColor: zColor(),
  textColor: zColor(),
  background: z.enum(['Studio bar', 'Video', 'Dark']),
  videoFile: z.string(),
  countSeconds: z.number().min(0.3).max(6).step(0.1).describe('How long numbers take to count up'),
  scale: z.number().min(0.4).max(2).step(0.05),
  seconds: z.number().min(2).max(20).step(0.1),
});
export type GlassStatsProps = z.infer<typeof glassStatsSchema>;

export const glassStatsDefaults: GlassStatsProps = {
  widget: 'Counter',
  title: 'Orders per Day',
  value: 814,
  target: 1000,
  prefix: '',
  suffix: '',
  decimals: 0,
  note: '',
  theme: 'Glass',
  accentColor: '#3df07a',
  textColor: '#ffffff',
  background: 'Studio bar',
  videoFile: 'bg_liquid.mp4',
  countSeconds: 1.8,
  scale: 1,
  seconds: 6,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);
const easeOut = Easing.out(Easing.cubic);
const fmt = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------- shared pieces ----------
/** set by GlassStats: darker glass when sitting on a (bright) video */
const ShadeContext = React.createContext(0);

const Card: React.FC<{ w: number; h: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ w, h, style, children }) => {
  const shade = React.useContext(ShadeContext);
  return (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 34,
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(26px) saturate(1.5)',
      background: `linear-gradient(rgba(10,12,22,${shade}), rgba(10,12,22,${shade})), linear-gradient(160deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.18))`,
      textShadow: shade > 0 ? '0 2px 10px rgba(0,0,0,0.35)' : undefined,
      boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.6), inset 0 10px 22px rgba(255,255,255,0.3), inset 0 -12px 24px rgba(0,0,0,0.12), 0 24px 60px rgba(0,0,0,0.28)',
      ...style,
    }}
  >
    {children}
  </div>
  );
};

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)', fontSize: 16 }}>
    {children}
  </div>
);

const Up: React.FC<{ c: string; size?: number }> = ({ c, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M6 18L18 6M9 6h9v9" stroke={c} strokeWidth={2.6} fill="none" strokeLinecap="round" />
  </svg>
);

type Ctx = { p: GlassStatsProps; t: number; fps: number; c: (to: number, delay?: number) => number; draw: (delay?: number, len?: number) => number };

// ---------- widgets ----------
const W: Record<StatWidget, React.FC<{ x: Ctx }>> = {
  Gauge: ({ x }) => {
    const { p, c, draw } = x;
    const pr = draw(6, 40) * Math.min(1, p.value / Math.max(1, p.target));
    const R = 190;
    const arc = (a: number) => {
      const ang = Math.PI - a * Math.PI;
      return [230 + R * Math.cos(ang), 330 - R * Math.sin(ang)];
    };
    const [ex, ey] = arc(pr);
    return (
      <Card w={460} h={470}>
        <div style={{ padding: '30px 34px' }}>
          <div style={{ fontSize: 44, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {p.prefix}
            {fmt(c(p.value), p.decimals)}
            <Up c={p.textColor} />
          </div>
          <div style={{ fontSize: 18, opacity: 0.8 }}>{p.title}</div>
        </div>
        <svg width={460} height={470} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M ${230 - R} 330 A ${R} ${R} 0 0 1 ${230 + R} 330`} stroke="rgba(255,255,255,0.18)" strokeWidth={34} fill="none" strokeLinecap="round" />
          <path d={`M ${230 - R} 330 A ${R} ${R} 0 0 1 ${230 + R} 330`} stroke={p.accentColor} strokeWidth={34} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${pr} 1`} style={{ filter: `drop-shadow(0 0 10px ${p.accentColor})` }} />
          <circle cx={ex} cy={ey} r={22} fill="#fff" opacity={pr > 0.02 ? 1 : 0} />
        </svg>
        <div style={{ position: 'absolute', left: 34, bottom: 30, fontSize: 22 }}>
          {p.prefix}
          {fmt(p.target * 0.15, 0)}
          <div style={{ fontSize: 14, opacity: 0.7 }}>Start</div>
        </div>
        <div style={{ position: 'absolute', right: 34, bottom: 30, fontSize: 22, textAlign: 'right' }}>
          {p.prefix}
          {fmt(p.target, 0)}
          <div style={{ fontSize: 14, opacity: 0.7 }}>Goal</div>
        </div>
      </Card>
    );
  },
  'Balance sparkline': ({ x }) => {
    const { p, c, draw } = x;
    const d = draw(10, 40);
    const pts = [0.55, 0.62, 0.5, 0.58, 0.44, 0.5, 0.36, 0.42, 0.22, 0.3, 0.12];
    const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${30 + i * 44} ${60 + v * 160}`).join(' ');
    return (
      <Card w={520} h={330}>
        <div style={{ padding: '28px 34px' }}>
          <div style={{ fontSize: 20, opacity: 0.85 }}>{p.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 62, fontWeight: 600 }}>
              {p.prefix}
              {fmt(c(p.value), p.decimals)}
              {p.suffix}
            </div>
            <div style={{ textAlign: 'right', fontSize: 16 }}>
              <div style={{ opacity: 0.85 }}>Since last week</div>
              <Chip>+{fmt(c(13), 0)}%</Chip>
            </div>
          </div>
        </div>
        <svg width={520} height={330} style={{ position: 'absolute', left: 0, top: 110 }}>
          <path d={path} stroke="#fff" strokeWidth={4} fill="none" pathLength={1} strokeDasharray={`${d} 1`} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Card>
    );
  },
  Exchange: ({ x }) => {
    const { p, c } = x;
    return (
      <Card w={520} h={330}>
        <div style={{ padding: '26px 30px' }}>
          <div style={{ fontSize: 18, opacity: 0.85 }}>{p.title} ▾</div>
          <div style={{ marginTop: 16, borderRadius: 22, padding: '18px 22px', background: 'rgba(0,0,0,0.12)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 600 }}>
                  {p.prefix}
                  {fmt(c(p.value), p.decimals)}
                </div>
                <div style={{ fontSize: 14, opacity: 0.75 }}>Funds available</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Chip>USD ▾</Chip>
                <Chip>EUR ▾</Chip>
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 600, marginTop: 14 }}>
              {fmt(c(p.target), 1)}
              <span style={{ fontSize: 14, opacity: 0.75, marginLeft: 8 }}>You get</span>
            </div>
          </div>
        </div>
      </Card>
    );
  },
  'Target slider': ({ x }) => {
    const { p, c, draw } = x;
    const f = draw(6, 40) * Math.min(1, p.value / Math.max(1, p.target));
    return (
      <Card w={620} h={210}>
        <div style={{ padding: '26px 34px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, opacity: 0.8 }}>{p.title}</div>
            <div style={{ fontSize: 34, fontWeight: 600 }}>
              {p.prefix}
              {fmt(c(p.value), p.decimals)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 17, opacity: 0.8 }}>Target</div>
            <div style={{ fontSize: 34, fontWeight: 600 }}>
              {p.prefix}
              {fmt(p.target, 0)}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 34, right: 34, bottom: 40, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.2)' }}>
          <div style={{ width: `${f * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${p.accentColor}66, ${p.accentColor})`, boxShadow: `0 0 14px ${p.accentColor}` }} />
          <div style={{ position: 'absolute', left: `calc(${f * 100}% - 18px)`, top: -11, width: 36, height: 36, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
        </div>
      </Card>
    );
  },
  'Progress ring': ({ x }) => {
    const { p, c, draw } = x;
    const f = draw(6, 50) * Math.min(1, p.value / 100);
    return (
      <Card w={420} h={420}>
        <svg width={420} height={420} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={210} cy={210} r={150} stroke="rgba(255,255,255,0.18)" strokeWidth={28} fill="none" />
          <circle cx={210} cy={210} r={150} stroke={p.accentColor} strokeWidth={28} fill="none" pathLength={1} strokeDasharray={`${f} 1`} strokeLinecap="round" transform="rotate(-90 210 210)" style={{ filter: `drop-shadow(0 0 10px ${p.accentColor})` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 76, fontWeight: 700 }}>{fmt(c(p.value), 0)}%</div>
          <div style={{ fontSize: 20, opacity: 0.85 }}>{f >= Math.min(1, p.value / 100) - 0.001 && p.value >= 100 ? 'Done' : p.title}</div>
        </div>
      </Card>
    );
  },
  'Wallet card': ({ x }) => {
    const { p, c } = x;
    return (
      <Card w={620} h={360}>
        <div style={{ padding: '30px 38px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 500 }}>{p.title}</div>
              <div style={{ fontSize: 15, opacity: 0.7 }}>Account holder</div>
            </div>
            <div style={{ fontSize: 26, opacity: 0.8 }}>•••</div>
          </div>
          <div style={{ marginTop: 'auto', fontSize: 58, fontWeight: 600 }}>
            {p.prefix}
            {fmt(c(p.value), p.decimals)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, opacity: 0.8 }}>
            <span>Account **48210</span>
            <span>**** 7319</span>
          </div>
        </div>
      </Card>
    );
  },
  Counter: ({ x }) => {
    const { p, c } = x;
    return (
      <Card w={360} h={330}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 96, fontWeight: 500, letterSpacing: '-0.02em' }}>
            {p.prefix}
            {fmt(c(p.value), p.decimals)}
            {p.suffix}
          </div>
          <div style={{ fontSize: 22, opacity: 0.85 }}>{p.title}</div>
        </div>
      </Card>
    );
  },
  'Text and number': ({ x }) => {
    const { p, c } = x;
    return (
      <Card w={430} h={360}>
        <div style={{ padding: '30px 34px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, lineHeight: 1.3, opacity: 0.9 }}>{p.note}</div>
          <div style={{ marginTop: 'auto', fontSize: 110, fontWeight: 600, lineHeight: 1 }}>
            {fmt(c(p.value), 0)}
            <span style={{ fontSize: 30, fontWeight: 400, opacity: 0.8, marginLeft: 10 }}>{p.suffix}</span>
          </div>
        </div>
      </Card>
    );
  },
  'Sales bars': ({ x }) => {
    const { p, c, t, fps } = x;
    const bars = [0.4, 0.55, 0.35, 0.6, 0.5, 0.7, 0.45, 0.8, 0.62, 0.9, 0.55, 0.75, 0.5, 0.68];
    return (
      <Card w={640} h={340}>
        <div style={{ textAlign: 'center', paddingTop: 24 }}>
          <div style={{ fontSize: 18, opacity: 0.85 }}>{p.title}</div>
          <div style={{ fontSize: 72, fontWeight: 700 }}>
            {p.prefix}
            {fmt(c(p.value), p.decimals)}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 90, right: 90, bottom: 30, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.18)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 9, paddingBottom: 18 }}>
          {bars.map((b, i) => {
            const g = easeOut(lin(t - 10 - i * 1.5, 0, 0.5 * fps));
            return <div key={i} style={{ width: 16, height: 64 * b * g, borderRadius: 4, background: `linear-gradient(180deg, #ffffff, ${p.accentColor})` }} />;
          })}
        </div>
      </Card>
    );
  },
  'KPI percent': ({ x }) => {
    const { p, c } = x;
    return (
      <Card w={640} h={340}>
        <div style={{ padding: '30px 38px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 96, fontWeight: 400, lineHeight: 1 }}>
              {fmt(c(p.value), p.decimals)}
              {p.suffix}
            </div>
            <div style={{ fontSize: 18, fontStyle: 'italic', opacity: 0.85 }}>{p.title}</div>
          </div>
          <div style={{ fontSize: 22, marginTop: 18, maxWidth: 480 }}>{p.note}</div>
          <div style={{ position: 'absolute', right: 30, bottom: 26 }}>
            <Chip>This Month ▾</Chip>
          </div>
        </div>
      </Card>
    );
  },
  Visitors: ({ x }) => {
    const { p, c } = x;
    const small: [number, number, string, string][] = [
      [13.2, 1, '', 'CTR'],
      [586, 0, '', 'LEADS'],
      [917, 0, '', 'SALES'],
      [9.3, 1, '%', 'CONVERSION'],
    ];
    return (
      <Card w={640} h={340}>
        <div style={{ padding: '30px 38px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 72, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              {fmt(c(p.value), 0)}
              <Up c={p.accentColor} size={30} />
            </div>
            <Chip>This Month ▾</Chip>
          </div>
          <div style={{ fontSize: 26, marginTop: -6 }}>{p.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 50 }}>
            {small.map(([v, d, s, l], i) => (
              <div key={l}>
                <div style={{ fontSize: 30, fontWeight: 500 }}>
                  {fmt(c(v, 6 + i * 3), d)}
                  {s}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  },
  'Funds card': ({ x }) => {
    const { p, c } = x;
    const themes: Record<(typeof FUNDS_THEMES)[number], string | null> = {
      Glass: null,
      Mint: 'radial-gradient(circle at 85% 20%, #0b3d2e, transparent 45%), linear-gradient(135deg, #1ba86a, #0c7a5a)',
      Ember: 'radial-gradient(circle at 80% 50%, #1450ff 0%, transparent 35%), linear-gradient(120deg, #ff4b1f, #c4081e 60%, #111 100%)',
      Midnight: 'linear-gradient(135deg, #111, #000)',
      Peach: 'radial-gradient(circle at 20% 30%, #ff6a3d, transparent 45%), radial-gradient(circle at 70% 70%, #ffd0d8, transparent 50%), #fff3ee',
      Ocean: 'linear-gradient(135deg, #00c6ff, #0072ff 60%, #003a8c)',
      Neon: 'linear-gradient(120deg, #2a18ff, #b23cff 45%, #ff3d9a 70%, #5ad7ff)',
      Halo: 'radial-gradient(circle at 60% 50%, #ffffff 0%, #ffffff 22%, #7ab6ff 32%, #e8f0ff 50%)',
      Galaxy: 'radial-gradient(circle at 70% 70%, #6a3cff, transparent 50%), radial-gradient(circle at 30% 30%, #2a1060, transparent 60%), #0a0620',
    };
    const bg = themes[p.theme];
    const dark = p.theme === 'Peach' || p.theme === 'Halo';
    return (
      <Card w={620} h={340} style={bg ? { background: bg, backdropFilter: 'none' } : undefined}>
        <div style={{ position: 'absolute', right: 26, top: 22, display: 'flex', gap: 10 }}>
          <Chip>Dashboard ▾</Chip>
          <Chip>•••</Chip>
        </div>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: dark ? '#1a1a1a' : p.textColor }}>
          <div style={{ fontSize: 76, fontWeight: 600 }}>
            {p.prefix}
            {fmt(c(p.value), p.decimals)}
          </div>
          <div style={{ fontSize: 18, marginTop: 34 }}>{p.title}</div>
        </div>
      </Card>
    );
  },
  'Donut breakdown': ({ x }) => {
    const { p, draw } = x;
    const parts: [number, string, string][] = [
      [0.45, p.accentColor, 'Organic'],
      [0.3, '#5ad7ff', 'Social'],
      [0.25, '#ff4fa0', 'Ads'],
    ];
    const d = draw(6, 45);
    let acc = 0;
    return (
      <Card w={620} h={360}>
        <svg width={300} height={300} style={{ position: 'absolute', left: 24, top: 30 }}>
          {parts.map(([v, col], i) => {
            const start = acc;
            acc += v;
            const len = Math.max(0, Math.min(v, d - start));
            return <circle key={i} cx={150} cy={150} r={105} stroke={col} strokeWidth={38} fill="none" pathLength={1} strokeDasharray={`${len} 1`} strokeDashoffset={-start} transform="rotate(-90 150 150)" />;
          })}
          <text x={150} y={160} textAnchor="middle" fill={p.textColor} fontSize={36} fontWeight={600} fontFamily={FONT}>
            {p.title}
          </text>
        </svg>
        <div style={{ position: 'absolute', left: 350, top: 90, display: 'flex', flexDirection: 'column', gap: 26 }}>
          {parts.map(([v, col, l], i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: lin(x.t, 20 + i * 5, 30 + i * 5) }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: col }} />
              <span style={{ fontSize: 24 }}>{l}</span>
              <span style={{ fontSize: 24, fontWeight: 600, marginLeft: 'auto' }}>{Math.round(v * 100)}%</span>
            </div>
          ))}
        </div>
      </Card>
    );
  },
  'Growth line': ({ x }) => {
    const { p, c, draw } = x;
    const d = draw(8, 50);
    const pts = [0.85, 0.78, 0.8, 0.66, 0.7, 0.55, 0.58, 0.4, 0.44, 0.25, 0.12];
    const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${40 + i * 54} ${30 + v * 170}`).join(' ');
    const area = `${line} L ${40 + 10 * 54} 220 L 40 220 Z`;
    return (
      <Card w={660} h={380}>
        <div style={{ padding: '26px 36px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, opacity: 0.85 }}>{p.title}</div>
            <div style={{ fontSize: 50, fontWeight: 600 }}>
              {p.prefix}
              {fmt(c(p.value), p.decimals)}
              {p.suffix}
            </div>
          </div>
          <Chip>
            <Up c={p.accentColor} size={16} /> +{fmt(c(p.target), 0)}%
          </Chip>
        </div>
        <svg width={660} height={260} style={{ position: 'absolute', left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="glArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.accentColor} stopOpacity={0.5} />
              <stop offset="1" stopColor={p.accentColor} stopOpacity={0} />
            </linearGradient>
            <clipPath id="glClip">
              <rect x={0} y={0} width={40 + d * 540} height={260} />
            </clipPath>
          </defs>
          <path d={area} fill="url(#glArea)" clipPath="url(#glClip)" />
          <path d={line} stroke={p.accentColor} strokeWidth={5} fill="none" pathLength={1} strokeDasharray={`${d} 1`} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${p.accentColor})` }} />
        </svg>
      </Card>
    );
  },
  'Compare bars': ({ x }) => {
    const { p, c, draw } = x;
    const d = draw(6, 40);
    const rows: [string, number][] = [
      ['Before', p.target],
      ['After', p.value],
    ];
    const max = Math.max(p.value, p.target);
    return (
      <Card w={640} h={300}>
        <div style={{ padding: '26px 36px' }}>
          <div style={{ fontSize: 22, opacity: 0.9, marginBottom: 20 }}>{p.title}</div>
          {rows.map(([l, v], i) => (
            <div key={l} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
                <span>{l}</span>
                <span style={{ fontWeight: 600 }}>
                  {p.prefix}
                  {fmt(c(v, i * 6), p.decimals)}
                  {p.suffix}
                </span>
              </div>
              <div style={{ height: 18, borderRadius: 9, background: 'rgba(255,255,255,0.18)', marginTop: 8 }}>
                <div style={{ width: `${(v / max) * d * 100}%`, height: '100%', borderRadius: 9, background: i === 0 ? 'rgba(255,255,255,0.6)' : `linear-gradient(90deg, ${p.accentColor}99, ${p.accentColor})`, boxShadow: i === 1 ? `0 0 12px ${p.accentColor}` : undefined }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  },
  'Star rating': ({ x }) => {
    const { p, c, t, fps } = x;
    return (
      <Card w={560} h={300}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 88, fontWeight: 600, lineHeight: 1 }}>{fmt(c(p.value), 1)}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const fill = Math.max(0, Math.min(1, p.value - i));
              const s = spring({ frame: t - 12 - i * 4, fps, config: { damping: 10, stiffness: 200 } });
              return (
                <svg key={i} width={46} height={46} viewBox="0 0 24 24" style={{ transform: `scale(${s})` }}>
                  <defs>
                    <linearGradient id={`st${i}`}>
                      <stop offset={fill} stopColor="#ffd34d" />
                      <stop offset={fill} stopColor="rgba(255,255,255,0.3)" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill={`url(#st${i})`} />
                </svg>
              );
            })}
          </div>
          <div style={{ fontSize: 20, opacity: 0.85, marginTop: 12 }}>{p.title}</div>
        </div>
      </Card>
    );
  },
  'Step progress': ({ x }) => {
    const { p, t } = x;
    const steps = p.note ? p.note.split('|') : ['Plan', 'Design', 'Build', 'Launch'];
    const done = Math.min(steps.length, Math.max(0, Math.floor(p.value)));
    return (
      <Card w={720} h={250}>
        <div style={{ padding: '26px 40px' }}>
          <div style={{ fontSize: 22, opacity: 0.9 }}>{p.title}</div>
          <div style={{ position: 'relative', marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', left: 22, right: 22, top: 20, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ width: `${(Math.max(0, done - 1) / (steps.length - 1)) * 100 * easeOut(lin(t, 10, 50))}%`, height: '100%', borderRadius: 3, background: p.accentColor }} />
            </div>
            {steps.map((s, i) => {
              const on = i < done && t > 10 + (i / (steps.length - 1)) * 40;
              return (
                <div key={s} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: on ? p.accentColor : 'rgba(255,255,255,0.2)', boxShadow: on ? `0 0 14px ${p.accentColor}` : 'inset 0 0 0 1.5px rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600 }}>
                    {on ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 18, marginTop: 10 }}>{s}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  },
};

// ---------- main ----------
export const GlassStats: React.FC<Partial<GlassStatsProps>> = (props) => {
  const bgTrim = useBgTrim();
  const p = { ...glassStatsDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: Wd, height: H, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));
  const u = (Math.min(Wd, H) / 1080) * p.scale * 1.35;

  const appear = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const out = Easing.in(Easing.cubic)(lin(frame, total - 12, total));
  const vis = appear * (1 - out);

  const x: Ctx = {
    p,
    t: frame,
    fps,
    // number counting up with a slowing finish
    c: (to, delay = 0) => {
      const k = lin(frame - 8 - delay, 0, p.countSeconds * fps);
      return k >= 1 ? to : to * Easing.bezier(0.16, 1, 0.3, 1)(k);
    },
    // chart drawing progress 0..1
    draw: (delay = 0, len = 40) => Easing.inOut(Easing.cubic)(lin(frame - delay, 0, len)),
  };

  // studio background: soft grey + a neon bar sliding behind the glass
  const barX = interpolate(frame, [0, total], [-8, 8]);
  const background =
    p.background === 'Video' && p.videoFile ? (
      <>
        <Video src={staticFile(p.videoFile)} trimBefore={bgTrim} objectFit="cover" style={{ width: Wd, height: H }} muted />
      </>
    ) : p.background === 'Dark' ? (
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 30% 30%, #2a2f45, #07080d)' }} />
    ) : (
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, #c9cfd6, #8d97a3)' }}>
        <div
          style={{
            position: 'absolute',
            left: `${20 + barX}%`,
            right: `${14 - barX}%`,
            top: '50%',
            height: 70 * u,
            marginTop: -35 * u,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #36f05f, #3ae0ff 30%, #ff3d9a 60%, #ff4d2d 80%, #ffd21f)',
            filter: `blur(${2 * u}px)`,
          }}
        />
      </AbsoluteFill>
    );

  const Comp = W[p.widget];
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {background}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', fontFamily: FONT, color: p.textColor }}>
        <div style={{ transform: `scale(${u * (0.85 + 0.15 * vis)})`, opacity: Math.min(1, vis * 1.4), filter: vis < 0.98 ? `blur(${(1 - vis) * 10}px)` : undefined }}>
          <ShadeContext.Provider value={p.background === 'Video' ? 0.3 : 0}>
            <Comp x={x} />
          </ShadeContext.Provider>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- presets (own numbers / text) ----------
const S = (props: Partial<GlassStatsProps>): GlassStatsProps => ({ ...glassStatsDefaults, ...props });
export const GLASS_STATS_PRESETS: { id: string; props: GlassStatsProps }[] = [
  { id: 'GlassStats-01-Gauge', props: S({ widget: 'Gauge', title: 'Return', value: 8420, target: 10000, prefix: '$', background: 'Dark' }) },
  { id: 'GlassStats-02-Balance-Sparkline', props: S({ widget: 'Balance sparkline', title: 'Balance', value: 9.2, decimals: 1, suffix: 'K', prefix: '$', background: 'Video' }) },
  { id: 'GlassStats-03-Exchange', props: S({ widget: 'Exchange', title: 'Exchange', value: 98450.3, target: 90642.8, prefix: '$', decimals: 1, background: 'Dark' }) },
  { id: 'GlassStats-04-Target-Slider', props: S({ widget: 'Target slider', title: 'Total Sold', value: 15432, target: 30000, prefix: '$', background: 'Video' }) },
  { id: 'GlassStats-05-Progress-Ring', props: S({ widget: 'Progress ring', title: 'Complete', value: 100, background: 'Dark', accentColor: '#3df07a' }) },
  { id: 'GlassStats-06-Wallet-Card', props: S({ widget: 'Wallet card', title: 'Wallet', value: 14232.2, decimals: 1, prefix: '$', background: 'Video' }) },
  { id: 'GlassStats-07-Counter', props: S({ widget: 'Counter', title: 'Orders per Day', value: 814 }) },
  { id: 'GlassStats-08-Text-And-Number', props: S({ widget: 'Text and number', note: 'Our team has 147 people today, and we are hiring for 10 more roles.', value: 147, suffix: 'People' }) },
  { id: 'GlassStats-09-Sales-Bars', props: S({ widget: 'Sales bars', title: 'Average sales per day', value: 10000, prefix: '$' }) },
  { id: 'GlassStats-10-KPI-Percent', props: S({ widget: 'KPI percent', title: 'Results monitor', value: 96.2, decimals: 1, suffix: '%', note: 'More people clicked after our new video ads went live.' }) },
  { id: 'GlassStats-11-Visitors', props: S({ widget: 'Visitors', title: 'Visitors', value: 5748 }) },
  ...FUNDS_THEMES.map((theme, i) => ({
    id: `GlassStats-${String(12 + i).padStart(2, '0')}-Funds-${theme}`,
    props: S({ widget: 'Funds card' as const, title: 'Funds Available', value: 1000000, prefix: '$', theme }),
  })),
  { id: 'GlassStats-21-Donut-Breakdown', props: S({ widget: 'Donut breakdown', title: 'Traffic', background: 'Dark' }) },
  { id: 'GlassStats-22-Growth-Line', props: S({ widget: 'Growth line', title: 'Monthly revenue', value: 48200, target: 32, prefix: '$', background: 'Dark' }) },
  { id: 'GlassStats-23-Compare-Bars', props: S({ widget: 'Compare bars', title: 'Watch time per video', value: 7.4, target: 3.1, decimals: 1, suffix: ' min' }) },
  { id: 'GlassStats-24-Star-Rating', props: S({ widget: 'Star rating', title: 'from 2,400 reviews', value: 4.8, background: 'Video' }) },
  { id: 'GlassStats-25-Step-Progress', props: S({ widget: 'Step progress', title: 'Project status', value: 3, note: 'Plan|Design|Build|Launch', background: 'Dark' }) },
];
