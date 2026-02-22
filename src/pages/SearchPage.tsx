import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContactStore } from '@/stores/contactStore';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Search, Sparkles, Loader2, MapPin, Building, Tag } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [summary, setSummary] = useState('');
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuth();
  const contacts = useContactStore((s) => s.contacts);
  const fetchContacts = useContactStore((s) => s.fetchContacts);
  const selectContact = useContactStore((s) => s.selectContact);

  useEffect(() => {
    if (user && contacts.length === 0) {
      fetchContacts(user.id);
    }
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query: query.trim(), userId: user.id },
      });

      if (error) throw error;
      setMatchedIds(data.matchedIds || []);
      setSummary(data.summary || '');
    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const matchedContacts = contacts.filter((c) => matchedIds.includes(c.id));

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm">
        <h1 className="text-foreground font-semibold text-sm">AI Search</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "investors I met at hackathons" or "friends in NYC"'
            className="bg-card border-border pl-10 pr-12"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </form>

        {/* Summary */}
        {summary && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-foreground flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              {summary}
            </p>
          </div>
        )}

        {/* Results */}
        {hasSearched && !searching && matchedContacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No contacts matched your search.</p>
          </div>
        )}

        <div className="grid gap-2">
          {matchedContacts.map((contact) => {
            const primaryTag = contact.categoryTags?.[0] || 'Default';
            const cat = CATEGORY_COLORS[primaryTag] || CATEGORY_COLORS.Default;
            return (
              <button
                key={contact.id}
                onClick={() => selectContact(contact.id)}
                className="w-full text-left bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground font-medium text-sm truncate">{contact.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {contact.company && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building className="w-3 h-3" /> {contact.company}
                        </span>
                      )}
                      {contact.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {contact.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {contact.categoryTags?.slice(0, 2).map((tag) => {
                      const tagCat = CATEGORY_COLORS[tag];
                      return (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: tagCat ? `${tagCat.color}20` : 'hsl(var(--secondary))',
                            color: tagCat?.color || 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {!hasSearched && (
          <div className="flex-1 flex items-center justify-center pt-20">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-foreground font-semibold">Smart Search</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Search your network with natural language. AI understands context, not just keywords.</p>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {['investors in SF', 'friends from hackathons', 'people at Google'].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setQuery(ex); }}
                    className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-xs hover:text-foreground hover:bg-secondary/80 transition-colors border border-border"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
