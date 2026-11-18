import React from 'react';

// -----------------------------------------------------------
// SCENE ICONS
// Flat, thick-outline icons drawn in code (no image files), in the
// style of explainer infographics: black outline, flat colours,
// white walls, terracotta roofs, yellow doors.
// Every icon is drawn in a 200 x 200 box. Buildings with a sign
// accept `sign` to change the text on them.
// -----------------------------------------------------------

export const INK = '#1C1A17';
const SW = 5; // outline width
const WALL = '#FFFFFF';
const ROOF = '#D9785A';
const DOOR = '#FFD84D';
const GLASS = '#DCEEFB';
const GREEN = '#3FA34D';
const RED = '#E04B3F';
const BLUE = '#3D7BD9';
const FONT = '"Arial Black", "Arial", sans-serif';

const S = { stroke: INK, strokeWidth: SW, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

// --- drawing helpers -----------------------------------------------------

const Box: React.FC<{ x: number; y: number; w: number; h: number; fill?: string; r?: number }> = ({
  x, y, w, h, fill = WALL, r = 3,
}) => <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} {...S} />;

const Win: React.FC<{ x: number; y: number; w: number; h: number; fill?: string; cross?: boolean }> = ({
  x, y, w, h, fill = GLASS, cross = true,
}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} {...S} strokeWidth={4} />
    {cross && (
      <path d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}`} {...S} strokeWidth={3} fill="none" />
    )}
  </g>
);

const Door: React.FC<{ x: number; y: number; w: number; h: number; fill?: string; double?: boolean }> = ({
  x, y, w, h, fill = DOOR, double,
}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} {...S} />
    {double && <path d={`M${x + w / 2} ${y}V${y + h}`} {...S} strokeWidth={3} />}
  </g>
);

const Sign: React.FC<{ x: number; y: number; w: number; h: number; text: string; fill?: string; color?: string }> = ({
  x, y, w, h, text, fill = WALL, color = INK,
}) => {
  const fontSize = Math.min(h * 0.62, (w * 0.86) / Math.max(text.length * 0.68, 1));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} {...S} strokeWidth={4} />
      <text
        x={x + w / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONT}
        fontWeight={900}
        fontSize={fontSize}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
};

const Ground: React.FC<{ x1?: number; x2?: number; y?: number }> = ({ x1 = 8, x2 = 192, y = 186 }) => (
  <path d={`M${x1} ${y}H${x2}`} {...S} strokeWidth={6} />
);

const Tree: React.FC<{ x: number; y?: number; s?: number }> = ({ x, y = 186, s = 1 }) => (
  <g>
    <path d={`M${x} ${y}V${y - 26 * s}`} {...S} />
    <ellipse cx={x} cy={y - 38 * s} rx={13 * s} ry={18 * s} fill={GREEN} {...S} />
  </g>
);

// Striped roof like a tiled outlet roof.
const TiledRoof: React.FC<{ x1: number; x2: number; y: number; h: number; overhang?: number; fill?: string; tiles?: number }> = ({
  x1, x2, y, h, overhang = 10, fill = ROOF, tiles = 6,
}) => {
  const bl = x1 - overhang;
  const br = x2 + overhang;
  const tl = x1 + 6;
  const tr = x2 - 6;
  const lines = Array.from({ length: tiles - 1 }).map((_, i) => {
    const t = (i + 1) / tiles;
    return `M${tl + (tr - tl) * t} ${y - h}L${bl + (br - bl) * t} ${y}`;
  });
  return (
    <g>
      <path d={`M${bl} ${y}L${tl} ${y - h}H${tr}L${br} ${y}Z`} fill={fill} {...S} />
      <path d={lines.join('')} {...S} strokeWidth={3.5} fill="none" />
    </g>
  );
};

// Striped awning with scalloped edge.
const Awning: React.FC<{ x: number; y: number; w: number; h: number; a: string; b: string; n?: number }> = ({
  x, y, w, h, a, b, n = 6,
}) => {
  const sw = w / n;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <path
          key={i}
          d={`M${x + i * sw} ${y}H${x + (i + 1) * sw}V${y + h}A${sw / 2} ${sw / 2.4} 0 0 1 ${x + i * sw} ${y + h}Z`}
          fill={i % 2 ? b : a}
          {...S}
          strokeWidth={3.5}
        />
      ))}
    </g>
  );
};

// --- icons ---------------------------------------------------------------

type IconProps = { sign?: string };

const School: React.FC<IconProps> = ({ sign = 'SCHOOL' }) => (
  <g>
    <Box x={18} y={98} w={56} h={88} fill="#FFE7A3" />
    <Box x={126} y={98} w={56} h={88} fill="#FFE7A3" />
    <path d="M12 100L26 80H74V100Z M188 100L174 80H126V100Z" fill={RED} {...S} />
    <Box x={70} y={72} w={60} h={114} fill="#FFE7A3" />
    <path d="M62 76L100 42L138 76Z" fill={RED} {...S} />
    <path d="M100 42V12" {...S} />
    <path d="M100 13H124L118 20L124 27H100" fill={BLUE} {...S} strokeWidth={4} />
    <circle cx={100} cy={64} r={10} fill={WALL} {...S} strokeWidth={4} />
    <path d="M100 58V64H105" {...S} strokeWidth={3} fill="none" />
    <Sign x={74} y={86} w={52} h={16} text={sign} />
    <Win x={26} y={108} w={18} h={20} />
    <Win x={48} y={108} w={18} h={20} />
    <Win x={26} y={144} w={18} h={20} />
    <Win x={48} y={144} w={18} h={20} />
    <Win x={134} y={108} w={18} h={20} />
    <Win x={156} y={108} w={18} h={20} />
    <Win x={134} y={144} w={18} h={20} />
    <Win x={156} y={144} w={18} h={20} />
    <Door x={86} y={142} w={28} h={44} fill={BLUE} double />
    <Ground />
  </g>
);

const Office: React.FC<IconProps> = ({ sign = 'OFFICE' }) => (
  <g>
    <Box x={24} y={92} w={36} h={94} fill="#47C1C9" />
    <Box x={140} y={92} w={36} h={94} fill="#47C1C9" />
    <path d="M18 94L28 82H60V94Z M182 94L172 82H140V94Z" fill="#F07A3A" {...S} />
    <Box x={56} y={58} w={88} h={128} fill="#47C1C9" />
    <Box x={66} y={30} w={68} h={28} fill="#2F6E8C" />
    <path d="M60 32H140L134 24H66Z" fill="#F07A3A" {...S} />
    <Box x={48} y={56} w={104} h={10} fill="#F07A3A" r={2} />
    <Win x={66} y={74} w={68} h={50} />
    <path d="M83 74V124M100 74V124M117 74V124" {...S} strokeWidth={3} />
    <Win x={30} y={104} w={24} h={60} />
    <Win x={146} y={104} w={24} h={60} />
    <Sign x={70} y={130} w={60} h={14} text={sign} />
    <Door x={84} y={150} w={32} h={36} fill="#F8C38E" double />
    <Ground />
  </g>
);

const HouseClassic: React.FC<IconProps> = () => (
  <g>
    <Box x={40} y={92} w={120} h={94} />
    <TiledRoof x1={40} x2={160} y={94} h={36} />
    <Win x={52} y={110} w={30} h={28} />
    <Win x={118} y={110} w={30} h={28} />
    <Door x={88} y={136} w={24} h={50} />
    <Ground />
  </g>
);

const HouseCottage: React.FC<IconProps> = () => (
  <g>
    <Box x={30} y={100} w={100} h={86} fill="#F4A95A" />
    <Box x={120} y={112} w={52} h={74} fill="#F4A95A" />
    <path d="M114 114L122 92H176L182 114Z" fill="#7A4B32" {...S} />
    <Box x={92} y={36} w={14} h={30} fill="#F4A95A" r={1} />
    <path d="M20 104L80 52L140 104Z" fill="#7A4B32" {...S} />
    <path d="M48 104L80 76L112 104" fill="none" stroke={WALL} strokeWidth={6} strokeLinejoin="round" />
    <Win x={70} y={86} w={18} h={16} />
    <Door x={70} y={138} w={22} h={48} fill="#8B5A3C" />
    <Win x={40} y={130} w={20} h={22} />
    <Win x={134} y={128} w={30} h={24} />
    <Ground />
  </g>
);

const HouseTwoStorey: React.FC<IconProps> = () => (
  <g>
    <Box x={46} y={70} w={108} h={116} />
    <path d="M38 72L100 30L162 72Z" fill="#5B8DEF" {...S} />
    <path d="M46 128H154" {...S} strokeWidth={4} />
    <Win x={58} y={82} w={28} h={30} />
    <Win x={114} y={82} w={28} h={30} />
    <Win x={58} y={142} w={28} h={28} />
    <Door x={112} y={140} w={30} h={46} fill={RED} />
    <circle cx={100} cy={54} r={7} fill={GLASS} {...S} strokeWidth={3.5} />
    <Ground />
  </g>
);

const HouseModern: React.FC<IconProps> = () => (
  <g>
    <Box x={26} y={104} w={92} h={82} fill="#EDE6DA" />
    <Box x={100} y={70} w={76} h={116} fill="#3C3A38" />
    <Box x={20} y={96} w={104} h={10} fill="#3C3A38" r={2} />
    <Box x={94} y={62} w={88} h={10} fill="#3C3A38" r={2} />
    <Win x={110} y={84} w={56} h={40} cross={false} />
    <path d="M128 84V124M148 84V124" {...S} strokeWidth={3} />
    <Win x={34} y={116} w={46} h={52} cross={false} />
    <Door x={128} y={140} w={26} h={46} fill={DOOR} />
    <Tree x={192 - 8} s={0.8} />
    <Ground />
  </g>
);

const Restaurant: React.FC<IconProps> = ({ sign = 'RESTAURANT' }) => (
  <g>
    <path d="M30 66H170L176 86H24Z" fill={RED} {...S} />
    <Box x={34} y={84} w={132} h={102} fill="#F98B2B" />
    <Box x={22} y={80} w={156} h={10} fill="#8A3B22" r={2} />
    <path d="M70 80V64Q100 44 130 64V80" fill="#F8C9A0" {...S} strokeWidth={4} />
    <Sign x={52} y={64} w={96} h={18} text={sign} fill="#F8C9A0" color="#8A3B22" />
    <Awning x={40} y={100} w={76} h={14} a={RED} b={DOOR} n={6} />
    <Win x={44} y={120} w={68} h={46} cross={false} />
    <path d="M58 158L82 128M74 162L96 134" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
    <Door x={124} y={110} w={34} h={76} fill={RED} />
    <Win x={130} y={118} w={22} h={18} cross={false} />
    <Ground />
  </g>
);

const Mall: React.FC<IconProps> = ({ sign = 'MALL' }) => (
  <g>
    <path d="M10 186V98L36 88V186Z M190 186V98L164 88V186Z" fill="#2E5B7A" {...S} />
    <Box x={30} y={58} w={140} h={128} fill="#52E0F2" />
    <Box x={44} y={48} w={14} h={138} fill="#EA7187" r={1} />
    <Box x={142} y={48} w={14} h={138} fill="#EA7187" r={1} />
    <Box x={70} y={50} w={60} h={50} fill="#EA7187" />
    <text x={100} y={78} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={Math.min(20, 52 / Math.max(sign.length * 0.62, 1))} fill="#FFFFFF">
      {sign}
    </text>
    <Box x={30} y={100} w={140} h={14} fill="#A93244" r={1} />
    <Box x={78} y={126} w={44} h={60} fill="#7DEAF6" r={1} />
    <path d="M89 126V186M100 126V186M111 126V186M78 150H122" {...S} strokeWidth={3} />
    <Tree x={18} s={0.75} />
    <Tree x={182} s={0.75} />
    <Ground />
  </g>
);

const Cinema: React.FC<IconProps> = ({ sign = 'CINEMA' }) => (
  <g>
    <Box x={42} y={34} w={116} h={152} fill="#C93C3C" />
    <Box x={36} y={28} w={128} h={10} fill="#8F2626" r={2} />
    <Win x={58} y={48} w={84} h={34} fill="#4A4655" cross={false} />
    <path d="M75 48V82M92 48V82M109 48V82M126 48V82" stroke="#D9B26A" strokeWidth={3} />
    <Box x={34} y={92} w={132} h={26} fill="#FFE9A8" />
    {Array.from({ length: 12 }).map((_, i) => (
      <g key={i}>
        <circle cx={40 + i * 10.9} cy={92} r={2.2} fill={DOOR} stroke={INK} strokeWidth={1.2} />
        <circle cx={40 + i * 10.9} cy={118} r={2.2} fill={DOOR} stroke={INK} strokeWidth={1.2} />
      </g>
    ))}
    <text x={100} y={105} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={Math.min(17, 110 / Math.max(sign.length * 0.68, 1))} fill="#8F2626">
      {sign}
    </text>
    <Box x={50} y={128} w={30} h={42} fill="#FFF4E0" />
    <path d="M57 170V150A8 8 0 0 1 73 150V170Z" fill="#8F2626" {...S} strokeWidth={3} />
    <Box x={120} y={128} w={30} h={42} fill="#FFF4E0" />
    <path d="M127 170V150A8 8 0 0 1 143 150V170Z" fill="#8F2626" {...S} strokeWidth={3} />
    <Door x={86} y={132} w={28} h={54} fill="#8B5A3C" double />
    <Box x={30} y={182} w={140} h={6} fill="#D9A55C" r={1} />
    <Ground />
  </g>
);

const Stadium: React.FC<IconProps> = () => (
  <g>
    <ellipse cx={100} cy={136} rx={90} ry={44} fill="#9EC3E6" {...S} />
    <ellipse cx={100} cy={122} rx={86} ry={40} fill={WALL} {...S} />
    <ellipse cx={100} cy={122} rx={72} ry={31} fill="#2F5E9E" {...S} />
    <path d="M30 112Q100 70 170 112" fill="none" stroke="#F07A7A" strokeWidth={10} strokeLinecap="round" />
    <rect x={56} y={106} width={88} height={32} rx={8} fill="#5CCB5F" {...S} strokeWidth={4} />
    <path d="M100 106V138" stroke="#FFFFFF" strokeWidth={2.5} />
    <circle cx={100} cy={122} r={7} fill="none" stroke="#FFFFFF" strokeWidth={2.5} />
    {[24, 176].map((x) => (
      <g key={x}>
        <path d={`M${x} 118V76`} {...S} strokeWidth={4} />
        <rect x={x - 8} y={66} width={16} height={11} rx={2} fill={WALL} {...S} strokeWidth={3.5} />
      </g>
    ))}
  </g>
);

const Circus: React.FC<IconProps> = () => (
  <g>
    <ellipse cx={100} cy={180} rx={86} ry={10} fill={GREEN} {...S} />
    <rect x={44} y={98} width={112} height={80} fill={WALL} {...S} />
    {[0, 2, 4, 6].map((i) => (
      <rect key={i} x={44 + i * 16} y={98} width={16} height={80} fill={RED} stroke="none" />
    ))}
    <rect x={44} y={98} width={112} height={80} fill="none" {...S} />
    <path d="M84 178L100 128L116 178Z" fill="#3B2A22" {...S} strokeWidth={4} />
    <path d="M36 102L100 34L164 102Z" fill={WALL} {...S} />
    {[0, 2, 4, 6].map((i) => (
      <path key={i} d={`M100 34L${36 + i * 16} 102H${52 + i * 16}Z`} fill={RED} stroke="none" />
    ))}
    <path d="M36 102L100 34L164 102Z" fill="none" {...S} />
    {Array.from({ length: 8 }).map((_, i) => (
      <path
        key={i}
        d={`M${36 + i * 16} 102A8 8 0 0 0 ${52 + i * 16} 102`}
        fill={i % 2 ? '#7B3FA0' : DOOR}
        {...S}
        strokeWidth={3}
      />
    ))}
    <path d="M100 34V12" {...S} strokeWidth={4} />
    <path d="M100 12H122L114 18L122 24H100" fill={RED} {...S} strokeWidth={3.5} />
  </g>
);

const GlassOffice: React.FC<IconProps> = ({ sign = 'HQ' }) => (
  <g>
    <Box x={28} y={44} w={36} h={142} fill="#BFE3F5" />
    <path d="M60 186V62L122 48L176 70V186Z" fill="#4AA3D9" {...S} />
    <path d="M122 48V186" {...S} strokeWidth={4} />
    <path d="M60 92L122 82L176 96M60 124L122 116L176 124M60 156L122 150L176 154M80 58V186M101 53V186M140 56V186M158 63V186" {...S} strokeWidth={3} fill="none" />
    <path d="M70 72L90 66" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
    <Sign x={84} y={160} w={34} h={14} text={sign} fill="#F2E3C9" />
    <Box x={82} y={174} w={38} h={12} fill="#F2E3C9" r={1} />
    <Ground />
  </g>
);

const Police: React.FC<IconProps> = ({ sign = 'POLICE' }) => (
  <g>
    <Box x={26} y={60} w={148} h={126} />
    <Box x={18} y={52} w={164} h={10} fill="#2D3A55" r={2} />
    <Box x={62} y={36} w={76} h={18} fill="#2D3A55" r={2} />
    <path d="M100 66L112 70V80Q112 90 100 94Q88 90 88 80V70Z" fill={DOOR} {...S} strokeWidth={4} />
    <path d="M100 74L102 79H107L103 82L104.5 87L100 84L95.5 87L97 82L93 79H98Z" fill={INK} />
    <Sign x={64} y={100} w={72} h={18} text={sign} fill="#2D3A55" color="#FFFFFF" />
    <Win x={36} y={72} w={22} h={26} fill="#3B5A8C" />
    <Win x={142} y={72} w={22} h={26} fill="#3B5A8C" />
    <Win x={36} y={128} w={22} h={26} fill="#3B5A8C" />
    <Win x={142} y={128} w={22} h={26} fill="#3B5A8C" />
    <Door x={84} y={130} w={32} h={56} fill="#C77B3D" double />
    <Ground />
  </g>
);

const Bank: React.FC<IconProps> = ({ sign = 'BANK' }) => (
  <g>
    <path d="M22 72L100 30L178 72Z" fill="#E4E7EA" {...S} />
    <Box x={26} y={72} w={148} h={18} fill="#D3D8DD" r={1} />
    <text x={100} y={81} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={Math.min(13, 120 / Math.max(sign.length * 0.7, 1))} fill={INK}>
      {sign}
    </text>
    <Box x={34} y={90} w={132} h={78} fill="#9AA3AC" r={1} />
    {[40, 72, 116, 148].map((x) => (
      <Box key={x} x={x} y={90} w={14} h={78} fill="#EEF0F2" r={1} />
    ))}
    <path d="M90 168V140A10 10 0 0 1 110 140V168Z" fill="#7A4A2E" {...S} strokeWidth={4} />
    <Box x={26} y={166} w={148} h={9} fill="#D3D8DD" r={1} />
    <Box x={18} y={175} w={164} h={11} fill="#C2C8CE" r={1} />
  </g>
);

const Airport: React.FC<IconProps> = ({ sign = 'AIRPORT' }) => (
  <g>
    <Box x={36} y={80} w={14} h={106} fill={WALL} r={1} />
    <path d="M22 50H64L56 82H30Z" fill="#7FD0E8" {...S} />
    <path d="M34 50V82M43 50V82M52 50V82" {...S} strokeWidth={3} />
    <path d="M43 50V36" {...S} strokeWidth={4} />
    <Box x={70} y={118} w={118} h={68} fill="#7FD0E8" />
    <Box x={64} y={110} w={130} h={10} fill={RED} r={2} />
    <path d="M90 118V186M110 118V186M130 118V186M150 118V186M170 118V186" {...S} strokeWidth={3} />
    <Sign x={96} y={128} w={66} h={16} text={sign} />
    <path d="M110 66L180 44Q190 42 188 50L120 74Z" fill={WALL} {...S} strokeWidth={4} />
    <path d="M150 56L136 34H146L166 52Z M128 66L120 82H128L140 64Z" fill={RED} {...S} strokeWidth={3.5} />
    <Ground />
  </g>
);

const BusStation: React.FC<IconProps> = ({ sign = 'BUS STATION' }) => (
  <g>
    <Box x={14} y={40} w={172} h={22} fill="#7F8EA3" />
    <text x={100} y={51} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={Math.min(14, 150 / Math.max(sign.length * 0.7, 1))} fill="#FFFFFF">
      {sign}
    </text>
    <Box x={24} y={62} w={10} h={124} fill="#A9B4C2" r={1} />
    <Box x={166} y={62} w={10} h={124} fill="#A9B4C2" r={1} />
    <rect x={38} y={104} width={124} height={66} rx={12} fill="#F4A12F" {...S} />
    <path d="M38 132H162" {...S} strokeWidth={3} />
    {[46, 76, 106].map((x) => (
      <rect key={x} x={x} y={112} width={24} height={16} rx={3} fill="#3B3F4C" {...S} strokeWidth={3} />
    ))}
    <rect x={136} y={112} width={20} height={34} rx={3} fill="#3B3F4C" {...S} strokeWidth={3} />
    <circle cx={64} cy={172} r={10} fill="#3B3F4C" {...S} strokeWidth={4} />
    <circle cx={136} cy={172} r={10} fill="#3B3F4C" {...S} strokeWidth={4} />
    <Ground />
  </g>
);

const BusStop: React.FC<IconProps> = () => (
  <g>
    <path d="M60 60H186L180 72H54Z" fill="#E08A4A" {...S} />
    <Box x={72} y={72} w={8} h={114} fill="#3B3F4C" r={1} />
    <Box x={170} y={72} w={8} h={114} fill="#3B3F4C" r={1} />
    <Box x={80} y={78} w={90} h={84} fill={GLASS} r={1} />
    <path d="M96 140L130 96M112 146L144 104" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" />
    <Box x={88} y={160} w={74} h={8} fill="#8B5A3C" r={1} />
    <path d="M34 186V84" {...S} />
    <rect x={20} y={58} width={28} height={30} rx={4} fill={BLUE} {...S} strokeWidth={4} />
    <rect x={26} y={64} width={16} height={13} rx={2} fill="#FFFFFF" />
    <circle cx={29} cy={80} r={1.8} fill="#FFFFFF" />
    <circle cx={39} cy={80} r={1.8} fill="#FFFFFF" />
    <Ground />
  </g>
);

const RailwayStation: React.FC<IconProps> = ({ sign = 'STATION' }) => (
  <g>
    <Box x={46} y={92} w={108} h={64} fill="#FFF3D6" />
    <Box x={18} y={110} w={30} h={46} fill="#FFF3D6" />
    <Box x={152} y={110} w={30} h={46} fill="#FFF3D6" />
    <path d="M12 112L22 100H48V112Z M188 112L178 100H152V112Z" fill="#D9622E" {...S} strokeWidth={4} />
    <path d="M38 94L52 74H148L162 94Z" fill="#D9622E" {...S} />
    <circle cx={100} cy={60} r={13} fill={BLUE} {...S} strokeWidth={4} />
    <rect x={93} y={53} width={14} height={12} rx={3} fill="#FFFFFF" />
    <Sign x={58} y={98} w={84} h={16} text={sign} fill={BLUE} color="#FFFFFF" />
    <Door x={88} y={120} w={24} h={36} fill={GLASS} double />
    <Win x={58} y={122} w={20} h={20} />
    <Win x={122} y={122} w={20} h={20} />
    <Box x={8} y={158} w={184} h={6} fill="#B9B2A6" r={1} />
    <path d="M8 172H192M8 182H192" {...S} strokeWidth={4} />
    {Array.from({ length: 10 }).map((_, i) => (
      <path key={i} d={`M${16 + i * 19} 168V186`} stroke="#8B5A3C" strokeWidth={4} strokeLinecap="round" />
    ))}
  </g>
);

const Market: React.FC<IconProps> = ({ sign = 'MARKET' }) => (
  <g>
    <Box x={30} y={100} w={140} h={84} fill="#FFD98A" />
    <path d="M22 104L36 88H164L178 104Z" fill="#A9741F" {...S} strokeWidth={4} />
    <Sign x={64} y={52} w={72} h={22} text={sign} fill="#FFD98A" color="#6B3410" />
    <Awning x={52} y={74} w={96} h={18} a="#E9E9E9" b={RED} n={6} />
    <Win x={62} y={108} w={76} h={76} fill="#8CB8F0" cross={false} />
    <path d="M100 108V184" {...S} strokeWidth={3.5} />
    <Win x={36} y={116} w={20} h={36} fill="#8CB8F0" cross={false} />
    <Win x={144} y={116} w={20} h={36} fill="#8CB8F0" cross={false} />
    {[16, 184].map((x) => (
      <g key={x}>
        <path d={`M${x} 186V132`} {...S} strokeWidth={4} />
        <circle cx={x} cy={126} r={7} fill={DOOR} {...S} strokeWidth={3.5} />
      </g>
    ))}
    <Ground />
  </g>
);

// --- more buildings (added 2026-11-18) -----------------------------------

const Hospital: React.FC<IconProps> = ({ sign = 'HOSPITAL' }) => (
  <g>
    <Box x={22} y={78} w={156} h={108} />
    <Box x={70} y={34} w={60} h={46} />
    <path d="M94 42H106V51H115V63H106V72H94V63H85V51H94Z" fill={RED} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <Sign x={58} y={86} w={84} h={16} text={sign} fill={WALL} color={RED} />
    {[32, 58, 120, 146].map((x) => (
      <Win key={x} x={x} y={110} w={22} h={22} />
    ))}
    <Win x={32} y={146} w={22} h={22} />
    <Win x={146} y={146} w={22} h={22} />
    <Door x={82} y={140} w={36} h={46} fill={GLASS} double />
    <path d="M70 140H130" {...S} strokeWidth={4} />
    <Ground />
  </g>
);

const Factory: React.FC<IconProps> = ({ sign = 'FACTORY' }) => (
  <g>
    <Box x={146} y={38} w={20} h={70} fill="#B7B0A6" r={1} />
    <circle cx={160} cy={26} r={8} fill="#E6E2DC" {...S} strokeWidth={3} />
    <circle cx={174} cy={14} r={6} fill="#E6E2DC" {...S} strokeWidth={3} />
    <path d="M18 186V84L58 106V84L98 106V84L138 106V84L182 106V186Z" fill="#E9E2D6" {...S} />
    <path d="M18 84L58 106M58 84L98 106M98 84L138 106M138 84L182 106" {...S} strokeWidth={3} />
    <Sign x={30} y={116} w={80} h={18} text={sign} fill="#F07A3A" color="#FFFFFF" />
    {[120, 148].map((x) => (
      <Win key={x} x={x} y={116} w={22} h={20} />
    ))}
    <Door x={36} y={146} w={40} h={40} fill="#9AA3AC" />
    <path d="M36 156H76M36 166H76M36 176H76" {...S} strokeWidth={2.5} />
    <Door x={128} y={150} w={24} h={36} fill={DOOR} />
    <Ground />
  </g>
);

const Farm: React.FC<IconProps> = () => (
  <g>
    <Box x={150} y={72} w={32} h={114} fill="#C9CFD6" r={2} />
    <path d="M150 74A16 16 0 0 1 182 74" fill="#9AA3AC" {...S} />
    <path d="M150 104H182M150 136H182" {...S} strokeWidth={3} />
    <path d="M30 186V104L46 70L94 50L142 70L158 104V186Z" fill={RED} {...S} />
    <path d="M30 104H158" {...S} strokeWidth={4} />
    <rect x={80} y={72} width={28} height={20} rx={2} fill={WALL} {...S} strokeWidth={4} />
    <rect x={70} y={128} width={48} height={58} fill={WALL} {...S} strokeWidth={4} />
    <path d="M70 128L118 186M118 128L70 186" {...S} strokeWidth={4} />
    <path d="M6 186V158M22 186V158M4 166H30M4 178H30" stroke="#8B5A3C" strokeWidth={4} strokeLinecap="round" />
    <Ground />
  </g>
);

const Parliament: React.FC<IconProps> = ({ sign = 'GOVT' }) => (
  <g>
    <path d="M100 30V14" {...S} strokeWidth={4} />
    <path d="M100 14H120L114 19L120 24H100" fill={GREEN} {...S} strokeWidth={3} />
    <path d="M66 74A34 34 0 0 1 134 74Z" fill="#E4E7EA" {...S} />
    <Box x={60} y={72} w={80} h={16} fill="#D3D8DD" r={1} />
    <Box x={20} y={88} w={160} h={16} fill="#D3D8DD" r={1} />
    <text x={100} y={96} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={Math.min(12, 120 / Math.max(sign.length * 0.7, 1))} fill={INK}>
      {sign}
    </text>
    <Box x={28} y={104} w={144} h={62} fill="#9AA3AC" r={1} />
    {[34, 60, 86, 108, 134, 160].map((x) => (
      <Box key={x} x={x - 3} y={104} w={12} h={62} fill="#EEF0F2" r={1} />
    ))}
    <Box x={20} y={166} w={160} h={9} fill="#D3D8DD" r={1} />
    <Box x={12} y={175} w={176} h={11} fill="#C2C8CE" r={1} />
  </g>
);

const Warehouse: React.FC<IconProps> = ({ sign = 'WAREHOUSE' }) => (
  <g>
    <path d="M14 186V96Q100 44 186 96V186Z" fill="#D9C9A8" {...S} />
    <path d="M14 96Q100 44 186 96" fill="none" {...S} />
    <Sign x={58} y={84} w={84} h={16} text={sign} fill={WALL} />
    {[26, 108].map((x) => (
      <g key={x}>
        <rect x={x} y={112} width={66} height={74} rx={2} fill="#9AA3AC" {...S} strokeWidth={4} />
        <path d={`M${x} 124H${x + 66}M${x} 136H${x + 66}M${x} 148H${x + 66}M${x} 160H${x + 66}M${x} 172H${x + 66}`} {...S} strokeWidth={2.5} />
      </g>
    ))}
    <Ground />
  </g>
);

const PowerPlant: React.FC<IconProps> = () => (
  <g>
    <circle cx={74} cy={34} r={12} fill="#E6E2DC" {...S} strokeWidth={3} />
    <circle cx={92} cy={24} r={9} fill="#E6E2DC" {...S} strokeWidth={3} />
    <path d="M44 186Q62 120 50 52H102Q90 120 108 186Z" fill="#D3D8DD" {...S} />
    <path d="M50 80H102" stroke="#F07A3A" strokeWidth={8} />
    <path d="M50 76H102M50 84H102" {...S} strokeWidth={3} />
    <Box x={116} y={120} w={66} h={66} fill="#EDE6DA" />
    <path d="M140 132L130 156H142L134 176L158 148H146L154 132Z" fill={DOOR} {...S} strokeWidth={3.5} />
    <Ground />
  </g>
);

// --- money & objects -----------------------------------------------------

const Money: React.FC<IconProps> = ({ sign = '₹' }) => (
  <g>
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${-i * 6} ${i * 18}) rotate(${i === 1 ? -4 : 3} 100 100)`}>
        <rect x={34} y={66} width={132} height={70} rx={8} fill="#7DCB7A" {...S} />
        <rect x={46} y={78} width={108} height={46} rx={6} fill="none" stroke={INK} strokeWidth={2.5} />
        <circle cx={100} cy={101} r={16} fill="#B9E7B5" {...S} strokeWidth={3.5} />
        <text x={100} y={102} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={20} fill={INK}>
          {sign}
        </text>
      </g>
    ))}
  </g>
);

