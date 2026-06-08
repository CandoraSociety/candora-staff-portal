import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CHANGE_TYPES = [
  'stream_switch',
  'program_status_change',
  'file_opened',
  'file_closed',
  'employment_outcome',
  'post_completion_status',
  'followup_90day',
  'other'
];

export default function StatusChangeDialog({ open, onOpenChange, client, onSaved }) {
  const [change_type, setChange_type] = useState('program_status_change');
  const [change_date, setChange_date] = useState(new Date().toISOString().split('T')[0]);
  const [from_value, setFrom_value] = useState('');
  const [to_value, setTo_value] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.StatusChange.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        change_type,
        change_date,
        from_value,
        to_value,
        notes,
        logged_by: user.email,
        logged_by_name: user.full_name || user.email,
        billing_relevant: ['employment_outcome', 'post_completion_status', 'followup_90day'].includes(change_type)
      });
      toast.success('Status change logged');
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to log status change');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Status Change</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Type of Change</Label>
            <Select value={change_type} onValueChange={setChange_type}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={change_date} onChange={(e) => setChange_date(e.target.value)} />
          </div>
          <div>
            <Label>From</Label>
            <Input value={from_value} onChange={(e) => setFrom_value(e.target.value)} placeholder="Previous value" />
          </div>
          <div>
            <Label>To</Label>
            <Input value={to_value} onChange={(e) => setTo_value(e.target.value)} placeholder="New value" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save Change</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}