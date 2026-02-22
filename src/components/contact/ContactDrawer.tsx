import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useContactStore } from '@/stores/contactStore';
import { CATEGORY_COLORS } from '@/types';
import TagPills from './TagPills';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Mail, Phone, MapPin, Building, Trash2, Bell } from 'lucide-react';

const ContactDrawer = () => {
  const drawerOpen = useContactStore((s) => s.drawerOpen);
  const setDrawerOpen = useContactStore((s) => s.setDrawerOpen);
  const selectedContactId = useContactStore((s) => s.selectedContactId);
  const contacts = useContactStore((s) => s.contacts);
  const deleteContact = useContactStore((s) => s.deleteContact);
  const updateContact = useContactStore((s) => s.updateContact);

  const AVAILABLE_TAGS = Object.keys(CATEGORY_COLORS).filter((t) => t !== 'Default');

  const toggleTag = (tag: string) => {
    if (!contact) return;
    const newTags = contact.categoryTags.includes(tag)
      ? contact.categoryTags.filter((t) => t !== tag)
      : [...contact.categoryTags, tag];
    updateContact(contact.id, { categoryTags: newTags.length ? newTags : ['Default'] });
  };

  const contact = contacts.find((c) => c.id === selectedContactId);
  if (!contact) return null;

  const initials = contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const primaryTag = contact.categoryTags[0] || 'Default';
  const catColor = CATEGORY_COLORS[primaryTag] || CATEGORY_COLORS.Default;

  const strengthColor =
    contact.relationshipStrength >= 80 ? 'hsl(var(--nm-green))' :
    contact.relationshipStrength >= 50 ? 'hsl(var(--nm-amber))' :
    'hsl(var(--destructive))';

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="bg-card border-border w-[380px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-foreground shrink-0"
              style={{
                background: `linear-gradient(135deg, ${catColor.color}, hsl(var(--nm-elevated)))`,
                boxShadow: `0 0 20px ${catColor.color}30`,
              }}
            >
              {initials}
            </div>
            <div>
              <SheetTitle className="text-foreground text-lg">{contact.name}</SheetTitle>
              {contact.jobTitle && (
                <p className="text-sm text-muted-foreground">{contact.jobTitle}{contact.company ? ` at ${contact.company}` : ''}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-2">
          <div>
            <span className="text-xs text-muted-foreground font-medium mb-2 block">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const active = contact.categoryTags.includes(tag);
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

          {/* Editable Priority Score */}
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