const Coins: React.FC<IconProps> = ({ sign = '₹' }) => {
  const stack = (x: number, n: number) =>
    Array.from({ length: n }).map((_, i) => (
      <g key={`${x}-${i}`}>
        <path d={`M${x - 34} ${180 - i * 16}V${170 - i * 16}A34 11 0 0 1 ${x + 34} ${170 - i * 16}V${180 - i * 16}A34 11 0 0 1 ${x - 34} ${180 - i * 16}Z`} fill="#F5B841" {...S} strokeWidth={4} />
        <ellipse cx={x} cy={170 - i * 16} rx={34} ry={11} fill={DOOR} {...S} strokeWidth={4} />
      </g>
    ));
  return (
    <g>
      {stack(62, 4)}
      {stack(134, 6)}
      <ellipse cx={134} cy={90} rx={34} ry={11} fill={DOOR} {...S} strokeWidth={4} />
      <text x={134} y={91} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={15} fill="#8A5A00">
        {sign}
      </text>
    </g>
  );
};

const Wallet: React.FC<IconProps> = () => (
  <g>
    <rect x={44} y={46} width={96} height={52} rx={6} fill="#7DCB7A" {...S} transform="rotate(-8 92 72)" />
    <rect x={30} y={66} width={140} height={100} rx={16} fill="#A0623A" {...S} />
    <path d="M30 96H170" {...S} strokeWidth={3} />
    <path d="M118 104H176V140H118A18 18 0 0 1 118 104Z" fill="#C27C4C" {...S} />
    <circle cx={128} cy={122} r={6} fill={DOOR} {...S} strokeWidth={3} />
  </g>
);

