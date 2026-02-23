import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useContactStore } from '@/stores/contactStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ParsedContact {
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  linkedinUrl: string;
  connectedOn: string;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseLinkedInCSV(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ' '));

  const idx = {
    firstName: header.findIndex((h) => h.includes('first name')),
    lastName: header.findIndex((h) => h.includes('last name')),
    url: header.findIndex((h) => h.includes('url')),
    email: header.findIndex((h) => h.includes('email')),
    company: header.findIndex((h) => h.includes('company')),
    position: header.findIndex((h) => h.includes('position')),
    connectedOn: header.findIndex((h) => h.includes('connected on')),
  };

  const contacts: ParsedContact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const firstName = idx.firstName >= 0 ? fields[idx.firstName] || '' : '';
    const lastName = idx.lastName >= 0 ? fields[idx.lastName] || '' : '';
    const name = `${firstName} ${lastName}`.trim();
    if (!name) continue;

    contacts.push({
      name,
      email: idx.email >= 0 ? fields[idx.email] || '' : '',
      company: idx.company >= 0 ? fields[idx.company] || '' : '',
      jobTitle: idx.position >= 0 ? fields[idx.position] || '' : '',
      linkedinUrl: idx.url >= 0 ? fields[idx.url] || '' : '',
      connectedOn: idx.connectedOn >= 0 ? fields[idx.connectedOn] || '' : '',
    });
  }
  return contacts;
}

const CSVImportDialog = () => {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addContact = useContactStore((s) => s.addContact);
  const updateContact = useContactStore((s) => s.updateContact);
  const contacts = useContactStore((s) => s.contacts);
  const { user } = useAuth();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const contacts = parseLinkedInCSV(text);
      setParsed(contacts);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user || parsed.length === 0) return;
    setImporting(true);
    
    const importedContacts: { id: string; name: string; company: string; jobTitle: string; email: string; notes: string }[] = [];
    
    for (const c of parsed) {
      try {
        const contactId = await addContact({
          name: c.name,
          email: c.email || null,
          company: c.company || null,
          jobTitle: c.jobTitle || null,
          notes: c.linkedinUrl || null,
          source: 'linkedin-csv',
          categoryTags: [],
          relationshipStrength: 50,
          lastContactedAt: c.connectedOn ? new Date(c.connectedOn).toISOString() : null,
        } as any, user.id);
        
        if (contactId) {
          importedContacts.push({
            id: contactId,
            name: c.name,
            company: c.company,
            jobTitle: c.jobTitle,
            email: c.email,
            notes: c.linkedinUrl,
          });
        }
      } catch {
        // skip failed rows
      }
    }

    toast({ title: `${importedContacts.length} contacts imported`, description: 'Running AI auto-tagging...' });

    // AI auto-tag all imported contacts
    if (importedContacts.length > 0) {
      try {
        const existingTags = Array.from(new Set(contacts.flatMap((ct) => ct.categoryTags)));
        const { data, error } = await supabase.functions.invoke('ai-tag-contacts', {
          body: { contacts: importedContacts, existingTags },
        });

        if (!error && data?.results) {
          let taggedCount = 0;
          for (const result of data.results) {
            if (result.id && result.suggestedTags?.length) {
              await updateContact(result.id, {
                categoryTags: result.suggestedTags,
                relationshipStrength: result.relationshipStrength ?? 50,
              });
              taggedCount++;
            }
          }
          toast({ title: `AI tagged ${taggedCount} contacts` });
        }
      } catch {
        toast({ title: 'AI tagging skipped', description: 'Contacts imported without tags', variant: 'destructive' });
      }
    }

    setParsed([]);
    setImporting(false);
    setOpen(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setParsed([]); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 border-border bg-card/80 text-foreground hover:bg-secondary">
          <Upload className="w-3.5 h-3.5" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import LinkedIn Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your LinkedIn <code className="text-xs bg-secondary px-1 py-0.5 rounded">Connections.csv</code> file. AI will auto-tag imported contacts.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
          {parsed.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="w-4 h-4" />
                {parsed.length} contacts found
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {parsed.slice(0, 20).map((c, i) => (
                  <div key={i} className="text-xs text-muted-foreground truncate">
                    {c.name}{c.company ? ` · ${c.company}` : ''}
                  </div>
                ))}
                {parsed.length > 20 && (
                  <div className="text-xs text-muted-foreground">...and {parsed.length - 20} more</div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={parsed.length === 0 || importing} className="gap-1.5">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Import {parsed.length > 0 ? `${parsed.length} Contacts` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;
