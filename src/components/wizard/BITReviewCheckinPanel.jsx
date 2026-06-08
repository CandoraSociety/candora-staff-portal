import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

export default function BITReviewCheckinPanel({ onSave, onClose }) {
  const [completed, setCompleted] = useState(false);
  const [actualDate, setActualDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        completed,
        actual_date: actualDate,
        notes,
        checkin_date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg">BIT Review Check-in</CardTitle>
          <p className="text-sm text-muted-foreground">Log a barrier identification review</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={completed}
            onCheckedChange={setCompleted}
            id="completed"
          />
          <Label htmlFor="completed" className="font-normal">
            Review completed
          </Label>
        </div>

        <div>
          <Label>Actual Date</Label>
          <Input
            type="date"
            value={actualDate}
            onChange={(e) => setActualDate(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-2"
            placeholder="Document what was discussed, progress on barriers, any changes needed..."
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Check-in'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}