const CreditCard: React.FC<IconProps> = () => (
  <g>
    <rect x={22} y={52} width={156} height={100} rx={12} fill={BLUE} {...S} />
    <rect x={22} y={70} width={156} height={18} fill={INK} />
    <rect x={38} y={102} width={30} height={22} rx={4} fill={DOOR} {...S} strokeWidth={3} />
    <path d="M38 138H96M110 138H130" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
    <circle cx={146} cy={118} r={11} fill={RED} {...S} strokeWidth={3} />
    <circle cx={160} cy={118} r={11} fill={DOOR} {...S} strokeWidth={3} opacity={0.9} />
  </g>
);

const Phone: React.FC<IconProps> = () => (
  <g>
    <rect x={62} y={16} width={76} height={168} rx={16} fill="#2B2B33" {...S} />
    <rect x={70} y={32} width={60} height={130} rx={6} fill={GLASS} {...S} strokeWidth={3} />
    <rect x={88} y={22} width={24} height={5} rx={2.5} fill="#55555F" />
    <rect x={78} y={44} width={44} height={10} rx={3} fill={BLUE} />
    <rect x={78} y={62} width={20} height={20} rx={4} fill={DOOR} {...S} strokeWidth={2.5} />
    <rect x={102} y={62} width={20} height={20} rx={4} fill={GREEN} {...S} strokeWidth={2.5} />
    <rect x={78} y={88} width={20} height={20} rx={4} fill={RED} {...S} strokeWidth={2.5} />
    <rect x={102} y={88} width={20} height={20} rx={4} fill="#7B5CD6" {...S} strokeWidth={2.5} />
    <circle cx={100} cy={172} r={4} fill="#55555F" />
  </g>
);

