import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadKaushan } from '@remotion/google-fonts/KaushanScript';
import { loadFont as loadCinzel } from '@remotion/google-fonts/Cinzel';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { WaveField } from './WaveField';

// -----------------------------------------------------------
// GOLD CONTENT CARD — a gold box you fill with your own heading
// and text. The box grows to fit whatever you type:
//   • blank lines start a new paragraph
//   • lines starting with "- " become gold-diamond bullet points
// Frame draws itself on, heading + divider appear, then the text
// comes in line by line. Exit = entry played backwards.
// -----------------------------------------------------------

const SCRIPT = loadKaushan('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily;
const SERIF = loadCinzel('normal', { weights: ['600', '700'], subsets: ['latin'] }).fontFamily;
const MONT = loadMontserrat('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;

const GOLDS = {
  Classic: ['#fff4cf', '#f2cf78', '#c8973c', '#8d6420', '#f6dd96', '#b0812f'],
  Pale: ['#ffffff', '#f6ebc8', '#d9c08a', '#9a8352', '#f3e6bd', '#b9a06a'],
  Rose: ['#fff0e8', '#f3c2a8', '#d08f72', '#8e4f3a', '#f6cdb6', '#b57359'],
  Deep: ['#ffe7a0', '#eab443', '#b97f1a', '#6e4307', '#f2c55a', '#94600f'],
} as const;
type GoldName = keyof typeof GOLDS;

export const CARD_FRAMES = ['Double Square', 'Corner Card', 'Deco Ticket', 'Glass Card', 'Top & Bottom Lines'] as const;

export const goldContentCardSchema = z.object({
  frame: z.enum(CARD_FRAMES),
  heading: z.string(),
  headingFont: z.enum(['Script', 'Serif Caps']),
  subheading: z.string().describe('Small caps line under the heading (optional)'),
  body: z.string().describe('Your text. Blank line = new paragraph. Start a line with "- " for a bullet.'),
  mediaFile: z.string().describe('Optional image/video in public/ shown at the top of the card'),
  align: z.enum(['Center', 'Left']).describe('Text alignment inside the card'),
  position: z.enum(['Center', 'Left', 'Right']),
  offsetX: z.number().min(-900).max(900).step(5),
  offsetY: z.number().min(-500).max(500).step(5),
  width: z.number().min(300).max(1700).step(10).describe('Card width (height grows to fit)'),
  headingSize: z.number().min(24).max(160).step(1),
  bodySize: z.number().min(12).max(60).step(1),
  bodyColor: zColor(),
  gold: z.enum(Object.keys(GOLDS) as [GoldName, ...GoldName[]]),
  cardFill: z.number().min(0).max(1).step(0.05).describe('Darkness inside the card'),
  background: z.enum(['Video', 'Waves', 'Solid', 'Transparent']),
  videoFile: z.string().describe('Background video in public/ (when background = Video)'),
  darken: z.number().min(0).max(0.9).step(0.05).describe('Darken the background video'),
  backgroundColor: zColor(),
  speed: z.number().min(0.3).max(3).step(0.1),
  seconds: z.number().min(2).max(30).step(0.1),
});
export type GoldContentCardProps = z.infer<typeof goldContentCardSchema>;

export const goldContentCardDefaults: GoldContentCardProps = {
  frame: 'Double Square',
  heading: 'Our Story',
  headingFont: 'Script',
  subheading: 'WHERE IT ALL BEGAN',
  body: 'Every summer evening we walk the same golden road, counting poppies and chasing the last light of the day.\n\nThese little moments are the ones we want to remember forever.',
  mediaFile: '',
  align: 'Center',
  position: 'Right',
  offsetX: 0,
  offsetY: 0,
  width: 620,
  headingSize: 78,
  bodySize: 24,
  bodyColor: '#f4ecd6',
  gold: 'Classic',
  cardFill: 0.55,
  background: 'Video',
  videoFile: 'testvideo4.mp4',
  darken: 0.35,
  backgroundColor: '#1b1546',
  speed: 1,
  seconds: 7,
};

const clampO = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const E = (t: number, a: number, b: number, e = Easing.out(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clampO, easing: e });

const goldFill = (c: readonly string[], shine: number): React.CSSProperties => ({
  backgroundImage: `linear-gradient(105deg, transparent ${shine - 9}%, rgba(255,252,238,0.9) ${shine}%, transparent ${shine + 9}%), linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 25%, ${c[2]} 48%, ${c[3]} 56%, ${c[4]} 72%, ${c[5]} 100%)`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))',
});



