import { useState } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_COLORS } from '@/types';
import { X, Sparkles, Loader2, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface MindMapControlsProps {
  onSolarLayout?: () => void;
}

const MindMapControls = ({ onSolarLayout }: MindMapControlsProps) => {
  const activeFilters = useContactStore((s) => s.activeFilters);
  const toggleFilter = useContactStore((s) => s.toggleFilter);
  const clearFilters = useContactStore((s) => s.clearFilters);
  const contacts = useContactStore((s) => s.contacts);
  const connections = useContactStore((s) => s.connections);
  const addConnection = useContactStore((s) => s.addConnection);
  const { user } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.categoryTags))).sort();

  const handleAIConnect = async () => {
    if (!user || contacts.length < 2) {
      toast({ title: 'Need at least 2 contacts to auto-connect', variant: 'destructive' });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-connections', {
        body: { contacts, existingConnections: connections },
      });

      if (error) throw error;

      const suggested = data?.connections || [];
      if (suggested.length === 0) {
        toast({ title: 'No new connections suggested', description: 'AI found no missing relationships.' });
        setAiLoading(false);
        return;
      }

      let added = 0;
      for (const conn of suggested) {
        const exists = connections.some(
          (c) =>
            (c.contactAId === conn.contactAId && c.contactBId === conn.contactBId) ||
            (c.contactAId === conn.contactBId && c.contactBId === conn.contactAId)
        );
        if (!exists) {
          await addConnection(user.id, conn.contactAId, conn.contactBId, conn.relationshipType);
          added++;
        }
      }

      toast({
        title: `${added} connection${added !== 1 ? 's' : ''} created`,
        description: suggested.map((s: any) => s.reason).join(' • '),
      });

      // Auto-trigger solar layout after AI connects
      onSolarLayout?.();
    } catch (e: any) {
      console.error('AI connect error:', e);
      toast({ title: 'AI connection failed', description: e.message || 'Please try again', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        onClick={handleAIConnect}
        disabled={aiLoading}
        className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg gap-1.5"
      >
        {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        AI Connect
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onSolarLayout}
        className="gap-1.5 border-border bg-card/80 text-foreground hover:bg-secondary"
      >
        <Sun className="w-3.5 h-3.5" />
        Solar Layout
      </Button>

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
