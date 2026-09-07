import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function NotesTab({ cls, userName, saveClass }) {
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);
  const notes = [...(cls.notes || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleAdd = async () => {
    if (!note.trim()) {
      toast({ title: 'Write a note first', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await saveClass({
        notes: [...(cls.notes || []), {
          id: crypto.randomUUID(),
          date,
          note: note.trim(),
          created_by_name: userName,
        }],
      });
      setNote('');
      toast({ title: 'Note added' });
    } catch (e) {
      toast({ title: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Add a Note</h3>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Class progress, observations, follow-ups..." />
          </div>
          <Button onClick={handleAdd} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />{saving ? 'Adding...' : 'Add Note'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3">Notes Log</h3>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No notes yet.</p>
          ) : (
            notes.map(n => (
              <div key={n.id} className="py-2.5 border-b last:border-0">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">{n.created_by_name || 'Staff'}</span>
                  <span>{n.date ? format(parseLocalDate(n.date), 'MMM d, yyyy') : ''}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{n.note}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}