const hGold = (c: readonly string[]) => `linear-gradient(90deg, ${c[3]}, ${c[1]} 20%, ${c[0]} 45%, ${c[2]} 70%, ${c[4]} 90%, ${c[3]})`;
const vGold = (c: readonly string[]) => `linear-gradient(180deg, ${c[0]}, ${c[2]} 40%, ${c[4]} 70%, ${c[3]})`;
const seg = (p: number, i: number) => Math.max(0, Math.min(1, p * 4 - i));

/** rectangle outline that draws itself around the card (top → right → bottom → left) */
const EdgeFrame: React.FC<{ inset: number; p: number; w: number; c: readonly string[] }> = ({ inset, p, w, c }) =>
  p <= 0 ? null : (
    <div style={{ position: 'absolute', inset, filter: `drop-shadow(0 0 6px ${c[2]}55)` }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: w, width: `${seg(p, 0) * 100}%`, background: hGold(c) }} />
      <div style={{ position: 'absolute', right: 0, top: 0, width: w, height: `${seg(p, 1) * 100}%`, background: vGold(c) }} />
      <div style={{ position: 'absolute', right: 0, bottom: 0, height: w, width: `${seg(p, 2) * 100}%`, background: hGold(c) }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: w, height: `${seg(p, 3) * 100}%`, background: vGold(c) }} />
    </div>
  );

/** four thick L-shaped corners growing out of each corner */
const CornerMarks: React.FC<{ p: number; len: number; w: number; c: readonly string[] }> = ({ p, len, w, c }) => {
  if (p <= 0) return null;
  const L = len * p;
  const pos: React.CSSProperties[] = [
    { left: 0, top: 0 },
    { right: 0, top: 0 },
    { right: 0, bottom: 0 },
    { left: 0, bottom: 0 },
  ];
  return (
    <>
      {pos.map((ps, i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', ...ps, width: L, height: w, background: hGold(c), filter: `drop-shadow(0 0 6px ${c[2]}66)` }} />
          <div style={{ position: 'absolute', ...ps, width: w, height: L, background: vGold(c), filter: `drop-shadow(0 0 6px ${c[2]}66)` }} />
        </React.Fragment>
      ))}
    </>
  );
};

