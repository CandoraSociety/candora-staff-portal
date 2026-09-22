import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { computeInvoiceTotals } from './invoiceDocumentHtml';

const TYPES = [
  { value: 'receivable', label: 'Customer pays us', desc: 'An invoice we send to someone who owes Candora money (money in).' },
  { value: 'payable', label: 'On behalf of a vendor', desc: "An invoice we prepare for a service provider who doesn't issue their own — for our payables (e.g. musicians hired for events)." },
];

const emptyItem = () => ({ description: '', quantity: 1, unit_price: '' });
const fmt = n => `$${Number(n || 0).toFixed(2)}`;

// Create / edit dialog for a FinanceInvoice. invoice = null creates a new one,
// with the type preselected from defaultType and the number prefilled with nextNumber.
export default function InvoiceEditDialog({ open, onOpenChange, invoice = null, defaultType = 'receivable', nextNumber = '', onSaved }) {
  const { user } = useCurrentUser();
  const [type, setType] = useState('receivable');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [chargeGst, setChargeGst] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setType(invoice.invoice_type || 'receivable');
      setNumber(invoice.invoice_number || '');
      setName(invoice.counterparty_name || '');
      setEmail(invoice.counterparty_email || '');
      setPhone(invoice.counterparty_phone || '');
      setAddress(invoice.counterparty_address || '');
      setReference(invoice.reference || '');
      setInvoiceDate(invoice.invoice_date || format(new Date(), 'yyyy-MM-dd'));
      setDueDate(invoice.due_date || '');
      const its = (invoice.line_items || []).map(it => ({ ...it, quantity: it.quantity ?? 1, unit_price: it.unit_price ?? '' }));
      setItems(its.length ? its : [emptyItem()]);
      setChargeGst(!!invoice.charge_gst);
      setNotes(invoice.notes || '');
    } else {
      setType(defaultType);
      setNumber(nextNumber);
      setName(''); setEmail(''); setPhone(''); setAddress(''); setReference('');
      setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
      setDueDate('');
      setItems([emptyItem()]);
      setChargeGst(false);
      setNotes('');
    }
  }, [open, invoice, defaultType, nextNumber]);

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const { subtotal, gst, total } = useMemo(
    () => computeInvoiceTotals({ line_items: items, charge_gst: chargeGst }),
    [items, chargeGst]
  );

  const save = async () => {
    const lineItems = items
      .map(it => ({
        description: String(it.description || '').trim(),
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
      }))
      .filter(it => it.description);
    if (!name.trim()) { toast.error('Enter the customer or vendor name.'); return; }
    if (lineItems.length === 0) { toast.error('Add at least one line item with a description.'); return; }
    if (!invoiceDate) { toast.error('Select the invoice date.'); return; }

    const totals = computeInvoiceTotals({ line_items: lineItems, charge_gst: chargeGst });
    const payload = {
      invoice_type: type,
      invoice_number: String(number || '').trim(),
      counterparty_name: name.trim(),
      counterparty_email: email.trim(),
      counterparty_phone: phone.trim(),
      counterparty_address: address.trim(),
      reference: reference.trim(),
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      line_items: lineItems,
      charge_gst: chargeGst,
      ...totals,
      notes: notes.trim(),
      prepared_by_name: invoice?.prepared_by_name || displayName(user),
    };
    setSaving(true);
    try {
      if (invoice) {
        await base44.entities.FinanceInvoice.update(invoice.id, payload);
        toast.success('Invoice updated.');
      } else {
        await base44.entities.FinanceInvoice.create(payload);
        toast.success('Invoice created.');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Could not save the invoice. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? `Edit Invoice ${invoice.invoice_number || ''}` : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!invoice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn('text-left rounded-lg border p-3 transition-colors',
                    type === t.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50')}
                >
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">{type === 'payable' ? 'Vendor / service provider' : 'Customer (Bill To)'}</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={type === 'payable' ? 'e.g. Jane Doe — musician' : 'Person or organization being billed'}
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">For / Reference (event, service, PO…)</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. Winter Wonderland Festival — live music, Dec 12" />
            </div>
            <div>
              <Label className="text-xs">Invoice Date</Label>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">{type === 'payable' ? 'Service / Due Date' : 'Due Date'}</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Invoice Number</Label>
              <Input value={number} onChange={e => setNumber(e.target.value)} placeholder={nextNumber || 'CAND-INV-2026-0001'} />
              <p className="text-[11px] text-muted-foreground mt-1">Prefilled automatically — change it only if you need a different number.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Line Items</Label>
            {items.map((it, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <Input
                  className="flex-1 min-w-[200px]"
                  placeholder="Description of the service or item"
                  value={it.description}
                  onChange={e => updateItem(idx, 'description', e.target.value)}
                />
                <Input
                  type="number" min="0" step="0.5" className="w-20" placeholder="Qty"
                  value={it.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                />
                <Input
                  type="number" min="0" step="0.01" className="w-28" placeholder="Unit $"
                  value={it.unit_price}
                  onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                />
                <div className="w-24 text-right text-sm font-medium text-muted-foreground">
                  {fmt((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}
                </div>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50"
                  disabled={items.length === 1}
                  onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setItems(prev => [...prev, emptyItem()])}>
              <Plus className="w-4 h-4" />Add Item
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="charge-gst" checked={chargeGst} onCheckedChange={v => setChargeGst(!!v)} />
            <Label htmlFor="charge-gst" className="text-sm font-normal">Charge GST (5%)</Label>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
            {chargeGst && <div className="flex justify-between"><span className="text-muted-foreground">GST (5%)</span><span>{fmt(gst)}</span></div>}
            <div className="flex justify-between font-semibold"><span>Total</span><span>{fmt(total)}</span></div>
          </div>

          <div>
            <Label className="text-xs">Notes (printed on the invoice)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment instructions, event details, etc." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button className="gap-2" disabled={saving} onClick={save}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {invoice ? 'Save Changes' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}