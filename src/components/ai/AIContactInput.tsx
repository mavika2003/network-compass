import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useContactStore } from '@/stores/contactStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mic, MicOff, Loader2, Sparkles, ClipboardPaste, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_COLORS } from '@/types';

interface ExtractedContact {
  name: string;
  company?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  notes?: string;
  suggestedTags?: string[];
  relationshipStrength?: number;
}

type Mode = 'idle' | 'recording' | 'processing' | 'preview';

const AIContactInput = () => {
  const [mode, setMode] = useState<Mode>('idle');
  const [open, setOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [extractedContacts, setExtractedContacts] = useState<ExtractedContact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef<any>(null);
  const addContact = useContactStore((s) => s.addContact);
  const contacts = useContactStore((s) => s.contacts);
  const { user } = useAuth();

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Not supported', description: 'Speech recognition is not supported in your browser.', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setMode('idle');
    };

    recognition.onend = () => {
      setTranscript(finalTranscript.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
    setMode('recording');
    setTranscript('');
  }, []);

  const stopRecording = useCallback(async () => {
    recognitionRef.current?.stop();
    setMode('processing');
    await extractFromText(transcript);
  }, [transcript]);

  // Collect existing tags from all contacts for AI similarity matching
  const getExistingTags = (): string[] => {
    const tagSet = new Set<string>();
    contacts.forEach((c) => c.categoryTags?.forEach((t) => tagSet.add(t)));
    Object.keys(CATEGORY_COLORS).forEach((t) => tagSet.add(t));
    return Array.from(tagSet);
  };

  const extractFromText = async (text: string) => {
    if (!text.trim()) {
      toast({ title: 'No text', description: 'Please provide some text to extract contacts from.', variant: 'destructive' });
      setMode('idle');
      return;
    }

    setMode('processing');
    try {
      const existingTags = getExistingTags();
      const { data, error } = await supabase.functions.invoke('ai-extract', {
        body: { text, existingTags },
      });

      if (error) throw error;
      if (!data?.contacts?.length) {
        toast({ title: 'No contacts found', description: 'AI could not extract any contacts from the text.' });
        setMode('idle');
        return;
      }

      setExtractedContacts(data.contacts);
      setCurrentIndex(0);
      setMode('preview');
    } catch (err: any) {
      console.error('Extraction error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to extract contacts.', variant: 'destructive' });
      setMode('idle');
    }
  };

  const handleExtract = async () => {
    await extractFromText(pasteText);
  };

  const saveContact = async (contact: ExtractedContact) => {
    if (!user) return;
    setSaving(true);
    try {
      await addContact({
        name: contact.name,
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        location: contact.location || '',
        email: contact.email || '',
        phone: contact.phone || '',
        notes: contact.notes || '',
        source: 'voice',
        categoryTags: contact.suggestedTags?.length ? contact.suggestedTags : ['Default'],
        relationshipStrength: contact.relationshipStrength ?? 50,
      }, user.id);
      toast({ title: 'Contact saved', description: `${contact.name} added to your network.` });

      if (currentIndex < extractedContacts.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setMode('idle');
        setOpen(false);
        setExtractedContacts([]);
        setPasteText('');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const skipContact = () => {
    if (currentIndex < extractedContacts.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setMode('idle');
      setOpen(false);
      setExtractedContacts([]);
      setPasteText('');
    }
  };

  const updateField = (field: keyof ExtractedContact, value: any) => {
    setExtractedContacts((prev) =>
      prev.map((c, i) => i === currentIndex ? { ...c, [field]: value } : c)
    );
  };

  const toggleTag = (tag: string) => {
    const current = extractedContacts[currentIndex];
    const tags = current.suggestedTags || [];
    const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    updateField('suggestedTags', newTags);
  };

  const current = extractedContacts[currentIndex];
  const AVAILABLE_TAGS = Object.keys(CATEGORY_COLORS).filter((t) => t !== 'Default');

  return (
    <>
      {/* Single sidebar button */}
      <button
        onClick={() => { setPasteText(''); setMode('idle'); setOpen(true); }}
        className="flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary text-sm cursor-pointer hover:bg-primary/20 transition-colors w-full"
      >
        <Sparkles className="w-5 h-5 shrink-0" />
        <span className="hidden lg:block font-medium">AI Extract</span>
      </button>

      {/* Combined dialog */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) { setMode('idle'); recognitionRef.current?.stop(); } setOpen(o); }}>
        <DialogContent className="bg-card border-border max-w-md">
          {mode === 'idle' && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> AI Contact Parser
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Paste any text — meeting notes, emails, bios — or use voice input, and AI will extract contact information.</p>
              <div className="relative">
                <Textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="e.g. Met Sarah at the yoga class. She's also into hiking and lives in Brooklyn..."
                  className="bg-secondary border-border min-h-[120px] pr-12"
                />
                <button
                  onClick={startRecording}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <Button onClick={handleExtract} disabled={!pasteText.trim()} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" /> Extract Contacts
              </Button>
            </div>
          )}

          {mode === 'recording' && (
            <div className="text-center space-y-6 py-6">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto animate-pulse">
                <Mic className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-foreground font-semibold text-lg">Listening...</h2>
                <p className="text-muted-foreground text-sm mt-1">Describe the person you met</p>
              </div>
              {transcript && (
                <div className="bg-secondary rounded-lg p-3 text-left">
                  <p className="text-sm text-foreground">{transcript}</p>
                </div>
              )}
              <Button onClick={stopRecording} variant="destructive" size="lg">
                <MicOff className="w-4 h-4 mr-2" /> Stop & Extract
              </Button>
            </div>
          )}

          {mode === 'processing' && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-sm">AI is extracting contact info...</p>
            </div>
          )}

          {mode === 'preview' && current && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    {extractedContacts.length > 1 ? `Contact ${currentIndex + 1} of ${extractedContacts.length}` : 'Extracted Contact'}
                  </span>
                  {extractedContacts.length > 1 && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" disabled={currentIndex === extractedContacts.length - 1} onClick={() => setCurrentIndex((i) => i + 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={current.name} onChange={(e) => updateField('name', e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company</Label>
                  <Input value={current.company || ''} onChange={(e) => updateField('company', e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Job Title</Label>
                  <Input value={current.jobTitle || ''} onChange={(e) => updateField('jobTitle', e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Input value={current.location || ''} onChange={(e) => updateField('location', e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input value={current.email || ''} onChange={(e) => updateField('email', e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input value={current.phone || ''} onChange={(e) => updateField('phone', e.target.value)} className="bg-secondary border-border" />
                </div>
              </div>

              {/* Editable Tags */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TAGS.map((tag) => {
                    const active = current.suggestedTags?.includes(tag);
                    const cat = CATEGORY_COLORS[tag];
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all border"
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
                  <Label className="text-xs text-muted-foreground">Priority Score</Label>
                  <span className="text-xs font-bold text-primary">{current.relationshipStrength ?? 50}</span>
                </div>
                <Slider
                  value={[current.relationshipStrength ?? 50]}
                  onValueChange={([v]) => updateField('relationshipStrength', v)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {current.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <Textarea value={current.notes} onChange={(e) => updateField('notes', e.target.value)} className="bg-secondary border-border" rows={2} />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={skipContact} variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-1" /> Skip
                </Button>
                <Button onClick={() => saveContact(current)} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  Save Contact
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIContactInput;
