import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RISK_CATEGORY_OPTIONS, RISK_SEVERITY_OPTIONS, RISK_SEVERITY_COLORS, RISK_STATUS_OPTIONS, uid, today } from '../caseConstants';
import { StageFieldsCard, StageActionsCard, StageTasksCard } from '../stageShared';

// Intake & Assessment — document risk factors identified during assessment
export default function StageAssessment({ stageKey, draft, onUpdateStage, onAddTask, onUpdateTask, onAddRisk, onUpdateRisk }) {
  const [category, setCategory] = useState('family');
  const [severity, setSeverity] = useState('medium');
  const [desc, setDesc] = useState('');
  const risks = (draft?.risk_factors || []).filter(r => r.status !== 'mitigated');

  const add = () => {
    if (!desc.trim()) return;
    onAddRisk({ id: uid(), category, severity, description: desc.trim(), status: 'active', date_identified: today() });
    setDesc('');
  };

  return (
    <div className="space-y-4">
      <StageFieldsCard stageKey={stageKey} draft={draft} onUpdateStage={onUpdateStage} />

      <Card><CardContent className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Factors Identified ({risks.length})</p>
        <div className="grid sm:grid-cols-[140px_140px_1fr_auto] gap-2 items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{RISK_CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{RISK_SEVERITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the risk factor..."
            onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Button size="sm" onClick={add} disabled={!desc.trim()}>Add</Button>
        </div>
        {risks.length > 0 && (
          <ul className="divide-y divide-border">
            {risks.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{r.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {RISK_CATEGORY_OPTIONS.find(c => c.value === r.category)?.label} · Identified {r.date_identified || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: RISK_SEVERITY_COLORS[r.severity] || '#94a3b8' }}>
                    {(r.severity || '').toUpperCase()}
                  </span>
                  <Select value={r.status || 'active'} onValueChange={(v) => onUpdateRisk(r.id, { status: v })}>
                    <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{RISK_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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