import { useContactStore } from '@/stores/contactStore';
import { CATEGORY_COLORS } from '@/types';
import { X } from 'lucide-react';

const MindMapControls = () => {
  const activeFilters = useContactStore((s) => s.activeFilters);
  const toggleFilter = useContactStore((s) => s.toggleFilter);
  const clearFilters = useContactStore((s) => s.clearFilters);
  const contacts = useContactStore((s) => s.contacts);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.categoryTags))).sort();

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 flex-wrap">
      {allTags.map((tag) => {
        const active = activeFilters.includes(tag);
        const cat = CATEGORY_COLORS[tag] || CATEGORY_COLORS.Default;
        return (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border"
            style={{
              backgroundColor: active ? cat.color : 'hsl(240 18% 8% / 0.9)',
              borderColor: active ? cat.color : 'hsl(240 14% 16%)',
              color: active ? 'white' : 'hsl(215 16% 65%)',
              boxShadow: active ? `0 0 12px ${cat.color}40` : 'none',
            }}
          >
            {tag}
          </button>
        );
      })}
      {activeFilters.length > 0 && (
        <button
          onClick={clearFilters}
          className="px-2 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  );
};

export default MindMapControls;
