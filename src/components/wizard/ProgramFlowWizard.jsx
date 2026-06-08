import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ArrowRight, RotateCcw } from 'lucide-react';
import BarrierIdentificationTool from './BarrierIdentificationTool';
import BarrierActionPlan from './BarrierActionPlan';
import EmploymentActionPlan from './EmploymentActionPlan';
import InternalPlacementStep from './InternalPlacementStep';
import ExposuresSupportsStep from './ExposuresSupportsStep';
import CasualNotesPanel from './CasualNotesPanel';

const STEPS = [
  { id: 'bit', title: 'Barrier Identification', description: 'Identify barriers affecting employment' },
  { id: 'barrier_action_plan', title: 'Barrier Resolution Plan', description: 'Create action steps for each barrier' },
  { id: 'employment_action_plan', title: 'Employment Action Plan', description: 'Build customized employment plan' },
  { id: 'internal_placement', title: 'Internal Placement', description: 'Set up placement details', pathwaysOnly: true },
  { id: 'exposures', title: 'Exposure Courses & Supports', description: 'Log courses and financial supports' },
];

export default function ProgramFlowWizard({ client, onSave }) {
  const [activeStep, setActiveStep] = useState(null);

  const isPathways = client?.service_type === 'pathways';
  const isDEA = client?.service_type === 'direct_to_employment';
  const isCasual = client?.service_type === 'casual';

  if (isCasual) {
    return <CasualNotesPanel client={client} onSave={onSave} />;
  }

  const filteredSteps = STEPS.filter(step => !step.pathwaysOnly || isPathways);

  const isStepCompleted = (step) => {
    switch (step.id) {
      case 'bit': return client?.bit_completed;
      case 'barrier_action_plan': return client?.barrier_action_plan_completed;
      case 'employment_action_plan': return client?.action_plan_submitted;
      case 'internal_placement': return client?.placement_request_sent;
      case 'exposures': return client?.exposure_course || client?.employment_supports;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 'bit':
        return <BarrierIdentificationTool client={client} onSave={onSave} onComplete={() => setActiveStep(null)} />;
      case 'barrier_action_plan':
        return <BarrierActionPlan client={client} onSave={onSave} onComplete={() => setActiveStep(null)} />;
      case 'employment_action_plan':
        return <EmploymentActionPlan client={client} onSave={onSave} onComplete={() => setActiveStep(null)} />;
      case 'internal_placement':
        return <InternalPlacementStep client={client} onSave={onSave} onComplete={() => setActiveStep(null)} />;
      case 'exposures':
        return <ExposuresSupportsStep client={client} onSave={onSave} onComplete={() => setActiveStep(null)} />;
      default:
        return null;
    }
  };

  if (activeStep) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{STEPS.find(s => s.id === activeStep)?.title}</CardTitle>
              <CardDescription>
                {STEPS.find(s => s.id === activeStep)?.description}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveStep(null)}>
              Exit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Complete each step in order to build a comprehensive employment action plan.
        {isDEA && ' (DEA Stream)'}
      </div>

      <div className="space-y-4">
        {filteredSteps.map((step, index) => {
          const completed = isStepCompleted(step);
          const isNext = index === filteredSteps.findIndex(s => !isStepCompleted(s));

          return (
            <Card
              key={step.id}
              className={`transition-all ${
                completed ? 'bg-green-50 border-green-200' :
                isNext ? 'border-primary shadow-md' : ''
              }`}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2">
                    {completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : isNext ? (
                      <Circle className="w-6 h-6 text-primary fill-primary/10" />
                    ) : (
                      <Circle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{step.title}</h3>
                      {completed && (
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                {!completed && (
                  <Button
                    onClick={() => setActiveStep(step.id)}
                    disabled={!isNext}
                    className={isNext ? '' : 'opacity-50'}
                  >
                    {isNext ? 'Start' : 'Locked'}
                    {isNext && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                )}

                {completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveStep(step.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}