import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Paperclip, Pencil, Plus, Send, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { PROGRAM_OPTIONS, programLabel } from '@/lib/reimbursementConstants';
import { extractReceiptDate } from '@/lib/receiptDateExtraction';
import ReceiptEntryDialog from './ReceiptEntryDialog';
import SubmitReimbursementDialog from './SubmitReimbursementDialog';
import DownloadReimbursementButton from './DownloadReimbursementButton';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

const BLANK_DRAFT = {
  program: '', program_other: '', date_incurred: format(new Date(), 'yyyy-MM-dd'), description: '', supplier: '',
  total_cost: '', gst: '', food_included: null, funder_cost: '', account_no: '', funder_no: '', receipt_url: '',
};

// Alberta GST is 5% — the GST portion of an all-inclusive total is total × (5/105) = total / 21
const calcGst = (total) => (parseFloat(total) / 21).toFixed(2);

export default function UnsubmittedEntries() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [editingEntry, setEditingEntry] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [draft, setDraft] = useState(null); // non-null = inline new-entry row is open
  const [draftError, setDraftError] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['my-reimbursement-entries', user?.email],
    queryFn: () => base44.entities.ReimbursementEntry.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const unsubmitted = entries
    .filter(e => e.status === 'unsubmitted')
    .sort((a, b) => (b.date_incurred || b.created_date || '').localeCompare(a.date_incurred || a.created_date || ''));

  const total = unsubmitted.reduce((s, e) => s + (e.total_cost || 0), 0);
  const gstTotal = unsubmitted.reduce((s, e) => s + (e.gst || 0), 0);

  const del = useMutation({
    mutationFn: id => base44.entities.ReimbursementEntry.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-reimbursement-entries'] }),
  });

  const addEntry = useMutation({
    mutationFn: payload => base44.entities.ReimbursementEntry.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-reimbursement-entries'] });
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

  const startDraft = () => setDraft({ ...BLANK_DRAFT, date_incurred: format(new Date(), 'yyyy-MM-dd') });

  const onDraftFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      updateDraft('receipt_url', file_url);
      // Read the purchase date off the receipt — falls back to manual entry when unreadable
      const date = await extractReceiptDate(file_url);
      if (date) {
        updateDraft('date_incurred', date);
      } else {
        setDraftError('Could not read the purchase date from the receipt — enter it manually.');
      }
    } catch (err) {
      setDraftError('Receipt upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const saveDraft = async () => {
    setDraftError('');
    if (!draft.description.trim()) { setDraftError('Describe what was purchased.'); return; }
    if (!draft.program) { setDraftError('Select the program this purchase relates to.'); return; }
    if (draft.program === 'other' && !draft.program_other.trim()) { setDraftError('Specify the program.'); return; }
    if (draft.food_included === null || draft.food_included === undefined) { setDraftError('Indicate whether this purchase includes food items.'); return; }
    const amt = parseFloat(draft.total_cost);
    if (isNaN(amt) || amt <= 0) { setDraftError('Enter the receipt total cost (with GST).'); return; }
    if (draft.food_included === true && draft.gst === '') { setDraftError('Enter the GST amount (enter 0 if none was charged).'); return; }
    addEntry.mutate({
      requester_name: displayName(user),
      requester_email: user?.email || '',
      program: draft.program,
      program_other: draft.program === 'other' ? draft.program_other : '',
      date_incurred: draft.date_incurred || null,
      description: draft.description,
      supplier: draft.supplier,
      total_cost: amt,
      gst: draft.gst !== '' && draft.gst !== null ? parseFloat(draft.gst) : 0,
      food_included: draft.food_included === true,
      funder_cost: draft.funder_cost ? parseFloat(draft.funder_cost) : 0,
      account_no: draft.account_no,
      funder_no: draft.funder_no,
      receipt_url: draft.receipt_url,
      status: 'unsubmitted',
    });
  };

  const openEdit = (entry) => { setEditingEntry(entry); setEditDialogOpen(true); };

  const hasRows = unsubmitted.length > 0 || draft;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Not Submitted <span className="text-muted-foreground font-normal">({unsubmitted.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Individual receipt entries waiting to be submitted for reimbursement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={startDraft} disabled={!!draft}>
            <Plus className="w-4 h-4" />Add Receipt Entry
          </Button>
          <DownloadReimbursementButton entries={unsubmitted} />
          <Button size="sm" className="gap-2" disabled={unsubmitted.length === 0} onClick={() => setSubmitOpen(true)}>
            <Send className="w-4 h-4" />Submit for Reimbursement
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading your entries…</p>
      ) : !hasRows ? (
        <Card className="p-0">
          <div className="py-8 text-center text-sm text-muted-foreground">
            No unsubmitted entries. Click <span className="font-medium text-foreground">Add Receipt Entry</span> each time you spend money out of pocket.
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
                  <th className="px-3 py-2.5 w-[80px]"></th>
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
                    <td className="px-2 py-1.5"><Input type="number" step="0.01" min="0" value={draft.total_cost} onChange={e => updateTotalDraft(e.target.value)} placeholder="0.00" className="h-8 w-[100px] text-right" /></td>
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
                        <Paperclip className={`w-4 h-4 ${draft.receipt_url ? 'text-primary' : 'text-muted-foreground'}`} />
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
                    <td className="px-3 py-2.5 text-right font-semibold">{fmt(e.total_cost)}</td>
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
                        <button onClick={() => openEdit(e)} className="text-muted-foreground hover:text-foreground transition-colors" title="Edit entry">
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

      <ReceiptEntryDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} entry={editingEntry} />
      <SubmitReimbursementDialog open={submitOpen} onOpenChange={setSubmitOpen} entries={unsubmitted} />
    </section>
  );
}