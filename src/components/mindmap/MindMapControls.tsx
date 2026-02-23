import { useState } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_COLORS } from '@/types';
import { X, Sparkles, Loader2, Sun, RotateCcw, ChevronDown, Merge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MergeContactsDialog from './MergeContactsDialog';

interface MindMapControlsProps {
  onSolarLayout?: () => void;
  onResetLayout?: () => void;
  solarActive?: boolean;
}

const MindMapControls = ({ onSolarLayout, onResetLayout, solarActive }: MindMapControlsProps) => {
  const activeFilters = useContactStore((s) => s.activeFilters);
  const toggleFilter = useContactStore((s) => s.toggleFilter);
  const clearFilters = useContactStore((s) => s.clearFilters);
  const contacts = useContactStore((s) => s.contacts);
  const connections = useContactStore((s) => s.connections);
  const addConnection = useContactStore((s) => s.addConnection);
  const deleteConnection = useContactStore((s) => s.deleteConnection);
  const updateConnectionType = useContactStore((s) => s.updateConnectionType);
  const { user } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [mergeOpen, setMergeOpen] = useState(false);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.categoryTags))).sort();

  const handleAIConnect = async () => {
    if (!user || contacts.length < 2) {
      toast({ title: 'Need at least 2 contacts to manage connections', variant: 'destructive' });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-connections', {
        body: { contacts, existingConnections: connections, userPrompt: userPrompt.trim() || undefined },
      });

      if (error) throw error;

      const actions = data?.actions || [];
      if (actions.length === 0) {
        toast({ title: 'No actions suggested', description: 'AI found nothing to change.' });
        setAiLoading(false);
        return;
      }

      let added = 0, removed = 0, modified = 0;
      const reasons: string[] = [];

      for (const action of actions) {
        if (action.type === 'add') {
          const exists = connections.some(
            (c) =>
              (c.contactAId === action.contactAId && c.contactBId === action.contactBId) ||
              (c.contactAId === action.contactBId && c.contactBId === action.contactAId)
          );
          if (!exists) {
            await addConnection(user.id, action.contactAId, action.contactBId, action.relationshipType || 'mutual');
            added++;
          }
        } else if (action.type === 'remove') {
          const conn = connections.find(
            (c) =>
              (c.contactAId === action.contactAId && c.contactBId === action.contactBId) ||
              (c.contactAId === action.contactBId && c.contactBId === action.contactAId)
          );
          if (conn) {
            await deleteConnection(conn.id);
            removed++;
          }
        } else if (action.type === 'modify') {
          const conn = connections.find(
            (c) =>
              (c.contactAId === action.contactAId && c.contactBId === action.contactBId) ||
              (c.contactAId === action.contactBId && c.contactBId === action.contactAId)
          );
          if (conn && action.relationshipType) {
            await updateConnectionType(conn.id, action.relationshipType);
            modified++;
          }
        }
        if (action.reason) reasons.push(action.reason);
      }

      const parts = [];
      if (added) parts.push(`${added} added`);
      if (removed) parts.push(`${removed} removed`);
      if (modified) parts.push(`${modified} modified`);

      toast({
        title: `Connections: ${parts.join(', ')}`,
        description: reasons.slice(0, 3).join(' • '),
      });

      onSolarLayout?.();
      setShowPrompt(false);
      setUserPrompt('');
    } catch (e: any) {
      console.error('AI connect error:', e);
      toast({ title: 'AI connection failed', description: e.message || 'Please try again', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={handleAIConnect}
            disabled={aiLoading}
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg gap-1.5 rounded-r-none"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Connect
          </Button>
          <Button
            size="sm"
            onClick={() => setShowPrompt(!showPrompt)}
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg px-1.5 rounded-l-none border-l border-primary-foreground/20"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {solarActive ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onResetLayout}
            className="gap-1.5 border-border bg-card/80 text-foreground hover:bg-secondary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onSolarLayout}
            className="gap-1.5 border-border bg-card/80 text-foreground hover:bg-secondary"
          >
            <Sun className="w-3.5 h-3.5" />
            Solar Layout
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setMergeOpen(true)}
          className="gap-1.5 border-border bg-card/80 text-foreground hover:bg-secondary"
        >
          <Merge className="w-3.5 h-3.5" />
          Merge Duplicates
        </Button>

        {allTags.map((tag) => {
          const active = activeFilters.includes(tag);
          const cat = CATEGORY_COLORS[tag] || { color: 'hsl(215 16% 45%)', glow: 'var(--glow-primary)' };
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

      {showPrompt && (
        <div className="max-w-md">
          <Textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="e.g. Remove connection between Alice and Bob, connect all Tech people, change John-Jane to mentor"
            className="bg-card/90 backdrop-blur-sm border-border text-foreground text-xs min-h-[60px] resize-none"
            rows={2}
          />
        </div>
      )}

      <MergeContactsDialog open={mergeOpen} onOpenChange={setMergeOpen} />
    </div>
  );
};

export default MindMapControls;
