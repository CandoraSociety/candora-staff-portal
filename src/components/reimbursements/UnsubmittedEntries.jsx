import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Paperclip, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import ReceiptEntryDialog from './ReceiptEntryDialog';
import SubmitReimbursementDialog from './SubmitReimbursementDialog';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

export default function UnsubmittedEntries() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);

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

  const openEdit = (entry) => { setEditingEntry(entry); setEntryDialogOpen(true); };
  const openAdd = () => { setEditingEntry(null); setEntryDialogOpen(true); };

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
          <Button variant="outline" size="sm" className="gap-2" onClick={openAdd}>
            <Plus className="w-4 h-4" />Add Receipt Entry
          </Button>
          <Button size="sm" className="gap-2" disabled={unsubmitted.length === 0} onClick={() => setSubmitOpen(true)}>
            <Send className="w-4 h-4" />Submit for Reimbursement
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading your entries…</p>
      ) : unsubmitted.length === 0 ? (
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
                  <th className="px-3 py-2.5 font-semibold">Receipt #</th>
                  <th className="px-3 py-2.5 font-semibold text-right">GST</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Total (with GST)</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Receipt</th>
                  <th className="px-3 py-2.5 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
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
                    <td className="px-3 py-2.5">{e.receipt_no || '—'}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{e.gst ? fmt(e.gst) : '—'}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmt(e.total_cost)}</td>
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
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(total)}</td>
                  <td colSpan={2} className="px-3 py-2 text-right text-xs text-muted-foreground">Total not yet submitted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ReceiptEntryDialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen} entry={editingEntry} />
      <SubmitReimbursementDialog open={submitOpen} onOpenChange={setSubmitOpen} entries={unsubmitted} />
    </section>
  );
}