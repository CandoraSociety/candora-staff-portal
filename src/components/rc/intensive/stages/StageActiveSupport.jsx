import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { uid, today } from '../caseConstants';
import { StageFieldsCard, StageActionsCard, StageTasksCard } from '../stageShared';

// Active Support — quick contact logging plus the recent contact history
export default function StageActiveSupport({ stageKey, draft, meName, onUpdateStage, onAddTask, onUpdateTask, onAddHistory }) {
  const [date, setDate] = useState(today());
  const [entry, setEntry] = useState('');
  const history = [...(draft?.history_log || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const recent = history.slice(0, 5);

  const log = () => {
    if (!entry.trim()) return;
    onAddHistory({ id: uid(), date: date || today(), entry: entry.trim(), created_by_name: meName });
    setEntry('');
  };

  return (
    <div className="space-y-4">
      <StageFieldsCard stageKey={stageKey} draft={draft} onUpdateStage={onUpdateStage} />

      <Card><CardContent className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Log a Contact / Visit</p>
        <div className="grid sm:grid-cols-[160px_1fr_auto] gap-2 items-start">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Textarea rows={2} value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="What happened — visit, phone call, coaching, resource connection..." />
          <Button size="sm" onClick={log} disabled={!entry.trim()}>Log</Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Contacts</p>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">No contacts logged yet — use the form above after each visit or call.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map(h => (
              <li key={h.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-muted-foreground">{h.date}{h.created_by_name ? ` · ${h.created_by_name}` : ''}</p>
                </div>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{h.entry}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>

      <StageActionsCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} />
      <StageTasksCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} onUpdateTask={onUpdateTask} />
    </div>
  );
}