const Laptop: React.FC<IconProps> = () => (
  <g>
    <rect x={40} y={46} width={120} height={84} rx={8} fill="#2B2B33" {...S} />
    <rect x={50} y={56} width={100} height={64} rx={3} fill={GLASS} {...S} strokeWidth={3} />
    <path d="M60 104L80 86L94 98L114 76L140 100" fill="none" stroke={BLUE} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 146L36 130H164L180 146Z" fill="#C9CFD6" {...S} />
    <path d="M86 138H114" {...S} strokeWidth={3} />
  </g>
);

const Truck: React.FC<IconProps> = () => (
  <g>
    <rect x={14} y={70} width={110} height={84} rx={4} fill={WALL} {...S} />
    <path d="M124 92H162L184 120V154H124Z" fill="#F07A3A" {...S} />
    <path d="M134 100H158L172 120H134Z" fill={GLASS} {...S} strokeWidth={3.5} />
    <rect x={30} y={88} width={78} height={24} rx={3} fill="#F07A3A" {...S} strokeWidth={3.5} />
    {[46, 98, 156].map((x) => (
      <g key={x}>
        <circle cx={x} cy={158} r={15} fill="#3B3F4C" {...S} />
        <circle cx={x} cy={158} r={5} fill="#C9CFD6" />
      </g>
    ))}
  </g>
);

