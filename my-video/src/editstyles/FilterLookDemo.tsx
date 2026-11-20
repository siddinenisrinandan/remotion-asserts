import React from 'react';
import { AbsoluteFill, CalculateMetadataFunction } from 'remotion';
import { z } from 'zod';
import { FilterLayer, filterLayerDefaults, filterLayerSchema } from './FilterLayer';
import { TextBehindSubject, textBehindSubjectDefaults, TextBehindSubjectProps } from './TextBehindSubject';

// -----------------------------------------------------------
// FILTER LOOK DEMO
// Shows FilterLayer on a finished Text-Behind-Subject scene,
// with an optional before/after split so looks are easy to compare.
// -----------------------------------------------------------

const SCENES: Record<string, Partial<TextBehindSubjectProps>> = {
  'Walk (SUMMER)': {
    videoFile: 'testvideo4.mp4',
    cutoutFile: 'testvideo4_person.webm',
    text: 'SUMMER',
    textSize: 0.9,
    textPositionY: 32,
    letterSpacing: 0.04,
    appearAt: 0.4,
    dimBackground: 0.1,
    seconds: 10,
  },
  'Sitting man (TEXT)': {
    videoFile: 'testvideo2.mp4',
    cutoutFile: 'testvideo2_person.webm',
    seconds: 2.5,
  },
  'Runner (RUN)': {
    videoFile: 'testvideo3.mp4',
    cutoutFile: 'testvideo3_person.webm',
    text: 'RUN',
    textSize: 1.25,
    textPositionY: 38,
    letterSpacing: 0.04,
    appearAt: 0.3,
    dimBackground: 0.1,
    seconds: 5.9,
  },
};
const SCENE_NAMES = Object.keys(SCENES) as [string, ...string[]];

export const filterLookDemoSchema = filterLayerSchema.extend({
  scene: z.enum(SCENE_NAMES).describe('Which test scene to grade'),
  compare: z.boolean().describe('Split screen: left = original, right = with the look'),
});

export type FilterLookDemoProps = z.infer<typeof filterLookDemoSchema>;

export const filterLookDemoDefaults: FilterLookDemoProps = {
  ...filterLayerDefaults,
  scene: 'Walk (SUMMER)',
  compare: true,
};

export const calculateFilterLookDemoMetadata: CalculateMetadataFunction<FilterLookDemoProps> = ({ props }) => ({
  durationInFrames: Math.round((SCENES[props.scene]?.seconds ?? 5) * 30),
});

const Label: React.FC<{ text: string; side: 'left' | 'right' }> = ({ text, side }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 36,
      [side]: 40,
      padding: '8px 18px',
      borderRadius: 999,
      background: 'rgba(0,0,0,0.55)',
      color: 'white',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: 28,
      fontWeight: 600,
    }}
  >
    {text}
  </div>
);

export const FilterLookDemo: React.FC<Partial<FilterLookDemoProps>> = (props) => {
  const p = { ...filterLookDemoDefaults, ...props };
  const { scene, compare, ...filter } = p;
  const sceneProps = { ...textBehindSubjectDefaults, ...SCENES[scene] };

  const graded = (
    <FilterLayer {...filter}>
      <TextBehindSubject {...sceneProps} />
    </FilterLayer>
  );

  if (!compare) return graded;

  return (
    <AbsoluteFill>
      <TextBehindSubject {...sceneProps} />
      <AbsoluteFill style={{ clipPath: 'inset(0 0 0 50%)' }}>{graded}</AbsoluteFill>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 4, marginLeft: -2, background: 'white' }} />
      <Label text="Original" side="left" />
      <Label text={p.look} side="right" />
    </AbsoluteFill>
  );
};
