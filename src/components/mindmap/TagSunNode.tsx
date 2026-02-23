import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { CATEGORY_COLORS } from '@/types';

export interface TagSunNodeData {
  tag: string;
  contactCount: number;
  size?: number;
  [key: string]: unknown;
}

const TAG_ICONS: Record<string, string> = {
  Family: '👨‍👩‍👧‍👦',
  Friends: '🤝',
  Work: '💼',
  Networking: '🌐',
  Mentors: '🎓',
  Community: '🏘️',
  Health: '💪',
  Creative: '🎨',
  Tech: '💻',
  Default: '✦',
};

export function getSunSize(contactCount: number): number {
  return Math.min(220, 140 + Math.floor(contactCount / 3) * 20);
}

const TagSunNode = memo(({ data }: NodeProps) => {
  const { tag, contactCount } = data as unknown as TagSunNodeData;
  const cat = CATEGORY_COLORS[tag] || CATEGORY_COLORS.Default;
  const icon = TAG_ICONS[tag] || TAG_ICONS.Default;
  const size = getSunSize(contactCount);
  const coreSize = size - 30;
  const glowSize1 = size - 10;
  const glowSize2 = size - 20;

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer rotating dashed ring */}
      <div
        className="absolute rounded-full sun-rotate-ring"
        style={{
          width: size,
          height: size,
          border: `2px dashed ${cat.color}50`,
        }}
      />
      {/* Second rotating ring (opposite direction) */}
      <div
        className="absolute rounded-full sun-rotate-ring-reverse"
        style={{
          width: size - 6,
          height: size - 6,
          border: `1px dashed ${cat.color}30`,
        }}
      />
      {/* Middle pulsing glow */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: glowSize1,
          height: glowSize1,
          background: `radial-gradient(circle, ${cat.color}35 0%, transparent 70%)`,
          animationDuration: '3s',
        }}
      />
      {/* Inner pulsing glow (offset timing) */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: glowSize2,
          height: glowSize2,
          background: `radial-gradient(circle, ${cat.color}25 0%, transparent 60%)`,
          animationDuration: '4.5s',
        }}
      />
      {/* Core sphere */}
      <div
        className="relative rounded-full flex flex-col items-center justify-center"
        style={{
          width: coreSize,
          height: coreSize,
          background: `radial-gradient(circle at 35% 30%, ${cat.color}ff, ${cat.color}cc 50%, ${cat.color}80 100%)`,
          boxShadow: `0 0 ${size / 3}px ${cat.color}60, 0 0 ${size / 1.5}px ${cat.color}30, inset 0 -8px 20px ${cat.color}40`,
        }}
      >
        <span className="mb-0.5" style={{ fontSize: size > 180 ? 32 : size > 160 ? 28 : 24, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>
          {icon}
        </span>
        <span className="font-bold text-white drop-shadow-lg leading-tight text-center px-2" style={{ fontSize: size > 180 ? 16 : 14 }}>
          {tag}
        </span>
        <span
          className="mt-0.5 px-2 py-0.5 rounded-full font-semibold text-white/90"
          style={{ background: `${cat.color}40`, fontSize: size > 180 ? 12 : 10 }}
        >
          {contactCount} contact{contactCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
});

TagSunNode.displayName = 'TagSunNode';
export default TagSunNode;
