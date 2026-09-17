import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Loader2, Paperclip, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { extractReceiptDetails } from '@/lib/receiptDateExtraction';
import { PROGRAM_OPTIONS, programLabel } from '@/lib/reimbursementConstants';
import ExcludedItemsControl from '@/components/reimbursements/ExcludedItemsControl';
import ReceiptEntryDialog from '@/components/reimbursements/ReceiptEntryDialog';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

const BLANK_DRAFT = {
  program: '', program_other: '', date_incurred: format(new Date(), 'yyyy-MM-dd'), description: '', supplier: '',
  total_cost: '', gst: '', food_included: null, excluded_amount: '', excluded_description: '',
  receipt_url: '',
};

// Alberta GST is 5% — the GST portion of an all-inclusive total is total × (5/105) = total / 21
const calcGst = (total) => (parseFloat(total) / 21).toFixed(2);

// Staff side of Candora CC receipts — enter each MasterCard purchase receipt with the
// same details as a reimbursement entry, then submit them to Finance so they can be
// reviewed against the card statement.
export default function CCReceiptsUploadSection() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [draft, setDraft] = useState(null); // non-null = inline new-entry row is open
  const [draftError, setDraftError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['my-cc-receipt-entries', user?.email],
    queryFn: () => base44.entities.CCReceiptEntry.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const unsubmitted = entries
    .filter(e => e.status === 'unsubmitted')
    .sort((a, b) => (b.date_incurred || b.created_date || '').localeCompare(a.date_incurred || a.created_date || ''));

  const total = unsubmitted.reduce((s, e) => s + (e.total_cost || 0), 0);
  const gstTotal = unsubmitted.reduce((s, e) => s + (e.gst || 0), 0);

  const del = useMutation({
    mutationFn: id => base44.entities.CCReceiptEntry.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-cc-receipt-entries'] }),
  });

  const addEntry = useMutation({
    mutationFn: payload => base44.entities.CCReceiptEntry.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-cc-receipt-entries'] });
      setDraft(null);
      setDraftError('');
    },
  });

  const updateDraft = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const updateTotalDraft = (v) => {
    updateDraft('total_cost', v);
    if (draft.food_included === false) updateDraft('gst', calcGst(v));
  };

  const toggleFood = (checked) => {
    updateDraft('food_included', checked);
    if (checked) {
      updateDraft('gst', ''); // GST on food varies — entered manually
    } else {
      const amt = parseFloat(draft.total_cost);
      if (!isNaN(amt) && amt > 0) updateDraft('gst', calcGst(amt));
    }
  };

  const startDraft = () => {
    setDraftError('');
    setDraft({ ...BLANK_DRAFT, date_incurred: format(new Date(), 'yyyy-MM-dd') });
  };

  const onDraftFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      updateDraft('receipt_url', file_url);
      // Autofill what we can read off the receipt — user can still edit before saving
      const d = await extractReceiptDetails(file_url);
      if (d) {
        setDraft(prev => ({
          ...prev,
          date_incurred: d.date || prev.date_incurred,
          description: prev.description || d.description || d.supplier || '',
          supplier: d.supplier || prev.supplier,
          total_cost: d.total != null ? String(d.total) : prev.total_cost,
          gst: d.gst != null ? String(d.gst) : prev.gst,
        }));
        if (!d.date) setDraftError('Could not read the purchase date from the receipt — enter it manually.');
      } else {
        setDraftError('Could not read the receipt — fill in the details manually.');
      }
    } catch {
      setDraftError('Receipt upload failed — try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const saveDraft = () => {
    setDraftError('');
    if (!draft.description.trim()) { setDraftError('Describe what was purchased.'); return; }
    if (!draft.program) { setDraftError('Select the program this purchase relates to.'); return; }
    if (draft.program === 'other' && !draft.program_other.trim()) { setDraftError('Specify the program.'); return; }
    if (draft.food_included === null || draft.food_included === undefined) { setDraftError('Indicate whether this purchase includes food items.'); return; }
    const amt = parseFloat(draft.total_cost);
    if (isNaN(amt) || amt <= 0) { setDraftError('Enter the receipt total cost (with GST).'); return; }
    if (draft.food_included === true && draft.gst === '') { setDraftError('Enter the GST amount (enter 0 if none was charged).'); return; }
    // Personal item(s) excluded from the claim — price entered before GST, 5% GST added automatically
    const excl = parseFloat(draft.excluded_amount);
    const hasExcl = !isNaN(excl) && excl > 0;
    const exclIncl = hasExcl ? +(excl * 1.05).toFixed(2) : 0;
    const exclGst = hasExcl ? +(excl * 0.05).toFixed(2) : 0;
    const gstVal = draft.gst !== '' && draft.gst !== null ? parseFloat(draft.gst) : 0;
    addEntry.mutate({
      requester_name: displayName(user),
      requester_email: user?.email || '',
      program: draft.program,
      program_other: draft.program === 'other' ? draft.program_other : '',
      date_incurred: draft.date_incurred || null,
      description: draft.description,
      supplier: draft.supplier,
      total_cost: hasExcl ? Math.max(0, +(amt - exclIncl).toFixed(2)) : amt,
      gst: hasExcl ? Math.max(0, +(gstVal - exclGst).toFixed(2)) : gstVal,
      excluded_amount: hasExcl ? excl : null,
      excluded_description: hasExcl ? draft.excluded_description : '',
      food_included: draft.food_included === true,
      receipt_url: draft.receipt_url,
      status: 'unsubmitted',
    });
  };

  // Send all unsubmitted receipts to the Finance portal's Candora MasterCard tab
  const submitToFinance = async () => {
    if (unsubmitted.length === 0) return;
    if (!window.confirm(`Submit ${unsubmitted.length} receipt${unsubmitted.length === 1 ? '' : 's'} (${fmt(total)}) to Finance for review?`)) return;
    setSubmitting(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const submission = await base44.entities.CCReceiptSubmission.create({
        requester_name: displayName(user),
        requester_email: user?.email || '',
        payable_to: displayName(user),
        entry_ids: unsubmitted.map(e => e.id),
        entry_count: unsubmitted.length,
        amount: +total.toFixed(2),
        tax: +gstTotal.toFixed(2),
        date_requested: today,
        submitted_date: today,
        status: 'pending',
        supervisor_status: 'approved',
      });
      await base44.entities.CCReceiptEntry.bulkUpdate(
        unsubmitted.map(e => ({ id: e.id, status: 'submitted', form_id: submission.id }))
      );
      qc.invalidateQueries({ queryKey: ['my-cc-receipt-entries'] });
      qc.invalidateQueries({ queryKey: ['cc-submissions-mine'] });
      toast.success('Receipts submitted — Finance will review them against the card statement.');
    } catch (err) {
      toast.error(err?.message || 'Submission failed — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasRows = unsubmitted.length > 0 || !!draft;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Not Submitted <span className="text-muted-foreground font-normal">({unsubmitted.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Receipt entries waiting to be sent to Finance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={startDraft} disabled={!!draft}>
            <Plus className="w-4 h-4" />Add Receipt Entry
          </Button>
          <Button size="sm" className="gap-2" disabled={unsubmitted.length === 0 || submitting} onClick={submitToFinance}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Submit Receipts to Finance
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading your receipts…</p>
      ) : !hasRows ? (
        <Card className="p-0">
          <div className="py-8 text-center text-sm text-muted-foreground">
            No receipts entered yet. Click <span className="font-medium text-foreground">Add Receipt Entry</span> for each purchase made with the Candora MasterCard.
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Description</th>
                  <th className="px-3 py-2.5 font-semibold">Supplier</th>
                  <th className="px-3 py-2.5 font-semibold">Program</th>
                  <th className="px-3 py-2.5 font-semibold text-right">GST</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Total (with GST)</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Food?</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Receipt</th>
                  <th className="px-3 py-2.5 w-[110px]"></th>
                </tr>
              </thead>
              <tbody>
                {draft && (
                  <tr className="border-t border-border bg-primary/5">
                    <td className="px-2 py-1.5"><Input type="date" value={draft.date_incurred} onChange={e => updateDraft('date_incurred', e.target.value)} className="h-8 w-[130px]" /></td>
                    <td className="px-2 py-1.5"><Input value={draft.description} onChange={e => updateDraft('description', e.target.value)} placeholder="Items purchased" className="h-8 min-w-[180px]" /></td>
                    <td className="px-2 py-1.5"><Input value={draft.supplier} onChange={e => updateDraft('supplier', e.target.value)} placeholder="Supplier" className="h-8 w-[120px]" /></td>
                    <td className="px-2 py-1.5">
                      <Select value={draft.program} onValueChange={v => updateDraft('program', v)}>
                        <SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Program" /></SelectTrigger>
                        <SelectContent>
                          {PROGRAM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {draft.program === 'other' && (
                        <Input value={draft.program_other} onChange={e => updateDraft('program_other', e.target.value)} placeholder="Specify program" className="h-8 w-[150px] mt-1" />
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number" step="0.01" min="0" value={draft.gst}
                        onChange={e => updateDraft('gst', e.target.value)}
                        placeholder={draft.food_included === false ? 'auto' : '0.00'}
                        disabled={draft.food_included === false}
                        title={draft.food_included === false ? 'Auto-calculated at 5% Alberta GST' : 'Enter the GST amount from the receipt'}
                        className="h-8 w-[80px] text-right disabled:bg-muted/50" />
                      {draft.food_included === true && (
                        <p className="mt-1 text-[10px] leading-tight text-amber-600 max-w-[110px]">GST must be entered manually — not all food is charged GST.</p>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <Input type="number" step="0.01" min="0" value={draft.total_cost} onChange={e => updateTotalDraft(e.target.value)} placeholder="0.00" className="h-8 w-[100px] text-right" />
                      <div className="flex items-center justify-end mt-1">
                        <ExcludedItemsControl
                          amount={draft.excluded_amount}
                          description={draft.excluded_description}
                          onAmount={v => updateDraft('excluded_amount', v)}
                          onDescription={v => updateDraft('excluded_description', v)}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1" title="Does this include food items?">
                        <button
                          type="button" onClick={() => toggleFood(true)}
                          className={`h-7 px-2.5 rounded-md text-xs font-medium border transition-colors ${draft.food_included === true ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                        >Yes</button>
                        <button
                          type="button" onClick={() => toggleFood(false)}
                          className={`h-7 px-2.5 rounded-md text-xs font-medium border transition-colors ${draft.food_included === false ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                        >No</button>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer" title={draft.receipt_url ? 'Receipt attached' : 'Attach receipt'}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Paperclip className={`w-4 h-4 ${draft.receipt_url ? 'text-primary' : 'text-muted-foreground'}`} />}
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onDraftFile} disabled={uploading} />
                      </label>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={saveDraft} disabled={addEntry.isPending} className="text-green-700 hover:text-green-800 transition-colors disabled:opacity-50" title="Save entry">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDraft(null); setDraftError(''); }} className="text-muted-foreground hover:text-destructive transition-colors" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {unsubmitted.map(e => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {e.date_incurred ? format(new Date(e.date_incurred + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-3 py-2.5 max-w-[260px]">
                      <p className="font-medium truncate" title={e.description}>{e.description}</p>
                      {e.notes && <p className="text-xs text-muted-foreground truncate" title={e.notes}>{e.notes}</p>}
                    </td>
                    <td className="px-3 py-2.5">{e.supplier || '—'}</td>
                    <td className="px-3 py-2.5">{programLabel(e)}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{e.gst ? fmt(e.gst) : '—'}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">
                      {fmt(e.total_cost)}
                      {e.excluded_amount > 0 && (
                        <span
                          className="block text-[10px] font-normal text-amber-600"
                          title={e.excluded_description ? `Personal item excluded: ${e.excluded_description}` : 'Personal item excluded'}
                        >✂ −{fmt(e.excluded_amount * 1.05)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                      {e.food_included === true ? 'Food' : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {e.receipt_url ? (
                        <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Paperclip className="w-3.5 h-3.5" />View
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditingEntry(e); setEditOpen(true); }} className="text-muted-foreground hover:text-foreground transition-colors" title="Edit entry">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => del.mutate(e.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete entry">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={5} className="px-3 py-2 text-xs text-muted-foreground">
                    {unsubmitted.length} receipt entr{unsubmitted.length === 1 ? 'y' : 'ies'} (incl. {fmt(gstTotal)} GST)
                    {draftError && <span className="text-red-600 ml-2">{draftError}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(total)}</td>
                  <td colSpan={3} className="px-3 py-2 text-right text-xs text-muted-foreground">Total not yet submitted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ReceiptEntryDialog open={editOpen} onOpenChange={setEditOpen} entry={editingEntry} mode="cc" />
    </section>
  );
}