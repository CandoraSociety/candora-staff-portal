import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OBJECTIVE_STATUS_OPTIONS, RISK_CATEGORY_OPTIONS, RISK_SEVERITY_COLORS, RISK_STATUS_OPTIONS } from '../caseConstants';
import { StageFieldsCard, StageActionsCard, StageTasksCard } from '../stageShared';

// Monitoring & Review — review objectives progress and risk factor statuses
export default function StageMonitoringReview({ stageKey, draft, onUpdateStage, onAddTask, onUpdateTask, onUpdateObjective, onUpdateRisk }) {
  const objectives = draft?.objectives || [];
  const risks = draft?.risk_factors || [];

  return (
    <div className="space-y-4">
      <StageFieldsCard stageKey={stageKey} draft={draft} onUpdateStage={onUpdateStage} />

      <Card><CardContent className="p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Objectives Review ({objectives.length})</p>
        {objectives.length === 0 ? (
          <p className="text-xs text-muted-foreground">No objectives set — add service goals in the Support Plan Development stage.</p>
        ) : (
          <ul className="divide-y divide-border">
            {objectives.map(o => (
              <li key={o.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm truncate ${o.status === 'achieved' ? 'text-green-700' : o.status === 'dropped' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{o.text}</p>
                  {o.target_date && <p className="text-[10px] text-muted-foreground">Target {o.target_date}{o.achieved_date ? ` · Achieved ${o.achieved_date}` : ''}</p>}
                </div>
                <Select value={o.status || 'in_progress'} onValueChange={(v) => onUpdateObjective(o.id, { status: v, achieved_date: v === 'achieved' ? (o.achieved_date || new Date().toLocaleDateString('en-CA')) : null })}>
                  <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{OBJECTIVE_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>

      <Card><CardContent className="p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Factor Review ({risks.length})</p>
        {risks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No risk factors recorded.</p>
        ) : (
          <ul className="divide-y divide-border">
            {risks.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{r.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {RISK_CATEGORY_OPTIONS.find(c => c.value === r.category)?.label}
                    <span className="text-white font-semibold px-1 py-0.5 rounded ml-1" style={{ backgroundColor: RISK_SEVERITY_COLORS[r.severity] || '#94a3b8' }}>{(r.severity || '').toUpperCase()}</span>
                    {r.review_date ? ` · Review ${r.review_date}` : ''}
                  </p>
                </div>
                <Select value={r.status || 'active'} onValueChange={(v) => onUpdateRisk(r.id, { status: v })}>
                  <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
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