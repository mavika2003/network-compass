import MindMapCanvas from '@/components/mindmap/MindMapCanvas';
import ContactDrawer from '@/components/contact/ContactDrawer';
import ContactForm from '@/components/contact/ContactForm';
import { useContactStore } from '@/stores/contactStore';

const MapPage = () => {
  const contacts = useContactStore((s) => s.contacts);

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-foreground font-semibold text-sm">Your Network</h1>
          <p className="text-muted-foreground text-xs">{contacts.length} connections</p>
        </div>
        <ContactForm />
      </div>

      {/* Map */}
      <div className="flex-1">
        <MindMapCanvas />
      </div>

      <ContactDrawer />
    </div>
  );
};

export default MapPage;
