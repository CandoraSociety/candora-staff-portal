import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { BellRing, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import TimesheetDetail from '@/components/timesheets/TimesheetDetail';
import { ymd } from '@/lib/payPeriods';

// Highly visible banner on the main Dashboard for supervisors:
// pending timesheets assigned to them for review and approval.
export default function SupervisorTimesheetAlerts({ user }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const { data: pending = [] } = useQuery({
    queryKey: ['timesheets', 'pending'],
    queryFn: () => base44.entities.Timesheet.filter({ status: 'pending' }, '-submitted_date', 100),
    enabled: !!user?.email,
  });

  const mine = pending.filter(t =>
    (t.supervisor_email || '').toLowerCase() === (user?.email || '').toLowerCase());

  if (!mine.length) return null;

  const act = async (t, status) => {
    setActing(true);
    try {
      await base44.entities.Timesheet.update(t.id, status === 'approved'
        ? { status, approved_by_name: user.full_name, approved_by_email: user.email, approved_date: ymd(Date.now()) }
        : { status, rejection_reason: reason });
      qc.invalidateQueries({ queryKey: ['timesheets'] });
      toast({ title: status === 'approved' ? 'Timesheet approved' : 'Timesheet rejected' });
      setRejectingId(null);
      setReason('');
      setExpandedId(null);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-warning bg-warning/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-warning animate-pulse" />
        <h2 className="font-bold text-warning">
          {mine.length} timesheet{mine.length > 1 ? 's' : ''} awaiting your approval
        </h2>
      </div>

      {mine.map(t => (
        <div key={t.id} className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <div>
              <p className="font-semibold">{t.employee_name}</p>
              <p className="text-xs text-muted-foreground">Pay period {t.pay_period_start} → {t.pay_period_end}</p>
            </div>
            <p className="text-sm">Total paid hours: <span className="font-bold">{t.total_paid_hours || 0}</span></p>
            <p className="text-xs text-muted-foreground">Submitted {t.submitted_date}</p>
            <button
              className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
            >
              {expandedId === t.id ? <><ChevronUp className="w-4 h-4" /> Hide details</> : <><ChevronDown className="w-4 h-4" /> View details</>}
            </button>
          </div>

          {expandedId === t.id && <TimesheetDetail timesheet={t} />}

          {rejectingId === t.id ? (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Input
                className="flex-1"
                placeholder="Reason (optional)"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
              <Button variant="destructive" size="sm" disabled={acting} onClick={() => act(t, 'rejected')}><X className="w-4 h-4 mr-1" /> Confirm rejection</Button>
              <Button variant="ghost" size="sm" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" disabled={acting} onClick={() => act(t, 'approved')}><Check className="w-4 h-4 mr-1" /> Approve</Button>
              <Button size="sm" variant="outline" disabled={acting} onClick={() => setRejectingId(t.id)}>Reject</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}