import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import TeamScheduleCalendar from '@/components/timeoff/TeamScheduleCalendar';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';

// Supervisor view of their staff's vacation requests, sick time, personal days
// and timesheets — all on one month calendar, filterable by type and employee.
export default function TeamSchedule() {
  const { user, isAdmin, directReports, loading } = useSupervisorAccess();

  const staffEmails = useMemo(
    () => directReports.map(e => (e.email || '').toLowerCase()).filter(Boolean),
    [directReports]
  );

  const { data: allTimeOff = [] } = useQuery({
    queryKey: ['timeoff', 'team'],
    queryFn: () => base44.entities.TimeOffRecord.list('-created_date', 500),
  });

  const { data: allTimesheets = [] } = useQuery({
    queryKey: ['timesheets', 'team'],
    queryFn: () => base44.entities.Timesheet.list('-submitted_date', 200),
  });

  const myEmail = (user?.email || '').toLowerCase();
  const inScope = r =>
    isAdmin ||
    staffEmails.includes((r.employee_email || '').toLowerCase()) ||
    (r.supervisor_email || '').toLowerCase() === myEmail;

  const timeOff = allTimeOff.filter(r => (r.status === 'approved' || r.status === 'pending') && inScope(r));
  const timesheets = allTimesheets.filter(inScope);

  const isAnySupervisor =
    allTimeOff.some(r => (r.supervisor_email || '').toLowerCase() === myEmail) ||
    allTimesheets.some(t => (t.supervisor_email || '').toLowerCase() === myEmail);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Team Time &amp; Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your staff's vacation requests, sick time, personal days and timesheets on one calendar — filter by type or employee.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !isAdmin && staffEmails.length === 0 && !isAnySupervisor ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          You don't currently supervise any staff. Vacation requests and timesheets assigned
          to you for approval appear here once staff submit them.
        </CardContent></Card>
      ) : (
        <TeamScheduleCalendar timeOff={timeOff} timesheets={timesheets} />
      )}
    </div>
  );
}