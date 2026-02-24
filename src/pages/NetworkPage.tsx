import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserCard from '@/components/network/UserCard';
import ShareTagsDialog from '@/components/network/ShareTagsDialog';
import SharedContactsView from '@/components/network/SharedContactsView';
import { toast } from '@/hooks/use-toast';
import { Search, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  job_title: string | null;
}

interface UserConnection {
  id: string;
  requester_id: string;
  responder_id: string;
  status: string;
}

const NetworkPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog state
  const [shareTagsTarget, setShareTagsTarget] = useState<Profile | null>(null);
  const [viewContactsTarget, setViewContactsTarget] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) loadConnections();
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_connections')
      .select('*')
      .or(`requester_id.eq.${user.id},responder_id.eq.${user.id}`);

    const conns = (data || []) as UserConnection[];
    setConnections(conns);

    // Fetch profiles for all connected users
    const otherIds = conns.map((c) => (c.requester_id === user.id ? c.responder_id : c.requester_id));
    if (otherIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio, job_title')
        .in('id', otherIds);
      const map = new Map<string, Profile>();
      (profileData || []).forEach((p: any) => map.set(p.id, p));
      setProfiles(map);
    }
    setLoading(false);
  };

  const searchUsers = async () => {
    if (!user || !search.trim()) return;
    setSearching(true);
    const term = `%${search.trim()}%`;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, bio, job_title')
      .or(`name.ilike.${term},username.ilike.${term}`)
      .neq('id', user.id)
      .limit(20);
    setSearchResults((data || []) as Profile[]);
    setSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (search.trim()) searchUsers(); else setSearchResults([]); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getConnectionStatus = (profileId: string): { status: 'none' | 'pending_sent' | 'pending_received' | 'accepted'; conn?: UserConnection } => {
    const conn = connections.find(
      (c) => (c.requester_id === profileId || c.responder_id === profileId)
    );
    if (!conn) return { status: 'none' };
    if (conn.status === 'accepted') return { status: 'accepted', conn };
    if (conn.status === 'pending' && conn.requester_id === user?.id) return { status: 'pending_sent', conn };
    if (conn.status === 'pending' && conn.responder_id === user?.id) return { status: 'pending_received', conn };
    return { status: 'none' };
  };

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    setActionLoading(targetId);
    const { error } = await supabase.from('user_connections').insert({
      requester_id: user.id,
      responder_id: targetId,
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request sent!' });
      loadConnections();
    }
    setActionLoading(null);
  };

  const respondRequest = async (connId: string, accept: boolean) => {
    setActionLoading(connId);
    if (accept) {
      await supabase.from('user_connections').update({ status: 'accepted' } as any).eq('id', connId);
      toast({ title: 'Connected!' });
    } else {
      await supabase.from('user_connections').delete().eq('id', connId);
      toast({ title: 'Request rejected' });
    }
    loadConnections();
    setActionLoading(null);
  };

  const disconnect = async (connId: string) => {
    setActionLoading(connId);
    await supabase.from('user_connections').delete().eq('id', connId);
    toast({ title: 'Disconnected' });
    loadConnections();
    setActionLoading(null);
  };

  const pendingIncoming = connections.filter((c) => c.status === 'pending' && c.responder_id === user?.id);
  const pendingOutgoing = connections.filter((c) => c.status === 'pending' && c.requester_id === user?.id);
  const accepted = connections.filter((c) => c.status === 'accepted');

  const getOtherProfile = (conn: UserConnection): Profile | undefined => {
    const otherId = conn.requester_id === user?.id ? conn.responder_id : conn.requester_id;
    return profiles.get(otherId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm">
        <h1 className="text-foreground font-semibold text-sm">Network</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="discover" className="flex-1">Discover</TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              Requests {pendingIncoming.length > 0 && (
                <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5">
                  {pendingIncoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="connected" className="flex-1">Connected ({accepted.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or username..."
                className="pl-9 bg-secondary border-border"
              />
            </div>

            {searching && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

            {!searching && searchResults.length === 0 && search.trim() && (
              <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
            )}

            {!searching && !search.trim() && (
              <p className="text-center text-muted-foreground text-sm py-8">Search for users to connect with</p>
            )}

            <div className="space-y-2">
              {searchResults.map((p) => {
                const { status, conn } = getConnectionStatus(p.id);
                return (
                  <UserCard
                    key={p.id}
                    profile={p}
                    connectionStatus={status}
                    onConnect={() => sendRequest(p.id)}
                    onAccept={() => conn && respondRequest(conn.id, true)}
                    onReject={() => conn && respondRequest(conn.id, false)}
                    loading={actionLoading === p.id || actionLoading === conn?.id}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

            {!loading && pendingIncoming.length === 0 && pendingOutgoing.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No pending requests</p>
            )}

            {pendingIncoming.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Incoming</h3>
                <div className="space-y-2">
                  {pendingIncoming.map((conn) => {
                    const p = getOtherProfile(conn);
                    if (!p) return null;
                    return (
                      <UserCard
                        key={conn.id}
                        profile={p}
                        connectionStatus="pending_received"
                        onAccept={() => respondRequest(conn.id, true)}
                        onReject={() => respondRequest(conn.id, false)}
                        loading={actionLoading === conn.id}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {pendingOutgoing.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sent</h3>
                <div className="space-y-2">
                  {pendingOutgoing.map((conn) => {
                    const p = getOtherProfile(conn);
                    if (!p) return null;
                    return <UserCard key={conn.id} profile={p} connectionStatus="pending_sent" />;
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="connected">
            {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

            {!loading && accepted.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No connections yet. Discover users to connect with!</p>
            )}

            <div className="space-y-2">
              {accepted.map((conn) => {
                const p = getOtherProfile(conn);
                if (!p) return null;
                return (
                  <UserCard
                    key={conn.id}
                    profile={p}
                    connectionStatus="accepted"
                    onManageTags={() => setShareTagsTarget(p)}
                    onViewContacts={() => setViewContactsTarget(p)}
                    onDisconnect={() => disconnect(conn.id)}
                    loading={actionLoading === conn.id}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {shareTagsTarget && (
        <ShareTagsDialog
          open={!!shareTagsTarget}
          onOpenChange={(open) => !open && setShareTagsTarget(null)}
          targetUserId={shareTagsTarget.id}
          targetUserName={shareTagsTarget.name || 'User'}
        />
      )}

      {viewContactsTarget && (
        <SharedContactsView
          open={!!viewContactsTarget}
          onOpenChange={(open) => !open && setViewContactsTarget(null)}
          ownerId={viewContactsTarget.id}
          ownerName={viewContactsTarget.name || 'User'}
        />
      )}
    </div>
  );
};

export default NetworkPage;