/** art-deco border with cut corners; revealed from the centre outwards */
const DecoBorder: React.FC<{ inset: number; cut: number; w: number; p: number; c: readonly string[] }> = ({ inset, cut, w, p, c }) => {
  if (p <= 0) return null;
  const n = cut;
  const poly = `polygon(${n}px 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, ${n}px 100%, 0 calc(100% - ${n}px), 0 ${n}px)`;
  const diag = n * Math.SQRT2;
  const corners: [React.CSSProperties, number][] = [
    [{ left: 0, top: n }, -45],
    [{ right: 0, top: n }, 45],
    [{ right: 0, bottom: n }, -45],
    [{ left: 0, bottom: n }, 45],
  ];
  return (
    <div style={{ position: 'absolute', inset, clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}%)`, filter: `drop-shadow(0 0 6px ${c[2]}55)` }}>
      {/* straight edges: a ring (border-box minus content-box), with the corners cut off */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: w,
          background: hGold(c),
          clipPath: poly,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* the four diagonal corner strokes */}
      {corners.map(([ps, rot], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...ps,
            width: diag,
            height: w,
            background: hGold(c),
            transformOrigin: ps.left !== undefined ? 'left center' : 'right center',
            transform: `rotate(${rot}deg)`,
          }}
        />
      ))}
    </div>
  );
};


const Media: React.FC<{ file: string }> = ({ file }) => {
  const src = /^https?:/.test(file) ? file : staticFile(file);
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(file) ? (
    <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : (
    <Video src={src} objectFit="cover" style={{ width: '100%', height: '100%' }} muted />
  );
};

export const GoldContentCard: React.FC<Partial<GoldContentCardProps>> = (props) => {
  const p = { ...goldContentCardDefaults, ...props };
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = Math.min(frame, durationInFrames - 1 - frame) * p.speed;
  const c = GOLDS[p.gold as GoldName] ?? GOLDS.Classic;
  const shine = interpolate(t, [30, 80], [-20, 130], clampO);
  const pad = Math.round(p.bodySize * 2);

  // ----- body: paragraphs and bullets -----
  const blocks: { kind: 'p' | 'li'; text: string }[] = [];
  p.body
    .split('\n')
    .map((l) => l.trim())
    .forEach((l) => {
      if (!l) blocks.push({ kind: 'p', text: '' });
      else if (/^[-•*]\s+/.test(l)) blocks.push({ kind: 'li', text: l.replace(/^[-•*]\s+/, '') });
      else {
        const last = blocks[blocks.length - 1];
        if (last && last.kind === 'p' && last.text) last.text += ' ' + l;
        else blocks.push({ kind: 'p', text: l });
      }
    });
  const visible = blocks.filter((b) => b.text);

  const frameP = E(t, 0, 26);
  const fillP = E(t, 4, 24);
  const headP = E(t, 12, 30);
  const divP = E(t, 18, 34);
  const bodyStart = 26;

  const box = (
    <div style={{ position: 'relative', width: p.width, padding: pad, boxSizing: 'border-box', textAlign: p.align === 'Center' ? 'center' : 'left' }}>
      {/* fill */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: p.frame === 'Glass Card' ? `linear-gradient(180deg, rgba(40,34,70,${0.35 + p.cardFill * 0.5}), rgba(12,9,30,${0.3 + p.cardFill * 0.6}))` : `rgba(12,9,30,${p.cardFill})`,
          borderRadius: p.frame === 'Glass Card' ? 26 : 0,
          clipPath: p.frame === 'Deco Ticket' ? 'polygon(4% 0, 96% 0, 100% 4%, 100% 96%, 96% 100%, 4% 100%, 0 96%, 0 4%)' : undefined,
          opacity: fillP,
          backdropFilter: p.frame === 'Glass Card' ? 'blur(10px)' : undefined,
        }}
      />
      {/* frame (built from plain edges so it fits any card size exactly) */}
      {p.frame === 'Double Square' && (
        <>
          <EdgeFrame inset={0} p={frameP} w={3} c={c} />
          <EdgeFrame inset={14} p={E(t, 6, 32)} w={1.5} c={c} />
        </>
      )}
      {p.frame === 'Corner Card' && (
        <>
          <CornerMarks p={frameP} len={70} w={5} c={c} />
          <EdgeFrame inset={16} p={E(t, 6, 32)} w={1.5} c={c} />
        </>
      )}
      {p.frame === 'Deco Ticket' && (
        <>
          <DecoBorder inset={0} cut={30} w={3} p={frameP} c={c} />
          <DecoBorder inset={13} cut={22} w={1.5} p={E(t, 6, 32)} c={c} />
        </>
      )}
      {p.frame === 'Top & Bottom Lines' && (
        <>
          {[0, 1].map((k) => (
            <div key={k} style={{ position: 'absolute', left: `${50 - frameP * 50}%`, width: `${frameP * 100}%`, [k ? 'bottom' : 'top']: 0, height: 3, background: hGold(c) }} />
          ))}
          {[0, 1].map((k) => (
            <div
              key={`d${k}`}
              style={{ position: 'absolute', left: 'calc(50% - 7px)', [k ? 'bottom' : 'top']: -6, width: 14, height: 14, transform: `rotate(45deg) scale(${E(t, 14, 24)})`, background: c[1] }}
            />
          ))}
        </>
      )}
      {/* content */}
      <div style={{ position: 'relative' }}>
        {p.mediaFile ? (
          <div style={{ width: '100%', aspectRatio: '16 / 9', marginBottom: pad * 0.6, border: `2px solid ${c[1]}`, overflow: 'hidden', opacity: E(t, 10, 26), transform: `scale(${0.94 + 0.06 * E(t, 10, 28)})` }}>
            <Media file={p.mediaFile} />
          </div>
        ) : null}
        <div
          style={{
            fontFamily: p.headingFont === 'Script' ? SCRIPT : SERIF,
            fontWeight: p.headingFont === 'Script' ? 400 : 700,
            fontSize: p.headingSize,
            lineHeight: 1.15,
            letterSpacing: p.headingFont === 'Script' ? 0 : '0.06em',
            ...goldFill(c, shine),
            opacity: headP,
            transform: `translateY(${(1 - headP) * 18}px)`,
            padding: '0 0.1em',
          }}
        >
          {p.heading}
        </div>
        {p.subheading ? (
          <div
            style={{
              fontFamily: MONT,
              fontWeight: 700,
              fontSize: Math.max(12, p.bodySize * 0.62),
              letterSpacing: `${interpolate(E(t, 16, 32), [0, 1], [0.5, 0.22])}em`,
              ...goldFill(c, shine),
              opacity: E(t, 16, 30),
              marginTop: 6,
            }}
          >
            {p.subheading}
          </div>
        ) : null}
        {/* divider with a small diamond */}
        <div style={{ position: 'relative', height: 14, margin: `${pad * 0.45}px ${p.align === 'Center' ? 'auto' : '0'}`, width: '46%' }}>
          <div style={{ position: 'absolute', left: p.align === 'Center' ? `${50 - divP * 50}%` : 0, top: 6, width: `${divP * 100}%`, height: 2, background: `linear-gradient(90deg, transparent, ${c[1]}, ${c[2]}, ${c[1]}, transparent)` }} />
          <div style={{ position: 'absolute', left: p.align === 'Center' ? 'calc(50% - 5px)' : 'calc(50% - 5px)', top: 2, width: 10, height: 10, transform: `rotate(45deg) scale(${E(t, 24, 32)})`, background: c[1] }} />
        </div>
        {visible.map((b, i) => {
          const a = E(t, bodyStart + i * 5, bodyStart + 14 + i * 5);
          const common: React.CSSProperties = {
            fontFamily: MONT,
            fontWeight: 400,
            fontSize: p.bodySize,
            lineHeight: 1.5,
            color: p.bodyColor,
            opacity: a,
            transform: `translateY(${(1 - a) * 14}px)`,
            filter: `blur(${(1 - a) * 4}px)`,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          };
          return b.kind === 'li' ? (
            <div key={i} style={{ ...common, display: 'flex', gap: p.bodySize * 0.6, alignItems: 'baseline', textAlign: 'left', margin: `${p.bodySize * 0.35}px 0` }}>
              <span style={{ flex: 'none', width: p.bodySize * 0.4, height: p.bodySize * 0.4, background: c[1], transform: 'rotate(45deg) translateY(-2px)', boxShadow: `0 0 6px ${c[2]}` }} />
              <span>{b.text}</span>
            </div>
          ) : (
            <div key={i} style={{ ...common, margin: `${i === 0 ? 0 : p.bodySize * 0.7}px 0 0` }}>
              {b.text}
            </div>
          );
        })}
      </div>
    </div>
  );

  const justify = p.position === 'Center' ? 'center' : p.position === 'Left' ? 'flex-start' : 'flex-end';
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {p.background === 'Video' && p.videoFile ? (
        <>
          <Media file={p.videoFile} />
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(20,12,4,${p.darken * 0.55}) 0%, rgba(10,6,2,${p.darken}) 100%)` }} />
        </>
      ) : p.background === 'Waves' ? (
        <WaveField base={p.backgroundColor} />
      ) : p.background === 'Solid' ? (
        <AbsoluteFill style={{ backgroundColor: p.backgroundColor }} />
      ) : null}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row', padding: '0 110px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: justify, transform: `translate(${p.offsetX}px, ${p.offsetY}px)` }}>{box}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const GOLD_CONTENT_PRESETS: { id: string; props: GoldContentCardProps }[] = [
  { id: 'GoldCard-Story', props: goldContentCardDefaults },
  {
    id: 'GoldCard-List',
    props: {
      ...goldContentCardDefaults,
      frame: 'Corner Card',
      heading: 'Top 3 Tips',
      subheading: 'FOR A PERFECT EVENING WALK',
      body: '- Go out in the last hour before sunset\n- Leave your phone in your pocket\n- Let the little ones lead the way',
      align: 'Left',
      position: 'Right',
      width: 640,
    },
  },
  {
    id: 'GoldCard-Quote',
    props: {
      ...goldContentCardDefaults,
      frame: 'Glass Card',
      heading: '“Slow Down”',
      subheading: '',
      body: 'The days are long, but the years are short. Hold the small hands while they still fit in yours.\n\n— A mother’s note',
      position: 'Center',
      offsetY: -120,
      width: 760,
    },
  },
  {
    id: 'GoldCard-Announcement',
    props: {
      ...goldContentCardDefaults,
      frame: 'Deco Ticket',
      heading: 'GRAND OPENING',
      headingFont: 'Serif Caps',
      headingSize: 58,
      subheading: 'SATURDAY · 7 PM · MAIN HALL',
      body: 'Join us for an evening of music, food and celebration.\n\nEveryone is welcome — bring your family and friends.',
      position: 'Center',
      background: 'Waves',
      width: 820,
    },
  },
  {
    id: 'GoldCard-Feature',
    props: {
      ...goldContentCardDefaults,
      frame: 'Top & Bottom Lines',
      heading: 'Golden Fields',
      subheading: 'LOCATION OF THE WEEK',
      body: 'A quiet gravel road between wheat and poppies — best visited in late June.',
      mediaFile: 'testvideo3.mp4',
      position: 'Left',
      background: 'Waves',
      width: 640,
      bodySize: 22,
    },
  },
];
