import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uid, today } from '@/components/rc/intensive/caseConstants';

export default function CaseHistoryTab({ entries = [], onAdd, meName }) {
  const [date, setDate] = useState(today());
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    onAdd({ id: uid(), date: date || today(), entry: text.trim(), created_by_name: meName || '' });
    setText('');
  };

  const sorted = [...entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add History Entry</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:w-40" />
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Contact, decision, review, or other significant event..." />
        </div>
        <Button size="sm" onClick={submit} disabled={!text.trim()}><Plus className="h-4 w-4" /> Add Entry</Button>
      </CardContent></Card>

      {sorted.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No history entries yet.</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <ul className="divide-y divide-border">
            {sorted.map(e => (
              <li key={e.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-primary">{e.date || '—'}</p>
                  {e.created_by_name && <p className="text-[10px] text-muted-foreground">Logged by {e.created_by_name}</p>}
                </div>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{e.entry}</p>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      )}
    </div>
  );
}