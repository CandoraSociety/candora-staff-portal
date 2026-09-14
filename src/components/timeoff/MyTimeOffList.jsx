import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import TimesheetStatusBadge from '@/components/timesheets/TimesheetStatusBadge';
import EditTimeOffDialog from '@/components/timeoff/EditTimeOffDialog';
import { Pencil, Trash2, X } from 'lucide-react';

const KIND_LABELS = { vacation: 'Vacation', sick: 'Sick Time', personal: 'Personal Day' };

// The signed-in employee's time-off records, filtered by kind.
// When `manageable`, approved vacation requests can be edited (re-sent to the
// supervisor for approval) or withdrawn.
export default function MyTimeOffList({ user, kinds, manageable = false }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null);
  const [withdrawId, setWithdrawId] = useState(null);
  const [acting, setActing] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ['timeoff', 'mine', user?.email],
    queryFn: () => base44.entities.TimeOffRecord.filter({ employee_email: user.email }, '-created_date', 100),
    enabled: !!user?.email,
  });
  const mine = records.filter(r => kinds.includes(r.kind));

  const refresh = () => qc.invalidateQueries({ queryKey: ['timeoff'] });

  const withdraw = async (r) => {
    setActing(true);
    try {
      await base44.entities.TimeOffRecord.delete(r.id);
      toast({ title: 'Vacation request withdrawn' });
      setWithdrawId(null);
      refresh();
    } finally {
      setActing(false);
    }
  };

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
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <TimesheetStatusBadge status={r.status} />
            {manageable && r.kind === 'vacation' && r.status === 'approved' && (
              withdrawId === r.id ? (
                <span className="flex items-center gap-1">
                  <Button size="sm" variant="destructive" disabled={acting} onClick={() => withdraw(r)}>Confirm withdraw</Button>
                  <Button size="sm" variant="ghost" onClick={() => setWithdrawId(null)}><X className="w-4 h-4" /></Button>
                </span>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditing(r)} title="Edit — sends the request back to your supervisor for approval">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={() => setWithdrawId(r.id)} title="Withdraw this approved request">
                    <Trash2 className="w-3.5 h-3.5" /> Withdraw
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      ))}
      <EditTimeOffDialog record={editing} onClose={() => setEditing(null)} onSaved={refresh} />
    </div>
  );
}