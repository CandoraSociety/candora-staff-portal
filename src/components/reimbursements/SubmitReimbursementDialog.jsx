import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

export default function SubmitReimbursementDialog({ open, onOpenChange, entries }) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [header, setHeader] = useState({
    payable_to: '', etransfer_email: '', requested_by: '',
    date_requested: '', staff_signature: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      const name = displayName(user);
      setHeader({
        payable_to: name,
        etransfer_email: user?.etransfer_email || user?.email || '',
        requested_by: name,
        date_requested: format(new Date(), 'yyyy-MM-dd'),
        staff_signature: '',
      });
      // Pick up the latest saved e-transfer email from the profile
      base44.auth.me().then(u => {
        setHeader(h => ({ ...h, etransfer_email: u?.etransfer_email || u?.email || '' }));
      }).catch(() => {});
    }
  }, [open, user]);

  const setH = (k, v) => setHeader(h => ({ ...h, [k]: v }));

  const total = entries.reduce((s, e) => s + (e.total_cost || 0), 0);
  const gstTotal = entries.reduce((s, e) => s + (e.gst || 0), 0);

  const submit = async () => {
    setError('');
    if (!header.payable_to.trim()) { setError('Enter who the cheque is payable to.'); return; }
    if (!header.staff_signature.trim()) { setError('Type your e-signature to submit.'); return; }
    setSubmitting(true);
    try {
      const form = await base44.entities.StaffReimbursementRequest.create({
        requester_name: displayName(user),
        requester_email: user?.email || '',
        payable_to: header.payable_to,
        etransfer_email: header.etransfer_email,
        requested_by: header.requested_by || displayName(user),
        date_requested: header.date_requested || null,
        staff_signature: header.staff_signature,
        entry_ids: entries.map(e => e.id),
        entry_count: entries.length,
        amount: total,
        tax: gstTotal,
        status: 'pending',
        submitted_date: format(new Date(), 'yyyy-MM-dd'),
      });
      await base44.entities.ReimbursementEntry.bulkUpdate(
        entries.map(e => ({ id: e.id, status: 'submitted', form_id: form.id }))
      );
      qc.invalidateQueries({ queryKey: ['my-reimbursement-entries'] });
      qc.invalidateQueries({ queryKey: ['my-reimbursement-forms'] });
      qc.invalidateQueries({ queryKey: ['staff-reimbursements'] });
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'Failed to submit reimbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit for Reimbursement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="text-muted-foreground text-xs">
              This will compile <span className="font-medium text-foreground">{entries.length}</span> receipt
              entr{entries.length === 1 ? 'y' : 'ies'} into one reimbursement form and submit it to Finance.
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-muted-foreground">Total Requested</span>
              <span className="font-bold text-base">{fmt(total)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Including GST</span>
              <span>{fmt(gstTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Cheque Payable to *</Label>
              <Input value={header.payable_to} onChange={e => setH('payable_to', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">E-transfer Email</Label>
              <Input value={header.etransfer_email} onChange={e => setH('etransfer_email', e.target.value)} placeholder="name@email.com" />
            </div>
            <div>
              <Label className="text-xs">Requested by</Label>
              <Input value={header.requested_by} onChange={e => setH('requested_by', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Date Requested</Label>
              <Input type="date" value={header.date_requested} onChange={e => setH('date_requested', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">e-Signature — type your full name *</Label>
              <Input value={header.staff_signature} onChange={e => setH('staff_signature', e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60 text-left text-muted-foreground uppercase">
                  <th className="px-2.5 py-2 font-semibold">Date</th>
                  <th className="px-2.5 py-2 font-semibold">Description</th>
                  <th className="px-2.5 py-2 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-2.5 py-1.5 whitespace-nowrap">{e.date_incurred || '—'}</td>
                    <td className="px-2.5 py-1.5">{e.description}</td>
                    <td className="px-2.5 py-1.5 text-right font-medium">{fmt(e.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={submitting}>Cancel</Button></DialogClose>
          <Button onClick={submit} disabled={submitting} className="gap-2">
            <Send className="w-4 h-4" />{submitting ? 'Submitting…' : 'Submit for Reimbursement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}