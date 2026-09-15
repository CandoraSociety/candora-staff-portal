import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Receipt, Check, X } from 'lucide-react';
import OpenReimbursementButton from '@/components/reimbursements/OpenReimbursementButton';
import { ymd } from '@/lib/payPeriods';

const MODES = [
  { mode: 'reimbursement', label: 'Reimbursement request', formEntity: 'StaffReimbursementRequest', entryEntity: 'ReimbursementEntry' },
  { mode: 'cc', label: 'MasterCard receipts submission', formEntity: 'CCReceiptSubmission', entryEntity: 'CCReceiptEntry' },
];

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// Highly visible banner on the main Dashboard for supervisors:
// reimbursement forms and MasterCard receipts submissions from their direct
// reports, awaiting their approval before Finance can process them.
export default function SupervisorReimbursementAlerts({ user }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const { data: forms = [] } = useQuery({
    queryKey: ['supervisor-reimbursements', user?.email],
    queryFn: async () => {
      const lists = await Promise.all(MODES.map(async m => {
        const rows = await base44.entities[m.formEntity].filter({ supervisor_status: 'pending' }, '-submitted_date', 100);
        return rows
          .filter(r => (r.supervisor_email || '').toLowerCase() === (user?.email || '').toLowerCase())
          .map(r => ({ ...r, mode: m.mode, formEntity: m.formEntity }));
      }));
      return lists.flat();
    },
    enabled: !!user?.email,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['supervisor-reimbursement-entries'],
    queryFn: async () => {
      const lists = await Promise.all(MODES.map(m =>
        base44.entities[m.entryEntity].filter({ status: 'submitted' }, '-created_date', 500)
      ));
      return lists.flat();
    },
    enabled: !!user?.email,
  });

  const entriesByForm = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.form_id) continue;
      (map[e.form_id] = map[e.form_id] || []).push(e);
    }
    return map;
  }, [entries]);

  if (!forms.length) return null;

  const act = async (form, status) => {
    setActing(true);
    try {
      const entity = base44.entities[form.formEntity];
      if (status === 'approved') {
        await entity.update(form.id, {
          supervisor_status: 'approved',
          supervisor_approved_date: ymd(Date.now()),
          supervisor_approved_by_name: user.full_name,
        });
      } else {
        await entity.update(form.id, {
          supervisor_status: 'rejected',
          supervisor_approved_date: ymd(Date.now()),
          supervisor_approved_by_name: user.full_name,
          supervisor_rejection_reason: reason,
          status: 'rejected',
          rejection_reason: reason ? `Rejected by supervisor: ${reason}` : 'Rejected by supervisor',
        });
      }
      qc.invalidateQueries({ queryKey: ['supervisor-reimbursements'] });
      qc.invalidateQueries({ queryKey: ['supervisor-reimbursement-entries'] });
      qc.invalidateQueries({ queryKey: ['staff-reimbursements'] });
      qc.invalidateQueries({ queryKey: ['cc-receipt-submissions'] });
      qc.invalidateQueries({ queryKey: ['staff-reimbursement-entries'] });
      qc.invalidateQueries({ queryKey: ['cc-receipt-entries'] });
      qc.invalidateQueries({ queryKey: ['my-reimbursement-forms'] });
      qc.invalidateQueries({ queryKey: ['my-cc-receipt-forms'] });
      qc.invalidateQueries({ queryKey: ['my-reimbursement-entries'] });
      qc.invalidateQueries({ queryKey: ['my-cc-receipt-entries'] });
      toast({ title: status === 'approved' ? 'Submission approved' : 'Submission rejected' });
      setRejectingId(null);
      setReason('');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-warning bg-warning/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-warning animate-pulse" />
        <h2 className="font-bold text-warning">
          {forms.length} reimbursement submission{forms.length > 1 ? 's' : ''} awaiting your approval
        </h2>
      </div>

      {forms.map(f => {
        const items = entriesByForm[f.id] || [];
        return (
          <div key={`${f.mode}-${f.id}`} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <div>
                <p className="font-semibold">{f.requester_name}</p>
                <p className="text-xs text-muted-foreground">
                  {MODES.find(m => m.mode === f.mode)?.label} · {items.length} entr{items.length === 1 ? 'y' : 'ies'} · submitted {f.submitted_date || f.date_requested || '—'}
                </p>
              </div>
              <p className="text-sm">Total: <span className="font-bold">{fmt(f.amount)}</span></p>
              <div className="ml-auto">
                <OpenReimbursementButton entries={items} form={f} mode={f.mode} />
              </div>
            </div>

            {rejectingId === f.id ? (
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Input className="flex-1" placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} />
                <Button variant="destructive" size="sm" disabled={acting} onClick={() => act(f, 'rejected')}><X className="w-4 h-4 mr-1" /> Confirm rejection</Button>
                <Button variant="ghost" size="sm" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" disabled={acting} onClick={() => act(f, 'approved')}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                <Button size="sm" variant="outline" disabled={acting} onClick={() => setRejectingId(f.id)}>Reject</Button>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">
        Approving sends the submission on to the Finance portal. Finance cannot process a submission until you approve it.
      </p>
    </div>
  );
}