import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import { STAGE_DETAILS, STAGE_LABELS, STAGE_STATUS_OPTIONS, TASK_STATUS_OPTIONS, uid, today } from '@/components/rc/intensive/caseConstants';

// Shown when a specific workflow stage is selected in the far-left sidebar —
// the tools, resources, stage fields, and stage tasks for that stage.
export default function StageToolsPanel({ stageKey, draft, onUpdateStage, onAddTask }) {
  const detail = STAGE_DETAILS[stageKey] || {};
  const stages = draft?.stages || [];
  const idx = stages.findIndex(s => s.key === stageKey);
  const stage = stages[idx] || { status: 'not_started', notes: '' };
  const stageTasks = (draft?.tasks || []).filter(t => t.stage_key === stageKey);
  const [newTask, setNewTask] = useState('');

  const patchStage = (patch) => idx >= 0 && onUpdateStage(idx, patch);

  const addStageTask = () => {
    if (!newTask.trim()) return;
    onAddTask({ id: uid(), title: newTask.trim(), stage_key: stageKey, status: 'todo', created_date: today() });
    setNewTask('');
  };

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 space-y-4">
        <div>
          <p className="text-lg font-heading font-bold text-foreground">{STAGE_LABELS[stageKey]}</p>
          {detail.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{detail.description}</p>}
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
            <Select value={stage.status || 'not_started'} onValueChange={(v) => patchStage({ status: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGE_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Start Date</p>
            <Input type="date" value={stage.start_date || ''} onChange={(e) => patchStage({ start_date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Completed Date</p>
            <Input type="date" value={stage.completed_date || ''} onChange={(e) => patchStage({ completed_date: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Stage Notes</p>
          <Textarea rows={3} value={stage.notes || ''} onChange={(e) => patchStage({ notes: e.target.value })} placeholder="Notes for this stage..." />
        </div>
      </CardContent></Card>

      {(detail.resources?.length) > 0 && (
        <Card><CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tools &amp; Resources for this Stage</p>
          <ul className="space-y-1.5">
            {detail.resources.map(r => (
              <li key={r} className="text-sm text-foreground flex gap-2 items-start"><span className="text-primary mt-0.5">•</span>{r}</li>
            ))}
          </ul>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage Tasks ({stageTasks.length})</p>
        <div className="flex gap-2">
          <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task for this stage..."
            onKeyDown={(e) => e.key === 'Enter' && addStageTask()} />
          <Button size="sm" onClick={addStageTask} disabled={!newTask.trim()}>Add</Button>
        </div>
        {stageTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tasks for this stage yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {stageTasks.map(t => (
              <li key={t.id} className="py-2 flex items-center justify-between gap-2">
                <p className={`text-sm ${t.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{t.title}</p>
                <StatusBadge status={t.status} options={TASK_STATUS_OPTIONS} />
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>
    </div>
  );
}