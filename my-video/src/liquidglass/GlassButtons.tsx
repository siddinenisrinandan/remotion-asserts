import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useBgTrim } from './bgClock';
import { Video } from '@remotion/media';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';

// -----------------------------------------------------------
// GLASS BUTTONS  (liquid-glass social / UI elements)
// Every element pops out of a small glass dot, stretches into its
// shape with a soft spring, then its contents fade in. Buttons can
// "click": a quick press, a glow pulse and the label switches
// (Like → Liked, Download → Downloaded, Follow → Following …).
// Exit: contents fade, the glass shrinks back to a dot.
// Icons and avatars are drawn in code (no brand logos).
// -----------------------------------------------------------

const FONT = loadPoppins('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;

export const BUTTON_ELEMENTS = [
  'Action stack',
  'Download',
  'Channel pill',
  'Follow pill',
  'Profile card',
  'Join card',
  'Notification card',
  'Search',
  'Description',
  'Icon circle',
  'Full pack',
] as const;
export type ButtonElement = (typeof BUTTON_ELEMENTS)[number];

export const glassButtonsSchema = z.object({
  element: z.enum(BUTTON_ELEMENTS),
  name: z.string(),
  handle: z.string(),
  avatarFile: z.string().describe('Optional photo in public/ (empty = initials)'),
  appName: z.string().describe('Notification card title'),
  message: z.string().describe('Notification / description text'),
  searchText: z.string(),
  clickAt: z.number().min(0).max(20).step(0.1).describe('Seconds until buttons get clicked (0 = never)'),
  scale: z.number().min(0.3).max(3).step(0.05),
  accentColor: zColor().describe('Subscribe / active colour'),
  textColor: zColor(),
  videoFile: z.string().describe('Background video in public/ (empty = gradient)'),
  darken: z.number().min(0).max(0.8).step(0.01),
  seconds: z.number().min(2).max(20).step(0.1),
});
export type GlassButtonsProps = z.infer<typeof glassButtonsSchema>;

export const glassButtonsDefaults: GlassButtonsProps = {
  element: 'Action stack',
  name: 'Maya Rowe',
  handle: '@mayarowe',
  avatarFile: '',
  appName: 'New comment',
  message: '@studio.kite commented on your post: "Love the colours here — feels calm and cinematic."',
  searchText: 'Glass buttons for video',
  clickAt: 2.2,
  scale: 1,
  accentColor: '#e0252e',
  textColor: '#ffffff',
  videoFile: 'bg_liquid.mp4',
  darken: 0,
  seconds: 6,
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const lin = (x: number, a: number, b: number) => interpolate(x, [a, b], [0, 1], clamp);

// ---------- icons (own drawings) ----------
type IconName = 'like' | 'share' | 'save' | 'download' | 'check' | 'bell' | 'search' | 'people' | 'chat';
const Icon: React.FC<{ name: IconName; size: number; filled?: boolean; color: string }> = ({ name, size, filled, color }) => {
  const f = filled ? color : 'none';
  const st = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'like' ? <path d="M7 21H4V10h3zM7 10l4-7c1.6 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7.4A2.5 2.5 0 0 1 17.3 21H7" fill={filled ? color : color} fillOpacity={filled ? 1 : 0.95} {...st} /> : null}
      {name === 'share' ? <path d="M14 5l7 6-7 6v-3.5c-5 0-8 1.6-10 5 .6-5.5 3.6-9.5 10-10.4z" fill={color} {...st} /> : null}
      {name === 'save' ? <path d="M6 3h12v18l-6-4.5L6 21z" fill={f} {...st} /> : null}
      {name === 'download' ? (
        <g {...st} fill="none">
          <path d="M12 3v12M7 10l5 5 5-5" />
          <path d="M4 17v3h16v-3" />
        </g>
      ) : null}
      {name === 'check' ? <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" {...st} strokeWidth={2.6} /> : null}
      {name === 'bell' ? <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" fill={color} {...st} /> : null}
      {name === 'search' ? (
        <g fill="none" {...st} strokeWidth={2.4}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L21 21" />
        </g>
      ) : null}
      {name === 'people' ? (
        <g fill={color}>
          <circle cx="12" cy="7.5" r="3.2" />
          <circle cx="5.5" cy="9" r="2.4" />
          <circle cx="18.5" cy="9" r="2.4" />
          <path d="M6.5 20c0-3.6 2.4-6 5.5-6s5.5 2.4 5.5 6z" />
          <path d="M1.5 19c0-2.8 1.7-4.6 4-4.6 1 0 1.8.3 2.4.8-1.1 1.1-1.8 2.4-2 3.8z" />
          <path d="M22.5 19c0-2.8-1.7-4.6-4-4.6-1 0-1.8.3-2.4.8 1.1 1.1 1.8 2.4 2 3.8z" />
        </g>
      ) : null}
      {name === 'chat' ? <path d="M4 5h16v11H9l-5 4z" fill={color} {...st} /> : null}
    </svg>
  );
};

const Avatar: React.FC<{ name: string; file: string; size: number; round?: boolean }> = ({ name, file, size, round = true }) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  return file ? (
    <Img src={staticFile(file)} style={{ width: size, height: size, borderRadius: round ? '50%' : size * 0.12, objectFit: 'cover' }} />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: round ? '50%' : size * 0.12,
        background: 'linear-gradient(135deg, #ffb88c, #de6262 55%, #7a3cf0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: size * 0.36,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

// ---------- glass shell that pops from a dot ----------
type Anim = { grow: number; content: number; press: number; glow: number; clicked: boolean };

const Glass: React.FC<{ w: number; h: number; r: number; a: Anim; style?: React.CSSProperties; children?: React.ReactNode }> = ({ w, h, r, a, style, children }) => {
  const dot = Math.min(w, h) * 0.18;
  const gw = interpolate(a.grow, [0, 1], [dot, w]);
  const gh = interpolate(a.grow, [0, 1], [dot, h]);
  if (a.grow <= 0.001) return <div style={{ width: w, height: h, ...style }} />;
  return (
    <div style={{ width: w, height: h, position: 'relative', ...style }}>
      <div
        style={{
          position: 'absolute',
          left: (w - gw) / 2,
          top: (h - gh) / 2,
          width: gw,
          height: gh,
          borderRadius: Math.min(r, gh / 2, gw / 2),
          transform: `scale(${a.press})`,
          backdropFilter: 'blur(5px) saturate(1.3)',
          // light frosted glass: brightens what is behind it, white rim and top highlight
          background: `linear-gradient(180deg, rgba(255,255,255,${0.16 + a.glow * 0.25}), rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1))`,
          textShadow: '0 1px 2px rgba(0,0,0,0.45), 0 2px 14px rgba(0,0,0,0.45)',
          boxShadow: [
            'inset 0 0 0 1.5px rgba(255,255,255,0.55)',
            'inset 0 8px 16px rgba(255,255,255,0.28)',
            'inset 0 -10px 18px rgba(0,0,0,0.22)',
            `0 12px 30px rgba(0,0,0,0.35)`,
            a.glow > 0.01 ? `0 0 ${30 * a.glow}px rgba(255,255,255,${0.5 * a.glow})` : '0 0 0 transparent',
          ].join(', '),
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, width: w, height: h, left: (gw - w) / 2, top: (gh - h) / 2, opacity: a.content }}>{children}</div>
      </div>
    </div>
  );
};

// ---------- elements ----------
type P = GlassButtonsProps;
const ActionButton: React.FC<{ label: string; done: string; icon: IconName; a: Anim; c: string }> = ({ label, done, icon, a, c }) => (
  <Glass w={300} h={78} r={39} a={a}>
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 46px', color: c, fontSize: 34, fontWeight: 500 }}>
      <span>{a.clicked ? done : label}</span>
      <Icon name={icon} size={36} color={c} filled={a.clicked} />
    </div>
  </Glass>
);

const El: Record<Exclude<ButtonElement, 'Full pack'>, React.FC<{ p: P; a: (i: number) => Anim }>> = {
  'Action stack': ({ p, a }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <ActionButton label="Like" done="Liked" icon="like" a={a(0)} c={p.textColor} />
      <ActionButton label="Share" done="Shared" icon="share" a={a(1)} c={p.textColor} />
      <ActionButton label="Save" done="Saved" icon="save" a={a(2)} c={p.textColor} />
    </div>
  ),
  Download: ({ p, a }) => {
    const an = a(0);
    return (
      <Glass w={400} h={92} r={46} a={an}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px', color: p.textColor, fontSize: 36, fontWeight: 500 }}>
          <span>{an.clicked ? 'Downloaded' : 'Download'}</span>
          <Icon name={an.clicked ? 'check' : 'download'} size={38} color={p.textColor} />
        </div>
      </Glass>
    );
  },
  'Channel pill': ({ p, a }) => {
    const an = a(0);
    return (
      <Glass w={620} h={110} r={55} a={an}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', color: p.textColor }}>
          <Avatar name={p.name} file={p.avatarFile} size={70} />
          <div style={{ flex: 1, lineHeight: 1.15 }}>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 21, opacity: 0.8 }}>{p.handle}</div>
          </div>
          <div style={{ background: an.clicked ? 'rgba(255,255,255,0.45)' : p.accentColor, color: an.clicked ? p.textColor : '#ffffff', textShadow: 'none', borderRadius: 999, padding: '6px 20px', fontSize: 20, fontWeight: 500 }}>{an.clicked ? 'Subscribed' : 'Subscribe'}</div>
          <Icon name="bell" size={30} color={p.textColor} />
        </div>
      </Glass>
    );
  },
  'Follow pill': ({ p, a }) => {
    const an = a(0);
    return (
      <Glass w={620} h={110} r={55} a={an}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', color: p.textColor }}>
          <Avatar name={p.name} file={p.avatarFile} size={70} />
          <div style={{ flex: 1, lineHeight: 1.15 }}>
            <div style={{ fontSize: 28, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 21, opacity: 0.8 }}>{p.handle}</div>
          </div>
          <div style={{ border: '1.5px solid rgba(255,255,255,0.75)', background: an.clicked ? 'rgba(255,255,255,0.9)' : 'transparent', color: an.clicked ? '#111' : p.textColor, borderRadius: 999, padding: '4px 22px', fontSize: 20 }}>
            {an.clicked ? 'Following' : 'Follow'}
          </div>
        </div>
      </Glass>
    );
  },
  'Profile card': ({ p, a }) => {
    const an = a(0);
    return (
      <Glass w={360} h={470} r={44} a={an}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 22, color: p.textColor }}>
          <Avatar name={p.name} file={p.avatarFile} size={300} round={false} />
          <div style={{ fontSize: 30, fontWeight: 600, marginTop: 16 }}>{p.name}</div>
          <div style={{ fontSize: 20, opacity: 0.85 }}>{p.handle}</div>
          <div style={{ marginTop: 12, border: '1.5px solid rgba(255,255,255,0.75)', background: an.clicked ? 'rgba(255,255,255,0.9)' : 'transparent', color: an.clicked ? '#111' : p.textColor, borderRadius: 999, padding: '2px 24px', fontSize: 18 }}>
            {an.clicked ? 'Following' : 'Follow'}
          </div>
        </div>
      </Glass>
    );
  },
  'Join card': ({ p, a }) => {
    const an = a(0);
    return (
      <Glass w={370} h={470} r={60} a={an}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 34, color: p.textColor }}>
          <div style={{ fontSize: 26, fontWeight: 600 }}>Join With Us On</div>
          <div style={{ marginTop: 22 }}>
            <Avatar name={p.name} file={p.avatarFile} size={180} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, marginTop: 30 }}>{p.name}</div>
          <div style={{ fontSize: 19, opacity: 0.85 }}>{p.handle}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22 }}>
            <div style={{ background: an.clicked ? 'rgba(255,255,255,0.45)' : p.accentColor, color: an.clicked ? p.textColor : '#ffffff', textShadow: 'none', borderRadius: 999, padding: '4px 20px', fontSize: 18 }}>{an.clicked ? 'Subscribed' : 'Subscribe'}</div>
            <Icon name="bell" size={28} color={p.textColor} />
          </div>
        </div>
      </Glass>
    );
  },
  'Notification card': ({ p, a }) => {
    const an = a(0);
    return (
      <Glass w={830} h={210} r={50} a={an}>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', color: p.textColor }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, background: 'linear-gradient(135deg, #ff9a3c, #ff3d6e 55%, #7a3cf0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="chat" size={54} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 34, fontWeight: 600 }}>{p.appName}</span>
              <span style={{ fontSize: 22, opacity: 0.7 }}>now</span>
            </div>
            <div style={{ fontSize: 23, lineHeight: 1.3, marginTop: 6, opacity: 0.95 }}>{p.message}</div>
          </div>
        </div>
      </Glass>
    );
  },
  Search: ({ p, a }) => (
    <Glass w={720} h={96} r={48} a={a(0)}>
      <SearchContent p={p} />
    </Glass>
  ),
  Description: ({ p, a }) => (
    <Glass w={720} h={220} r={50} a={a(0)}>
      <div style={{ padding: '30px 44px', color: p.textColor }}>
        <div style={{ fontSize: 34, fontWeight: 600 }}>Description</div>
        <div style={{ fontSize: 21, lineHeight: 1.35, marginTop: 8, opacity: 0.95 }}>{p.message}</div>
      </div>
    </Glass>
  ),
  'Icon circle': ({ p, a }) => (
    <Glass w={130} h={130} r={65} a={a(0)}>
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="people" size={70} color={p.textColor} />
      </div>
    </Glass>
  ),
};

