import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CasualNotesPanel({ client, onSave }) {
  const [notes, setNotes] = useState(client?.casual_activity_log?.[0]?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const activityLog = [{
        date: new Date().toISOString().split('T')[0],
        notes: notes,
        activity_type: 'casual_engagement'
      }];
      
      await onSave({
        casual_activity_log: activityLog
      });
      toast.success('Casual activity notes saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Casual Client Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Document informal support provided to casual clients.
        </div>
        
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder="Document activities, support provided, and any follow-up needed..."
        />
        
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Activity Notes'}
        </Button>
      </CardContent>
    </Card>
  );
}