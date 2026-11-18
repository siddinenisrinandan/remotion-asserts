import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ICON_NAMES, INK, SceneIcon } from './SceneIcons';

// A contact sheet of every scene icon, so you can see what is available.
export const IconLibrary: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = width / 1920;
  const cols = 11;
  const cellW = 1760 / cols;
  const size = 104;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FBF5EA',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.08) 1.2px, transparent 1.2px)',
        backgroundSize: `${26 * s}px ${26 * s}px`,
        padding: `${30 * s}px ${80 * s}px`,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
      }}
    >
      {ICON_NAMES.map((name, i) => {
        const pop = spring({ frame: frame - i * 1.2, fps, config: { damping: 13, stiffness: 160 } });
        return (
          <div
            key={name}
            style={{
              width: cellW * s,
              height: 164 * s,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              transform: `scale(${pop})`,
            }}
          >
            <SceneIcon name={name} size={size * s} />
            <div
              style={{
                marginTop: 6 * s,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
                fontSize: 15 * s,
                color: INK,
              }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
