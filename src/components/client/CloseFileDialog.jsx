import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const CLOSE_REASONS = [
  'completed_program',
  'no_show',
  'withdrew',
  'transferred',
  'not_eligible',
  'other'
];

export default function CloseFileDialog({ open, onOpenChange, onConfirm, client }) {
  const [closed_reason, setClosed_reason] = useState('completed_program');
  const [closed_date, setClosed_date] = useState(new Date().toISOString().split('T')[0]);
  const [closed_notes, setClosed_notes] = useState('');

  const handleConfirm = () => {
    onConfirm({ closed_reason, closed_date, closed_notes, file_closed: true, status: 'closed' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Client File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Closing Reason</Label>
            <Select value={closed_reason} onValueChange={setClosed_reason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLOSE_REASONS.map(reason => (
                  <SelectItem key={reason} value={reason}>
                    {reason.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Closing Date</Label>
            <Input type="date" value={closed_date} onChange={(e) => setClosed_date(e.target.value)} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={closed_notes} onChange={(e) => setClosed_notes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Close File</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}