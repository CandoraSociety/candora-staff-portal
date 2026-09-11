import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { PlaneTakeoff, Check, X } from 'lucide-react';
import { ymd } from '@/lib/payPeriods';

// Highly visible banner on the main Dashboard for supervisors:
// pending vacation requests assigned to them for review and approval.
export default function SupervisorVacationAlerts({ user }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const { data: pending = [] } = useQuery({
    queryKey: ['timeoff', 'pending'],
    queryFn: () => base44.entities.TimeOffRecord.filter({ status: 'pending' }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const mine = pending.filter(t =>
    (t.supervisor_email || '').toLowerCase() === (user?.email || '').toLowerCase());

  if (!mine.length) return null;

  const act = async (r, status) => {
    setActing(true);
    try {
      await base44.entities.TimeOffRecord.update(r.id, status === 'approved'
        ? { status, approved_by_name: user.full_name, approved_by_email: user.email, approved_date: ymd(Date.now()) }
        : { status, rejection_reason: reason });
      qc.invalidateQueries({ queryKey: ['timeoff'] });
      toast({ title: status === 'approved' ? 'Vacation request approved' : 'Vacation request rejected' });
      setRejectingId(null);
      setReason('');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-warning bg-warning/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <PlaneTakeoff className="h-5 w-5 text-warning animate-pulse" />
        <h2 className="font-bold text-warning">
          {mine.length} vacation request{mine.length > 1 ? 's' : ''} awaiting your approval
        </h2>
      </div>

      {mine.map(r => (
        <div key={r.id} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <div>
              <p className="font-semibold">{r.employee_name}</p>
              <p className="text-xs text-muted-foreground">
                {r.start_date}{r.end_date && r.end_date !== r.start_date ? ` → ${r.end_date}` : ''} · {r.hours_per_day || 8} hrs/day
              </p>
            </div>
            {r.notes && <p className="text-xs text-muted-foreground flex-1 min-w-[180px]">{r.notes}</p>}
          </div>

          {rejectingId === r.id ? (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Input className="flex-1" placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} />
              <Button variant="destructive" size="sm" disabled={acting} onClick={() => act(r, 'rejected')}><X className="w-4 h-4 mr-1" /> Confirm rejection</Button>
              <Button variant="ghost" size="sm" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" disabled={acting} onClick={() => act(r, 'approved')}><Check className="w-4 h-4 mr-1" /> Approve</Button>
              <Button size="sm" variant="outline" disabled={acting} onClick={() => setRejectingId(r.id)}>Reject</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}