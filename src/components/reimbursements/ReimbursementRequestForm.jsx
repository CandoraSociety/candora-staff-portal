import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paperclip, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';

export const CATEGORY_LABELS = {
  travel: 'Travel', mileage: 'Mileage', parking: 'Parking', supplies: 'Supplies',
  meals: 'Meals / Hospitality', training: 'Training', equipment: 'Equipment',
  software: 'Software / Subscriptions', office: 'Office', other: 'Other',
};

const DEPARTMENTS = [
  'Administration', 'Operations', 'Finance', 'Human Resources', 'Marketing', 'IT',
  'Pathways', 'Food Services', 'Facilities', 'Childcare', 'Fundraising', 'Reception', 'Other',
];

const EMPTY = {
  expense_category: 'supplies', expense_category_other: '', description: '', vendor: '',
  date_incurred: format(new Date(), 'yyyy-MM-dd'), amount: '', tax: '',
  receipt_url: '', receipt_name: '', notes: '', department: 'Other',
};

function Cell({ label, children, className = '' }) {
  return (
    <div className={`bg-card p-3 space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function ReimbursementRequestForm() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm(f => ({ ...f, receipt_url: file_url, receipt_name: file.name }));
    } catch (err) {
      setError('Receipt upload failed.');
    }
  };

  const submit = async () => {
    setError('');
    if (!form.description.trim()) { setError('Please describe the expense.'); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    setSubmitting(true);
    try {
      await base44.entities.StaffReimbursementRequest.create({
        requester_name: user?.full_name || 'Unknown',
        requester_email: user?.email || '',
        department: form.department,
        expense_category: form.expense_category,
        expense_category_other: form.expense_category === 'other' ? form.expense_category_other : '',
        description: form.description,
        vendor: form.vendor,
        date_incurred: form.date_incurred,
        amount: amt,
        tax: form.tax ? parseFloat(form.tax) : 0,
        receipt_url: form.receipt_url,
        notes: form.notes,
        status: 'pending',
        submitted_date: format(new Date(), 'yyyy-MM-dd'),
      });
      qc.invalidateQueries({ queryKey: ['my-reimbursements'] });
      qc.invalidateQueries({ queryKey: ['staff-reimbursements'] });
      setForm(EMPTY);
    } catch (err) {
      setError(err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
        <Cell label="Date Incurred">
          <Input type="date" value={form.date_incurred} onChange={e => set('date_incurred', e.target.value)} />
        </Cell>
        <Cell label="Department">
          <Select value={form.department} onValueChange={v => set('department', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Cell>
        <Cell label="Expense Category">
          <Select value={form.expense_category} onValueChange={v => set('expense_category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Cell>
        <Cell label="Category (if Other)">
          <Input value={form.expense_category_other} onChange={e => set('expense_category_other', e.target.value)} disabled={form.expense_category !== 'other'} placeholder="Specify..." />
        </Cell>
        <Cell label="Description *" className="sm:col-span-2">
          <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was the expense for?" />
        </Cell>
        <Cell label="Vendor">
          <Input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Where purchased" />
        </Cell>
        <Cell label="Amount ($) *">
          <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
        </Cell>
        <Cell label="Tax Portion ($)">
          <Input type="number" step="0.01" min="0" value={form.tax} onChange={e => set('tax', e.target.value)} placeholder="0.00" />
        </Cell>
        <Cell label="Receipt">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Paperclip className="w-4 h-4 shrink-0" />
            <span className="truncate">{form.receipt_name || 'Attach receipt...'}</span>
            <input type="file" className="hidden" onChange={onFile} />
          </label>
        </Cell>
        <Cell label="Notes" className="sm:col-span-2">
          <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
        </Cell>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={submitting} className="gap-2">
          <Send className="w-4 h-4" />{submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </div>
  );
}