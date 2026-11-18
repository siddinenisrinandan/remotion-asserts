import React from 'react';
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';

const { fontFamily: SERIF } = loadFraunces('normal', { weights: ['700', '800'], subsets: ['latin'] });
const { fontFamily: SANS } = loadArchivo('normal', { weights: ['400', '500', '700'], subsets: ['latin'] });

// -----------------------------------------------------------
// BROWSER FRAME
// A desktop browser window: traffic-light dots, URL bar, thick
// outline and hard shadow. It is EMPTY by default. Content is
// added as "blocks" (heading, text, image, video), stacked top to
// bottom, so AI can fill it by changing settings only.
// -----------------------------------------------------------

export const browserFrameSchema = z.object({
  url: z.string().describe('Text in the address bar (empty hides it)'),
  blocks: z
    .array(
      z.object({
        type: z.enum(['Heading', 'Text', 'Image', 'Video']).describe('What this block is'),
        text: z.string().describe('Heading/Text: the words'),
        highlight: z.string().describe('Heading/Text: part to highlight (must match exactly)'),
        file: z.string().describe('Image/Video: file name in public/ or a web link'),
        widthPercent: z.number().min(10).max(100).describe('Width inside the window, %'),
        textSize: z.number().min(12).max(120).describe('Heading/Text: font size'),
        appearAt: z.number().min(0).max(60).step(0.1).describe('Seconds until it appears'),
      }),
    )
    .describe('Content inside the window, top to bottom (empty = blank window)'),
  align: z.enum(['Center', 'Left']).describe('Content alignment'),
  windowWidth: z.number().min(30).max(100).describe('Window width, % of screen'),
  windowHeight: z.number().min(30).max(100).describe('Window height, % of screen'),
  entrance: z.enum(['Rise up', 'Zoom in', 'None']).describe('How the window comes in'),
  scrollAmount: z.number().min(0).max(3000).describe('Pixels the page scrolls down over the scene (0 = no scroll)'),
  scrollStartSeconds: z.number().min(0).max(60).step(0.1).describe('When scrolling starts'),
  pageColor: zColor(),
  barColor: zColor(),
  outlineColor: zColor(),
  highlightColor: zColor(),
  textColor: zColor(),
  transparentBackground: z.boolean().describe('No background (to put over a video)'),
  backgroundColor: zColor(),
  seconds: z.number().min(1).max(60).step(0.5).describe('Length'),
});

export type BrowserFrameProps = z.infer<typeof browserFrameSchema>;

export const browserFrameDefaults: BrowserFrameProps = {
  url: 'yourwebsite.com',
  blocks: [],
  align: 'Center',
  windowWidth: 72,
  windowHeight: 78,
  entrance: 'Rise up',
  scrollAmount: 0,
  scrollStartSeconds: 1.5,
  pageColor: '#FBF5EA',
  barColor: '#F1E6D2',
  outlineColor: '#1C1A17',
  highlightColor: '#FFE14D',
  textColor: '#1C1A17',
  transparentBackground: false,
  backgroundColor: '#EDE3D1',
  seconds: 5,
};

export const calculateBrowserFrameMetadata: CalculateMetadataFunction<BrowserFrameProps> = ({ props }) => ({
  durationInFrames: Math.max(15, Math.round((props.seconds ?? browserFrameDefaults.seconds) * 30)),
});

const Highlighted: React.FC<{ text: string; highlight: string; color: string; sweep: number }> = ({
  text,
  highlight,
  color,
  sweep,
}) => {
  const i = highlight ? text.indexOf(highlight) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span
        style={{
          backgroundImage: `linear-gradient(${color}, ${color})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${sweep * 100}% 50%`,
          backgroundPosition: '0 88%',
        }}
      >
        {highlight}
      </span>
      {text.slice(i + highlight.length)}
    </>
  );
};

