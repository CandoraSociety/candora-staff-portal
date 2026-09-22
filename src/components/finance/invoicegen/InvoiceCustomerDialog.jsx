import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

// Auto-initials for the invoicing convention: first letters of each word
// (single word → first 3 letters), e.g. "Candora Community League" → "CCL".
export function initialsFromName(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase();
}

// New invoice customer — sets up the person/org being billed, their invoicing
// convention (prefix + sequential 4-digit numbers) and optional monthly billing.
export default function InvoiceCustomerDialog({ open, onOpenChange, onSaved, customer = null }) {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [prefixTouched, setPrefixTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Payment due upon receipt');
  const [monthly, setMonthly] = useState(false);
  const [monthlyDesc, setMonthlyDesc] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [monthlyGst, setMonthlyGst] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setName(customer.name || '');
      setPrefix(customer.invoice_prefix || '');
      setPrefixTouched(true);
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setPaymentTerms(customer.payment_terms || 'Payment due upon receipt');
      setMonthly(!!customer.monthly_billing);
      setMonthlyDesc(customer.monthly_line_description || '');
      setMonthlyAmount(customer.monthly_amount || '');
      setMonthlyGst(!!customer.monthly_charge_gst);
    } else {
      setName(''); setPrefix(''); setPrefixTouched(false);
      setEmail(''); setPhone(''); setAddress('');
      setPaymentTerms('Payment due upon receipt');
      setMonthly(false); setMonthlyDesc(''); setMonthlyAmount(''); setMonthlyGst(false);
    }
  }, [open, customer]);

  const onNameChange = (v) => {
    setName(v);
    if (!prefixTouched) setPrefix(initialsFromName(v));
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Enter the customer name.'); return; }
    const p = prefix.trim().toUpperCase();
    if (!p) { toast.error('Set the invoicing convention prefix — usually the initials of the org being billed.'); return; }
    if (monthly && !(Number(monthlyAmount) > 0)) { toast.error('Enter the monthly billing amount.'); return; }
    const payload = {
      name: name.trim(),
      invoice_prefix: p,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      payment_terms: paymentTerms.trim() || 'Payment due upon receipt',
      monthly_billing: monthly,
      monthly_line_description: monthlyDesc.trim(),
      monthly_amount: monthly ? (Number(monthlyAmount) || 0) : 0,
      monthly_charge_gst: monthly && monthlyGst,
    };
    setSaving(true);
    try {
      if (customer) {
        await base44.entities.InvoiceCustomer.update(customer.id, payload);
        toast.success(`${payload.name} updated.`);
        onSaved?.({ ...customer, ...payload });
      } else {
        const created = await base44.entities.InvoiceCustomer.create({ ...payload, next_invoice_seq: 1 });
        toast.success(`${created.name} added as an invoice customer.`);
        onSaved?.(created);
      }
      onOpenChange(false);
    } catch {
      toast.error('Could not save the customer. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'New Invoice Customer'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs">Person or Organization</Label>
              <Input value={name} onChange={e => onNameChange(e.target.value)} placeholder="e.g. Candora Community League" />
            </div>
            <div>
              <Label className="text-xs">Invoicing Convention (prefix)</Label>
              <Input
                value={prefix}
                onChange={e => { setPrefix(e.target.value.toUpperCase()); setPrefixTouched(true); }}
                placeholder="CCL"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Usually the initials of the org being billed — invoices follow as <span className="font-mono">{prefix || 'CCL'}-0001</span>, <span className="font-mono">{prefix || 'CCL'}-0002</span>…
              </p>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Payment Terms</Label>
              <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Payment due upon receipt" />
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="monthly-billing" checked={monthly} onCheckedChange={v => setMonthly(!!v)} />
              <Label htmlFor="monthly-billing" className="text-sm font-normal">
                Monthly billing — automatically create this customer's invoice on the 1st of each month (categorized as To Be Sent)
              </Label>
            </div>
            {monthly && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs">Monthly Charge Description</Label>
                  <Input value={monthlyDesc} onChange={e => setMonthlyDesc(e.target.value)} placeholder="e.g. Monthly space rental" />
                </div>
                <div>
                  <Label className="text-xs">Monthly Amount</Label>
                  <Input type="number" min="0" step="0.01" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} />
                </div>
                <div className="sm:col-span-3 flex items-center gap-2">
                  <Checkbox id="monthly-gst" checked={monthlyGst} onCheckedChange={v => setMonthlyGst(!!v)} />
                  <Label htmlFor="monthly-gst" className="text-sm font-normal">Charge GST (5%) on the monthly invoice</Label>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button className="gap-2" disabled={saving} onClick={save}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {customer ? 'Save Changes' : 'Add Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}