const Car: React.FC<IconProps> = () => (
  <g>
    <path d="M18 146V122Q18 112 30 110L56 104L76 78Q82 72 92 72H128Q138 72 144 80L162 104L176 108Q184 112 184 122V146Z" fill={RED} {...S} />
    <path d="M66 104L82 84H108V104Z M116 104V84H136L150 104Z" fill={GLASS} {...S} strokeWidth={3.5} />
    <path d="M176 122H184M18 124H28" stroke={DOOR} strokeWidth={6} strokeLinecap="round" />
    {[54, 148].map((x) => (
      <g key={x}>
        <circle cx={x} cy={148} r={17} fill="#3B3F4C" {...S} />
        <circle cx={x} cy={148} r={6} fill="#C9CFD6" />
      </g>
    ))}
  </g>
);

const Document: React.FC<IconProps> = ({ sign = 'TAX' }) => (
  <g>
    <path d="M44 18H128L156 46V182H44Z" fill={WALL} {...S} />
    <path d="M128 18V46H156" fill="#E6E2DC" {...S} strokeWidth={4} />
    <text x={58} y={44} dominantBaseline="central" fontFamily={FONT} fontSize={Math.min(22, 64 / Math.max(sign.length * 0.62, 1))} fill={INK}>
      {sign}
    </text>
    {[72, 90, 108, 126].map((y, i) => (
      <path key={y} d={`M58 ${y}H${i % 2 ? 120 : 142}`} stroke="#B9B2A6" strokeWidth={5} strokeLinecap="round" />
    ))}
    <circle cx={122} cy={154} r={18} fill="none" stroke={RED} strokeWidth={4} />
    <path d="M113 154L120 161L132 147" fill="none" stroke={RED} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

// --- set 3 (added 2026-11-18) --------------------------------------------

const FireStation: React.FC<IconProps> = ({ sign = 'FIRE' }) => (
  <g>
    <Box x={22} y={70} w={156} h={116} fill="#D9433A" />
    <path d="M14 72L30 50H170L186 72Z" fill="#8F2626" {...S} />
    <Sign x={66} y={78} w={68} h={18} text={sign} fill={WALL} color="#8F2626" />
    {[34, 104].map((x) => (
      <g key={x}>
        <path d={`M${x} 186V130A31 22 0 0 1 ${x + 62} 130V186Z`} fill="#F4F4F4" {...S} strokeWidth={4} />
        <path d={`M${x} 146H${x + 62}M${x} 162H${x + 62}M${x + 31} 108V186`} {...S} strokeWidth={2.5} />
      </g>
    ))}
    <Ground />
  </g>
);

const PostOffice: React.FC<IconProps> = ({ sign = 'POST' }) => (
  <g>
    <Box x={30} y={84} w={140} h={102} fill="#FFE7A3" />
    <path d="M22 86L100 46L178 86Z" fill={RED} {...S} />
    <Sign x={68} y={94} w={64} h={18} text={sign} fill={RED} color="#FFFFFF" />
    <rect x={44} y={124} width={36} height={26} rx={2} fill={WALL} {...S} strokeWidth={4} />
    <path d="M44 124L62 140L80 124" fill="none" {...S} strokeWidth={3} />
    <Door x={104} y={130} w={44} h={56} fill={GLASS} double />
    <rect x={8} y={140} width={22} height={46} rx={8} fill={RED} {...S} strokeWidth={4} />
    <path d="M12 154H26" {...S} strokeWidth={3} />
    <Ground />
  </g>
);

const PetrolPump: React.FC<IconProps> = () => (
  <g>
    <path d="M16 56H184L176 72H24Z" fill="#F07A3A" {...S} />
    <Box x={34} y={72} w={10} h={114} fill="#C9CFD6" r={1} />
    <Box x={156} y={72} w={10} h={114} fill="#C9CFD6" r={1} />
    <rect x={76} y={96} width={48} height={90} rx={6} fill={RED} {...S} />
    <rect x={84} y={106} width={32} height={24} rx={3} fill={GLASS} {...S} strokeWidth={3} />
    <path d="M124 120H136V160Q136 170 128 170" fill="none" {...S} strokeWidth={4} />
    <path d="M84 146H116" {...S} strokeWidth={3} />
    <Ground />
  </g>
);

const Hotel: React.FC<IconProps> = ({ sign = 'HOTEL' }) => (
  <g>
    <Box x={44} y={36} w={112} h={150} fill="#7B5CD6" />
    <Sign x={64} y={20} w={72} h={20} text={sign} fill={DOOR} />
    {[54, 78, 102, 126].map((x) =>
      [50, 76, 102, 128].map((y) => <Win key={`${x}-${y}`} x={x} y={y} w={18} h={18} cross={false} />),
    )}
    <path d="M70 158H130L124 150H76Z" fill={RED} {...S} strokeWidth={3.5} />
    <Door x={84} y={158} w={32} h={28} fill={GLASS} double />
    <Ground />
  </g>
);

const Pharmacy: React.FC<IconProps> = ({ sign = 'PHARMACY' }) => (
  <g>
    <Box x={30} y={90} w={140} h={96} />
    <Box x={22} y={80} w={156} h={14} fill={GREEN} r={2} />
    <Sign x={52} y={58} w={96} h={20} text={sign} fill={GREEN} color="#FFFFFF" />
    <path d="M150 34H160V44H170V54H160V64H150V54H140V44H150Z" fill={GREEN} {...S} strokeWidth={3} />
    <Win x={40} y={106} w={60} h={50} cross={false} />
    <rect x={52} y={126} width={36} height={14} rx={7} fill={RED} {...S} strokeWidth={3} />
    <path d="M70 126V140" stroke={INK} strokeWidth={3} />
    <Door x={118} y={112} w={38} h={74} fill={GLASS} />
    <Ground />
  </g>
);

const Bicycle: React.FC<IconProps> = () => (
  <g>
    <circle cx={52} cy={132} r={34} fill="none" {...S} strokeWidth={7} />
    <circle cx={148} cy={132} r={34} fill="none" {...S} strokeWidth={7} />
    <path d="M52 132L84 86H134L148 132M84 86L100 132L134 86M100 132H52" fill="none" stroke={RED} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
    <path d="M76 76H96M126 70L134 86M120 70H136" fill="none" {...S} strokeWidth={6} />
  </g>
);

const Scooter: React.FC<IconProps> = () => (
  <g>
    <path d="M40 140Q40 110 72 110H112L124 64H140" fill="none" {...S} strokeWidth={6} />
    <path d="M36 140H130Q130 116 150 110L130 62" fill="#3FB39A" {...S} />
    <rect x={56} y={98} width={54} height={14} rx={7} fill="#3B3F4C" {...S} strokeWidth={4} />
    <path d="M122 58H146" {...S} strokeWidth={6} />
    {[50, 158].map((x) => (
      <g key={x}>
        <circle cx={x} cy={150} r={18} fill="#3B3F4C" {...S} />
        <circle cx={x} cy={150} r={6} fill="#C9CFD6" />
      </g>
    ))}
  </g>
);

const AutoRickshaw: React.FC<IconProps> = () => (
  <g>
    <path d="M28 66Q30 46 60 46H150Q172 46 174 70V150H28Z" fill="#2E2E2E" {...S} />
    <path d="M28 96H174V150H28Z" fill={DOOR} {...S} />
    <path d="M36 66H86V96H36Z M126 66H166V96H126Z" fill={GLASS} {...S} strokeWidth={3.5} />
    <path d="M90 66V150" {...S} strokeWidth={3.5} />
    <path d="M96 66H118V96H96Z" fill="#2E2E2E" {...S} strokeWidth={3} />
    <circle cx={168} cy={118} r={6} fill="#FFFFFF" {...S} strokeWidth={3} />
    {[52, 150].map((x) => (
      <g key={x}>
        <circle cx={x} cy={156} r={17} fill="#3B3F4C" {...S} />
        <circle cx={x} cy={156} r={6} fill="#C9CFD6" />
      </g>
    ))}
  </g>
);

const Train: React.FC<IconProps> = () => (
  <g>
    <rect x={44} y={28} width={112} height={132} rx={22} fill={BLUE} {...S} />
    <rect x={56} y={44} width={88} height={50} rx={8} fill={GLASS} {...S} strokeWidth={4} />
    <path d="M100 44V94" {...S} strokeWidth={3} />
    <path d="M44 112H156" {...S} strokeWidth={4} />
    <circle cx={70} cy={134} r={9} fill={DOOR} {...S} strokeWidth={3.5} />
    <circle cx={130} cy={134} r={9} fill={DOOR} {...S} strokeWidth={3.5} />
    <path d="M70 160L52 186M130 160L148 186M60 174H140" fill="none" {...S} strokeWidth={5} />
  </g>
);

const Ship: React.FC<IconProps> = () => (
  <g>
    <path d="M70 92H140V120H70Z" fill={WALL} {...S} />
    <path d="M80 100H92M100 100H112M120 100H132" {...S} strokeWidth={4} />
    <rect x={100} y={62} width={20} height={30} fill={RED} {...S} strokeWidth={4} />
    <path d="M24 120H180L160 158H44Z" fill="#2F5E9E" {...S} />
    <path d="M36 138H172" stroke="#FFFFFF" strokeWidth={4} />
    <path d="M10 172Q30 162 50 172T90 172T130 172T170 172T200 172" fill="none" stroke={BLUE} strokeWidth={5} strokeLinecap="round" />
  </g>
);

const Tractor: React.FC<IconProps> = () => (
  <g>
    <path d="M34 128V96H96L104 62H144V128Z" fill={GREEN} {...S} />
    <path d="M110 70H138V100H110Z" fill={GLASS} {...S} strokeWidth={3.5} />
    <path d="M52 96V70" {...S} strokeWidth={6} />
    <circle cx={128} cy={138} r={34} fill="#3B3F4C" {...S} />
    <circle cx={128} cy={138} r={13} fill={DOOR} {...S} strokeWidth={3.5} />
    <circle cx={54} cy={150} r={20} fill="#3B3F4C" {...S} />
    <circle cx={54} cy={150} r={7} fill={DOOR} />
  </g>
);

const Park: React.FC<IconProps> = () => (
  <g>
    <path d="M70 186V120" {...S} strokeWidth={6} />
    <circle cx={70} cy={92} r={40} fill={GREEN} {...S} />
    <circle cx={52} cy={84} r={6} fill="#7FD07F" />
    <path d="M150 186V140" {...S} strokeWidth={5} />
    <circle cx={150} cy={120} r={26} fill="#7FD07F" {...S} />
    <rect x={98} y={150} width={60} height={10} rx={3} fill="#A0623A" {...S} strokeWidth={3.5} />
    <path d="M104 160V178M152 160V178" {...S} strokeWidth={4} />
    <Ground />
  </g>
);

const Cloud: React.FC<IconProps> = () => (
  <g>
    <path d="M56 146Q24 146 24 118Q24 90 54 88Q60 54 96 54Q128 54 138 82Q176 80 178 114Q178 146 146 146Z" fill={WALL} {...S} />
    <path d="M100 136V100M86 112L100 98L114 112" fill="none" stroke={BLUE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const ShoppingCart: React.FC<IconProps> = () => (
  <g>
    <path d="M18 46H44L64 132H152L170 72H52" fill="none" {...S} strokeWidth={6} />
    <path d="M56 72H168L152 128H66Z" fill="#9CCBF2" {...S} strokeWidth={4} />
    <rect x={80} y={56} width={26} height={22} rx={3} fill={RED} {...S} strokeWidth={3.5} />
    <rect x={112} y={50} width={22} height={28} rx={3} fill={DOOR} {...S} strokeWidth={3.5} />
    <circle cx={76} cy={156} r={12} fill="#3B3F4C" {...S} />
    <circle cx={140} cy={156} r={12} fill="#3B3F4C" {...S} />
  </g>
);

const LightBulb: React.FC<IconProps> = () => (
  <g>
    <path d="M100 22Q148 22 148 70Q148 96 126 116V134H74V116Q52 96 52 70Q52 22 100 22Z" fill={DOOR} {...S} />
    <path d="M86 116V94L100 104L114 94V116" fill="none" {...S} strokeWidth={3.5} />
    <rect x={74} y={134} width={52} height={26} rx={4} fill="#C9CFD6" {...S} />
    <path d="M74 147H126" {...S} strokeWidth={3} />
    <path d="M88 160Q100 176 112 160" fill="#9AA3AC" {...S} strokeWidth={4} />
    <path d="M22 70H36M164 70H178M40 26L50 36M160 26L150 36" {...S} strokeWidth={5} />
  </g>
);

const Clock: React.FC<IconProps> = () => (
  <g>
    <circle cx={100} cy={100} r={76} fill={WALL} {...S} strokeWidth={7} />
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i * Math.PI) / 6;
      return (
        <path
          key={i}
          d={`M${100 + Math.sin(a) * 60} ${100 - Math.cos(a) * 60}L${100 + Math.sin(a) * 68} ${100 - Math.cos(a) * 68}`}
          {...S}
          strokeWidth={i % 3 ? 3 : 5}
        />
      );
    })}
    <path d="M100 100V56M100 100L132 116" fill="none" {...S} strokeWidth={7} />
    <circle cx={100} cy={100} r={6} fill={RED} {...S} strokeWidth={3} />
  </g>
);

