import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PROGRAM_REFERRAL_OPTIONS } from '@/lib/programReferralConstants';

// Refers a person into one or more Candora internal programs. The referral
// shows up on the receiving portal's dashboard and in Central Registration.
export default function ReferralToProgramDialog({ open, onOpenChange, person, sourceLabel, onCreated }) {
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setSelected([]); setNotes(''); }
  }, [open]);

  const toggle = (value) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleSave = async () => {
    if (selected.length === 0) { toast.error('Choose at least one program to refer to'); return; }
    setSaving(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.ProgramReferral.bulkCreate(selected.map((program) => ({
        client_id: person?.clientId || undefined,
        rc_client_id: person?.rcClientId || undefined,
        client_name: person?.name || '',
        client_phone: person?.phone || undefined,
        client_email: person?.email || undefined,
        program,
        source_label: sourceLabel || undefined,
        referred_by_name: me?.full_name || me?.email || '',
        referred_by_email: me?.email || '',
        referral_date: new Date().toISOString().split('T')[0],
        status: 'new',
        notes: notes.trim() || undefined,
      })));
      toast.success(selected.length === 1 ? 'Referral sent' : `${selected.length} referrals sent`);
      onCreated?.();
      onOpenChange(false);
    } catch {
      toast.error('Could not create the referral');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Refer {person?.name || 'this person'} to a program</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
            <p className="text-sm font-medium text-foreground">{person?.name}</p>
            <p className="text-xs text-muted-foreground">
              {[person?.phone, person?.email].filter(Boolean).join(' · ') || 'No contact details on file'}
              {sourceLabel ? ` · referred from ${sourceLabel}` : ''}
            </p>
          </div>
          <div>
            <Label className="mb-2 block">Receiving program(s)</Label>
            <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
              {PROGRAM_REFERRAL_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-3">
                  <Checkbox
                    id={`ref-${opt.value}`}
                    checked={selected.includes(opt.value)}
                    onCheckedChange={() => toggle(opt.value)}
                  />
                  <Label htmlFor={`ref-${opt.value}`} className="text-sm font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes for the receiving program</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Why are they being referred? Anything the program should know?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Sending…' : 'Send referral'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}