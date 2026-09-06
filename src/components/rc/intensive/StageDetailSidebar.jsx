import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CASE_STAGES, STAGE_DETAILS, STAGE_STATUS_COLORS } from '@/components/rc/intensive/caseConstants';

export default function StageDetailSidebar({ stages = [], currentStage, selectedKey, onSelect, taskCountFor }) {
  const selected = CASE_STAGES.find(s => s.key === selectedKey) || CASE_STAGES[0];
  const detail = STAGE_DETAILS[selected.key] || {};
  const stageData = stages.find(s => s.key === selected.key) || {};

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-2">
        <p className="px-2 pt-1.5 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workflow Stages</p>
        {CASE_STAGES.map((s) => {
          const data = stages.find(st => st.key === s.key) || {};
          const count = taskCountFor ? taskCountFor(s.key) : 0;
          return (
            <button key={s.key} onClick={() => onSelect(s.key)}
              className={`w-full text-left p-2.5 rounded-md transition-colors ${selectedKey === s.key ? 'bg-primary/10' : 'hover:bg-muted'}`}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STAGE_STATUS_COLORS[data.status || 'not_started'] }} />
                <p className="text-sm font-medium text-foreground truncate">{s.label}</p>
              </div>
              <div className="flex items-center gap-2 mt-1 pl-4">
                {currentStage === s.key && <span className="text-[10px] font-medium text-primary">Current</span>}
                {count > 0 && <span className="text-[10px] text-muted-foreground">{count} task{count !== 1 ? 's' : ''}</span>}
              </div>
            </button>
          );
        })}
      </CardContent></Card>

      <Card><CardContent className="p-4">
        <p className="text-sm font-semibold text-foreground">{selected.label}</p>
        <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: (STAGE_STATUS_COLORS[stageData.status || 'not_started']) + '22', color: STAGE_STATUS_COLORS[stageData.status || 'not_started'] }}>
          {stageData.status === 'complete' ? 'Complete' : stageData.status === 'in_progress' ? 'In Progress' : 'Not Started'}
        </span>
        {detail.description && <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{detail.description}</p>}
        {(detail.resources?.length) > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Stage Resources</p>
            <ul className="space-y-1">
              {detail.resources.map(r => <li key={r} className="text-xs text-foreground flex gap-1.5"><span className="text-primary">•</span>{r}</li>)}
            </ul>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}