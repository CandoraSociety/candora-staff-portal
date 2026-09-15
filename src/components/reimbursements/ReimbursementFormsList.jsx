import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, ChevronDown, ChevronUp, ExternalLink, Pencil, Plus, Receipt as ReceiptIcon, Trash2, Undo2 } from 'lucide-react';
import ReceiptEntryDialog from './ReceiptEntryDialog';
import OpenReimbursementButton from './OpenReimbursementButton';
import { getFormItems, syncFormTotals, invalidateFormQueries } from '@/lib/reimbursementFormTotals';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { REIMBURSEMENT_MODES } from '@/lib/reimbursementMode';

const STATUS_STYLES = {
  pending: { label: 'Submitted', cls: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Processing', cls: 'bg-purple-100 text-purple-800' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
};

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = d => d ? format(new Date(d + 'T00:00:00'), 'MMM d, yyyy') : '—';

export default function ReimbursementFormsList({ statuses, emptyText, mode = 'reimbursement' }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState(null);
  const [editState, setEditState] = useState(null); // { entry, form } — editing an entry inside a submitted (pending) form
  const cfg = REIMBURSEMENT_MODES[mode];
  const entryEntity = base44.entities[cfg.entryEntity];
  const formEntity = base44.entities[cfg.formEntity];

  const { data: forms = [], isLoading } = useQuery({
    queryKey: [cfg.myFormsKey, user?.email],
    queryFn: () => formEntity.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: entries = [] } = useQuery({
    queryKey: [cfg.myEntriesKey, user?.email],
    queryFn: () => entryEntity.filter({ requester_email: user?.email }),
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

  // Staff can still edit entries while the form sits at 'pending'.
  // Finance pressing Processing (or marking paid) locks it.
  const updateFormTotals = async (form, items) => {
    await syncFormTotals({ cfg, form, items });
    invalidateFormQueries(qc, cfg);
  };

  const handleEntrySaved = async (form) => {
    const items = await getFormItems({ cfg, userEmail: user?.email, formId: form.id });
    await updateFormTotals(form, items);
  };

  const removeFromForm = async (form, entry) => {
    if (!window.confirm('Remove this receipt from the request? It will move back to your Not Submitted list.')) return;
    await entryEntity.update(entry.id, { status: 'unsubmitted', form_id: null });
    const items = (entriesByForm[form.id] || []).filter(e => e.id !== entry.id);
    await updateFormTotals(form, items);
  };

  // Withdraw a submitted request while it's still pending (before Finance starts
  // processing it) — the entries return to the Not Submitted list, the form is removed.
  const withdrawForm = async (form) => {
    if (!window.confirm(`Withdraw this ${cfg.formCardLabel}? All receipt entries will move back to your Not Submitted list, and the request will be cancelled. You can edit them and resubmit later.`)) return;
    await entryEntity.updateMany({ form_id: form.id, status: 'submitted' }, { $set: { status: 'unsubmitted', form_id: null } });
    await formEntity.delete(form.id);
    invalidateFormQueries(qc, cfg);
  };

  const filtered = forms
    .filter(f => statuses.includes(f.status))
    .sort((a, b) => (b.submitted_date || b.created_date || '').localeCompare(a.submitted_date || a.created_date || ''));

  if (isLoading) return <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>;

  if (filtered.length === 0) {
    return (
      <Card className="p-0">
        <div className="py-8 text-center text-sm text-muted-foreground">
          <ReceiptIcon className="w-7 h-7 mx-auto mb-2 opacity-30" />
          {emptyText}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map(f => {
        const items = entriesByForm[f.id] || [];
        const st = STATUS_STYLES[f.status] || STATUS_STYLES.pending;
        const expanded = expandedId === f.id;
        return (
          <Card key={f.id} className="p-0 overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{cfg.formCardLabel} — {fmtDate(f.submitted_date || f.date_requested)}</p>
                  <Badge className={st.cls}>
                    {f.status === 'pending' && f.supervisor_status === 'pending' ? 'Awaiting Supervisor Approval' : st.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {f.entry_count || items.length || 0} receipt entr{(f.entry_count || items.length) === 1 ? 'y' : 'ies'}
                  {' · '}Cheque payable to {f.payable_to}
                  {f.etransfer_email ? ` · e-transfer: ${f.etransfer_email}` : ''}
                  {f.status === 'paid' && f.payment_date ? ` · paid ${fmtDate(f.payment_date)}` : ''}
                  {f.approved_by ? ` · approved by ${f.approved_by}` : ''}
                  {f.status === 'pending' && f.supervisor_status === 'pending'
                    ? ` · awaiting approval from ${f.supervisor_name || f.supervisor_email || 'your supervisor'}` : ''}
                </p>
                {f.status === 'rejected' && f.rejection_reason && (
                  <p className="text-xs text-red-600 mt-0.5">{f.rejection_reason}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{fmt(f.amount)}</p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <OpenReimbursementButton entries={items} form={f} mode={mode} />
                  {f.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 gap-1 text-xs"
                      onClick={() => withdrawForm(f)}
                      title="Withdraw this request — receipts go back to your Not Submitted list"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Withdraw
                    </Button>
                  )}
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    onClick={() => setExpandedId(expanded ? null : f.id)}
                  >
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {expanded ? 'Hide items' : 'View items'}
                  </button>
                </div>
              </div>
            </div>
            {expanded && (
              <div className="border-t border-border bg-muted/20">
                {f.status === 'pending' && (
                  <div className="px-4 py-1.5 text-xs text-muted-foreground border-b border-border bg-amber-50/50 flex items-center justify-between gap-2 flex-wrap">
                    <span>You can still edit these entries until Finance starts processing this form.</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 gap-1 text-xs"
                      onClick={() => setEditState({ entry: null, form: f })}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add receipt entry
                    </Button>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 font-semibold">Supplier</th>
                      <th className="px-4 py-2 font-semibold text-right">Total</th>
                      <th className="px-4 py-2 font-semibold text-center">Receipt</th>
                      {f.status === 'pending' && <th className="px-4 py-2 font-semibold text-center">Edit</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(e => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="px-4 py-2 whitespace-nowrap">{fmtDate(e.date_incurred)}</td>
                        <td className="px-4 py-2">{e.description}</td>
                        <td className="px-4 py-2">{e.supplier || '—'}</td>
                        <td className="px-4 py-2 text-right font-medium">{fmt(e.total_cost)}</td>
                        <td className="px-4 py-2 text-center">
                          {e.receipt_url ? (
                            <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                              <ExternalLink className="w-3.5 h-3.5" />View
                            </a>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        {f.status === 'pending' && (
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditState({ entry: e, form: f })} title="Edit this entry">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => removeFromForm(f, e)} title="Remove from this request (back to Not Submitted)">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-3 text-center text-xs text-muted-foreground">No item details available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
      {editState && (
        <ReceiptEntryDialog
          open
          onOpenChange={o => { if (!o) setEditState(null); }}
          onSaved={() => handleEntrySaved(editState.form)}
          entry={editState.entry}
          attachToFormId={editState.entry ? undefined : editState.form.id}
          mode={mode}
        />
      )}
    </div>
  );
}