import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import { PROGRAM_OPTIONS } from '@/lib/reimbursementConstants';
import { extractReceiptDetails } from '@/lib/receiptDateExtraction';
import ExcludedItemsControl from './ExcludedItemsControl';

// Alberta GST is 5% — the GST portion of an all-inclusive total is total × (5/105) = total / 21
const calcGst = (total) => (parseFloat(total) / 21).toFixed(2);

const BLANK = {
  program: '', program_other: '', date_incurred: '', description: '', supplier: '',
  total_cost: '', gst: '', food_included: null, excluded_amount: '', excluded_description: '',
  funder_cost: '', account_no: '', funder_no: '', receipt_url: '', notes: '',
};

export default function ReceiptEntryDialog({ open, onOpenChange, entry }) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const editing = !!entry?.id;
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setForm(entry ? {
        program: entry.program || '',
        program_other: entry.program_other || '',
        date_incurred: entry.date_incurred || format(new Date(), 'yyyy-MM-dd'),
        description: entry.description || '',
        supplier: entry.supplier || '',
        total_cost: entry.total_cost ?? '',
        gst: entry.gst ?? '',
        food_included: entry.food_included === true,
        excluded_amount: entry.excluded_amount ?? '',
        excluded_description: entry.excluded_description || '',
        funder_cost: entry.funder_cost ?? '',
        account_no: entry.account_no || '',
        funder_no: entry.funder_no || '',
        receipt_url: entry.receipt_url || '',
        notes: entry.notes || '',
      } : { ...BLANK, date_incurred: format(new Date(), 'yyyy-MM-dd'), program: '', program_other: '', food_included: null });
    }
  }, [open, entry]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setTotal = (v) => {
    set('total_cost', v);
    if (form.food_included === false) set('gst', calcGst(v));
  };

  const toggleFood = (checked) => {
    set('food_included', checked);
    if (checked) {
      set('gst', ''); // GST on food varies — entered manually
    } else {
      const amt = parseFloat(form.total_cost);
      if (!isNaN(amt) && amt > 0) set('gst', calcGst(amt));
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set('receipt_url', file_url);
      // Autofill from the receipt — anything unreadable falls back to manual entry
      const d = await extractReceiptDetails(file_url);
      if (d) {
        setForm(prev => ({
          ...prev,
          date_incurred: d.date || prev.date_incurred,
          description: d.description || prev.description,
          supplier: d.supplier || prev.supplier,
          total_cost: d.total != null ? String(d.total) : prev.total_cost,
          gst: d.gst != null ? String(d.gst) : prev.gst,
        }));
        if (!d.date) setError('Could not read the purchase date from the receipt — enter it manually.');
      } else {
        setError('Could not read the receipt — fill in the details manually.');
      }
    } catch (err) {
      setError('Receipt upload failed.');
    }
  };

  const save = async () => {
    setError('');
    if (!form.description.trim()) { setError('Describe what was purchased.'); return; }
    if (!form.program) { setError('Select the program this purchase relates to.'); return; }
    if (form.program === 'other' && !form.program_other.trim()) { setError('Specify the program.'); return; }
    if (form.food_included === null || form.food_included === undefined) { setError('Indicate whether this purchase includes food items.'); return; }
    if (form.food_included === true && form.gst === '') { setError('Enter the GST amount (enter 0 if none was charged).'); return; }
    const amt = parseFloat(form.total_cost);
    if (isNaN(amt) || amt <= 0) { setError('Enter the receipt total cost (with GST).'); return; }
    // Personal item(s) excluded from the claim — price entered before GST, 5% GST added automatically
    const excl = parseFloat(form.excluded_amount);
    const hasExcl = !isNaN(excl) && excl > 0;
    const exclIncl = hasExcl ? +(excl * 1.05).toFixed(2) : 0;
    const exclGst = hasExcl ? +(excl * 0.05).toFixed(2) : 0;
    const gstVal = form.gst !== '' && form.gst !== null ? parseFloat(form.gst) : 0;
    setSubmitting(true);
    try {
      const payload = {
        program: form.program,
        program_other: form.program === 'other' ? form.program_other : '',
        date_incurred: form.date_incurred || null,
        description: form.description,
        supplier: form.supplier,
        total_cost: hasExcl ? Math.max(0, +(amt - exclIncl).toFixed(2)) : amt,
        gst: hasExcl ? Math.max(0, +(gstVal - exclGst).toFixed(2)) : gstVal,
        excluded_amount: hasExcl ? excl : null,
        excluded_description: hasExcl ? form.excluded_description : '',
        food_included: form.food_included === true,
        funder_cost: form.funder_cost ? parseFloat(form.funder_cost) : 0,
        account_no: form.account_no,
        funder_no: form.funder_no,
        receipt_url: form.receipt_url,
        notes: form.notes,
      };
      if (editing) {
        await base44.entities.ReimbursementEntry.update(entry.id, payload);
      } else {
        await base44.entities.ReimbursementEntry.create({
          ...payload,
          requester_name: displayName(user),
          requester_email: user?.email || '',
          status: 'unsubmitted',
        });
      }
      qc.invalidateQueries({ queryKey: ['my-reimbursement-entries'] });
      onOpenChange(false);
    } catch (err) {
      setError(err?.message || 'Failed to save entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Receipt Entry' : 'New Receipt Entry'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date of Purchase</Label>
              <Input type="date" value={form.date_incurred} onChange={e => set('date_incurred', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Program *</Label>
              <Select value={form.program} onValueChange={v => set('program', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.program === 'other' && (
            <div>
              <Label className="text-xs">Specify Program *</Label>
              <Input value={form.program_other} onChange={e => set('program_other', e.target.value)} placeholder="Program name" />
            </div>
          )}
          <div>
            <Label className="text-xs">Description (items purchased) *</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Craft supplies for sewing group" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Supplier</Label>
              <Input value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="e.g. Dollar Tree" />
            </div>
            <div>
              <Label className="text-xs">Total Cost (with GST) *</Label>
              <Input type="number" step="0.01" min="0" value={form.total_cost} onChange={e => setTotal(e.target.value)} placeholder="0.00" />
              <div className="mt-1 flex items-center justify-end">
                <ExcludedItemsControl
                  amount={form.excluded_amount}
                  description={form.excluded_description}
                  onAmount={v => set('excluded_amount', v)}
                  onDescription={v => set('excluded_description', v)}
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">Does this include food items? * (if yes, GST is entered manually)</Label>
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button" onClick={() => toggleFood(true)}
                className={`h-8 px-4 rounded-md text-sm font-medium border transition-colors ${form.food_included === true ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >Yes</button>
              <button
                type="button" onClick={() => toggleFood(false)}
                className={`h-8 px-4 rounded-md text-sm font-medium border transition-colors ${form.food_included === false ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >No</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">GST</Label>
              <Input
                type="number" step="0.01" min="0" value={form.gst}
                onChange={e => set('gst', e.target.value)}
                placeholder={form.food_included === false ? 'auto' : '0.00'}
                disabled={form.food_included === false}
                title={form.food_included === false ? 'Auto-calculated at 5% Alberta GST' : 'Enter the GST amount from the receipt'}
              />
              {form.food_included === true && (
                <p className="mt-1 text-xs text-amber-600">GST must be entered manually — not all food is charged GST.</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Funder Cost</Label>
              <Input type="number" step="0.01" min="0" value={form.funder_cost} onChange={e => set('funder_cost', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Funder #</Label>
              <Input value={form.funder_no} onChange={e => set('funder_no', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Account #</Label>
              <Input value={form.account_no} onChange={e => set('account_no', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Receipt</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={onFile} />
              {form.receipt_url && <div className="text-xs text-green-700 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Receipt attached</div>}
            </div>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={submitting}>Cancel</Button></DialogClose>
          <Button onClick={save} disabled={submitting}>{submitting ? 'Saving…' : (editing ? 'Save Entry' : 'Add Entry')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}