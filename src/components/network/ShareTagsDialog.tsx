import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTagStore } from '@/stores/tagStore';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ShareTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
}

const ShareTagsDialog = ({ open, onOpenChange, targetUserId, targetUserName }: ShareTagsDialogProps) => {
  const { user } = useAuth();
  const tags = useTagStore((s) => s.tags);
  const fetchTags = useTagStore((s) => s.fetchTags);
  const [sharedTagNames, setSharedTagNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchTags(user.id);
      loadSharedTags();
    }
  }, [open, user]);

  const loadSharedTags = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('shared_tags')
      .select('tag_name')
      .eq('owner_id', user.id)
      .eq('shared_with_id', targetUserId);
    setSharedTagNames(new Set((data || []).map((r: any) => r.tag_name)));
    setLoading(false);
  };

  const toggleTag = async (tagName: string) => {
    if (!user) return;
    const isShared = sharedTagNames.has(tagName);

    if (isShared) {
      await supabase
        .from('shared_tags')
        .delete()
        .eq('owner_id', user.id)
        .eq('shared_with_id', targetUserId)
        .eq('tag_name', tagName);
      setSharedTagNames((prev) => {
        const next = new Set(prev);
        next.delete(tagName);
        return next;
      });
    } else {
      await supabase.from('shared_tags').insert({
        owner_id: user.id,
        shared_with_id: targetUserId,
        tag_name: tagName,
      } as any);
      setSharedTagNames((prev) => new Set([...prev, tagName]));
    }

    toast({
      title: isShared ? 'Tag unshared' : 'Tag shared',
      description: `"${tagName}" ${isShared ? 'hidden from' : 'shared with'} ${targetUserName}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share tags with {targetUserName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground mb-3">
          Selected tags control which of your posts and contacts {targetUserName} can see.
        </p>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tags yet. Create tags first.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={sharedTagNames.has(tag.name)}
                  onCheckedChange={() => toggleTag(tag.name)}
                />
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm text-foreground">{tag.name}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareTagsDialog;
