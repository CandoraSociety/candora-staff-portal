import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, ListPlus, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAGE_ACTIONS, STAGE_DETAILS, STAGE_LABELS, STAGE_STATUS_OPTIONS, TASK_STATUS_OPTIONS, uid, today } from './caseConstants';

const addDays = (n) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-CA');

export const makeTask = (stageKey, title, dueDays) => ({
  id: uid(),
  title,
  stage_key: stageKey,
  status: 'todo',
  due_date: dueDays ? addDays(dueDays) : null,
  created_date: today(),
});

// Status, start/end dates, and notes for the selected stage
export function StageFieldsCard({ stageKey, draft, onUpdateStage }) {
  const detail = STAGE_DETAILS[stageKey] || {};
  const stage = (draft?.stages || []).find(s => s.key === stageKey) || { status: 'not_started', notes: '' };
  const patch = (p) => onUpdateStage(stageKey, p);

  return (
    <Card><CardContent className="p-4 space-y-4">
      <div>
        <p className="text-lg font-heading font-bold text-foreground">{STAGE_LABELS[stageKey]}</p>
        {detail.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{detail.description}</p>}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</p>
          <Select value={stage.status || 'not_started'} onValueChange={(v) => patch({ status: v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAGE_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Start Date</p>
          <Input type="date" value={stage.start_date || ''} onChange={(e) => patch({ start_date: e.target.value || null })} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">End Date</p>
          <Input type="date" value={stage.completed_date || ''} onChange={(e) => patch({ completed_date: e.target.value || null })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Stage Notes</p>
        <Textarea rows={3} value={stage.notes || ''} onChange={(e) => patch({ notes: e.target.value })} placeholder="Notes for this stage..." />
      </div>
    </CardContent></Card>
  );
}

// One-click planning tools — task checklists with due dates and in-app links
export function StageActionsCard({ stageKey, draft, onAddTask }) {
  const navigate = useNavigate();
  const actions = STAGE_ACTIONS[stageKey] || [];
  if (actions.length === 0) return null;

  const run = (a) => {
    if (a.type === 'link') navigate((a.url || '').replace('{clientId}', draft?.client_id || ''));
    else if (a.type === 'task') onAddTask(makeTask(stageKey, a.title, a.due_days));
    else if (a.type === 'task_batch') (a.titles || []).forEach(t => onAddTask(makeTask(stageKey, t)));
  };

  return (
    <Card><CardContent className="p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Planning &amp; Action Tools</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {actions.map(a => (
          <Button key={a.label} variant="outline" size="sm" className="justify-start h-auto py-2 text-left whitespace-normal" onClick={() => run(a)}>
            {a.type === 'link' ? <Link2 className="h-4 w-4 shrink-0 text-primary" />
              : a.type === 'task_batch' ? <ListPlus className="h-4 w-4 shrink-0 text-primary" />
              : <Plus className="h-4 w-4 shrink-0 text-primary" />}
            <span className="text-xs font-normal">{a.label}</span>
          </Button>
        ))}
      </div>
    </CardContent></Card>
  );
}

// Tasks belonging to this stage, with an inline add field
export function StageTasksCard({ stageKey, draft, onAddTask, onUpdateTask }) {
  const [newTask, setNewTask] = useState('');
  const stageTasks = (draft?.tasks || []).filter(t => t.stage_key === stageKey);

  const add = () => {
    if (!newTask.trim()) return;
    onAddTask(makeTask(stageKey, newTask.trim()));
    setNewTask('');
  };

  return (
    <Card><CardContent className="p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage Tasks ({stageTasks.length})</p>
      <div className="flex gap-2">
        <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task for this stage..."
          onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button size="sm" onClick={add} disabled={!newTask.trim()}>Add</Button>
      </div>
      {stageTasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No tasks for this stage yet — use the planning tools above or add your own.</p>
      ) : (
        <ul className="divide-y divide-border">
          {stageTasks.map(t => (
            <li key={t.id} className="py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-sm truncate ${t.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{t.title}</p>
                {t.due_date && <p className="text-[10px] text-muted-foreground">Due {t.due_date}</p>}
              </div>
              <Select value={t.status || 'todo'} onValueChange={(v) => onUpdateTask(t.id, { status: v, completed_date: v === 'done' ? today() : null })}>
                <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      )}
    </CardContent></Card>
  );
}