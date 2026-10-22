import { BellRing } from 'lucide-react';
import { useTrainingTour } from '@/components/training/TrainingTourProvider';
import SupervisorTimesheetAlerts from '@/components/timesheets/SupervisorTimesheetAlerts';
import SupervisorReimbursementAlerts from '@/components/reimbursements/SupervisorReimbursementAlerts';
import SupervisorVacationAlerts from '@/components/timeoff/SupervisorVacationAlerts';
import PaidReimbursementAlerts from '@/components/dashboard/PaidReimbursementAlerts';
import EdBriefingAlerts from '@/components/dashboard/EdBriefingAlerts';
import FinanceFileApprovalWidget from '@/components/ed/FinanceFileApprovalWidget';

export default function DashboardNotifications({ user }) {
  const { revealedWidget } = useTrainingTour();
  return (
    <section data-tour="dashboard-notifications" className="space-y-6 empty:hidden">
      {revealedWidget === 'notifications' && (
        <div className="rounded-2xl border-2 border-primary bg-primary/10 p-4" role="note">
          <h2 className="flex items-center gap-2 font-bold text-foreground">
            <BellRing className="h-5 w-5 text-primary" /> Notifications and approvals
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment updates appear here. Supervisors also see timesheets, time-off requests,
            and reimbursements awaiting approval. When there are no updates, this area stays
            hidden outside the tour.
          </p>
        </div>
      )}
      <SupervisorTimesheetAlerts user={user} />
      <SupervisorReimbursementAlerts user={user} />
      <SupervisorVacationAlerts user={user} />
      <PaidReimbursementAlerts user={user} />
      <EdBriefingAlerts user={user} />
      {user?.email?.toLowerCase() === 'graham.currie@candorasociety.com' && (
        <FinanceFileApprovalWidget />
      )}
    </section>
  );
}