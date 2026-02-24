import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Clock, UserCheck, UserX, X } from 'lucide-react';

interface UserCardProps {
  profile: {
    id: string;
    name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    job_title: string | null;
  };
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  onConnect?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onDisconnect?: () => void;
  onManageTags?: () => void;
  onViewContacts?: () => void;
  loading?: boolean;
}

const UserCard = ({
  profile,
  connectionStatus = 'none',
  onConnect,
  onAccept,
  onReject,
  onDisconnect,
  onManageTags,
  onViewContacts,
  loading,
}: UserCardProps) => {
  const initials = (profile.name || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarImage src={profile.avatar_url || ''} />
        <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{profile.name || 'Unnamed'}</p>
        {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
        {profile.job_title && <p className="text-xs text-muted-foreground mt-0.5">{profile.job_title}</p>}
        {profile.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>}

        {connectionStatus === 'accepted' && (
          <div className="flex gap-1.5 mt-2">
            {onManageTags && (
              <Button size="sm" variant="outline" onClick={onManageTags} className="text-xs h-7">
                Share Tags
              </Button>
            )}
            {onViewContacts && (
              <Button size="sm" variant="outline" onClick={onViewContacts} className="text-xs h-7">
                View Contacts
              </Button>
            )}
            {onDisconnect && (
              <Button size="sm" variant="ghost" onClick={onDisconnect} className="text-xs h-7 text-destructive hover:text-destructive">
                <X className="w-3 h-3 mr-1" /> Remove
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0">
        {connectionStatus === 'none' && onConnect && (
          <Button size="sm" onClick={onConnect} disabled={loading} className="h-8">
            <UserPlus className="w-3.5 h-3.5 mr-1" /> Connect
          </Button>
        )}
        {connectionStatus === 'pending_sent' && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )}
        {connectionStatus === 'pending_received' && (
          <div className="flex gap-1">
            <Button size="sm" onClick={onAccept} disabled={loading} className="h-7 text-xs">
              <UserCheck className="w-3 h-3 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={onReject} disabled={loading} className="h-7 text-xs">
              <UserX className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;
