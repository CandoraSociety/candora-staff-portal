import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

const EI_CODES = [
  'A - Shortage of work',
  'B - Strike or lockout',
  'C - Return to school',
  'D - Illness or injury',
  'E - Quit',
  'F - Maternity/Parental leave',
  'G - Compassionate care/family caregiver',
  'H - Work-sharing',
  'J - Apprentice training',
  'K - Other',
  'M - Dismissal',
  'N - Leave of absence',
  'P - Parental leave',
  'Z - Compassionate care',
];

export default function ConcludeEmploymentDialog({ open, onOpenChange, employee, onConfirm, isLoading }) {
  const [form, setForm] = useState({
    termination_date: new Date().toISOString().split('T')[0],
    termination_reason_code: '',
    termination_comments: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <AlertTriangle className="w-5 h-5" /> Conclude Employment
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will mark <strong>{employee?.first_name} {employee?.last_name}</strong> as terminated and disable their platform access. They will be moved to the Former Employees section.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
          🔐 Login access will be automatically revoked when you conclude their employment.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Last Day of Employment *</Label>
            <Input
              type="date"
              value={form.termination_date}
              onChange={e => setForm(f => ({ ...f, termination_date: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>EI Reason Code *</Label>
            <Select
              value={form.termination_reason_code}
              onValueChange={v => setForm(f => ({ ...f, termination_reason_code: v }))}
              required
            >
              <SelectTrigger><SelectValue placeholder="Select reason code..." /></SelectTrigger>
              <SelectContent>
                {EI_CODES.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">As per Employment Insurance categories (Record of Employment)</p>
          </div>
          <div className="space-y-1">
            <Label>Comments</Label>
            <Textarea
              value={form.termination_comments}
              onChange={e => setForm(f => ({ ...f, termination_comments: e.target.value }))}
              placeholder="Additional notes about the end of employment..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              disabled={isLoading || !form.termination_reason_code}
            >
              {isLoading ? 'Processing...' : 'Conclude Employment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}