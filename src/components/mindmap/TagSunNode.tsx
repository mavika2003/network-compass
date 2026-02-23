import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { CATEGORY_COLORS } from '@/types';

export interface TagSunNodeData {
  tag: string;
  contactCount: number;
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

const TagSunNode = memo(({ data }: NodeProps) => {
  const { tag, contactCount } = data as unknown as TagSunNodeData;
  const cat = CATEGORY_COLORS[tag] || CATEGORY_COLORS.Default;
  const icon = TAG_ICONS[tag] || TAG_ICONS.Default;

  return (
    <div className="flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {/* Outer rotating dashed ring */}
      <div
        className="absolute rounded-full sun-rotate-ring"
        style={{
          width: 140,
          height: 140,
          border: `2px dashed ${cat.color}50`,
        }}
      />
      {/* Middle pulsing glow */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: 130,
          height: 130,
          background: `radial-gradient(circle, ${cat.color}30 0%, transparent 70%)`,
          animationDuration: '3s',
        }}
      />
      {/* Inner pulsing glow (offset timing) */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${cat.color}20 0%, transparent 60%)`,
          animationDuration: '4.5s',
        }}
      />
      {/* Core sphere */}
      <div
        className="relative rounded-full flex flex-col items-center justify-center"
        style={{
          width: 110,
          height: 110,
          background: `radial-gradient(circle at 35% 30%, ${cat.color}ff, ${cat.color}cc 50%, ${cat.color}80 100%)`,
          boxShadow: `0 0 40px ${cat.color}60, 0 0 80px ${cat.color}30, inset 0 -8px 20px ${cat.color}40`,
        }}
      >
        <span className="text-2xl mb-0.5" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>
          {icon}
        </span>
        <span className="text-sm font-bold text-white drop-shadow-lg leading-tight text-center px-2">
          {tag}
        </span>
        <span
          className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/90"
          style={{ background: `${cat.color}40` }}
        >
          {contactCount} contact{contactCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
});

TagSunNode.displayName = 'TagSunNode';
export default TagSunNode;
