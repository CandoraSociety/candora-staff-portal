import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import ReceiptsBundleButton from '@/components/reimbursements/ReceiptsBundleButton';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = d => d ? format(parseISO(d), 'MMM d, yyyy') : '—';

const STATUS_STYLES = {
  pending: { label: 'Awaiting Finance review', cls: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Under review', cls: 'bg-purple-100 text-purple-800' },
  approved: { label: 'Reviewed', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Returned', cls: 'bg-red-100 text-red-800' },
  paid: { label: 'Processed', cls: 'bg-blue-100 text-blue-800' },
};

// Staff side — receipts once they've been submitted to the Finance portal
export default function CCSubmittedReceipts() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['cc-submissions-mine', user?.email],
    queryFn: () => base44.entities.CCReceiptSubmission.filter({ requester_email: user?.email }, '-submitted_date', 200),
    enabled: !!user?.email,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['my-cc-receipt-entries', user?.email],
    queryFn: () => base44.entities.CCReceiptEntry.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const entriesByForm = useMemo(() => {
    const map = {};
    for (const e of entries) {
      if (!e.form_id || e.status === 'unsubmitted') continue;
      (map[e.form_id] = map[e.form_id] || []).push(e);
    }
    return map;
  }, [entries]);

  // Delete a submitted batch — its receipts move back to Not Submitted so they can be fixed and resubmitted
  const del = useMutation({
    mutationFn: async s => {
      const items = entriesByForm[s.id] || [];
      await base44.entities.CCReceiptSubmission.delete(s.id);
      if (items.length > 0) {
        await base44.entities.CCReceiptEntry.bulkUpdate(items.map(e => ({ id: e.id, status: 'unsubmitted', form_id: '' })));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-submissions-mine'] });
      qc.invalidateQueries({ queryKey: ['my-cc-receipt-entries'] });
      toast.success('Submission deleted — its receipts are back in Not Submitted.');
    },
    onError: err => toast.error(err?.message || 'Could not delete the submission.'),
  });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Submitted</h2>
        <p className="text-xs text-muted-foreground">
          Receipts you've sent to Finance — reviewed against the monthly card statement in the Candora MasterCard tab.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading your submissions…</p>
      ) : submissions.length === 0 ? (
        <Card className="p-0">
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nothing submitted yet. Use <span className="font-medium text-foreground">Submit Receipts to Finance</span> to send your uploaded receipts.
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-3 py-2.5 font-semibold">Submitted</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Receipts</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Total</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Receipts PDF</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => {
                  const st = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
                  const items = entriesByForm[s.id] || [];
                  const count = s.entry_count || items.length;
                  return (
                    <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-3 py-2.5 whitespace-nowrap">{fmtDate(s.submitted_date || s.date_requested)}</td>
                      <td className="px-3 py-2.5 text-center">{count}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{fmt(s.amount)}</td>
                      <td className="px-3 py-2.5">
                        <Badge className={st.cls}>
                          {st.label === 'Reviewed' && <CheckCircle2 className="w-3 h-3 mr-1" />}{st.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <ReceiptsBundleButton entries={items} form={s} docTitle="Candora MasterCard Receipts" />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Button
                          size="sm" variant="ghost" className="h-7 px-2"
                          title="Delete this submission — its receipts move back to Not Submitted"
                          disabled={del.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete this submission (${count} receipt${count === 1 ? '' : 's'}, ${fmt(s.amount)})? Its receipts will move back to Not Submitted.`)) del.mutate(s);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}