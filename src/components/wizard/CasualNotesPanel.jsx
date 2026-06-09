import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function CasualNotesPanel({ client, onSave }) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const log = client?.casual_activity_log || [];

  const handleSave = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      let user = null;
      try { user = await base44.auth.me(); } catch (_) {}

      const entry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        note: newNote.trim(),
        logged_by: user?.email || '',
        logged_by_name: user?.full_name || '',
        logged_at: new Date().toISOString(),
      };

      const updated = [entry, ...log];
      await onSave({ casual_activity_log: updated });
      setNewNote('');
      toast.success('Activity logged');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Casual Client Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Document informal support provided to this casual client.
          </p>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
            placeholder="Document activities, support provided, and any follow-up needed..."
          />
          <Button onClick={handleSave} disabled={saving || !newNote.trim()}>
            {saving ? 'Saving...' : 'Log Activity'}
          </Button>
        </CardContent>
      </Card>

      {log.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Previous Entries</div>
          {log.map((entry) => (
            <Card key={entry.id || entry.logged_at}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">{entry.date}</Badge>
                  {entry.logged_by_name && (
                    <span className="text-xs text-muted-foreground">{entry.logged_by_name}</span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}