const BarChart: React.FC<IconProps> = () => (
  <g>
    <path d="M24 26V176H182" fill="none" {...S} strokeWidth={6} />
    <rect x={42} y={120} width={28} height={56} fill={BLUE} {...S} />
    <rect x={82} y={92} width={28} height={84} fill={GREEN} {...S} />
    <rect x={122} y={60} width={28} height={116} fill={DOOR} {...S} />
    <path d="M40 104L92 70L128 82L172 34M154 34H172V52" fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Lock: React.FC<IconProps> = () => (
  <g>
    <path d="M62 92V66Q62 28 100 28Q138 28 138 66V92" fill="none" {...S} strokeWidth={14} />
    <path d="M62 92V66Q62 28 100 28Q138 28 138 66V92" fill="none" stroke="#C9CFD6" strokeWidth={6} />
    <rect x={40} y={88} width={120} height={92} rx={14} fill={DOOR} {...S} />
    <circle cx={100} cy={124} r={11} fill={INK} />
    <path d="M100 128V152" {...S} strokeWidth={8} />
  </g>
);

const Globe: React.FC<IconProps> = () => (
  <g>
    <circle cx={100} cy={100} r={78} fill="#9CCBF2" {...S} strokeWidth={6} />
    <path d="M58 52Q76 44 84 60Q96 70 80 84Q70 98 54 92Q40 84 44 68Z M108 40Q140 46 150 70Q146 86 128 80Q112 70 108 56Z M98 112Q124 106 140 122Q150 142 130 160Q112 168 104 150Q94 130 98 112Z" fill={GREEN} {...S} strokeWidth={4} />
    <ellipse cx={100} cy={100} rx={36} ry={78} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.35} />
    <path d="M22 100H178" stroke={INK} strokeWidth={2.5} opacity={0.35} />
  </g>
);

