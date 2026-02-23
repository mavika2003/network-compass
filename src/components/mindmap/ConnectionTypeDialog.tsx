import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useContactStore } from '@/stores/contactStore';
import { useAuth } from '@/hooks/useAuth';

const RELATIONSHIP_TYPES = [
  { value: 'friend', label: 'Friend', color: 'hsl(var(--nm-pink))' },
  { value: 'colleague', label: 'Colleague', color: 'hsl(var(--nm-blue))' },
  { value: 'mutual', label: 'Mutual', color: 'hsl(var(--muted-foreground))' },
  { value: 'mentor', label: 'Mentor', color: 'hsl(var(--nm-purple))' },
];

const ConnectionTypeDialog = () => {
  const pendingConnection = useContactStore((s) => s.pendingConnection);
  const setPendingConnection = useContactStore((s) => s.setPendingConnection);
  const addConnection = useContactStore((s) => s.addConnection);
  const contacts = useContactStore((s) => s.contacts);
  const { user } = useAuth();

  if (!pendingConnection) return null;

  const sourceContact = contacts.find((c) => c.id === pendingConnection.source);
  const targetContact = contacts.find((c) => c.id === pendingConnection.target);

  const handleSelect = async (type: string) => {
    if (!user) return;
    await addConnection(user.id, pendingConnection.source, pendingConnection.target, type);
    setPendingConnection(null);
  };

  return (
    <Dialog open={!!pendingConnection} onOpenChange={() => setPendingConnection(null)}>
      <DialogContent className="bg-card border-border sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base">
            Connect {sourceContact?.name} & {targetContact?.name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Choose the relationship type</p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {RELATIONSHIP_TYPES.map((rt) => (
            <Button
              key={rt.value}
              variant="outline"
              className="h-12 flex flex-col gap-0.5 border-border hover:border-primary"
              onClick={() => handleSelect(rt.value)}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rt.color }} />
              <span className="text-sm text-foreground">{rt.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionTypeDialog;
