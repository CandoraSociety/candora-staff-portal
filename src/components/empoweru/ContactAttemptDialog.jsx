import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { ACCOUNT_SETUP_CONTACT_METHODS } from '@/lib/empoweruConstants';

const toLocalInput = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Logs a contact attempt for an account-setup record: date/time (defaults to
// now, editable), contact method checkboxes and comments.
export default function ContactAttemptDialog({ open, onOpenChange, record, onSaved }) {
  const { toast } = useToast();
  const [dateTime, setDateTime] = useState('');
  const [methods, setMethods] = useState([]);
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDateTime(toLocalInput(new Date()));
      setMethods([]);
      setComments('');
    }
  }, [open]);

  const toggleMethod = (m) => setMethods(p => (p.includes(m) ? p.filter(x => x !== m) : [...p, m]));

  const handleSave = async () => {
    if (methods.length === 0) {
      toast({ title: 'Select at least one contact method', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const iso = new Date(dateTime).toISOString();
      const attempts = [...(record.contact_attempts || []), { date_time: iso, methods, comments }];
      // Legacy records can have a higher attempt count than detailed entries — never count down
      const count = Math.max(record.follow_up_attempts || 0, attempts.length);
      const lastDate = !record.last_contact_attempt_date || iso >= record.last_contact_attempt_date
        ? iso
        : record.last_contact_attempt_date;
      await base44.entities.EmpowerUAccountSetup.update(record.id, {
        contact_attempts: attempts,
        follow_up_attempts: count,
        last_contact_attempt_date: lastDate,
      });
      toast({ title: 'Contact attempt logged', description: `${count} total attempts` });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Contact Attempt</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground -mt-3">{record?.participant_name} · {record?.cohort_name}</p>
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Contact method</Label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_SETUP_CONTACT_METHODS.map(m => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={methods.includes(m)} onCheckedChange={() => toggleMethod(m)} /> {m}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Comments</Label>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="How did it go? Next steps?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Log Attempt'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}