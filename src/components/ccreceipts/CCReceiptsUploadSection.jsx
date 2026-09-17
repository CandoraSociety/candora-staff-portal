import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Loader2, Paperclip, Plus, Send, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { extractReceiptDetails } from '@/lib/receiptDateExtraction';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// Staff side of Candora CC receipts — upload each MasterCard purchase receipt,
// then submit them to Finance so they can be reviewed against the card statement.
export default function CCReceiptsUploadSection() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [draft, setDraft] = useState(null); // non-null = inline upload row is open
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['cc-receipts-mine', user?.email],
    queryFn: () => base44.entities.CCReceiptEntry.filter({ requester_email: user?.email }),
    enabled: !!user?.email,
  });

  const unsubmitted = entries
    .filter(e => e.status === 'unsubmitted')
    .sort((a, b) => String(a.date_incurred || '').localeCompare(String(b.date_incurred || '')));
  const total = unsubmitted.reduce((s, e) => s + (e.total_cost || 0), 0);

  const del = useMutation({
    mutationFn: id => base44.entities.CCReceiptEntry.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cc-receipts-mine'] }),
  });

  const startDraft = () => {
    setError('');
    setDraft({ date: format(new Date(), 'yyyy-MM-dd'), description: '', amount: '', receipt_url: '' });
  };

  const onDraftFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setDraft(d => ({ ...d, receipt_url: file_url }));
      // Autofill what we can read off the receipt — user can still edit before saving
      const d = await extractReceiptDetails(file_url);
      if (d) {
        setDraft(prev => ({
          ...prev,
          date: d.date || prev.date,
          description: prev.description || d.description || d.supplier || '',
          amount: prev.amount !== '' ? prev.amount : (d.total != null ? String(d.total) : ''),
        }));
      }
    } catch {
      setError('Receipt upload failed — try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const saveDraft = async () => {
    setError('');
    if (!draft.description.trim()) { setError('Describe what was purchased.'); return; }
    const amt = parseFloat(draft.amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter the receipt amount.'); return; }
    if (!draft.receipt_url) { setError('Attach the receipt file.'); return; }
    try {
      await base44.entities.CCReceiptEntry.create({
        requester_name: displayName(user),
        requester_email: user?.email || '',
        description: draft.description.trim(),
        date_incurred: draft.date || null,
        total_cost: amt,
        receipt_url: draft.receipt_url,
        status: 'unsubmitted',
      });
      setDraft(null);
      qc.invalidateQueries({ queryKey: ['cc-receipts-mine'] });
    } catch (err) {
      setError(err?.message || 'Could not save the receipt.');
    }
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
        date_requested: today,
        submitted_date: today,
        status: 'pending',
        supervisor_status: 'approved',
      });
      await base44.entities.CCReceiptEntry.bulkUpdate(
        unsubmitted.map(e => ({ id: e.id, status: 'submitted', form_id: submission.id }))
      );
      qc.invalidateQueries({ queryKey: ['cc-receipts-mine'] });
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
            Uploaded receipts waiting to be sent to Finance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={startDraft} disabled={!!draft}>
            <Plus className="w-4 h-4" />Upload Receipt
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
            No receipts uploaded yet. Click <span className="font-medium text-foreground">Upload Receipt</span> for each purchase made with the Candora MasterCard.
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
                  <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Receipt</th>
                  <th className="px-3 py-2.5 w-[80px]" />
                </tr>
              </thead>
              <tbody>
                {draft && (
                  <tr className="border-t border-border bg-primary/5">
                    <td className="px-2 py-1.5"><Input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} className="h-8 w-[140px]" /></td>
                    <td className="px-2 py-1.5"><Input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="What was purchased" className="h-8 min-w-[220px]" /></td>
                    <td className="px-2 py-1.5"><Input type="number" step="0.01" min="0" value={draft.amount} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))} placeholder="0.00" className="h-8 w-[110px] text-right" /></td>
                    <td className="px-2 py-1.5 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer" title={draft.receipt_url ? 'Receipt attached — click to replace' : 'Attach receipt'}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Paperclip className={`w-4 h-4 ${draft.receipt_url ? 'text-primary' : 'text-muted-foreground'}`} />}
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onDraftFile} disabled={uploading} />
                      </label>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={saveDraft} className="text-green-700 hover:text-green-800 transition-colors" title="Save receipt">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDraft(null); setError(''); }} className="text-muted-foreground hover:text-destructive transition-colors" title="Cancel">
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
                    <td className="px-3 py-2.5 max-w-[320px]">
                      <p className="font-medium truncate" title={e.description}>{e.description}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmt(e.total_cost)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {e.receipt_url ? (
                        <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Paperclip className="w-3.5 h-3.5" />View
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => del.mutate(e.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete receipt">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border bg-muted/30">
                  <td colSpan={2} className="px-3 py-2 text-xs text-muted-foreground">
                    {unsubmitted.length} receipt{unsubmitted.length === 1 ? '' : 's'} not yet submitted
                    {error && <span className="text-red-600 ml-2">{error}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(total)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}