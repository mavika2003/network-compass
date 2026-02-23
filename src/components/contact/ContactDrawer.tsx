import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useContactStore } from '@/stores/contactStore';
import { useTagStore } from '@/stores/tagStore';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORY_COLORS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Building, Trash2, Bell, Camera, Plus, X, Link2 } from 'lucide-react';

const ContactDrawer = () => {
  const drawerOpen = useContactStore((s) => s.drawerOpen);
  const setDrawerOpen = useContactStore((s) => s.setDrawerOpen);
  const selectedContactId = useContactStore((s) => s.selectedContactId);
  const contacts = useContactStore((s) => s.contacts);
  const connections = useContactStore((s) => s.connections);
  const deleteContact = useContactStore((s) => s.deleteContact);
  const deleteConnection = useContactStore((s) => s.deleteConnection);
  const updateContact = useContactStore((s) => s.updateContact);
  const tags = useTagStore((s) => s.tags);
  const addTag = useTagStore((s) => s.addTag);
  const deleteTag = useTagStore((s) => s.deleteTag);
  const { user } = useAuth();

  const [newTagName, setNewTagName] = useState('');
  const [showNewTag, setShowNewTag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BUILTIN_TAGS = Object.keys(CATEGORY_COLORS).filter((t) => t !== 'Default');
  const customTagNames = tags.map((t) => t.name);
  const ALL_TAGS = [...new Set([...BUILTIN_TAGS, ...customTagNames])];

  const contact = contacts.find((c) => c.id === selectedContactId);
  if (!contact) return null;

  const toggleTag = (tag: string) => {
    const newTags = contact.categoryTags.includes(tag)
      ? contact.categoryTags.filter((t) => t !== tag)
      : [...contact.categoryTags, tag];
    updateContact(contact.id, { categoryTags: newTags.length ? newTags : ['Default'] });
  };

  const handleAddNewTag = async () => {
    if (!newTagName.trim() || !user) return;
    const name = newTagName.trim();
    if (!ALL_TAGS.includes(name)) {
      await addTag(name, `hsl(${Math.floor(Math.random() * 360)} 70% 55%)`, user.id);
    }
    const newTags = [...contact.categoryTags.filter((t) => t !== 'Default'), name];
    updateContact(contact.id, { categoryTags: newTags });
    setNewTagName('');
    setShowNewTag(false);
  };

  const handleDeleteCustomTag = async (tagName: string) => {
    const tag = tags.find((t) => t.name === tagName);
    if (tag) await deleteTag(tag.id);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${contact.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('contact-photos').upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('contact-photos').getPublicUrl(path);
    await updateContact(contact.id, { avatarUrl: urlData.publicUrl });
    toast({ title: 'Photo updated!' });
    setUploading(false);
  };

  const initials = contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const primaryTag = contact.categoryTags[0];
  const catColor = (primaryTag && CATEGORY_COLORS[primaryTag]) || { color: 'hsl(215 16% 45%)', glow: 'var(--glow-primary)' };

  const strengthColor =
    contact.relationshipStrength >= 80 ? 'hsl(var(--nm-green))' :
    contact.relationshipStrength >= 50 ? 'hsl(var(--nm-amber))' :
    'hsl(var(--destructive))';

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="bg-card border-border w-[380px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {contact.avatarUrl ? (
                <img
                  src={contact.avatarUrl}
                  alt={contact.name}
                  className="w-16 h-16 rounded-full object-cover"
                  style={{ boxShadow: `0 0 20px ${catColor.color}30`, border: `2px solid ${catColor.color}60` }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-foreground"
                  style={{
                    background: `linear-gradient(135deg, ${catColor.color}, hsl(var(--nm-elevated)))`,
                    boxShadow: `0 0 20px ${catColor.color}30`,
                  }}
                >
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-5 h-5 text-foreground" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <SheetTitle className="text-foreground text-lg">{contact.name}</SheetTitle>
              {contact.jobTitle && (
                <p className="text-sm text-muted-foreground">{contact.jobTitle}{contact.company ? ` at ${contact.company}` : ''}</p>
              )}
              {uploading && <p className="text-xs text-primary">Uploading...</p>}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-2">
          {/* Tags with create & delete */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Tags</span>
              <button onClick={() => setShowNewTag(!showNewTag)} className="text-primary hover:text-primary/80">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {showNewTag && (
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag name"
                  className="bg-secondary border-border h-7 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                />
                <Button size="sm" onClick={handleAddNewTag} className="h-7 text-xs px-2">Add</Button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((tag) => {
                const active = contact.categoryTags.includes(tag);
                const cat = CATEGORY_COLORS[tag];
                const customTag = tags.find((t) => t.name === tag);
                const color = cat?.color || customTag?.color || 'hsl(var(--primary))';
                const isCustom = !BUILTIN_TAGS.includes(tag);
                return (
                  <div key={tag} className="relative group/tag">
                    <button
                      onClick={() => toggleTag(tag)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border cursor-pointer"
                      style={{
                        backgroundColor: active ? `${color}30` : 'transparent',
                        borderColor: active ? color : 'hsl(var(--border))',
                        color: active ? color : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {tag}
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => handleDeleteCustomTag(tag)}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] opacity-0 group-hover/tag:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground font-medium">Priority Score</span>
              <span className="text-xs font-bold" style={{ color: strengthColor }}>{contact.relationshipStrength}</span>
            </div>
            <Slider
              value={[contact.relationshipStrength]}
              onValueChange={([v]) => updateContact(contact.id, { relationshipStrength: v })}
              min={0}
              max={100}
              step={1}
            />
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            {contact.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{contact.phone}</span>
              </div>
            )}
            {contact.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{contact.location}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-3 text-sm">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{contact.company}</span>
              </div>
            )}
          </div>

          {/* Connections */}
          {(() => {
            const EDGE_COLORS: Record<string, string> = {
              friend: 'hsl(var(--nm-pink))',
              colleague: 'hsl(var(--nm-blue))',
              mutual: 'hsl(var(--muted-foreground))',
              mentor: 'hsl(var(--nm-purple))',
            };
            const contactConns = connections.filter(
              (c) => c.contactAId === contact.id || c.contactBId === contact.id
            );
            if (contactConns.length === 0) return null;
            return (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Connections</span>
                </div>
                <div className="space-y-1.5">
                  {contactConns.map((conn) => {
                    const otherId = conn.contactAId === contact.id ? conn.contactBId : conn.contactAId;
                    const other = contacts.find((c) => c.id === otherId);
                    if (!other) return null;
                    const color = EDGE_COLORS[conn.relationshipType] || EDGE_COLORS.mutual;
                    return (
                      <div key={conn.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm text-foreground">{other.name}</span>
                          <span className="text-[10px] text-muted-foreground capitalize">{conn.relationshipType}</span>
                        </div>
                        <button onClick={() => deleteConnection(conn.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {contact.notes && (
            <div>
              <h4 className="text-xs text-muted-foreground font-medium mb-2">Notes</h4>
              <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{contact.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Added via</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{contact.source}</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 text-muted-foreground">
              <Bell className="w-3.5 h-3.5 mr-1.5" /> Remind
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => { deleteContact(contact.id); setDrawerOpen(false); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ContactDrawer;
