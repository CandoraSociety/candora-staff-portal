import React from 'react';
import StageReferralScreening from './stages/StageReferralScreening';
import StageAssessment from './stages/StageAssessment';
import StageSupportPlan from './stages/StageSupportPlan';
import StageActiveSupport from './stages/StageActiveSupport';
import StageMonitoringReview from './stages/StageMonitoringReview';
import StageClosureFollowup from './stages/StageClosureFollowup';

// Dispatcher — each workflow stage renders its own purpose-built panel
const PANELS = {
  referral_screening: StageReferralScreening,
  assessment: StageAssessment,
  support_plan: StageSupportPlan,
  active_support: StageActiveSupport,
  monitoring_review: StageMonitoringReview,
  closure_followup: StageClosureFollowup,
};

export default function StageToolsPanel(props) {
  const Panel = PANELS[props.stageKey];
  if (!Panel) return <p className="text-sm text-muted-foreground">Unknown stage.</p>;
  return <Panel {...props} />;
}