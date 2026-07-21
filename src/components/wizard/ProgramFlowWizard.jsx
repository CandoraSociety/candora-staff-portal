import { useState } from 'react';
import { CheckCircle2, Map, ChevronDown, Briefcase, CalendarCheck, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmploymentActionPlan from './EmploymentActionPlan';
import CasualNotesPanel from './CasualNotesPanel';
import ActionPlanRoadmap from './ActionPlanRoadmap';
import EmploymentSearchPanel from './EmploymentSearchPanel';
import FollowUp90DayPanel from './FollowUp90DayPanel';
import ProgramStatusPanel from './ProgramStatusPanel';

const FOLLOWUP_STEP = { key: 'followup_90day', label: '90-Day Follow-Up', short: '90-Day Follow-Up', icon: CalendarCheck };

function getStepStatus(key, client) {
  switch (key) {
    case 'employment_action_plan':
      return client?.action_plan_submitted ? 'done' : 'active';
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

export default function ProgramFlowWizard({ client, onSave, onComplete, onClientUpdate }) {
  const [activeStep, setActiveStep] = useState(client?.action_plan_submitted ? 'employment_action_plan' : null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isCasual = client?.service_type === 'casual';
  const isComplete = client?.program_status === 'complete';
  const hasActionPlan = !!client?.action_plan_submitted;

  if (isCasual) {
    return <CasualNotesPanel client={client} onSave={onSave} />;
  }

  const steps = [
    { key: 'employment_action_plan', label: 'Employment Action Plan', short: 'Action Plan', icon: null },
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
        return <EmploymentActionPlan client={client} onSave={onSave} onComplete={goNext} onClientUpdate={onClientUpdate} />;
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
            const isLocked = !hasActionPlan && step.key !== 'employment_action_plan';
            const isFollowup = step.key === 'followup_90day';
            const StepIcon = step.icon;

            const circleBase = 'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0';
            const circleClass = isActive
              ? `${circleBase} border-primary bg-primary/5`
              : status === 'done'
                ? `${circleBase} border-green-500 bg-green-50`
                : `${circleBase} border-slate-300 bg-slate-50`;

            return (
              <button
                key={step.key}
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
                {status === 'done' && !isActive && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                )}
              </button>
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
            {steps.filter(s => hasActionPlan || s.key === 'employment_action_plan').map((step) => {
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