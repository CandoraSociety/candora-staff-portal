import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

export default function BITReviewCheckinPanel({ reviewIndex, scheduledDate, checkin, clientId, onSave, onCancel, saving }) {
  const [completed, setCompleted] = useState(checkin?.completed || false);
  const [date,      setDate]      = useState(checkin?.actual_date || checkin?.scheduled_date || scheduledDate || new Date().toISOString().split('T')[0]);
  const [notes,     setNotes]     = useState(checkin?.notes || '');

  const handleSave = () => {
    onSave({
      completed,
      actual_date:    completed ? date : '',
      scheduled_date: !completed ? date : (checkin?.scheduled_date || scheduledDate || ''),
      notes,
    });
  };

  return (
    <Card className="border-2 border-rose-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-rose-700">BIT Review {reviewIndex + 1}</CardTitle>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Status toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors ${!completed ? 'bg-slate-500 text-white border-slate-500' : 'border-slate-300 text-slate-500'}`}
            onClick={() => setCompleted(false)}
          >
            Pending
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors ${completed ? 'bg-green-500 text-white border-green-500' : 'border-green-300 text-green-600'}`}
            onClick={() => setCompleted(true)}
          >
            Completed
          </button>
        </div>

        <div>
          <Label className="text-xs font-semibold">{completed ? 'Date Check-in Occurred' : 'Scheduled Date'}</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
        </div>

        <div>
          <Label className="text-xs font-semibold">Progress Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 text-xs" placeholder="Document progress, barriers discussed, follow-ups..." />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Check-in'}</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}