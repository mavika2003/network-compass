import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useContactStore } from '@/stores/contactStore';
import { CATEGORY_COLORS } from '@/types';
import TagPills from './TagPills';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Building, Trash2, Bell } from 'lucide-react';

const ContactDrawer = () => {
  const drawerOpen = useContactStore((s) => s.drawerOpen);
  const setDrawerOpen = useContactStore((s) => s.setDrawerOpen);
  const selectedContactId = useContactStore((s) => s.selectedContactId);
  const contacts = useContactStore((s) => s.contacts);
  const deleteContact = useContactStore((s) => s.deleteContact);

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
          <TagPills tags={contact.categoryTags} size="md" />

          {/* Relationship Strength */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground font-medium">Relationship Strength</span>
              <span className="text-xs font-bold" style={{ color: strengthColor }}>{contact.relationshipStrength}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${contact.relationshipStrength}%`, backgroundColor: strengthColor }}
              />
            </div>
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
