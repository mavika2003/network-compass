import { useState } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, Undo2 } from 'lucide-react';

interface MergeSuggestion {
  keepId: string;
  mergeId: string;
  keepName: string;
  mergeName: string;
  reason: string;
  selected: boolean;
}

interface MergeContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MergeContactsDialog = ({ open, onOpenChange }: MergeContactsDialogProps) => {
  const contacts = useContactStore((s) => s.contacts);
  const mergeContacts = useContactStore((s) => s.mergeContacts);
  const undoMerge = useContactStore((s) => s.undoMerge);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [suggestions, setSuggestions] = useState<MergeSuggestion[]>([]);

  const handleFindDuplicates = async () => {
    if (!user || contacts.length < 2) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-merge', {
        body: { contacts },
      });
      if (error) throw error;

      const merges = data?.merges || [];
      setSuggestions(merges.map((m: any) => ({ ...m, selected: true })));

      if (merges.length === 0) {
        toast({ title: 'No duplicates found', description: 'All contacts look unique!' });
      }
    } catch (e: any) {
      console.error('AI merge error:', e);
      toast({ title: 'Merge scan failed', description: e.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleMerge = async () => {
    if (!user) return;
    const selected = suggestions.filter((s) => s.selected);
    if (selected.length === 0) return;

    setMerging(true);
    const undoPayloads: any[] = [];

    try {
      for (const s of selected) {
        const payload = await mergeContacts(s.keepId, s.mergeId, user.id);
        undoPayloads.push(payload);
      }

      toast({
        title: `${selected.length} contact${selected.length !== 1 ? 's' : ''} merged`,
        description: 'Click Undo to revert',
        action: (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={async () => {
              for (const payload of undoPayloads.reverse()) {
                await undoMerge(payload, user.id);
              }
              toast({ title: 'Merge undone', description: 'Contacts restored' });
            }}
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </Button>
        ),
        duration: 15000,
      });

      onOpenChange(false);
      setSuggestions([]);
    } catch (e: any) {
      console.error('Merge error:', e);
      toast({ title: 'Merge failed', description: e.message || 'Please try again', variant: 'destructive' });
    } finally {
      setMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Merge Duplicate Contacts</DialogTitle>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-muted-foreground text-center">
              AI will scan your contacts for likely duplicates and suggest merges.
            </p>
            <Button onClick={handleFindDuplicates} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Scan for Duplicates
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              {suggestions.length} potential duplicate{suggestions.length !== 1 ? 's' : ''} found. Select which to merge:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {suggestions.map((s, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={s.selected}
                    onCheckedChange={() => toggleSuggestion(i)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Merge <span className="text-destructive">"{s.mergeName}"</span> → <span className="text-primary">"{s.keepName}"</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setSuggestions([]); onOpenChange(false); }}>
                Cancel
              </Button>
              <Button
                onClick={handleMerge}
                disabled={merging || suggestions.every((s) => !s.selected)}
                className="gap-1.5"
              >
                {merging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Merge {suggestions.filter((s) => s.selected).length} Contact{suggestions.filter((s) => s.selected).length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MergeContactsDialog;
