import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2, Paperclip, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import ReceiptsBundleButton from '@/components/reimbursements/ReceiptsBundleButton';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = d => d ? format(parseISO(d), 'MMM d, yyyy') : '—';

const STATUS_STYLES = {
  pending: { label: 'Awaiting review', cls: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Under review', cls: 'bg-purple-100 text-purple-800' },
  approved: { label: 'Reviewed', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Returned', cls: 'bg-red-100 text-red-800' },
  paid: { label: 'Processed', cls: 'bg-blue-100 text-blue-800' },
};

// Finance side of staff Candora CC receipts — submitted receipt bundles listed
// for review against the monthly card statement (no payment workflow needed:
// these purchases were already made on the card).
export default function CCStaffReceiptsReview() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['finance-cc-submissions'],
    queryFn: () => base44.entities.CCReceiptSubmission.list('-submitted_date', 200),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['finance-cc-entries'],
    queryFn: () => base44.entities.CCReceiptEntry.list('-created_date', 1000),
  });

  const entriesByForm = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.form_id || e.status === 'unsubmitted') continue;
      (map[e.form_id] = map[e.form_id] || []).push(e);
    }
    return map;
  }, [entries]);

  // Awaiting review first, then newest submitted
  const ordered = useMemo(() =>
    [...submissions].sort((a, b) =>
      (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
      String(b.submitted_date || b.created_date || '').localeCompare(String(a.submitted_date || a.created_date || ''))),
    [submissions]);

  const markReviewed = useMutation({
    mutationFn: s => base44.entities.CCReceiptSubmission.update(s.id, {
      status: 'approved',
      reviewed_date: format(new Date(), 'yyyy-MM-dd'),
      reviewed_by: user?.email || '',
      reviewed_by_name: displayName(user),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-cc-submissions'] });
      toast.success('Marked as reviewed.');
    },
    onError: err => toast.error(err?.message || 'Could not update the submission.'),
  });

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Staff MasterCard Receipts</h3>
        <p className="text-xs text-muted-foreground hidden md:block">
          Receipts submitted by staff — check them off against the card statement above, then mark them reviewed.
        </p>
      </div>

      {isLoading ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">Loading submissions…</div>
      ) : ordered.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">No staff receipts submitted yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Staff Member</th>
                <th className="text-left px-4 py-2 font-semibold">Reference</th>
                <th className="text-left px-4 py-2 font-semibold">Submitted</th>
                <th className="text-center px-4 py-2 font-semibold">Receipts</th>
                <th className="text-right px-4 py-2 font-semibold">Total</th>
                <th className="text-left px-4 py-2 font-semibold">Status</th>
                <th className="text-center px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ordered.map(s => {
                const st = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
                const items = entriesByForm[s.id] || [];
                const count = s.entry_count || items.length;
                const withFile = items.filter(e => e.receipt_url).length;
                return (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <div className="font-medium">{s.requester_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.requester_email || ''}</div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{s.reference_code || '—'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{fmtDate(s.submitted_date || s.date_requested)}</td>
                    <td className="px-4 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                        {count}
                        <span className="text-xs text-muted-foreground">({withFile} file{withFile === 1 ? '' : 's'})</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{fmt(s.amount)}</td>
                    <td className="px-4 py-2">
                      <Badge className={st.cls}>
                        {st.label === 'Reviewed' && <CheckCircle2 className="w-3 h-3 mr-1" />}{st.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center gap-1">
                        <ReceiptsBundleButton entries={items} form={s} docTitle="Candora MasterCard Receipts" />
                        {s.status === 'pending' && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1.5 text-green-700 hover:bg-green-50" onClick={() => markReviewed.mutate(s)} title="Mark these receipts as reviewed against the statement">
                            <Check className="w-4 h-4" /> Mark Reviewed
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}