const Megaphone: React.FC<IconProps> = () => (
  <g>
    <path d="M40 82H70L150 40V160L70 118H40Z" fill={RED} {...S} />
    <rect x={30} y={78} width={22} height={44} rx={6} fill="#F4F4F4" {...S} strokeWidth={4} />
    <path d="M74 118L86 164H104L96 128" fill="#F4F4F4" {...S} strokeWidth={4} />
    <path d="M166 76Q178 100 166 124M176 60Q196 100 176 140" fill="none" {...S} strokeWidth={5} />
  </g>
);

// --- people --------------------------------------------------------------

type Look = {
  skin: string;
  hair: string;
  shirt: string;
  bg: string;
  style: 'short' | 'spiky' | 'curly' | 'cap' | 'beard' | 'long' | 'bob' | 'ponytail' | 'bun' | 'braids';
};

const Avatar: React.FC<{ look: Look }> = ({ look }) => {
  const { skin, hair, shirt, bg, style } = look;
  const girl = ['long', 'bob', 'ponytail', 'bun', 'braids'].includes(style);
  return (
    <g>
      <defs>
        <clipPath id={`clip-${style}`}>
          <circle cx={100} cy={100} r={88} />
        </clipPath>
      </defs>
      <circle cx={100} cy={100} r={88} fill={bg} />
      <g clipPath={`url(#clip-${style})`}>
        {/* hair behind the head */}
        {style === 'long' && <path d="M56 88Q56 40 100 40Q144 40 144 88V170H56Z" fill={hair} {...S} />}
        {style === 'braids' && (
          <>
            <path d="M58 90V150" stroke={hair} strokeWidth={16} strokeLinecap="round" />
            <path d="M142 90V150" stroke={hair} strokeWidth={16} strokeLinecap="round" />
          </>
        )}
        {style === 'ponytail' && <path d="M136 70Q170 90 150 140" fill="none" stroke={hair} strokeWidth={18} strokeLinecap="round" />}
        {style === 'bun' && <circle cx={100} cy={38} r={16} fill={hair} {...S} />}
        {/* body */}
        <path d="M30 200Q34 148 100 142Q166 148 170 200Z" fill={shirt} {...S} />
        {!girl && <path d="M84 144L100 166L116 144" fill="#F4F4F4" {...S} strokeWidth={4} />}
        {girl && <path d="M84 146Q100 160 116 146" fill="none" {...S} strokeWidth={4} />}
        <rect x={90} y={122} width={20} height={24} fill={skin} {...S} strokeWidth={4} />
        {/* head */}
        <ellipse cx={58} cy={96} rx={7} ry={10} fill={skin} {...S} strokeWidth={4} />
        <ellipse cx={142} cy={96} rx={7} ry={10} fill={skin} {...S} strokeWidth={4} />
        <ellipse cx={100} cy={92} rx={40} ry={44} fill={skin} {...S} />
        {style === 'beard' && <path d="M62 98Q66 140 100 140Q134 140 138 98Q126 122 100 122Q74 122 62 98Z" fill={hair} {...S} strokeWidth={4} />}
        {/* hair on top */}
        {(style === 'short' || style === 'beard') && <path d="M60 86Q58 46 100 46Q142 46 140 86Q130 64 100 64Q70 64 60 86Z" fill={hair} {...S} />}
        {style === 'spiky' && <path d="M60 88L58 60L72 66L76 44L90 58L100 38L110 56L126 44L128 64L142 60L140 88Q120 66 100 70Q80 66 60 88Z" fill={hair} {...S} />}
        {style === 'curly' && (
          <g fill={hair} {...S} strokeWidth={4}>
            {[62, 76, 92, 108, 124, 138].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 54 : 62} r={14} />
            ))}
          </g>
        )}
        {style === 'cap' && (
          <>
            <path d="M58 80Q58 44 100 44Q142 44 142 80Z" fill={BLUE} {...S} />
            <path d="M120 78H162Q164 86 140 86H120Z" fill={BLUE} {...S} strokeWidth={4} />
          </>
        )}
        {style === 'long' && <path d="M60 92Q60 48 100 48Q140 48 140 92Q126 60 96 64Q76 66 60 92Z" fill={hair} {...S} />}
        {style === 'bob' && <path d="M54 110Q48 46 100 44Q152 46 146 110Q136 112 134 96Q130 64 100 64Q70 64 66 96Q64 112 54 110Z" fill={hair} {...S} />}
        {(style === 'ponytail' || style === 'bun' || style === 'braids') && (
          <path d="M60 88Q58 48 100 48Q142 48 140 88Q130 62 100 62Q70 62 60 88Z" fill={hair} {...S} />
        )}
        {/* face */}
        <circle cx={86} cy={96} r={3.6} fill={INK} />
        <circle cx={114} cy={96} r={3.6} fill={INK} />
        {style !== 'beard' && <path d="M90 114Q100 121 110 114" fill="none" {...S} strokeWidth={3.5} />}
        {style === 'beard' && <path d="M92 116Q100 120 108 116" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />}
        {girl && (
          <>
            <circle cx={78} cy={108} r={5} fill="#F28C8C" opacity={0.5} />
            <circle cx={122} cy={108} r={5} fill="#F28C8C" opacity={0.5} />
          </>
        )}
      </g>
      <circle cx={100} cy={100} r={88} fill="none" {...S} />
    </g>
  );
};

