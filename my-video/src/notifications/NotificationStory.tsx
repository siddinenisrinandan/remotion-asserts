import React, { useId } from 'react';
import { AbsoluteFill, CalculateMetadataFunction, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadBarlowCond } from '@remotion/google-fonts/BarlowCondensed';

// -----------------------------------------------------------
// NOTIFICATION STORY
// 1. Notification cards stack up one by one: blank card → icon →
//    sender + message typed letter by letter. Each new card pushes the
//    stack up with vertical motion blur; arrivals speed up into a flood.
// 2. A phone lock screen fades in (glass clock, wallpaper).
// 3. Hard cut to a close-up of an incoming-call pill.
// 4. Cut back: notifications drop onto the lock screen, clock turns
//    solid white, list scrolls and floods.
// 5. Dissolve to an end line ("Thanks for watching").
// All icons, avatars and the wallpaper are drawn in code (no brand logos).
// -----------------------------------------------------------

const INTER = loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;
const CLOCK = loadBarlowCond('normal', { weights: ['500'], subsets: ['latin'] }).fontFamily;

export const APPS = ['Chat', 'Messenger', 'Mail', 'Inbox', 'Camera', 'Calendar', 'Notes', 'Maps', 'Assistant', 'Video', 'Pay', 'Social', 'Call'] as const;
type App = (typeof APPS)[number];

const notificationSchema = z.object({
  kind: z.enum(['App', 'Person', 'Call']).describe('App = app header card, Person = avatar card, Call = incoming call'),
  app: z.enum(APPS),
  title: z.string().describe('Sender / title'),
  message: z.string(),
  time: z.string().describe('e.g. now, 2m ago'),
});
export type Notification = z.infer<typeof notificationSchema>;

export const notificationStorySchema = z.object({
  section: z.enum(['Full story', 'Card stack only', 'Phone only']),
  notifications: z.array(notificationSchema).min(3).max(40),
  gaps: z.array(z.number().int().min(1).max(120)).min(1).describe('Frames between cards (last value repeats). Shrinking gaps = flood'),
  typingSpeed: z.number().min(0.5).max(4).step(0.1).describe('Letters per frame'),
  motionBlur: z.number().min(0).max(2).step(0.05),
  callerName: z.string(),
  clockTime: z.string(),
  dateText: z.string(),
  wallpaperTop: zColor(),
  wallpaperBottom: zColor(),
  backgroundTop: zColor(),
  backgroundBottom: zColor(),
  endText: z.string(),
  endHoldSeconds: z.number().min(0.5).max(10).step(0.5),
});
export type NotificationStoryProps = z.infer<typeof notificationStorySchema>;

const N = (kind: Notification['kind'], app: App, title: string, message: string, time = 'now'): Notification => ({ kind, app, title, message, time });

export const notificationStoryDefaults: NotificationStoryProps = {
  section: 'Full story',
  notifications: [
    N('App', 'Chat', 'Maya Rowe', 'Are you coming tonight? We saved you a seat', 'now'),
    N('Person', 'Messenger', 'Leo Brandt', "On my way, five minutes", '1m ago'),
    N('Person', 'Chat', 'Sam Okafor', 'Did you see my message?', '3m ago'),
    N('Person', 'Mail', 'Priya Nair', 'Quick question about the new project timeline and budget', '6m ago'),
    N('Person', 'Inbox', 'Northwind Studio', 'We would love to collaborate on an upcoming campaign', '9m ago'),
    N('Person', 'Messenger', 'Ava Kim', 'Call me when you can', '11m ago'),
    N('Person', 'Camera', 'Noah Hale', 'Tagged you in a photo', '13m ago'),
    N('Call', 'Call', 'Zara Quinn', 'Incoming call', 'now'),
    N('App', 'Assistant', 'Assistant', 'Your summary is ready', '15m ago'),
    N('App', 'Maps', 'Maps', 'Leave now to arrive on time', '16m ago'),
    N('App', 'Social', 'Social', '12 new followers', '18m ago'),
    N('App', 'Pay', 'Pay', 'You received $40.00', '20m ago'),
    N('App', 'Calendar', 'Calendar', 'Team meeting in 10 minutes', '21m ago'),
    N('App', 'Notes', 'Notes', 'New note shared with you', '23m ago'),
    N('App', 'Video', 'Video', 'New upload from a channel you follow', '25m ago'),
    N('Person', 'Chat', 'Maya Rowe', 'Hello??', '26m ago'),
    N('Person', 'Messenger', 'Leo Brandt', 'Where are you', '27m ago'),
    N('App', 'Mail', 'Mail', '3 unread messages', '28m ago'),
    N('App', 'Camera', 'Camera', 'Memories from last year', '29m ago'),
    N('App', 'Notes', 'Notes', 'Reminder: call mom', '30m ago'),
  ],
  // measured from the reference: three calm cards, then the rush
  gaps: [44, 56, 40, 17, 9, 13, 9, 8, 6, 8, 6, 6, 6, 4, 2],
  typingSpeed: 1.6,
  motionBlur: 1,
  callerName: 'Zara Quinn',
  clockTime: '9:41',
  dateText: 'Wed Mar 4',
  wallpaperTop: '#27386e',
  wallpaperBottom: '#8d80bd',
  backgroundTop: '#f3f3f3',
  backgroundBottom: '#c7c7c7',
  endText: 'Thanks for watching',
  endHoldSeconds: 3.5,
};

