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
};

const FALLBACK_ICON = '✦';

export function getSunSize(contactCount: number): number {
  return Math.min(320, 180 + Math.floor(contactCount / 2) * 30);
}

const TagSunNode = memo(({ data }: NodeProps) => {
  const { tag, contactCount } = data as unknown as TagSunNodeData;
  const cat = CATEGORY_COLORS[tag] || { color: 'hsl(215 16% 45%)', glow: 'var(--glow-primary)' };
  const icon = TAG_ICONS[tag] || FALLBACK_ICON;
  const size = getSunSize(contactCount);
  const coreSize = size - 40;
  const glowSize1 = size - 10;
  const glowSize2 = size - 20;
  const outerBubbleSize = size + 60;

  return (
    <div className="flex items-center justify-center sun-breathe" style={{ width: outerBubbleSize, height: outerBubbleSize }}>
      {/* Outermost glassmorphic bubble */}
      <div
        className="absolute rounded-full"
        style={{
          width: outerBubbleSize,
          height: outerBubbleSize,
          background: `radial-gradient(circle at 40% 35%, ${cat.color}18 0%, ${cat.color}08 50%, transparent 70%)`,
          border: `1.5px solid ${cat.color}20`,
          backdropFilter: 'blur(8px)',
        }}
      />
      {/* Outer rotating dashed ring */}
      <div
        className="absolute rounded-full sun-rotate-ring"
        style={{
          width: size + 20,
          height: size + 20,
          border: `2px dashed ${cat.color}40`,
        }}
      />
      {/* Second rotating ring (opposite direction) */}
      <div
        className="absolute rounded-full sun-rotate-ring-reverse"
        style={{
          width: size + 8,
          height: size + 8,
          border: `1px dashed ${cat.color}25`,
        }}
      />
      {/* Outer glow layer */}
      <div
        className="absolute rounded-full"
        style={{
          width: size + 40,
          height: size + 40,
          background: `radial-gradient(circle, ${cat.color}20 0%, ${cat.color}08 40%, transparent 70%)`,
        }}
      />
      {/* Middle pulsing glow */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: glowSize1,
          height: glowSize1,
          background: `radial-gradient(circle, ${cat.color}40 0%, transparent 65%)`,
          animationDuration: '3s',
        }}
      />
      {/* Inner pulsing glow (offset timing) */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: glowSize2,
          height: glowSize2,
          background: `radial-gradient(circle, ${cat.color}30 0%, transparent 55%)`,
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
          boxShadow: `0 0 ${size / 2}px ${cat.color}60, 0 0 ${size}px ${cat.color}25, inset 0 -10px 25px ${cat.color}40`,
        }}
      >
        <span className="mb-0.5" style={{ fontSize: size > 240 ? 38 : size > 200 ? 32 : 26, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          {icon}
        </span>
        <span className="font-bold text-white drop-shadow-lg leading-tight text-center px-3" style={{ fontSize: size > 240 ? 18 : size > 200 ? 16 : 14 }}>
          {tag}
        </span>
        <span
          className="mt-1 px-2.5 py-0.5 rounded-full font-semibold text-white/90"
          style={{ background: `${cat.color}40`, fontSize: size > 240 ? 13 : 11 }}
        >
          {contactCount} contact{contactCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
});

TagSunNode.displayName = 'TagSunNode';
export default TagSunNode;
