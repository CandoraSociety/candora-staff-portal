import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

// Delete confirmation for an invoice, with the option to release its number
// back to the customer's sequential invoicing convention (e.g. after a test
// invoice) so the next invoice reuses that number.
export default function InvoiceDeleteDialog({ invoice, open, onOpenChange, onDeleted }) {
  const [release, setRelease] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) setRelease(!!invoice?.customer_id);
  }, [open, invoice]);

  const confirm = async () => {
    if (!invoice) return;
    setDeleting(true);
    try {
      await base44.entities.FinanceInvoice.delete(invoice.id);
      if (release && invoice.customer_id) {
        const cust = await base44.entities.InvoiceCustomer.get(invoice.customer_id);
        const m = String(invoice.invoice_number || '').match(/-(\d+)$/);
        if (cust && m) {
          const next = Math.min(cust.next_invoice_seq || 1, Number(m[1]));
          await base44.entities.InvoiceCustomer.update(cust.id, { next_invoice_seq: next });
          toast.success(`Invoice deleted — ${cust.invoice_prefix} sequence adjusted so the next invoice will be ${cust.invoice_prefix}-${String(next).padStart(4, '0')}.`);
        } else {
          toast.success('Invoice deleted.');
        }
      } else {
        toast.success('Invoice deleted.');
      }
      onDeleted?.();
      onOpenChange(false);
    } catch {
      toast.error('Could not delete the invoice. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete invoice {invoice?.invoice_number || ''}?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        {invoice?.customer_id && (
          <div className="flex items-start gap-2 rounded-lg border p-3">
            <Checkbox id="release-number" checked={release} onCheckedChange={v => setRelease(!!v)} className="mt-0.5" />
            <Label htmlFor="release-number" className="text-sm font-normal leading-snug">
              Release this invoice number back to the sequential order — the next invoice for this customer will reuse this number (e.g. for test invoices that shouldn't have taken a number).
            </Label>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive" className="gap-2" disabled={deleting} onClick={confirm}>
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}