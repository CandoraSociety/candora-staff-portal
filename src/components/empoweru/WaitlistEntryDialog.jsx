import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { WAITLIST_STATUS_OPTIONS } from '@/lib/empoweruConstants';

// Light waitlist tracking — status, last contact note/date, follow-up date.
export default function WaitlistEntryDialog({ entry, open, onClose, onSaved }) {
  const { toast } = useToast();
  const [status, setStatus] = useState('waiting');
  const [note, setNote] = useState('');
  const [contactedDate, setContactedDate] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setStatus(entry.waitlist_status || 'waiting');
      setNote(entry.last_contact_note || '');
      setContactedDate(entry.last_contacted_date || '');
      setFollowUp(entry.follow_up_date || '');
    }
  }, [entry]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.EmpowerURegistration.update(entry.id, {
        waitlist_status: status,
        last_contact_note: note || null,
        last_contacted_date: contactedDate || null,
        follow_up_date: followUp || null,
      });
      toast({ title: 'Waitlist entry updated' });
      onSaved?.();
      onClose();
    } catch {
      toast({ title: 'Could not save — please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update waitlist entry — {entry?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WAITLIST_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Last contacted</Label>
              <Input type="date" value={contactedDate} onChange={(e) => setContactedDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Follow up on</Label>
              <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contact note</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened on the last contact" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}