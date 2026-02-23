import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContactStore } from '@/stores/contactStore';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Loader2, MessageSquare, Phone, Coffee, Mail, RefreshCw, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types';

interface Suggestion {
  contactId: string;
  contactName: string;
  reason: string;
  suggestedAction: string;
  urgency: 'high' | 'medium' | 'low';
  suggestedMessage?: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  message: <MessageSquare className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  coffee: <Coffee className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
};

const urgencyStyles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  high: { bg: 'bg-destructive/10', text: 'text-destructive', icon: <AlertTriangle className="w-3 h-3" /> },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: <Clock className="w-3 h-3" /> },
  low: { bg: 'bg-green-500/10', text: 'text-green-500', icon: <CheckCircle2 className="w-3 h-3" /> },
};

const RemindersPage = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { user } = useAuth();
  const contacts = useContactStore((s) => s.contacts);
  const fetchContacts = useContactStore((s) => s.fetchContacts);
  const selectContact = useContactStore((s) => s.selectContact);

  useEffect(() => {
    if (user && contacts.length === 0) {
      fetchContacts(user.id);
    }
  }, [user]);

  const generateSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-reminders', {
        body: { userId: user.id },
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
      setHasLoaded(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getContactTag = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact?.categoryTags?.[0] || 'Default';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
        <h1 className="text-foreground font-semibold text-sm">AI Reminders</h1>
        <Button size="sm" onClick={generateSuggestions} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
          {hasLoaded ? 'Refresh' : 'Generate'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-sm">AI is analyzing your network...</p>
            </div>
          </div>
        )}

        {!loading && !hasLoaded && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-foreground font-semibold">AI Reconnect Suggestions</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Let AI analyze your contacts and suggest who you should reconnect with.</p>
              <Button onClick={generateSuggestions} size="lg">
                <Sparkles className="w-4 h-4 mr-2" /> Generate Suggestions
              </Button>
            </div>
          </div>
        )}

        {!loading && hasLoaded && suggestions.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No suggestions right now. Your network is well-maintained! 🎉</p>
          </div>
        )}

        <div className="space-y-3">
          {suggestions.map((suggestion, i) => {
            const urgency = urgencyStyles[suggestion.urgency] || urgencyStyles.medium;
            const tag = getContactTag(suggestion.contactId);
            const cat = CATEGORY_COLORS[tag] || { color: 'hsl(215 16% 45%)', glow: 'var(--glow-primary)' };
            const actionIcon = actionIcons[suggestion.suggestedAction] || actionIcons.message;

            return (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      onClick={() => selectContact(suggestion.contactId)}
                    >
                      {suggestion.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3
                        className="text-foreground font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => selectContact(suggestion.contactId)}
                      >
                        {suggestion.contactName}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${urgency.bg} ${urgency.text}`}>
                        {urgency.icon} {suggestion.urgency} priority
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs">
                    {actionIcon}
                    <span className="capitalize">{suggestion.suggestedAction}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{suggestion.reason}</p>

                {suggestion.suggestedMessage && (
                  <div className="bg-secondary/50 rounded-md p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Suggested message:</p>
                    <p className="text-sm text-foreground italic">"{suggestion.suggestedMessage}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RemindersPage;
