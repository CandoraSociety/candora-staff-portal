import { useState } from 'react';
import { CheckCircle2, Map, ChevronDown, Briefcase, CalendarCheck, FileText, Plus, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmploymentActionPlan from './EmploymentActionPlan';
import CasualNotesPanel from './CasualNotesPanel';
import ActionPlanRoadmap from './ActionPlanRoadmap';
import EmploymentSearchPanel from './EmploymentSearchPanel';
import EmploymentSupportsStep from './EmploymentSupportsStep';
import WorkExposurePlacementTab from './WorkExposurePlacementTab';
import FollowUp90DayPanel from './FollowUp90DayPanel';
import ProgramStatusPanel from './ProgramStatusPanel';
import EDAStep from './EDAStep';
import InternalPlacementStep from './InternalPlacementStep';
import ExposuresSupportsStep from './ExposuresSupportsStep';

const FOLLOWUP_STEP = { key: 'followup_90day', label: '90-Day Follow-Up', short: '90-Day Follow-Up', icon: CalendarCheck };

const ITEM_LABELS = {
  job_search_workshop: 'Job Search Workshop',
  resume_writing_workshop: 'Resume Writing Workshop',
  interview_skills_workshop: 'Interview Skills Workshop',
  workplace_readiness_workshop: 'Workplace Readiness Workshop',
  financial_literacy_workshop: 'Financial Literacy Workshop',
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

function getEDASubItems(client) {
  if (!client?.action_plan_submitted) return [];

  const isDEA = client?.service_type === 'direct_to_employment';

  if (isDEA) {
    return (client.dea_activities || [])
      .filter(a => a.type)
      .map(a => ({ key: `dea_${a.id}`, label: a.type, component: 'eda' }));
  }

  const items = client.sdp_items || [];
  const subItems = [];
  const hasExposure = items.some(k => EXPOSURE_KEYS.includes(k));

  for (const key of items) {
    if (EXPOSURE_KEYS.includes(key)) continue;
    if (key === 'internal_placement') {
      subItems.push({ key: 'internal_placement', label: 'Internal Placement', component: 'internal_placement' });
    } else {
      const label = key === 'other' ? (client.sdp_other_desc || 'Other') : (ITEM_LABELS[key] || key);
      subItems.push({ key, label, component: 'eda' });
    }
  }

  if (hasExposure) {
    subItems.push({ key: 'exposures', label: 'Exposures & Supports', component: 'exposures' });
  }

  // Work Exposure Placement — always shown as a highlighted sub-tab
  subItems.push({ key: 'work_exposure_placement', label: 'Work Exposure Placement', component: 'work_exposure_placement', highlight: true });

  return subItems;
}

function getStepStatus(key, client) {
  switch (key) {
    case 'employment_action_plan':
      return client?.action_plan_submitted ? 'done' : 'active';
    case 'employment_supports':
      return client?.employment_supports ? 'done' : 'active';
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
      return 'pending';
  }
}

export default function ProgramFlowWizard({ client, onSave, onComplete, onClientUpdate, onRequireProgramPath }) {
  const [activeStep, setActiveStep] = useState(client?.action_plan_submitted ? 'employment_action_plan' : null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [actionPlanExpanded, setActionPlanExpanded] = useState(true);

  const isCasual = client?.service_type === 'casual';
  const isComplete = client?.program_status === 'complete';
  const hasActionPlan = !!client?.action_plan_submitted;

  if (!client?.service_type) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Program Pathway Required</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
          A program pathway must be selected before you can create an action plan.
        </p>
        {onRequireProgramPath && (
          <Button onClick={onRequireProgramPath}>
            Select Program Pathway
          </Button>
        )}
      </div>
    );
  }

  if (isCasual) {
    return <CasualNotesPanel client={client} onSave={onSave} />;
  }

  const isDEA = client?.service_type === 'direct_to_employment';
  const isEmployed = ['E-RF', 'E-UF', 'E-PT'].includes(client?.employment_status);
  const hasFollowup = !!client?.followup_90day_status || !!client?.followup_90day_date;

  // DEA: Action Plan → Supports → (complete) 90-Day Follow-Up → Progress
  // WD:  Action Plan → Supports → Employment Search → (employed) 90-Day Follow-Up → Progress
  const steps = isDEA ? [
    { key: 'employment_action_plan', label: 'Employment Action Plan', short: 'Action Plan', icon: null },
    { key: 'employment_supports', label: 'Employment Supports', short: 'Supports', icon: DollarSign },
    ...(isComplete ? [FOLLOWUP_STEP] : []),
    { key: 'roadmap', label: 'Program Progress', short: 'Progress', icon: Map },
  ] : [
    { key: 'employment_action_plan', label: 'Employment Action Plan', short: 'Action Plan', icon: null },
    { key: 'employment_supports', label: 'Employment Supports', short: 'Supports', icon: DollarSign },
    { key: 'employment_search', label: 'Employment Search', short: 'Employment', icon: Briefcase },
    ...((isEmployed || hasFollowup || isComplete) ? [FOLLOWUP_STEP] : []),
    { key: 'roadmap', label: 'Program Progress', short: 'Progress', icon: Map },
  ];

  const edaSubItems = getEDASubItems(client);

  const renderStepContent = (key) => {
    const goNext = () => {
      const idx = steps.findIndex(s => s.key === key);
      if (idx < steps.length - 1) setActiveStep(steps[idx + 1].key);
      else setActiveStep(null);
    };

    // Handle EDA sub-items
    if (key?.startsWith('eda:')) {
      const edaKey = key.substring(4);
      const subItem = edaSubItems.find(s => s.key === edaKey);
      if (!subItem) return null;

      const goBack = () => setActiveStep('employment_action_plan');

      switch (subItem.component) {
        case 'eda':
          return <EDAStep client={client} edaKey={edaKey} edaLabel={subItem.label} onSave={onSave} onComplete={goBack} />;
        case 'internal_placement':
          return <InternalPlacementStep client={client} onSave={onSave} onComplete={goBack} />;
        case 'exposures':
          return <ExposuresSupportsStep client={client} onSave={onSave} isDEA={false} />;
        case 'work_exposure_placement':
          return <WorkExposurePlacementTab client={client} onSave={onSave} />;
        default:
          return null;
      }
    }

    switch (key) {
      case 'employment_action_plan':
        return <EmploymentActionPlan client={client} onSave={onSave} onComplete={goNext} onClientUpdate={onClientUpdate} />;
      case 'employment_supports':
        return <EmploymentSupportsStep client={client} onSave={onSave} onComplete={goNext} />;
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
        return null;
    }
  };

  const currentStepLabel = steps.find(s => s.key === activeStep)?.label
    || edaSubItems.find(s => `eda:${s.key}` === activeStep)?.label
    || 'Select a step';

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
            const isActive = activeStep === step.key || (step.key === 'employment_action_plan' && activeStep?.startsWith('eda:'));
            const isLocked = !hasActionPlan && step.key !== 'employment_action_plan' && step.key !== 'employment_supports';
            const isFollowup = step.key === 'followup_90day';
            const StepIcon = step.icon;
            const isActionPlan = step.key === 'employment_action_plan';
            const showSubItems = isActionPlan && hasActionPlan && edaSubItems.length > 0;

            const circleBase = 'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0';
            const circleClass = isActive
              ? `${circleBase} border-primary bg-primary/5`
              : status === 'done'
                ? `${circleBase} border-green-500 bg-green-50`
                : `${circleBase} border-slate-300 bg-slate-50`;

            return (
              <div key={step.key}>
                <button
                  onClick={() => !isLocked && setActiveStep(step.key)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isLocked
                        ? 'text-slate-300 cursor-not-allowed'
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
                  <div className="flex items-center gap-1 shrink-0">
                    {showSubItems && (
                      <span
                        onClick={(e) => { e.stopPropagation(); setActionPlanExpanded(p => !p); }}
                        className="p-0.5 hover:bg-black/10 rounded"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${actionPlanExpanded ? 'rotate-180' : ''}`} />
                      </span>
                    )}
                    {status === 'done' && !isActive && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </button>

                {/* EDA sub-items — collapsible under Action Plan */}
                {showSubItems && actionPlanExpanded && (
                  <div className="ml-6 mt-1 mb-2 space-y-0.5 border-l-2 border-slate-200 pl-2">
                    {edaSubItems.map(sub => {
                      const subActive = activeStep === `eda:${sub.key}`;
                      return (
                        <button
                          key={sub.key}
                          onClick={() => setActiveStep(`eda:${sub.key}`)}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5 ${
                            subActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : sub.highlight
                                ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-200 hover:bg-indigo-100'
                                : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {sub.highlight && <Briefcase className="w-3 h-3 shrink-0" />}
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Program Status Controls */}
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
            {steps.filter(s => hasActionPlan || s.key === 'employment_action_plan' || s.key === 'employment_supports').map((step) => {
              const status = getStepStatus(step.key, client);
              const subItems = step.key === 'employment_action_plan' ? edaSubItems : [];
              return (
                <div key={step.key} className="divide-y">
                  <button
                    className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50"
                    onClick={() => { setActiveStep(step.key); setMobileOpen(false); }}
                  >
                    {step.label}
                    {status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </button>
                  {subItems.length > 0 && subItems.map(sub => (
                    <button
                      key={sub.key}
                      className={`w-full text-left px-8 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-1 ${
                        sub.highlight ? 'text-indigo-700 font-medium bg-indigo-50/50' : 'text-slate-600'
                      }`}
                      onClick={() => { setActiveStep(`eda:${sub.key}`); setMobileOpen(false); }}
                    >
                      {sub.highlight
                        ? <Briefcase className="w-3 h-3" />
                        : <span className="w-1 h-1 rounded-full bg-slate-400" />}
                      {sub.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-3 p-3 border rounded-lg bg-white">
          <ProgramStatusPanel client={client} onClientUpdate={onClientUpdate} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {!activeStep ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-500 mb-4">No action plan has been created yet.</p>
            <Button onClick={() => setActiveStep('employment_action_plan')}>
              <Plus className="w-4 h-4 mr-1" /> Create Action Plan
            </Button>
          </div>
        ) : (
          renderStepContent(activeStep)
        )}
      </div>
    </div>
  );
}