/** Search text types itself out after the bar appears. */
const SearchContent: React.FC<{ p: P }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typed = Math.max(0, Math.floor((frame - 0.8 * fps) / 2.2));
  const text = p.searchText.slice(0, typed);
  const cursor = Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', color: p.textColor, fontSize: 38 }}>
      <Icon name="search" size={42} color={p.textColor} />
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {text}
        <span style={{ opacity: cursor ? 1 : 0 }}>_</span>
      </span>
    </div>
  );
};

// ---------- main ----------
export const GlassButtons: React.FC<Partial<GlassButtonsProps>> = (props) => {
  const bgTrim = useBgTrim();
  const p = { ...glassButtonsDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const total = Math.min(durationInFrames, Math.round(p.seconds * fps));

  /** animation state for item i (items appear one after another) */
  const anim = (i: number): Anim => {
    const start = i * 4;
    const grow = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 170 } });
    const out = Easing.in(Easing.cubic)(lin(frame, total - 12 - (6 - Math.min(6, i)), total - (6 - Math.min(6, i))));
    const clickF = p.clickAt > 0 ? frame - (p.clickAt * fps + i * 6) : -1;
    const press = clickF >= 0 ? interpolate(clickF, [0, 4, 12], [1, 0.9, 1], clamp) : 1;
    const glow = clickF >= 0 ? interpolate(clickF, [0, 4, 20], [0, 1, 0], clamp) : 0;
    return {
      grow: grow * (1 - out),
      content: lin(frame - start, 8, 16) * (1 - lin(frame, total - 16, total - 8)),
      press,
      glow,
      clicked: clickF >= 4,
    };
  };

  const R = (name: Exclude<ButtonElement, 'Full pack'>, a: (i: number) => Anim) => React.createElement(El[name], { p, a });
  const content =
    p.element === 'Full pack' ? (
      // a layout of every element at once, like the pack preview
      <div style={{ position: 'relative', width: 1920, height: 1080 }}>
        <div style={{ position: 'absolute', left: 100, top: 60 }}>
          {R('Download', (i) => anim(i))}
        </div>
        <div style={{ position: 'absolute', left: 100, top: 190, transform: 'scale(1.1)', transformOrigin: '0 0' }}>
          {R('Action stack', (i) => anim(i + 1))}
        </div>
        <div style={{ position: 'absolute', left: 90, top: 640 }}>{R('Search', () => anim(4))}</div>
        <div style={{ position: 'absolute', left: 90, top: 790 }}>{R('Description', () => anim(9))}</div>
        <div style={{ position: 'absolute', left: 630, top: 70 }}>{R('Follow pill', () => anim(5))}</div>
        <div style={{ position: 'absolute', left: 630, top: 210 }}>{R('Channel pill', () => anim(6))}</div>
        <div style={{ position: 'absolute', left: 690, top: 390 }}>{R('Icon circle', () => anim(7))}</div>
        <div style={{ position: 'absolute', left: 1050, top: 340 }}>{R('Notification card', () => anim(8))}</div>
        <div style={{ position: 'absolute', left: 1060, top: 590, transform: 'scale(0.95)', transformOrigin: '0 0' }}>
          {R('Profile card', () => anim(10))}
        </div>
        <div style={{ position: 'absolute', left: 1470, top: 590, transform: 'scale(0.95)', transformOrigin: '0 0' }}>
          {R('Join card', () => anim(11))}
        </div>
      </div>
    ) : (
      R(p.element, anim)
    );

  const fit = p.element === 'Full pack' ? Math.min(W / 1920, H / 1080) : p.scale * (Math.min(W, H) / 1080);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: 'radial-gradient(ellipse at 40% 30%, #6a5a4a, #1c1814)' }}>
      {p.videoFile ? <Video src={staticFile(p.videoFile)} trimBefore={bgTrim} objectFit="cover" style={{ width: W, height: H }} muted /> : null}
      {p.darken > 0 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${p.darken})` }} /> : null}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', fontFamily: FONT }}>
        <div style={{ transform: `scale(${fit})` }}>{content}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const GLASS_BUTTON_PRESETS: { id: string; props: GlassButtonsProps }[] = BUTTON_ELEMENTS.map((element, i) => ({
  id: `GlassButtons-${String(i + 1).padStart(2, '0')}-${element.replace(/\s+/g, '-')}`,
  props: {
    ...glassButtonsDefaults,
    element,
    seconds: element === 'Full pack' ? 8 : element === 'Search' ? 6 : 5,
    clickAt: ['Action stack', 'Download', 'Channel pill', 'Follow pill', 'Profile card', 'Join card'].includes(element) ? 2.2 : 0,
    scale: element === 'Icon circle' ? 1.6 : element === 'Action stack' || element === 'Download' ? 1.4 : 1.2,
  },
}));
