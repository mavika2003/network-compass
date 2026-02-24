import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Building2, MapPin, Mail } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types';

interface SharedContact {
  id: string;
  name: string;
  company: string | null;
  job_title: string | null;
  email: string | null;
  category_tags: string[] | null;
  avatar_url: string | null;
  location: string | null;
}

interface SharedContactsViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
  ownerName: string;
}

const SharedContactsView = ({ open, onOpenChange, ownerId, ownerName }: SharedContactsViewProps) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<SharedContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) loadContacts();
  }, [open, user]);

  const loadContacts = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.rpc('get_shared_contacts', {
      viewer_id: user.id,
      owner_id: ownerId,
    });
    setContacts((data as SharedContact[]) || []);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{ownerName}'s Shared Contacts</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No shared contacts yet. They haven't shared any tags with you.
          </p>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-96">
            {contacts.map((c) => (
              <div key={c.id} className="bg-secondary/50 rounded-lg p-3 flex items-start gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={c.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-foreground text-[10px]">
                    {c.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {c.company && (
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{c.company}</span>
                    )}
                    {c.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                    )}
                  </div>
                  {c.category_tags && c.category_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.category_tags.map((tag) => {
                        const cat = CATEGORY_COLORS[tag] || { color: 'hsl(215 16% 45%)' };
                        return (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SharedContactsView;
