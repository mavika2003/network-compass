import { CATEGORY_COLORS } from '@/types';

interface TagPillsProps {
  tags: string[];
  size?: 'sm' | 'md';
  onRemove?: (tag: string) => void;
}

const TagPills = ({ tags, size = 'sm', onRemove }: TagPillsProps) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const cat = CATEGORY_COLORS[tag] || { color: 'hsl(215 16% 45%)', glow: 'var(--glow-primary)' };
        return (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full font-medium ${
              size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
            }`}
            style={{
              backgroundColor: `${cat.color}20`,
              color: cat.color,
              border: `1px solid ${cat.color}30`,
            }}
          >
            {tag}
            {onRemove && (
              <button onClick={() => onRemove(tag)} className="hover:opacity-70 ml-0.5">×</button>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default TagPills;
