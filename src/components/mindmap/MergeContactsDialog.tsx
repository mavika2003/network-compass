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

interface TagMergeSuggestion {
  keepTag: string;
  mergeTag: string;
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
  const mergeTag = useContactStore((s) => s.mergeTag);
  const undoMerge = useContactStore((s) => s.undoMerge);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [suggestions, setSuggestions] = useState<MergeSuggestion[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagMergeSuggestion[]>([]);

  const handleFindDuplicates = async () => {
    if (!user || contacts.length < 2) return;
    setLoading(true);
    try {
      const allTags = Array.from(new Set(contacts.flatMap((c) => c.categoryTags)));
      const { data, error } = await supabase.functions.invoke('ai-merge', {
        body: { contacts, tags: allTags },
      });
      if (error) throw error;

      const merges = data?.merges || [];
      const tagMerges = data?.tagMerges || [];
      setSuggestions(merges.map((m: any) => ({ ...m, selected: true })));
      setTagSuggestions(tagMerges.map((m: any) => ({ ...m, selected: true })));

      if (merges.length === 0 && tagMerges.length === 0) {
        toast({ title: 'No duplicates found', description: 'All contacts and tags look unique!' });
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

  const toggleTagSuggestion = (index: number) => {
    setTagSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleMerge = async () => {
    if (!user) return;
    const selectedContacts = suggestions.filter((s) => s.selected);
    const selectedTags = tagSuggestions.filter((s) => s.selected);
    if (selectedContacts.length === 0 && selectedTags.length === 0) return;

    setMerging(true);
    const undoPayloads: any[] = [];

    try {
      // Merge contacts
      for (const s of selectedContacts) {
        const payload = await mergeContacts(s.keepId, s.mergeId, user.id);
        undoPayloads.push(payload);
      }

      // Merge tags
      for (const s of selectedTags) {
        await mergeTag(s.keepTag, s.mergeTag, user.id);
      }

      const parts = [];
      if (selectedContacts.length) parts.push(`${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''}`);
      if (selectedTags.length) parts.push(`${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`);

      toast({
        title: `Merged ${parts.join(' and ')}`,
        description: undoPayloads.length > 0 ? 'Click Undo to revert contact merges' : undefined,
        action: undoPayloads.length > 0 ? (
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
        ) : undefined,
        duration: 15000,
      });

      onOpenChange(false);
      setSuggestions([]);
      setTagSuggestions([]);
    } catch (e: any) {
      console.error('Merge error:', e);
      toast({ title: 'Merge failed', description: e.message || 'Please try again', variant: 'destructive' });
    } finally {
      setMerging(false);
    }
  };

  const totalSelected = suggestions.filter((s) => s.selected).length + tagSuggestions.filter((s) => s.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Merge Duplicates</DialogTitle>
        </DialogHeader>

        {suggestions.length === 0 && tagSuggestions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-muted-foreground text-center">
              AI will scan your contacts and tags for duplicates and suggest merges.
            </p>
            <Button onClick={handleFindDuplicates} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Scan for Duplicates
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="max-h-72 overflow-y-auto space-y-3">
              {suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Contact Duplicates ({suggestions.length})
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                      >
                        <Checkbox checked={s.selected} onCheckedChange={() => toggleSuggestion(i)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            Merge <span className="text-destructive">"{s.mergeName}"</span> → <span className="text-primary">"{s.keepName}"</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {tagSuggestions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Tag Duplicates ({tagSuggestions.length})
                  </p>
                  <div className="space-y-2">
                    {tagSuggestions.map((s, i) => (
                      <label
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                      >
                        <Checkbox checked={s.selected} onCheckedChange={() => toggleTagSuggestion(i)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            Merge tag <span className="text-destructive">"{s.mergeTag}"</span> → <span className="text-primary">"{s.keepTag}"</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setSuggestions([]); setTagSuggestions([]); onOpenChange(false); }}>
                Cancel
              </Button>
              <Button onClick={handleMerge} disabled={merging || totalSelected === 0} className="gap-1.5">
                {merging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Merge {totalSelected} item{totalSelected !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MergeContactsDialog;