export const BrowserFrame: React.FC<Partial<BrowserFrameProps>> = (props) => {
  const p = { ...browserFrameDefaults, ...props };
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const s = width / 1920;

  const winW = (p.windowWidth / 100) * width;
  const winH = (p.windowHeight / 100) * height;
  const barH = 64 * s;

  const enter = p.entrance === 'None' ? 1 : spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const transform =
    p.entrance === 'Rise up'
      ? `translateY(${(1 - enter) * 160 * s}px)`
      : p.entrance === 'Zoom in'
        ? `scale(${0.85 + enter * 0.15})`
        : undefined;

  const scrollStart = Math.round(p.scrollStartSeconds * fps);
  const scroll = interpolate(frame, [scrollStart, durationInFrames - 10], [0, p.scrollAmount * s], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const left = p.align === 'Left';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.transparentBackground ? 'transparent' : p.backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: winW,
          height: winH,
          background: p.pageColor,
          border: `${4 * s}px solid ${p.outlineColor}`,
          borderRadius: 22 * s,
          boxShadow: `${12 * s}px ${12 * s}px 0 ${p.outlineColor}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: Math.min(enter * 1.4, 1),
          transform,
        }}
      >
        {/* top bar */}
        <div
          style={{
            height: barH,
            flexShrink: 0,
            background: p.barColor,
            borderBottom: `${3 * s}px solid ${p.outlineColor}`,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${22 * s}px`,
            gap: 12 * s,
          }}
        >
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span
              key={c}
              style={{
                width: 18 * s,
                height: 18 * s,
                borderRadius: '50%',
                background: c,
                border: `${2 * s}px solid ${p.outlineColor}`,
              }}
            />
          ))}
          {p.url && (
            <div
              style={{
                marginLeft: 18 * s,
                padding: `${8 * s}px ${22 * s}px`,
                background: '#FFFFFF',
                border: `${2.5 * s}px solid ${p.outlineColor}`,
                borderRadius: 10 * s,
                fontFamily: SANS,
                fontWeight: 500,
                fontSize: 22 * s,
                color: p.textColor,
              }}
            >
              {p.url}
            </div>
          )}
        </div>

        {/* page */}
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              transform: `translateY(${-scroll}px)`,
              padding: `${48 * s}px ${64 * s}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: left ? 'flex-start' : 'center',
              textAlign: left ? 'left' : 'center',
              gap: 26 * s,
            }}
          >
            {p.blocks.map((b, i) => {
              const start = Math.round(b.appearAt * fps);
              const inP = spring({ frame: frame - start, fps, config: { damping: 200 }, durationInFrames: 16 });
              const sweep = interpolate(frame, [start + 10, start + 26], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const common: React.CSSProperties = {
                width: `${b.widthPercent}%`,
                opacity: inP,
                transform: `translateY(${(1 - inP) * 24 * s}px)`,
              };
              if (b.type === 'Heading' || b.type === 'Text') {
                const heading = b.type === 'Heading';
                return (
                  <div
                    key={i}
                    style={{
                      ...common,
                      fontFamily: heading ? SERIF : SANS,
                      fontWeight: heading ? 800 : 400,
                      fontSize: b.textSize * s,
                      lineHeight: heading ? 1.1 : 1.4,
                      color: p.textColor,
                    }}
                  >
                    <Highlighted text={b.text} highlight={b.highlight} color={p.highlightColor} sweep={sweep} />
                  </div>
                );
              }
              if (!b.file) return null;
              const src = /^https?:\/\//.test(b.file) ? b.file : staticFile(b.file);
              const mediaStyle: React.CSSProperties = {
                width: '100%',
                display: 'block',
                borderRadius: 16 * s,
                border: `${3 * s}px solid ${p.outlineColor}`,
                boxShadow: `${6 * s}px ${6 * s}px 0 ${p.outlineColor}`,
              };
              return (
                <div key={i} style={common}>
                  {b.type === 'Image' ? (
                    <Img src={src} style={mediaStyle} />
                  ) : (
                    <Sequence from={start} layout="none">
                      <OffthreadVideo src={src} muted style={mediaStyle} />
                    </Sequence>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