// -----------------------------------------------------------
// Timeline (frames at 30 fps, measured from the reference)
// -----------------------------------------------------------
const T = {
  phoneIn: 238,
  callCut: 306,
  callBack: 344,
  lockCards: [348, 356, 364],
  focus: 397,
  scroll: 440,
  dissolve: 541,
};

const arrivals = (count: number, gaps: number[]) => {
  const out = [0];
  for (let i = 1; i < count; i++) out.push(out[i - 1] + gaps[Math.min(i - 1, gaps.length - 1)]);
  return out;
};

export const calculateNotificationStoryMetadata: CalculateMetadataFunction<NotificationStoryProps> = ({ props }) => {
  const end = Math.round(props.endHoldSeconds * 30);
  if (props.section === 'Card stack only') {
    const arr = arrivals(props.notifications.length, props.gaps);
    return { durationInFrames: arr[arr.length - 1] + 45 };
  }
  if (props.section === 'Phone only') return { durationInFrames: T.dissolve - T.phoneIn + 12 + end };
  return { durationInFrames: T.dissolve + 12 + end };
};

// -----------------------------------------------------------
// Icons & avatars (own designs)
// -----------------------------------------------------------
const ICON_BG: Record<App, string> = {
  Chat: 'linear-gradient(180deg,#5df58a,#1fc85a)',
  Messenger: 'linear-gradient(180deg,#4fd1ff,#1a8cff)',
  Mail: 'linear-gradient(180deg,#6aa8ff,#2f62e6)',
  Inbox: 'linear-gradient(180deg,#ffffff,#eceff3)',
  Camera: 'linear-gradient(135deg,#ffb347,#ff5e62 55%,#c13584)',
  Calendar: '#ffffff',
  Notes: 'linear-gradient(180deg,#fff7d6,#ffffff)',
  Maps: 'linear-gradient(135deg,#7be495,#3fa7ff)',
  Assistant: 'linear-gradient(180deg,#2b2b2f,#111114)',
  Video: 'linear-gradient(180deg,#ff5a5a,#e01e1e)',
  Pay: 'linear-gradient(180deg,#3d8bff,#1f4fd6)',
  Social: 'linear-gradient(180deg,#222,#000)',
  Call: 'linear-gradient(180deg,#5df58a,#1fc85a)',
};

