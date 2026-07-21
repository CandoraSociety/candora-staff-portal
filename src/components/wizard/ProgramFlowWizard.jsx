import { useState } from 'react';
import { CheckCircle2, Map, ChevronDown, Briefcase, CalendarCheck } from 'lucide-react';
import EmploymentActionPlan from './EmploymentActionPlan';
import InternalPlacementStep from './InternalPlacementStep';
import ExposuresSupportsStep from './ExposuresSupportsStep';
import EDAStep from './EDAStep';
import CasualNotesPanel from './CasualNotesPanel';
import ActionPlanRoadmap from './ActionPlanRoadmap';
import EmploymentSearchPanel from './EmploymentSearchPanel';
import FollowUp90DayPanel from './FollowUp90DayPanel';
import ProgramStatusPanel from './ProgramStatusPanel';

const ITEM_LABELS = {
  job_search_workshop: 'Job Search Workshop',
  resume_writing_workshop: 'Resume Writing Workshop',
  interview_skills_workshop: 'Interview Skills Workshop',
  workplace_readiness_workshop: 'Workplace Readiness Workshop',
  financial_literacy_workshop: 'Financial Literacy Workshop',
  digital_literacy_workshop: 'Digital Literacy Workshop',
  empoweru: 'EmpowerU',
  ell_classes: 'ELL Classes',
  skills_assessment: 'Skills Assessment',
  internal_placement: 'Internal Placement',
  exposure_course: 'Exposure Course',
  paid_external_placement: 'Paid External Placement',
  employment_supports: 'Employment Supports',
  job_applications: 'Job Applications',
  networking: 'Networking',
  barrier_support: 'Barrier Support',
  other: 'Other',
};

const EXPOSURE_KEYS = ['exposure_course', 'paid_external_placement', 'employment_supports'];

const FOLLOWUP_STEP = { key: 'followup_90day', label: '90-Day Follow-Up', short: '90-Day Follow-Up', icon: CalendarCheck };

function truncate(label, max = 22) {
  return label.length > max ? label.substring(0, max - 1) + '…' : label;
}

/**
 * Dynamically generates EDA (Employment Development Activity) steps from the
 * submitted action plan items. Only shown after the action plan is created.
 *
 * - DEA: each dea_activities entry becomes a generic EDA step.
 * - Pathways: each sdp_item becomes a step, with specialized routing for
 *   internal_placement (→ InternalPlacementStep) and exposure/support items
 *   (→ ExposuresSupportsStep, grouped into one step).
 */
function getEDASteps(client) {
  if (!client?.action_plan_submitted) return [];

  const isDEA = client?.service_type === 'direct_to_employment';

  if (isDEA) {
    return (client?.dea_activities || [])
      .filter(a => a.type)
      .map(a => ({
        key: `eda_dea_${a.id}`,
        label: a.type,
        short: truncate(a.type),
        icon: null,
        edaType: 'dea',
        edaKey: a.id,
      }));
  }

  // Pathways
  const steps = [];
  const items = client?.sdp_items || [];
  const hasExposure = items.some(k => EXPOSURE_KEYS.includes(k));

  for (const key of items) {
    if (EXPOSURE_KEYS.includes(key)) continue; // handled as a grouped step below

    if (key === 'internal_placement') {
      steps.push({
        key: 'eda_internal_placement',
        label: 'Internal Placement',
        short: 'Placement',
        icon: null,
        edaType: 'specialized',
        edaComponent: 'internal_placement',
      });
    } else if (key === 'other') {
      const label = client?.sdp_other_desc || 'Other';
      steps.push({
        key: 'eda_other',
        label,
        short: truncate(label),
        icon: null,
        edaType: 'generic',
        edaKey: key,
      });
    } else {
      const label = ITEM_LABELS[key] || key;
      steps.push({
        key: `eda_${key}`,
        label,
        short: truncate(label),
        icon: null,
        edaType: 'generic',
        edaKey: key,
      });
    }
  }

  if (hasExposure) {
    steps.push({
      key: 'eda_exposures',
      label: 'Exposures & Supports',
      short: 'Exposures',
      icon: null,
      edaType: 'specialized',
      edaComponent: 'exposures',
    });
  }

  return steps;
}

function getStepStatus(key, client) {
  switch (key) {
    case 'employment_action_plan':
      return client?.action_plan_submitted ? 'done' : 'active';
    case 'eda_internal_placement':
      return client?.placement_request_sent ? 'done' : 'active';
    case 'eda_exposures':
      return (client?.exposure_course || client?.paid_external_placement || client?.employment_supports || client?.external_employer)
        ? 'done' : 'active';
    case 'employment_search':
      return ['E-RF', 'E-UF', 'E-PT'].includes(client?.employment_status) ? 'done' : 'active';
    case 'roadmap':
      return client?.program_status === 'complete' ? 'done' :
             client?.program_status === 'cancelled' ? 'done' :
             client?.program_status === 'incomplete' ? 'done' :
             client?.action_plan_submitted ? 'active' : 'pending';
    case 'followup_90day':
      return client?.followup_90day_status ? 'done' : 'active';
    default:
      // DEA EDA steps
      if (key.startsWith('eda_dea_')) {
        const actId = key.replace('eda_dea_', '');
        const act = client?.dea_activities?.find(a => a.id === actId);
        return act?.completed_date ? 'done' : 'active';
      }
      // Pathways generic EDA steps
      if (key.startsWith('eda_')) {
        const edaKey = key.replace('eda_', '');
        return client?.sdp_item_details?.[edaKey]?.date ? 'done' : 'active';
      }
      return 'pending';
  }
}

