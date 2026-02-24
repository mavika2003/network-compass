import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContactStore } from '@/stores/contactStore';
import { CATEGORY_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Send, Trash2, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  postType: string;
  location?: string | null;
  visibilityTags: string[];
  expiresAt?: string | null;
  createdAt: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  userId?: string;
}

type FeedMode = 'mine' | 'network';

const FeedPage = () => {
  const { user } = useAuth();
  const contacts = useContactStore((s) => s.contacts);
  const fetchContacts = useContactStore((s) => s.fetchContacts);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>('mine');

  const AVAILABLE_TAGS = Object.keys(CATEGORY_COLORS).filter((t) => t !== 'Default');

  useEffect(() => {
    if (user) {
      fetchContacts(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadPosts();
  }, [user, feedMode]);

  const loadPosts = async () => {
    if (!user) return;
    setLoading(true);

    if (feedMode === 'network') {
      const { data } = await supabase.rpc('get_visible_posts', { viewer_id: user.id });
      setPosts(
        (data || []).map((p: any) => ({
          id: p.id,
          content: p.content,
          imageUrl: p.image_url,
          postType: p.post_type || 'status',
          location: p.location,
          visibilityTags: p.visibility_tags || [],
          expiresAt: p.expires_at,
          createdAt: p.created_at,
          authorName: p.author_name,
          authorAvatar: p.author_avatar,
          userId: p.user_id,
        }))
      );
    } else {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPosts(
        (data || []).map((p: any) => ({
          id: p.id,
          content: p.content,
          imageUrl: p.image_url,
          postType: p.post_type || 'status',
          location: p.location,
          visibilityTags: p.visibility_tags || [],
          expiresAt: p.expires_at,
          createdAt: p.created_at,
          userId: p.user_id,
        }))
      );
    }
    setLoading(false);
  };

  const matchingContacts = contacts.filter((c) =>
    c.categoryTags.some((t) => selectedTags.includes(t))
  );

  const createPost = async () => {
    if (!user || !content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      visibility_tags: selectedTags,
      post_type: 'status',
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setContent('');
      setSelectedTags([]);
      loadPosts();
      toast({ title: 'Posted!', description: `Visible to ${matchingContacts.length} contacts.` });
    }
    setPosting(false);
  };

  const deletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    setPosts((p) => p.filter((post) => post.id !== id));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm justify-between">
        <h1 className="text-foreground font-semibold text-sm">Feed</h1>
        <div className="flex bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setFeedMode('mine')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              feedMode === 'mine' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Posts
          </button>
          <button
            onClick={() => setFeedMode('network')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              feedMode === 'network' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Network
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Compose — only in "My Posts" mode */}
        {feedMode === 'mine' && (
          <div className="p-4 border-b border-border bg-card/30">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update with your network..."
              className="bg-secondary border-border resize-none mb-3"
              rows={3}
            />

            <div className="mb-3">
              <span className="text-xs text-muted-foreground font-medium mb-1.5 block">Who can see this?</span>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  const cat = CATEGORY_COLORS[tag];
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border cursor-pointer"
                      style={{
                        backgroundColor: active ? `${cat.color}30` : 'transparent',
                        borderColor: active ? cat.color : 'hsl(var(--border))',
                        color: active ? cat.color : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedTags.length > 0 && matchingContacts.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-500 mb-3 bg-amber-500/10 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                No contacts match these tags — nobody will see this
              </div>
            )}

            {selectedTags.length > 0 && matchingContacts.length > 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                Visible to <strong className="text-foreground">{matchingContacts.length}</strong> contact{matchingContacts.length !== 1 ? 's' : ''}
              </p>
            )}

            <Button onClick={createPost} disabled={!content.trim() || posting} size="sm">
              <Send className="w-4 h-4 mr-1.5" /> Post
            </Button>
          </div>
        )}

        {/* Posts */}
        <div className="p-4 space-y-3">
          {loading && <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>}

          {!loading && posts.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
                <span className="text-2xl">{feedMode === 'network' ? '🌐' : '📬'}</span>
              </div>
              <h2 className="text-foreground font-semibold">
                {feedMode === 'network' ? 'No network posts yet' : 'No posts yet'}
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {feedMode === 'network'
                  ? 'Connect with users and share tags to see their posts here.'
                  : 'Share your first update with your network.'}
              </p>
            </div>
          )}

          {posts.map((post) => {
            const isOwn = post.userId === user?.id;
            return (
              <div key={post.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                {/* Author header for network posts */}
                {feedMode === 'network' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={post.authorAvatar || ''} />
                      <AvatarFallback className="bg-secondary text-foreground text-[9px]">
                        {(post.authorName || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">
                      {isOwn ? 'You' : post.authorName || 'Unknown'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <p className="text-sm text-foreground whitespace-pre-wrap flex-1">{post.content}</p>
                  {isOwn && (
                    <button onClick={() => deletePost(post.id)} className="text-muted-foreground hover:text-destructive ml-2 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {post.visibilityTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.visibilityTags.map((tag) => {
                      const cat = CATEGORY_COLORS[tag] || { color: 'hsl(215 16% 45%)', glow: 'var(--glow-primary)' };
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

                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(post.createdAt), 'MMM d, yyyy · h:mm a')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
