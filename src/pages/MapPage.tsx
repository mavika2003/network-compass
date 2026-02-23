import { useEffect } from 'react';
import MindMapCanvas from '@/components/mindmap/MindMapCanvas';
import ContactDrawer from '@/components/contact/ContactDrawer';
import ContactForm from '@/components/contact/ContactForm';
import { useContactStore } from '@/stores/contactStore';
import { useTagStore } from '@/stores/tagStore';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const MapPage = () => {
  const contacts = useContactStore((s) => s.contacts);
  const loading = useContactStore((s) => s.loading);
  const fetchContacts = useContactStore((s) => s.fetchContacts);
  const fetchTags = useTagStore((s) => s.fetchTags);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchContacts(user.id);
      fetchTags(user.id);
    }
  }, [user, fetchContacts, fetchTags]);

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-foreground font-semibold text-sm">Your Network</h1>
          <p className="text-muted-foreground text-xs">{contacts.length} connections</p>
        </div>
        <ContactForm />
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">🗺️</span>
              </div>
              <h2 className="text-foreground font-semibold text-lg">Your map is empty</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Add your first contact to start building your network mind map.</p>
              <ContactForm />
            </div>
          </div>
        ) : (
          <MindMapCanvas />
        )}
      </div>

      <ContactDrawer />
    </div>
  );
};

export default MapPage;
