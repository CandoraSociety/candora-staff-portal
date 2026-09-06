import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { uid, today } from '../caseConstants';
import { StageFieldsCard, StageActionsCard, StageTasksCard } from '../stageShared';

// Closure & Follow-Up — closure summary and follow-up planning
export default function StageClosureFollowup({ stageKey, draft, meName, onUpdateStage, onAddTask, onUpdateTask, onAddHistory }) {
  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState('');
  const objectives = draft?.objectives || [];
  const achieved = objectives.filter(o => o.status === 'achieved');

  const record = () => {
    if (!summary.trim()) return;
    onAddHistory({ id: uid(), date: date || today(), entry: `Closure summary: ${summary.trim()}`, created_by_name: meName });
    setSummary('');
  };

  return (
    <div className="space-y-4">
      <StageFieldsCard stageKey={stageKey} draft={draft} onUpdateStage={onUpdateStage} />

      <Card><CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Goal Outcomes at Closure</p>
        <p className="text-sm text-foreground">{achieved.length} of {objectives.length} service goals achieved</p>
        {achieved.length > 0 && (
          <ul className="mt-2 space-y-1">
            {achieved.map(o => (
              <li key={o.id} className="flex items-start gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> {o.text}
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Closure Summary</p>
        <div className="grid sm:grid-cols-[160px_1fr_auto] gap-2 items-start">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summarize the closure — outcomes, family situation at exit, remaining referrals, follow-up plan..." />
          <Button size="sm" onClick={record} disabled={!summary.trim()}>Record</Button>
        </div>
      </CardContent></Card>

      <StageActionsCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} />
      <StageTasksCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} onUpdateTask={onUpdateTask} />
    </div>
  );
}