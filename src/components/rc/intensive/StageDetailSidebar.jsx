import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CASE_STAGES, COMPLEXITY_OPTIONS, STAGE_STATUS_COLORS, today } from './caseConstants';

// Far-left workflow sidebar: case-level summary at a glance + stage navigation.
// Stages are freely navigable (non-linear) — workers can return to any stage.
export default function StageDetailSidebar({ stages = [], currentStage, selectedKey, onSelect, taskCountFor, caseData }) {
  const todayStr = today();
  const contacts = caseData?.contacts || [];
  const lastContact = contacts.map(c => c.date).filter(Boolean).sort().pop();
  const activeGoals = (caseData?.objectives || []).filter(o => (o.status || 'in_progress') === 'in_progress').length;
  const overdueTasks = (caseData?.tasks || []).filter(t => t.status !== 'done' && t.due_date && t.due_date < todayStr).length;
  const overdueReviews = (caseData?.next_review_due && caseData.next_review_due < todayStr)
    || (caseData?.next_contact_due && caseData.next_contact_due < todayStr);

  const statusLabels = { waitlisted: 'Waitlisted', active: 'Active', closed: 'Closed' };
  const info = [
    { label: 'Case Status', value: caseData?.case_status ? statusLabels[caseData.case_status] || caseData.case_status : null },
    { label: 'Assigned Worker', value: caseData?.assigned_worker },
    { label: 'Service Start', value: caseData?.service_start_date },
    { label: 'Complexity', value: caseData?.complexity_level ? COMPLEXITY_OPTIONS.find(c => c.value === caseData.complexity_level)?.label : null },
    { label: 'Last Contact', value: lastContact },
    { label: 'Next Contact Due', value: caseData?.next_contact_due, alert: caseData?.next_contact_due && caseData.next_contact_due < todayStr },
    { label: 'Next Review Due', value: caseData?.next_review_due, alert: caseData?.next_review_due && caseData.next_review_due < todayStr },
    { label: 'Active Goals', value: activeGoals ? String(activeGoals) : null },
  ].filter(r => r.value);

  const stageByKey = Object.fromEntries(stages.map(s => [s.key, s]));
  const totalTasks = (caseData?.tasks || []).filter(t => t.status !== 'done').length;

  return (
    <div className="space-y-3">
      {caseData && (
        <Card><CardContent className="p-3.5 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Case Snapshot</p>
          <div className="space-y-1">
            {info.length === 0 && <p className="text-xs text-muted-foreground">Set case details in the Workflow tab.</p>}
            {info.map(r => (
              <div key={r.label} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">{r.label}</span>
                <span className={cn('text-[11px] font-medium text-right', r.alert ? 'text-red-600' : 'text-foreground')}>{r.value}{r.alert ? ' — overdue' : ''}</span>
              </div>
            ))}
            {(overdueTasks > 0 || overdueReviews) && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium pt-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {overdueTasks > 0 && <span>{overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}</span>}
              </div>
            )}
          </div>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-2 space-y-1 sticky top-4">
        <button
          onClick={() => onSelect('main')}
          className={cn(
            'w-full text-left px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
            selectedKey === 'main' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
          )}
        >
          Workflow Overview
          <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
            All stages — {totalTasks} open task{totalTasks === 1 ? '' : 's'}
          </span>
        </button>

        <div className="pt-1 space-y-0.5">
          {CASE_STAGES.map(s => {
            const st = stageByKey[s.key] || {};
            const color = STAGE_STATUS_COLORS[st.status] || '#94a3b8';
            const openCount = taskCountFor(s.key);
            return (
              <button
                key={s.key}
                onClick={() => onSelect(s.key)}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2',
                  selectedKey === s.key ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                )}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{s.label}</span>
                  {s.key === currentStage && <span className="block text-[9px] font-semibold uppercase opacity-70">Current</span>}
                </span>
                {openCount > 0 && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">{openCount}</span>}
              </button>
            );
          })}
        </div>
      </CardContent></Card>
    </div>
  );
}