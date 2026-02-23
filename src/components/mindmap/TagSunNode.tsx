import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { CATEGORY_COLORS } from '@/types';

export interface TagSunNodeData {
  tag: string;
  contactCount: number;
  [key: string]: unknown;
}

const TagSunNode = memo(({ data }: NodeProps) => {
  const { tag, contactCount } = data as unknown as TagSunNodeData;
  const cat = CATEGORY_COLORS[tag] || CATEGORY_COLORS.Default;

  return (
    <div className="flex items-center justify-center" style={{ width: 90, height: 90 }}>
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: 90,
          height: 90,
          background: `radial-gradient(circle, ${cat.color}40 0%, transparent 70%)`,
        }}
      />
      {/* Core */}
      <div
        className="relative rounded-full flex flex-col items-center justify-center"
        style={{
          width: 70,
          height: 70,
          background: `radial-gradient(circle at 35% 35%, ${cat.color}, ${cat.color}90)`,
          boxShadow: `0 0 30px ${cat.color}60, 0 0 60px ${cat.color}30`,
        }}
      >
        <span className="text-[11px] font-bold text-white drop-shadow-lg leading-tight text-center px-1">
          {tag}
        </span>
        <span className="text-[9px] text-white/70 font-medium">{contactCount}</span>
      </div>
    </div>
  );
});

TagSunNode.displayName = 'TagSunNode';
export default TagSunNode;
