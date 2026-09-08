import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Manual invoice-number override: writes the number to column B of the
// matching month row on the CRT Invoice Tracker (the source the invoice reads
// its number from) and stamps the Invoice record so closed-off snapshots and
// the Invoice Package tab show the same number.
export default function InvoiceNumberDialog({ open, onOpenChange, billingMonth, monthLabel, currentNumber, invoiceId }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue(currentNumber != null ? String(currentNumber) : '');
  }, [open, currentNumber]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmed = value.trim();
      if (!trimmed) throw new Error('Enter an invoice number');
      const res = await base44.functions.invoke('setInvoiceNumber', { billingMonth, invoiceNumber: trimmed });
      if (res.data?.status !== 'success') {
        throw new Error(res.data?.status === 'month_not_found'
          ? `The ${monthLabel} row isn't in the active CRT workbook yet — run an Invoice Tracker sync / advance first.`
          : `Could not update the CRT (${res.data?.status || 'unknown error'}).`);
      }
      if (invoiceId) {
        await base44.entities.Invoice.update(invoiceId, { invoice_number: trimmed, invoice_number_manual: true });
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Invoice number set to #${value.trim()} for ${monthLabel} — on the invoice and the CRT.`);
      onOpenChange(false);
      queryClient.invalidateQueries();
    },
    onError: (e) => toast.error('Could not update invoice number: ' + (e.message || '')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Invoice Number — {monthLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Invoice Number</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 15 or 15.1" />
          </div>
          <p className="text-xs text-slate-500">
            Saving writes this number to column B of the {monthLabel} row on the CRT Invoice Tracker and updates the number shown on the invoice.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !value.trim()}>
            {saveMutation.isPending ? 'Saving...' : 'Save Number'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}