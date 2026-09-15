import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import TeamScheduleCalendar from '@/components/timeoff/TeamScheduleCalendar';
import { useSupervisorAccess } from '@/lib/useSupervisorAccess';

// Collapsible team schedule — the same calendar as the Team Schedule page,
// embedded (collapsed by default) inside supervisor dashboard notifications.
// Data is only fetched once the section is expanded.
export default function TeamScheduleSection() {
  const { user, isAdmin, directReports } = useSupervisorAccess();
  const [expanded, setExpanded] = useState(false);

  const { data: allTimeOff = [] } = useQuery({
    queryKey: ['timeoff', 'team'],
    queryFn: () => base44.entities.TimeOffRecord.list('-created_date', 500),
    enabled: expanded,
  });

  const { data: allTimesheets = [] } = useQuery({
    queryKey: ['timesheets', 'team'],
    queryFn: () => base44.entities.Timesheet.list('-submitted_date', 200),
    enabled: expanded,
  });

  const myEmail = (user?.email || '').toLowerCase();
  const staffEmails = useMemo(
    () => directReports.map(e => (e.email || '').toLowerCase()).filter(Boolean),
    [directReports]
  );
  const inScope = r =>
    isAdmin ||
    staffEmails.includes((r.employee_email || '').toLowerCase()) ||
    (r.supervisor_email || '').toLowerCase() === myEmail;

  const timeOff = allTimeOff.filter(r => (r.status === 'approved' || r.status === 'pending') && inScope(r));
  const timesheets = allTimesheets.filter(inScope);

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <CalendarDays className="w-4 h-4" />
        {expanded ? 'Hide Team Schedule' : 'View Team Schedule'}
      </Button>
      {expanded && <TeamScheduleCalendar timeOff={timeOff} timesheets={timesheets} />}
    </div>
  );
}