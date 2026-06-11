import React, { useState } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExpectedNotificationModal from './ExpectedNotificationModal';
import SetReminderPopover from './SetReminderPopover';

const STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'awarded', label: 'Decision' },
];

const STATUS_ORDER = ['draft', 'in_progress', 'submitted', 'awarded', 'declined'];

export default function ProjectProgress({ project, onUpdate }) {
  const [showNotif, setShowNotif] = useState(false);
  const currentIdx = STATUS_ORDER.indexOf(project.status);

  return (
    <div className="bg-card border rounded-xl px-5 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {STAGES.map((stage, i) => {
            const stageIdx = STATUS_ORDER.indexOf(stage.key);
            const done = currentIdx > stageIdx;
            const active = currentIdx === stageIdx || (stage.key === 'awarded' && ['awarded', 'declined', 'cancelled', 'closed'].includes(project.status));
            return (
              <React.Fragment key={stage.key}>
                {i > 0 && <div className={`flex-1 h-0.5 min-w-4 ${done ? 'bg-primary' : 'bg-border'}`} />}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  {done ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : active ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                  <span className={`text-xs whitespace-nowrap ${active ? 'text-primary font-semibold' : done ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                    {stage.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowNotif(true)}>
            <Clock className="h-3.5 w-3.5" />Expected Notification
          </Button>
          <SetReminderPopover projectId={project.id} />
        </div>
      </div>
      {project.expected_notification_date && (
        <p className="text-xs text-muted-foreground mt-2">
          Expected decision: <span className="font-medium">{project.expected_notification_date}</span>
          {project.expected_notification_notes && ` — ${project.expected_notification_notes}`}
        </p>
      )}
      {showNotif && <ExpectedNotificationModal project={project} onClose={() => { setShowNotif(false); onUpdate(); }} />}
    </div>
  );
}