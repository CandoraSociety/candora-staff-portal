import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

// Add a persistent staff note (or safety alert) to a client's profile card.
// Entries must be objective — the dialog prompts for factual, non-accusatory language.
export default function ClientNoteDialog({ open, onOpenChange, client, onSaved }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [isSafetyAlert, setIsSafetyAlert] = useState(false);
  const [alertExplanation, setAlertExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setNote(''); setIsSafetyAlert(false); setAlertExplanation(''); }
  }, [open]);

  const handleSave = async () => {
    if (!note.trim()) { toast({ title: 'A note is required', variant: 'destructive' }); return; }
    if (isSafetyAlert && !alertExplanation.trim()) { toast({ title: 'A safety alert requires an explanation of the concern', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await base44.entities.RCClientNote.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        note: note.trim(),
        is_safety_alert: isSafetyAlert,
        safety_alert_explanation: isSafetyAlert ? alertExplanation.trim() : '',
        created_by_name: user?.full_name || '',
      });
      toast({ title: 'Note added to client profile' });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error adding note', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Profile Note</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground bg-muted/60 rounded-md p-3">
          Notes must be objective and factual — describe observed behaviour, dates, and actions taken.
          Avoid emotional or accusatory language, biased opinions, and unnecessary personal details.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="client-note">Note *</Label>
          <Textarea id="client-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Client has visited four times since May regarding the same housing concern..." />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="safety-alert" checked={isSafetyAlert} onCheckedChange={(v) => setIsSafetyAlert(!!v)} />
          <Label htmlFor="safety-alert" className="cursor-pointer font-medium">Safety Alert</Label>
        </div>
        {isSafetyAlert && (
          <div className="space-y-1.5">
            <Label htmlFor="safety-explanation">Safety Alert Explanation *</Label>
            <Textarea
              id="safety-explanation"
              value={alertExplanation}
              onChange={(e) => setAlertExplanation(e.target.value)}
              rows={3}
              placeholder="e.g. On Sept 5 the client arrived intoxicated and made verbal threats toward reception staff. Police were not called. Security has been informed."
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Add Note'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}