import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GoalDialog, { GOAL_STATUS_OPTIONS } from '@/components/frn/GoalDialog';

const fmtDate = (str) => str ? new Date(str + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function ParticipantGoals({ goals = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const openAdd = () => { setEditingIndex(null); setOpen(true); };
  const openEdit = (index) => { setEditingIndex(index); setOpen(true); };

  const save = (goal) => {
    const next = [...goals];
    if (editingIndex === null) next.push(goal);
    else next[editingIndex] = goal;
    onChange?.(next);
    setOpen(false);
  };

  const remove = (index) => onChange?.(goals.filter((_, i) => i !== index));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Goals</CardTitle>
        <Button size="sm" variant="outline" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Set a goal</Button>
      </CardHeader>
      <CardContent className="pt-0">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No goals set yet.</p>
        ) : (
          <div className="space-y-2">
            {goals.map((g, index) => {
              const status = GOAL_STATUS_OPTIONS.find(s => s.value === g.status) || GOAL_STATUS_OPTIONS[0];
              return (
                <div key={`${g.goal}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{g.goal}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: status.color + '20', color: status.color }}>{status.label}</span>
                      {g.target_date && <span className="text-xs text-muted-foreground">Target {fmtDate(g.target_date)}</span>}
                    </div>
                    {g.notes && <p className="text-xs text-muted-foreground mt-1">{g.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(index)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(index)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <GoalDialog
        open={open}
        onOpenChange={setOpen}
        goal={editingIndex === null ? null : goals[editingIndex]}
        onSave={save}
      />
    </Card>
  );
}