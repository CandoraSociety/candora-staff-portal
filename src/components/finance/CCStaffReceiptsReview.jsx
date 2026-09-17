import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, CheckCircle2, ChevronDown, ChevronRight, Paperclip, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import ReceiptsBundleButton from '@/components/reimbursements/ReceiptsBundleButton';
import { useCCReceiptSelection } from '@/components/finance/CCReceiptSelectionContext';

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
  const { selected, toggle: toggleSelected } = useCCReceiptSelection();
  const [expanded, setExpanded] = useState({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['finance-cc-submissions'],
    queryFn: () => base44.entities.CCReceiptSubmission.list('-submitted_date', 200),
  });

  // Line items across all statements — lets us flag receipts already attached to a statement
  const { data: allLines = [] } = useQuery({
    queryKey: ['cc-statement-lines-all'],
    queryFn: () => base44.entities.CCStatementLineItem.list('-created_date', 1000),
  });
  const usedUrls = useMemo(() => new Set(allLines.map(l => l.receipt_url).filter(Boolean)), [allLines]);

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
          Expand a submission and check the receipts, then press “Add from Staff Receipts” on a statement line item to attach them. Mark submissions reviewed once everything is in.
        </p>
        {Object.keys(selected).length > 0 && (
          <Badge className="bg-primary text-primary-foreground ml-auto">{Object.keys(selected).length} checked</Badge>
        )}
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
                const open = !!expanded[s.id];
                return (
                  <React.Fragment key={s.id}>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <button type="button" className="inline-flex items-start gap-2 text-left" onClick={() => setExpanded(x => ({ ...x, [s.id]: !x[s.id] }))} title={open ? 'Hide receipts' : 'Show receipts'}>
                        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-0.5" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5" />}
                        <span>
                          <span className="block font-medium">{s.requester_name || '—'}</span>
                          <span className="block text-xs text-muted-foreground">{s.requester_email || ''}</span>
                        </span>
                      </button>
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
                  {open && (
                    <tr className="bg-muted/10">
                      <td colSpan={7} className="px-10 py-3">
                        {items.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No receipts found for this submission.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {items.map(e => {
                              const onStatement = !!e.receipt_url && usedUrls.has(e.receipt_url);
                              const checked = !!selected[e.id];
                              return (
                                <label
                                  key={e.id}
                                  className={`flex items-center gap-3 rounded-md border px-3 py-1.5 ${checked ? 'border-primary bg-primary/5' : onStatement ? 'border-success/40 bg-success/5' : 'border-border'} ${onStatement ? '' : 'cursor-pointer'}`}
                                >
                                  <Checkbox checked={checked} disabled={onStatement} onCheckedChange={() => !onStatement && toggleSelected(e)} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" title={e.description}>{e.description || 'Receipt'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {e.date_incurred ? format(parseISO(e.date_incurred), 'MMM d, yyyy') : 'No date'}
                                    </p>
                                  </div>
                                  <span className="text-sm font-semibold whitespace-nowrap">{fmt(e.total_cost)}</span>
                                  {onStatement ? (
                                    <Badge className="bg-green-100 text-green-800 whitespace-nowrap"><CheckCircle2 className="w-3 h-3 mr-1" />On statement</Badge>
                                  ) : e.receipt_url ? (
                                    <a href={e.receipt_url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline whitespace-nowrap">View</a>
                                  ) : (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">No file</span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}