const LOOKS: Record<string, Look> = {
  'Boy 1': { style: 'short', skin: '#F2C9A0', hair: '#2A1E17', shirt: '#2D3A55', bg: '#9CCBF2' },
  'Boy 2': { style: 'spiky', skin: '#D9A066', hair: '#1C1A17', shirt: GREEN, bg: '#FFE08A' },
  'Boy 3': { style: 'curly', skin: '#8D5A3B', hair: '#1C1A17', shirt: '#F07A3A', bg: '#BDE8C8' },
  'Boy 4': { style: 'cap', skin: '#E8B98A', hair: '#4A2E1E', shirt: RED, bg: '#D8CCF5' },
  'Boy 5': { style: 'beard', skin: '#C68A5E', hair: '#2A1E17', shirt: '#5B5F6B', bg: '#F7C6B4' },
  'Girl 1': { style: 'long', skin: '#F2C9A0', hair: '#3B2416', shirt: '#E86A92', bg: '#FFD6E2' },
  'Girl 2': { style: 'bob', skin: '#D9A066', hair: '#1C1A17', shirt: '#5B8DEF', bg: '#C9E7FF' },
  'Girl 3': { style: 'ponytail', skin: '#8D5A3B', hair: '#1C1A17', shirt: DOOR, bg: '#FFE7B0' },
  'Girl 4': { style: 'bun', skin: '#F5D0B0', hair: '#B5522E', shirt: '#7B5CD6', bg: '#E2D9FF' },
  'Girl 5': { style: 'braids', skin: '#C68A5E', hair: '#2A1E17', shirt: '#3FB39A', bg: '#C8F0E4' },
};

// Tiny person for crowd rows ("customers", "users" ...).
const PersonSimple: React.FC<IconProps> = () => (
  <g>
    <circle cx={100} cy={70} r={30} fill="#B57A4A" {...S} strokeWidth={8} />
    <path d="M48 186Q48 112 100 112Q152 112 152 186Z" fill={DOOR} {...S} strokeWidth={8} />
  </g>
);

// --- registry ------------------------------------------------------------

const BUILDINGS: Record<string, React.FC<IconProps>> = {
  School,
  Office,
  'House (classic)': HouseClassic,
  'House (cottage)': HouseCottage,
  'House (two storey)': HouseTwoStorey,
  'House (modern)': HouseModern,
  Restaurant,
  'Shopping mall': Mall,
  Cinema,
  Stadium,
  'Circus tent': Circus,
  'Glass office': GlassOffice,
  'Police station': Police,
  Bank,
  Airport,
  'Bus station': BusStation,
  'Bus stop': BusStop,
  'Railway station': RailwayStation,
  Market,
  Hospital,
  Factory,
  Farm,
  Parliament,
  Warehouse,
  'Power plant': PowerPlant,
  Money,
  Coins,
  Wallet,
  'Credit card': CreditCard,
  Phone,
  Laptop,
  Truck,
  Car,
  Document,
  'Fire station': FireStation,
  'Post office': PostOffice,
  'Petrol pump': PetrolPump,
  Hotel,
  Pharmacy,
  Bicycle,
  Scooter,
  'Auto rickshaw': AutoRickshaw,
  Train,
  Ship,
  Tractor,
  Park,
  Cloud,
  'Shopping cart': ShoppingCart,
  'Light bulb': LightBulb,
  Clock,
  'Bar chart': BarChart,
  Lock,
  Globe,
  Megaphone,
  'Person (simple)': PersonSimple,
};

export const ICON_NAMES = [...Object.keys(BUILDINGS), ...Object.keys(LOOKS)] as [string, ...string[]];

// Icons that show sign text, and their default text.
export const SIGN_DEFAULTS: Record<string, string> = {
  School: 'SCHOOL',
  Office: 'OFFICE',
  Restaurant: 'RESTAURANT',
  'Shopping mall': 'MALL',
  Cinema: 'CINEMA',
  'Glass office': 'HQ',
  'Police station': 'POLICE',
  Bank: 'BANK',
  Airport: 'AIRPORT',
  'Bus station': 'BUS STATION',
  'Railway station': 'STATION',
  Market: 'MARKET',
  Hospital: 'HOSPITAL',
  Factory: 'FACTORY',
  Parliament: 'GOVT',
  Warehouse: 'WAREHOUSE',
  Money: '₹',
  Coins: '₹',
  Document: 'TAX',
  'Fire station': 'FIRE',
  'Post office': 'POST',
  Hotel: 'HOTEL',
  Pharmacy: 'PHARMACY',
};

export const SceneIcon: React.FC<{ name: string; size: number; sign?: string; style?: React.CSSProperties }> = ({
  name,
  size,
  sign,
  style,
}) => {
  const Building = BUILDINGS[name];
  const look = LOOKS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible', ...style }}>
      {Building ? <Building sign={sign || undefined} /> : look ? <Avatar look={look} /> : null}
    </svg>
  );
};