const Glyph: React.FC<{ app: App; s: number }> = ({ app, s }) => {
  const w = '#fff';
  switch (app) {
    case 'Chat':
    case 'Messenger':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M12 4c4.8 0 8.5 3 8.5 6.8S16.8 17.6 12 17.6c-.9 0-1.8-.1-2.6-.3L5.5 19.5l1-3.4C4.7 14.9 3.5 13 3.5 10.8 3.5 7 7.2 4 12 4z" fill={w} />
          {app === 'Messenger' ? <path d="M8 12l2.6-2.6 2 2 3.4-2.4-2.6 2.6-2-2z" fill="#1a8cff" /> : null}
        </svg>
      );
    case 'Mail':
    case 'Inbox':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect x="3.5" y="6" width="17" height="12" rx="2" fill={app === 'Mail' ? w : '#fff'} stroke={app === 'Inbox' ? '#e2453c' : 'none'} strokeWidth="1.5" />
          <path d="M4 7l8 6 8-6" fill="none" stroke={app === 'Mail' ? '#2f62e6' : '#e2453c'} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case 'Camera':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke={w} strokeWidth="2" />
          <circle cx="12" cy="12" r="3.8" fill="none" stroke={w} strokeWidth="2" />
          <circle cx="16.6" cy="7.4" r="1.1" fill={w} />
        </svg>
      );
    case 'Calendar':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <text x="12" y="9" textAnchor="middle" fontSize="5" fontFamily={INTER} fontWeight="700" fill="#ff3b30">
            WED
          </text>
          <text x="12" y="19.5" textAnchor="middle" fontSize="10" fontFamily={INTER} fill="#222">
            4
          </text>
        </svg>
      );
    case 'Notes':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="5" fill="#ffcc2e" />
          {[11, 14, 17].map((y) => (
            <line key={y} x1="5" x2="19" y1={y} y2={y} stroke="#d9d9d9" strokeWidth="1" />
          ))}
        </svg>
      );
    case 'Maps':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M12 4a5 5 0 0 1 5 5c0 3.8-5 10-5 10S7 12.8 7 9a5 5 0 0 1 5-5z" fill="#ff3b30" />
          <circle cx="12" cy="9" r="1.8" fill={w} />
        </svg>
      );
    case 'Assistant':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" fill={w} />
          <circle cx="18" cy="17" r="1.5" fill={w} />
        </svg>
      );
    case 'Video':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M9.5 8l7 4-7 4z" fill={w} />
        </svg>
      );
    case 'Pay':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect x="4" y="7" width="16" height="11" rx="2" fill="none" stroke={w} strokeWidth="1.8" />
          <line x1="4" x2="20" y1="10.5" y2="10.5" stroke={w} strokeWidth="1.8" />
        </svg>
      );
    case 'Social':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <circle cx="9" cy="10" r="3" fill={w} />
          <circle cx="16" cy="9" r="2.3" fill={w} opacity="0.75" />
          <path d="M3.5 18.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5z" fill={w} />
        </svg>
      );
    case 'Call':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M7 4.5l2.5 0 1.3 3.6-1.7 1.2c.9 1.9 2.4 3.4 4.3 4.3l1.2-1.7 3.6 1.3 0 2.5c0 1-.8 1.8-1.8 1.8C10.4 17.5 5.5 12.6 5.2 6.3 5.2 5.3 6 4.5 7 4.5z" fill={w} />
        </svg>
      );
    default:
      return null;
  }
};

export const AppIcon: React.FC<{ app: App; size: number }> = ({ app, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: ICON_BG[app],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: app === 'Inbox' || app === 'Calendar' || app === 'Notes' ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
      flexShrink: 0,
    }}
  >
    <Glyph app={app} s={size * 0.72} />
  </div>
);

const AVATAR_COLORS = [
  ['#ffb88c', '#de6262'],
  ['#a1c4fd', '#4a6fd1'],
  ['#d4fc79', '#41a96b'],
  ['#fbc2eb', '#a66cff'],
  ['#ffe29f', '#ff9a44'],
  ['#8fd3f4', '#3b8fb8'],
];
const Avatar: React.FC<{ name: string; size: number; badge?: App }> = ({ name, size, badge }) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  const c = AVATAR_COLORS[(name.charCodeAt(0) + name.length) % AVATAR_COLORS.length];
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${c[0]}, ${c[1]})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: size * 0.36,
          color: '#fff',
        }}
      >
        {initials}
      </div>
      {badge ? (
        <div style={{ position: 'absolute', right: -size * 0.04, bottom: -size * 0.04, borderRadius: size * 0.1, boxShadow: '0 0 0 2px #fff' }}>
          <AppIcon app={badge} size={size * 0.34} />
        </div>
      ) : null}
    </div>
  );
};

