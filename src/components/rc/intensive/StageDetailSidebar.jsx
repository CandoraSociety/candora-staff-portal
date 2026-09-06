import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CASE_STAGES, STAGE_STATUS_COLORS } from '@/components/rc/intensive/caseConstants';

// Far-left workflow navigation: a "main" entry (all workflow cards) plus each stage.
export default function StageDetailSidebar({ stages = [], currentStage, selectedKey, onSelect, taskCountFor }) {
  return (
    <Card className="lg:sticky lg:top-4"><CardContent className="p-2">
      <p className="px-2 pt-1.5 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workflow Stages</p>
      <button
        onClick={() => onSelect('main')}
        className={`w-full text-left p-2.5 rounded-md transition-colors ${selectedKey === 'main' ? 'bg-primary/10' : 'hover:bg-muted'}`}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Workflow Overview</p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 pl-5">All stages, tasks &amp; risks</p>
      </button>
      <div className="h-px bg-border/60 my-1.5 mx-2" />
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
  );
}