export default function ProgramFlowWizard({ client, onSave, onComplete, onClientUpdate }) {
  const [activeStep, setActiveStep] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCasual = client?.service_type === 'casual';
  const isComplete = client?.program_status === 'complete';

  if (isCasual) {
    return <CasualNotesPanel client={client} onSave={onSave} />;
  }

  const edaSteps = getEDASteps(client);
  const steps = [
    { key: 'employment_action_plan', label: 'Employment Action Plan', short: 'Action Plan', icon: null },
    ...edaSteps,
    { key: 'employment_search', label: 'Employment Search', short: 'Employment', icon: Briefcase },
    ...(isComplete ? [FOLLOWUP_STEP] : []),
    { key: 'roadmap', label: 'Program Progress', short: 'Progress', icon: Map },
  ];

  const renderStepContent = (key) => {
    const goNext = () => {
      const idx = steps.findIndex(s => s.key === key);
      if (idx < steps.length - 1) setActiveStep(steps[idx + 1].key);
      else setActiveStep(null);
    };
    switch (key) {
      case 'employment_action_plan':
        return <EmploymentActionPlan client={client} onSave={onSave} onComplete={goNext} />;
      case 'eda_internal_placement':
        return <InternalPlacementStep client={client} onSave={onSave} onComplete={goNext} />;
      case 'eda_exposures':
        return <ExposuresSupportsStep client={client} onSave={onSave} isDEA={client?.service_type === 'direct_to_employment'} />;
      case 'employment_search':
        return <EmploymentSearchPanel client={client} onSave={onSave} onClientUpdate={onClientUpdate} />;
      case 'followup_90day':
        return <FollowUp90DayPanel client={client} onClientUpdate={onClientUpdate} />;
      case 'roadmap':
        return (
          <ActionPlanRoadmap
            client={client}
            selectedItems={client?.sdp_items || []}
            itemDetails={client?.sdp_item_details || {}}
            otherDesc={client?.sdp_other_desc}
            onClientUpdate={onClientUpdate || onSave}
          />
        );
      default:
        if (key.startsWith('eda_')) {
          const step = steps.find(s => s.key === key);
          if (step?.edaType === 'generic') {
            return <EDAStep client={client} edaKey={step.edaKey} edaLabel={step.label} onSave={onSave} onComplete={goNext} />;
          }
          if (step?.edaType === 'dea') {
            return <EDAStep client={client} edaKey={`dea_${step.edaKey}`} edaLabel={step.label} onSave={onSave} onComplete={goNext} />;
          }
        }
        return null;
    }
  };

  const currentStepLabel = steps.find(s => s.key === activeStep)?.label || 'Select a step';

  return (
    <div className="flex gap-6">
      {/* Sidebar — desktop */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-6 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 px-2">
            Program Steps
          </div>

          {steps.map((step, idx) => {
            const status = getStepStatus(step.key, client);
            const isActive = activeStep === step.key;
            const isSkipped = status === 'skipped';
            const StepIcon = step.icon;

            const isFollowup = step.key === 'followup_90day';

            const circleBase = 'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0';
            const circleClass = isActive
              ? `${circleBase} border-primary bg-primary/5`
              : status === 'done'
                ? `${circleBase} border-green-500 bg-green-50`
                : status === 'pending'
                  ? `${circleBase} border-slate-300 bg-slate-50`
                  : `${circleBase} border-slate-300 bg-slate-50`;

            return (
              <button
                key={step.key}
                onClick={() => !isSkipped && setActiveStep(step.key)}
                disabled={isSkipped}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isSkipped
                      ? 'text-slate-400 cursor-default'
                      : isFollowup
                        ? 'hover:bg-cyan-50 text-cyan-800 border border-cyan-200 bg-cyan-50/50'
                        : 'hover:bg-slate-100 text-slate-700'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={circleClass}>
                    {StepIcon
                      ? <StepIcon className="w-3 h-3" />
                      : status === 'done'
                        ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                        : <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>{idx + 1}</span>
                    }
                  </span>
                  <span className="truncate text-xs">{step.short}</span>
                </div>
                {status === 'done' && !isActive && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                )}
              </button>
            );
          })}

          {/* Program Status Controls — always visible at bottom of sidebar */}
          <div className="pt-4 border-t border-slate-200 mt-2">
            <ProgramStatusPanel client={client} onClientUpdate={onClientUpdate} />
          </div>
        </div>
      </aside>

      {/* Mobile step selector */}
      <div className="md:hidden w-full mb-2">
        <button
          onClick={() => setMobileOpen(p => !p)}
          className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white text-sm font-medium"
        >
          <span>{currentStepLabel}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileOpen && (
          <div className="border rounded-lg mt-1 bg-white shadow divide-y">
            {steps.map((step) => {
              const status = getStepStatus(step.key, client);
              return (
                <button
                  key={step.key}
                  className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50"
                  onClick={() => { setActiveStep(step.key); setMobileOpen(false); }}
                >
                  {step.label}
                  {status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </button>
              );
            })}
          </div>
        )}
        {/* Mobile program status */}
        <div className="mt-3 p-3 border rounded-lg bg-white">
          <ProgramStatusPanel client={client} onClientUpdate={onClientUpdate} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {!activeStep ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Select a step from the sidebar to get started.</p>
          </div>
        ) : (
          renderStepContent(activeStep)
        )}
      </div>
    </div>
  );
}