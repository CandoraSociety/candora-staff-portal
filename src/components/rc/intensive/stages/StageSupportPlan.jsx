import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CaseObjectivesTab from '../CaseObjectivesTab';
import { StageFieldsCard, StageActionsCard, StageTasksCard } from '../stageShared';

// Support Plan Development — the service goals & objectives builder lives here
export default function StageSupportPlan({ stageKey, draft, onUpdateStage, onAddTask, onUpdateTask, onAddObjective, onUpdateObjective, onDeleteObjective }) {
  const objectives = draft?.objectives || [];
  const achieved = objectives.filter(o => o.status === 'achieved').length;

  return (
    <div className="space-y-4">
      <StageFieldsCard stageKey={stageKey} draft={draft} onUpdateStage={onUpdateStage} />

      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-foreground">Service Goals &amp; Objectives</p>
          <span className="text-xs text-muted-foreground">{achieved} of {objectives.length} achieved</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Set the goals and objectives the caregiver and this case are working toward — with target dates, status, and progress notes. These are shown on the client overview and reviewed in the Monitoring &amp; Review stage.</p>
      </CardContent></Card>

      <CaseObjectivesTab objectives={objectives} onAdd={onAddObjective} onUpdate={onUpdateObjective} onDelete={onDeleteObjective} />

      <StageActionsCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} />
      <StageTasksCard stageKey={stageKey} draft={draft} onAddTask={onAddTask} onUpdateTask={onUpdateTask} />
    </div>
  );
}