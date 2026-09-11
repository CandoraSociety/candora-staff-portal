import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';

const KIND_LABELS = { vacation: 'Vacation', sick: 'Sick Time', personal: 'Personal Day' };

// The signed-in employee's time-off records, filtered by kind
export default function MyTimeOffList({ user, kinds }) {
  const { data: records = [] } = useQuery({
    queryKey: ['timeoff', 'mine', user?.email],
    queryFn: () => base44.entities.TimeOffRecord.filter({ employee_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });
  const mine = records.filter(r => kinds.includes(r.kind));

  if (!mine.length) {
    return <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {mine.map(r => (
        <div key={r.id} className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-x-6 gap-y-1">
          <div>
            <p className="font-medium">{KIND_LABELS[r.kind] || r.kind}</p>
            <p className="text-xs text-muted-foreground">
              {r.start_date}{r.end_date && r.end_date !== r.start_date ? ` → ${r.end_date}` : ''} · {r.hours_per_day || 8} hrs/day
            </p>
          </div>
          {r.notes && <p className="text-xs text-muted-foreground flex-1 min-w-[180px]">{r.notes}</p>}
          {r.status === 'approved' && r.approved_by_name && (
            <p className="text-xs text-muted-foreground">Approved by {r.approved_by_name}</p>
          )}
          <div className="ml-auto"><TimesheetStatusBadge status={r.status} /></div>
        </div>
      ))}
    </div>
  );
}