// -----------------------------------------------------------
// Typing text: typed letters solid, the last few fade in softly
// -----------------------------------------------------------
const Typed: React.FC<{ text: string; typed: number; style: React.CSSProperties }> = ({ text, typed, style }) => {
  if (typed >= text.length + 6) return <span style={style}>{text}</span>;
  return (
    <span style={style}>
      {Array.from(text).map((ch, i) => {
        const o = interpolate(typed - i, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <span key={i} style={{ opacity: o }}>
            {ch}
          </span>
        );
      })}
    </span>
  );
};

// -----------------------------------------------------------
// Notification card (designed at 700px wide; scale it for the phone)
// -----------------------------------------------------------
export const CARD_W = 700;
const LINE = 46; // chars per message line
const msgLines = (m: string) => Math.min(3, Math.max(1, Math.ceil(m.length / LINE)));
export const cardHeight = (n: Notification) => (n.kind === 'App' ? 150 + (msgLines(n.message) - 1) * 31 : 112 + (msgLines(n.message) - 1) * 31);

type CardLook = 'grey' | 'white' | 'glass' | 'frost';
const NotificationCard: React.FC<{ n: Notification; local: number; typingSpeed: number; look: CardLook }> = ({
  n,
  local,
  typingSpeed,
  look,
}) => {
  const h = cardHeight(n);
  const bg =
    look === 'white'
      ? 'rgba(252,252,252,0.98)'
      : look === 'grey'
        ? 'rgba(236,236,236,0.96)'
        : look === 'frost'
          ? 'rgba(238,240,248,0.82)'
          : 'rgba(255,255,255,0.32)';
  const ink = look === 'glass' ? 'rgba(20,20,40,0.55)' : '#151515';
  const sub = look === 'glass' ? 'rgba(20,20,40,0.45)' : '#3a3a3a';
  const iconIn = interpolate(local, [2, 6], [0.5, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) });
  const iconOpacity = interpolate(local, [2, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const nameStart = n.kind === 'App' ? 7 : 4;
  const nameTyped = (local - nameStart) * typingSpeed * 0.8;
  const msgTyped = (local - nameStart - n.title.length / (typingSpeed * 0.8)) * typingSpeed;
  const appNameOpacity = interpolate(local, [3, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const timeOpacity = interpolate(local, [14, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (n.kind === 'Call') {
    return (
      <div style={{ width: CARD_W, height: h, borderRadius: 34, background: bg, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 22 }}>
        <div style={{ opacity: iconOpacity, transform: `scale(${iconIn})` }}>
          <Avatar name={n.title} size={74} />
        </div>
        <Typed text={n.title} typed={nameTyped} style={{ fontFamily: INTER, fontWeight: 500, fontSize: 30, color: ink, flex: 1 }} />
        {['#ef3e4a', '#3ddc6a'].map((c, i) => (
          <div
            key={c}
            style={{
              width: 74,
              height: 74,
              borderRadius: '50%',
              background: c,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${interpolate(local, [3 + i * 2, 8 + i * 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) })})`,
            }}
          >
            <div style={{ transform: i === 0 ? 'rotate(135deg)' : undefined }}>
              <Glyph app="Call" s={40} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: CARD_W, height: h, borderRadius: 34, background: bg, padding: '20px 28px', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', right: 28, top: 20, fontFamily: INTER, fontSize: 21, color: look === 'glass' ? 'rgba(20,20,40,0.35)' : '#a9a9a9', opacity: timeOpacity }}>
        {n.time}
      </div>
      {n.kind === 'App' ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 52 }}>
            <div style={{ opacity: iconOpacity, transform: `scale(${iconIn})` }}>
              <AppIcon app={n.app} size={50} />
            </div>
            <span style={{ fontFamily: INTER, fontSize: 27, color: ink, opacity: appNameOpacity }}>{n.app}</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Typed text={n.title} typed={nameTyped} style={{ fontFamily: INTER, fontWeight: 600, fontSize: 27, color: ink }} />
          </div>
          <div style={{ marginTop: 2, lineHeight: '31px', maxWidth: 620 }}>
            <Typed text={n.message} typed={msgTyped} style={{ fontFamily: INTER, fontSize: 24, color: sub }} />
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ opacity: iconOpacity, transform: `scale(${iconIn})` }}>
            {n.app === 'Mail' || n.app === 'Inbox' ? <AppIcon app={n.app} size={72} /> : <Avatar name={n.title} size={72} badge={n.app} />}
          </div>
          <div style={{ paddingTop: 4, maxWidth: 540 }}>
            <Typed text={n.title} typed={nameTyped} style={{ fontFamily: INTER, fontWeight: 600, fontSize: 27, color: ink }} />
            <div style={{ lineHeight: '31px' }}>
              <Typed text={n.message} typed={msgTyped} style={{ fontFamily: INTER, fontSize: 24, color: sub }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------
// A scrolling stack of cards with vertical motion blur
// -----------------------------------------------------------
const GAP = 16;
const Stack: React.FC<{
  items: Notification[];
  times: number[];
  frame: number;
  top: number; // y where the first card sits (px, in stack space)
  bottomLimit: number; // newest card's bottom never goes below this
  typingSpeed: number;
  blurAmount: number;
  look: (i: number, newest: number) => CardLook;
  pushFrames?: number;
  /** keep the stack centred on this y while it still fits on screen */
  centerY?: number;
}> = ({ items, times, frame, top, bottomLimit, typingSpeed, blurAmount, look, pushFrames = 7, centerY }) => {
  const id = `mb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ys: number[] = [];
  let y = top;
  items.forEach((n) => {
    ys.push(y);
    y += cardHeight(n) + GAP;
  });
  const scrollFor = (i: number) => {
    const bottom = ys[i] + cardHeight(items[i]);
    const centred = centerY === undefined ? 0 : (top + bottom) / 2 - centerY;
    return Math.max(0, centred, bottom - bottomLimit);
  };
  // scroll position eases from one target to the next as each card arrives
  const scrollAt = (f: number) => {
    let s = 0;
    for (let i = 0; i < items.length; i++) {
      if (f < times[i]) break;
      const prev = i === 0 ? 0 : scrollFor(i - 1);
      const p = Easing.out(Easing.cubic)(Math.min(1, (f - times[i]) / pushFrames));
      s = prev + (scrollFor(i) - prev) * p;
    }
    return s;
  };
  const scroll = scrollAt(frame);
  const speed = Math.abs(scroll - scrollAt(frame - 1));
  const blur = Math.min(60, speed * 0.35 * blurAmount);
  const newest = times.filter((t) => t <= frame).length - 1;

  return (
    <AbsoluteFill style={{ filter: blur > 0.4 ? `url(#${id})` : undefined }}>
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={id} x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation={`0 ${blur}`} />
        </filter>
      </svg>
      {items.map((n, i) => {
        const local = frame - times[i];
        if (local < 0) return null;
        const appear = Easing.out(Easing.cubic)(Math.min(1, local / 5));
        const l = look(i, newest);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: ys[i] - scroll,
              marginLeft: -CARD_W / 2,
              opacity: appear,
              transform: `translateY(${(1 - appear) * 26}px) scale(${0.97 + 0.03 * appear})`,
              boxShadow: l === 'white' ? '0 18px 40px rgba(0,0,0,0.14)' : l === 'grey' ? '0 10px 26px rgba(0,0,0,0.07)' : '0 6px 18px rgba(0,0,0,0.08)',
              borderRadius: 34,
            }}
          >
            <NotificationCard n={n} local={local} typingSpeed={typingSpeed} look={l} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// -----------------------------------------------------------
// Phone
// -----------------------------------------------------------
const PHONE_W = 470;
const PHONE_H = 900;
const SCREEN_INSET = 11;

const StatusBar: React.FC<{ time: string }> = ({ time }) => (
  <div style={{ position: 'absolute', top: 26, left: 40, right: 36, display: 'flex', justifyContent: 'space-between', fontFamily: INTER, fontWeight: 600, fontSize: 17, color: '#fff' }}>
    <span>{time}</span>
    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[6, 9, 12, 15].map((hh) => (
        <span key={hh} style={{ width: 4, height: hh, background: '#fff', borderRadius: 1, alignSelf: 'flex-end' }} />
      ))}
      <span style={{ width: 26, height: 12, border: '1.5px solid #fff', borderRadius: 4, marginLeft: 6, position: 'relative' }}>
        <span style={{ position: 'absolute', inset: 2, right: 6, background: '#fff', borderRadius: 1 }} />
      </span>
    </span>
  </div>
);

const Wallpaper: React.FC<{ top: string; bottom: string }> = ({ top, bottom }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top}, ${bottom})` }}>
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 30% 70%, rgba(255,190,220,0.35), transparent 45%), radial-gradient(circle at 80% 25%, rgba(140,200,255,0.35), transparent 40%)' }} />
    {/* soft abstract hill shapes */}
    <svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      <path d="M0 150 C 25 120, 55 165, 100 130 L100 200 L0 200 Z" fill="rgba(20,25,60,0.35)" />
      <path d="M0 172 C 30 150, 60 185, 100 160 L100 200 L0 200 Z" fill="rgba(15,18,45,0.45)" />
    </svg>
  </AbsoluteFill>
);

// -----------------------------------------------------------
// Main
// -----------------------------------------------------------
export const NotificationStory: React.FC<NotificationStoryProps> = (p) => {
  const raw = useCurrentFrame();
  const { height: H } = useVideoConfig();
  const frame = p.section === 'Phone only' ? raw + T.phoneIn : raw;
  const u = H / 1080;
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const items = p.notifications;
  const times = arrivals(items.length, p.gaps);

  // ---------------- 1. card stack ----------------
  const stackEnd = p.section === 'Card stack only' ? Infinity : T.phoneIn + 10;
  const stackFade = p.section === 'Card stack only' ? 1 : interpolate(frame, [T.phoneIn - 4, T.phoneIn + 8], [1, 0], clamp);
  const stack =
    frame < stackEnd ? (
      <AbsoluteFill style={{ opacity: stackFade, transform: `scale(${u})`, transformOrigin: '50% 0%' }}>
        <Stack
          items={items}
          times={times}
          frame={frame}
          top={(H / u) * 0.47 - cardHeight(items[0]) / 2}
          centerY={(H / u) * 0.47}
          bottomLimit={(H / u) * 0.94}
          typingSpeed={p.typingSpeed}
          blurAmount={p.motionBlur}
          look={(i, newest) => (i === newest && i > 0 ? 'white' : 'grey')}
        />
      </AbsoluteFill>
    ) : null;

  // ---------------- 2–5. phone ----------------
  let phone: React.ReactNode = null;
  if (p.section !== 'Card stack only' && frame >= T.phoneIn) {
    const fadeIn = Easing.out(Easing.cubic)(interpolate(frame, [T.phoneIn, T.phoneIn + 40], [0, 1], clamp));
    const closeUp = frame >= T.callCut && frame < T.callBack;
    const callLocal = frame - T.callCut;
    const focused = frame >= T.focus;
    const scrolled = Easing.inOut(Easing.cubic)(interpolate(frame, [T.scroll, T.scroll + 10], [0, 1], clamp));
    const dissolve = interpolate(frame, [T.dissolve, T.dissolve + 9], [0, 1], clamp);

    // camera: close-up on the call pill, else the full phone with a gentle drift
    const cam = closeUp
      ? `translateY(${H * 0.2}px) scale(${2.25 + callLocal * 0.002})`
      : `scale(${(0.97 + 0.03 * fadeIn) * (1 + interpolate(frame, [T.callBack, T.dissolve], [0, 0.02], clamp))})`;

    // call pill (visible during close-up, collapses right after the cut back)
    const pillOpen = closeUp ? 1 : interpolate(frame, [T.callBack, T.callBack + 5], [1, 0], clamp) * (frame >= T.callBack ? 1 : 0);

    // lock-screen notifications: three drop in, then the list scrolls and floods
    const lockItems = items.slice(0, 3);
    const floodItems = items.slice(3).concat(items.slice(0, 6));
    const floodTimes = floodItems.map((_, i) => T.scroll + 10 + Math.round(i * Math.max(3, 8 - i * 0.4)));

    const clockColor = focused ? '#ffffff' : 'rgba(255,255,255,0.42)';
    const lockLook: CardLook = frame >= T.focus + 5 ? 'white' : 'glass';
    const S = 0.6; // card scale inside the phone

    phone = (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            transform: `scale(${u * 0.94}) ${cam}`,
            transformOrigin: closeUp ? '50% 0%' : '50% 50%',
            opacity: fadeIn * (1 - dissolve),
            filter: `blur(${(1 - fadeIn) * 10 + dissolve * 8}px) saturate(${0.25 + 0.75 * fadeIn})`,
            position: 'relative',
          }}
        >
          {/* frame */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 78, background: 'linear-gradient(135deg,#f2f3f7,#c9ccd6 45%,#eef0f5)', boxShadow: '0 30px 60px rgba(0,0,0,0.25)' }} />
          {/* screen */}
          <div style={{ position: 'absolute', inset: SCREEN_INSET, borderRadius: 68, overflow: 'hidden' }}>
            <Wallpaper top={p.wallpaperTop} bottom={p.wallpaperBottom} />
            <StatusBar time={p.clockTime} />
            {/* date + clock (scroll away at T.scroll) */}
            <div style={{ position: 'absolute', top: 78, width: '100%', textAlign: 'center', transform: `translateY(${-scrolled * 420}px)`, opacity: 1 - scrolled }}>
              <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 26, color: '#fff' }}>{p.dateText}</div>
              <div
                style={{
                  fontFamily: CLOCK,
                  fontWeight: 500,
                  fontSize: 250,
                  lineHeight: 0.95,
                  color: clockColor,
                  letterSpacing: '-0.02em',
                  textShadow: focused ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 0 rgba(255,255,255,0.35)',
                }}
              >
                {p.clockTime}
              </div>
            </div>
            {/* incoming-call pill */}
            {pillOpen > 0 ? (
              <div
                style={{
                  position: 'absolute',
                  top: 20,
                  left: '50%',
                  width: 430,
                  marginLeft: -215,
                  transform: `scale(${0.6 + 0.4 * pillOpen}, ${pillOpen})`,
                  transformOrigin: '50% 0%',
                  opacity: pillOpen,
                }}
              >
                <div style={{ transform: `scale(${430 / CARD_W})`, transformOrigin: '0 0', width: CARD_W }}>
                  <NotificationCard
                    n={{ kind: 'Call', app: 'Call', title: p.callerName, message: '', time: '' }}
                    local={closeUp ? callLocal : 60}
                    typingSpeed={0.9}
                    look="frost"
                  />
                </div>
              </div>
            ) : null}
            {/* notifications on the lock screen */}
            {frame >= T.callBack ? (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: CARD_W,
                  height: (PHONE_H - 2 * SCREEN_INSET) / S,
                  marginLeft: -CARD_W / 2,
                  transform: `scale(${S})`,
                  transformOrigin: '50% 0%',
                }}
              >
                {frame < T.scroll + 10 ? (
                  <Stack
                    items={lockItems}
                    times={T.lockCards}
                    frame={frame}
                    top={430 / S - scrolled * (370 / S)}
                    bottomLimit={9999}
                    typingSpeed={6}
                    blurAmount={0}
                    look={() => lockLook}
                  />
                ) : (
                  <Stack
                    items={lockItems.concat(floodItems)}
                    times={[0, 0, 0, ...floodTimes]}
                    frame={frame}
                    top={60 / S}
                    bottomLimit={(PHONE_H - 2 * SCREEN_INSET - 40) / S}
                    typingSpeed={6}
                    blurAmount={p.motionBlur * 0.6}
                    look={() => 'white'}
                    pushFrames={5}
                  />
                )}
              </div>
            ) : null}
            {/* home bar */}
            <div style={{ position: 'absolute', bottom: 12, left: '50%', width: 140, marginLeft: -70, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------- end line ----------------
  const endIn = p.section === 'Card stack only' ? 0 : interpolate(frame, [T.dissolve + 5, T.dissolve + 12], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${p.backgroundTop}, ${p.backgroundBottom})`, overflow: 'hidden' }}>
      {stack}
      {phone}
      {endIn > 0 ? (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: endIn, filter: `blur(${(1 - endIn) * 6}px)` }}>
          <div style={{ fontFamily: INTER, fontSize: 40 * u, color: '#1f1f1f', letterSpacing: '-0.01em' }}>{p.endText}</div>
          <div style={{ position: 'absolute', bottom: H * 0.05, width: 150 * u, height: 6 * u, borderRadius: 3, background: '#8f8f8f' }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
