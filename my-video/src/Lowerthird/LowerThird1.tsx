import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';

// -----------------------------------------------------------
// EDITABLE SETTINGS
// Everything here shows up as a simple control in the Studio's
// right-hand "Props" panel. The descriptions are the help text
// shown next to each control.
// -----------------------------------------------------------
export const lowerThird1Schema = z.object({
  bigText: z.string().describe('The big text on the main banner'),
  smallTabText: z.string().describe('Small text on the tab above the banner'),

  // Note: no .describe() on colours — it would hide the Studio's colour picker.
  bannerAndLineColor: zColor(),
  bigTextColor: zColor(),
  smallTabColor: zColor(),
  smallTabTextColor: zColor(),

  position: z
    .enum(['Bottom left', 'Bottom center', 'Bottom right', 'Top left', 'Top center', 'Top right'])
    .describe('Where on the screen it appears'),
  size: z.number().min(0.5).max(2).step(0.05).describe('Overall size (1 = normal)'),
  font: z
    .enum(['Impact', 'Arial Black', 'Arial', 'Georgia', 'Courier New'])
    .describe('Font of the big text'),
  showStripes: z.boolean().describe('Show the /// stripes at the end of the banner'),
});

export type LowerThird1Props = z.infer<typeof lowerThird1Schema>;

export const lowerThird1Defaults: LowerThird1Props = {
  bigText: 'HEADLINE OR SAMPLE TEXT SPACE HERE',
  smallTabText: 'TEXT SPACE GOES HERE',
  bannerAndLineColor: '#00897B',
  bigTextColor: '#FFFFFF',
  smallTabColor: '#E0E0E0',
  smallTabTextColor: '#111111',
  position: 'Bottom left',
  size: 1,
  font: 'Impact',
  showStripes: true,
};

const MARGIN_X = 80;
const MARGIN_Y = 100;

export const LowerThird1: React.FC<Partial<LowerThird1Props>> = (props) => {
  const {
    bigText,
    smallTabText,
    bannerAndLineColor,
    bigTextColor,
    smallTabColor,
    smallTabTextColor,
    position,
    size,
    font,
    showStripes,
  } = { ...lowerThird1Defaults, ...props };

  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  const isTop = position.startsWith('Top');
  const isRight = position.endsWith('right');
  const isCenter = position.endsWith('center');
  // Slide in from the side of the screen it sits on.
  const slideDirection = isRight ? 1 : -1;
  // Keep the same look at any video size (designed for 1920 wide).
  const scale = (width / 1920) * size;

  // -----------------------------------------------------------
  // INTRO ANIMATIONS (Frames 0 -> 30)
  // -----------------------------------------------------------
  const bannerIntro = spring({ frame, fps, config: { stiffness: 30, damping: 20 } });
  const badgeIntro = spring({ frame: frame - 6, fps, config: { stiffness: 40, damping: 18 } });
  const lineIntro = spring({ frame: frame - 10, fps, config: { stiffness: 35, damping: 22 } });

  // -----------------------------------------------------------
  // OUTRO ANIMATIONS (Last 30 frames)
  // -----------------------------------------------------------
  const outroStartFrame = durationInFrames - 30;
  const isOutro = frame >= outroStartFrame;

  const bannerOutro = spring({
    frame: frame - outroStartFrame,
    fps,
    config: { stiffness: 35, damping: 22 },
  });
  const badgeOutro = spring({
    frame: frame - (outroStartFrame + 4),
    fps,
    config: { stiffness: 45, damping: 20 },
  });
  const lineOutro = spring({
    frame: frame - (outroStartFrame + 8),
    fps,
    config: { stiffness: 40, damping: 22 },
  });

  // -----------------------------------------------------------
  // INTERPOLATED VALUES (Combine Intro + Outro)
  // -----------------------------------------------------------
  const bannerTranslateX = isOutro
    ? interpolate(bannerOutro, [0, 1], [0, 1100 * slideDirection])
    : interpolate(bannerIntro, [0, 1], [900 * slideDirection, 0]);

  const badgeTranslateY = isOutro
    ? interpolate(badgeOutro, [0, 1], [0, 40])
    : interpolate(badgeIntro, [0, 1], [40, 0]);

  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const badgeOpacity = isOutro
    ? interpolate(badgeOutro, [0, 0.8], [1, 0], clamp)
    : interpolate(badgeIntro, [0, 0.2], [0, 1], clamp);

  const lineScaleX = isOutro
    ? interpolate(lineOutro, [0, 1], [1, 0])
    : interpolate(lineIntro, [0, 1], [0, 1]);

  // -----------------------------------------------------------
  // PLACEMENT
  // -----------------------------------------------------------
  const align = isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start';
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: align,
    [isTop ? 'top' : 'bottom']: MARGIN_Y * (width / 1920),
    ...(isCenter
      ? { left: '50%', transform: `translateX(-50%) scale(${scale})` }
      : isRight
        ? { right: MARGIN_X * (width / 1920), transform: `scale(${scale})` }
        : { left: MARGIN_X * (width / 1920), transform: `scale(${scale})` }),
    transformOrigin: `${isTop ? 'top' : 'bottom'} ${isCenter ? 'center' : isRight ? 'right' : 'left'}`,
  };
  const sideOffset = (px: number) =>
    isCenter ? {} : isRight ? { marginRight: px } : { marginLeft: px };

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent', overflow: 'hidden' }}>
      <div style={containerStyle}>
        {/* Top Category Tab */}
        <div
          style={{
            transform: `translateY(${badgeTranslateY}px)`,
            opacity: badgeOpacity,
            backgroundColor: smallTabColor,
            clipPath: 'polygon(15px 0%, 100% 0%, calc(100% - 15px) 100%, 0% 100%)',
            padding: '8px 30px 8px 35px',
            marginBottom: -2,
            zIndex: 1,
            ...sideOffset(40),
          }}
        >
          <span
            style={{
              color: smallTabTextColor,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}
          >
            {smallTabText}
          </span>
        </div>

        {/* Main Banner */}
        <div
          style={{
            transform: `translateX(${bannerTranslateX}px)`,
            backgroundColor: bannerAndLineColor,
            clipPath: 'polygon(25px 0%, 100% 0%, calc(100% - 25px) 100%, 0% 100%)',
            padding: showStripes ? '16px 60px 16px 50px' : '16px 50px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              color: bigTextColor,
              fontFamily: `${font}, Arial Black, sans-serif`,
              fontSize: 42,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginRight: showStripes ? 40 : 0,
              whiteSpace: 'nowrap',
            }}
          >
            {bigText}
          </span>
          {showStripes && (
            <div style={{ display: 'flex', gap: 8, height: 48, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: '100%',
                    backgroundColor: bigTextColor,
                    transform: 'skewX(-25deg)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Accent Line */}
        <div
          style={{
            marginTop: 8,
            width: 450,
            height: 6,
            backgroundColor: bannerAndLineColor,
            transform: `scaleX(${lineScaleX})`,
            transformOrigin: isRight ? 'right center' : isCenter ? 'center' : 'left center',
            ...sideOffset(260),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
