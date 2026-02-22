import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useContactStore } from '@/stores/contactStore';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types';

const AVAILABLE_TAGS = Object.keys(CATEGORY_COLORS).filter((t) => t !== 'Default');

const ContactForm = () => {
  const [open, setOpen] = useState(false);
  const addContact = useContactStore((s) => s.addContact);
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '', company: '', jobTitle: '', location: '', email: '', phone: '', notes: '', categoryTags: [] as string[], relationshipStrength: 50,
  });

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      categoryTags: f.categoryTags.includes(tag) ? f.categoryTags.filter((t) => t !== tag) : [...f.categoryTags, tag],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !user) return;
    addContact({
      ...form,
      source: 'manual',
      relationshipStrength: form.relationshipStrength,
      categoryTags: form.categoryTags.length ? form.categoryTags : ['Default'],
    }, user.id);
    setForm({ name: '', company: '', jobTitle: '', location: '', email: '', phone: '', notes: '', categoryTags: [], relationshipStrength: 50 });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1.5" /> Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" placeholder="John Doe" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Company</Label>
              <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className="bg-secondary border-border" placeholder="Acme Inc" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Job Title</Label>
              <Input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} className="bg-secondary border-border" placeholder="Engineer" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="bg-secondary border-border" placeholder="NYC" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="bg-secondary border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const active = form.categoryTags.includes(tag);
                const cat = CATEGORY_COLORS[tag];
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all border"
                    style={{
                      backgroundColor: active ? `${cat.color}30` : 'transparent',
                      borderColor: active ? cat.color : 'hsl(240 14% 16%)',
                      color: active ? cat.color : 'hsl(215 16% 65%)',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-xs text-muted-foreground">Priority Score</Label>
              <span className="text-xs font-bold text-primary">{form.relationshipStrength}</span>
            </div>
            <Slider
              value={[form.relationshipStrength]}
              onValueChange={([v]) => setForm((f) => ({ ...f, relationshipStrength: v }))}
              min={0}
              max={100}
              step={1}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="bg-secondary border-border" rows={2} />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            Add to Network
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactForm;
