import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { base44 as base44Api } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Receipt, Plus, ExternalLink, Search, DollarSign, Check, X, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';

const CATEGORY_LABELS = {
  travel: 'Travel',
  mileage: 'Mileage',
  parking: 'Parking',
  supplies: 'Supplies',
  meals: 'Meals / Hospitality',
  training: 'Training',
  equipment: 'Equipment',
  software: 'Software / Subscriptions',
  office: 'Office',
  other: 'Other',
};

const STATUS_STYLES = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
};

function NewRequestDialog() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    expense_category: 'supplies',
    expense_category_other: '',
    description: '',
    vendor: '',
    date_incurred: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    tax: '',
    receipt_url: '',
    notes: '',
    department: 'Other',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44Api.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, receipt_url: file_url }));
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
      await base44Api.entities.StaffReimbursementRequest.create({
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
      qc.invalidateQueries(['staff-reimbursements']);
      setOpen(false);
      setForm({
        expense_category: 'supplies', expense_category_other: '', description: '', vendor: '',
        date_incurred: format(new Date(), 'yyyy-MM-dd'), amount: '', tax: '', receipt_url: '', notes: '', department: 'Other',
      });
    } catch (err) {
      setError(err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground"><Plus className="w-4 h-4" /> New Request</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> New Reimbursement Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.expense_category} onValueChange={v => setForm(f => ({ ...f, expense_category: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Department</Label>
              <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Administration','Operations','Finance','Human Resources','Marketing','IT','Pathways','Food Services','Facilities','Childcare','Fundraising','Reception','Other'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.expense_category === 'other' && (
            <Input value={form.expense_category_other} onChange={e => setForm(f => ({ ...f, expense_category_other: e.target.value }))} placeholder="Specify category" />
          )}
          <div>
            <Label className="text-xs">Description *</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Vendor / Merchant</Label>
              <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="e.g. Staples" />
            </div>
            <div>
              <Label className="text-xs">Date Incurred *</Label>
              <Input type="date" value={form.date_incurred} onChange={e => setForm(f => ({ ...f, date_incurred: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount Paid (incl. tax) *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Tax (optional)</Label>
              <Input type="number" step="0.01" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Receipt</Label>
            <Input type="file" accept="image/*,application/pdf" onChange={onFile} />
            {form.receipt_url && <div className="text-xs text-green-700 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Receipt attached</div>}
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Additional context" />
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={submitting}>Cancel</Button></DialogClose>
          <Button onClick={submit} disabled={submitting} className="bg-primary text-primary-foreground">{submitting ? 'Submitting…' : 'Submit Request'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FinanceReimbursements() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['staff-reimbursements'],
    queryFn: () => base44.entities.StaffReimbursementRequest.list('-submitted_date', 200),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter(r => filterStatus === 'all' || r.status === filterStatus)
      .filter(r => {
        if (!q) return true;
        return [r.requester_name, r.requester_email, r.description, r.vendor, r.expense_category, r.expense_category_other, r.notes]
          .some(v => String(v || '').toLowerCase().includes(q));
      });
  }, [requests, filterStatus, search]);

  const totalPending = requests.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0);
  const totalApproved = requests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);
  const totalPaid = requests.filter(r => r.status === 'paid').reduce((s, r) => s + (r.amount || 0), 0);

  const setStatus = useMutation({
    mutationFn: async ({ id, status, patch }) => {
      const extra = patch || {};
      if (status === 'approved' || status === 'rejected') extra.reviewed_date = format(new Date(), 'yyyy-MM-dd');
      if (status === 'paid') extra.payment_date = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.StaffReimbursementRequest.update(id, { status, ...extra });
    },
    onSuccess: () => qc.invalidateQueries(['staff-reimbursements']),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Staff Reimbursement Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Staff requests to be reimbursed for personal money spent on behalf of Candora. The full amount (tax included) is reimbursed.
          </p>
        </div>
        <NewRequestDialog />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Pending</div>
            <div className="text-lg font-bold text-amber-700">${totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Approved (awaiting payment)</div>
            <div className="text-lg font-bold text-blue-700">${totalApproved.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Paid Out</div>
            <div className="text-lg font-bold text-green-700">${totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff, description, vendor…" className="pl-8 h-9 w-[260px]" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
          No reimbursement requests yet.
        </CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Staff Member</th>
                  <th className="text-left px-3 py-2 font-semibold">Category</th>
                  <th className="text-left px-3 py-2 font-semibold">Description</th>
                  <th className="text-left px-3 py-2 font-semibold">Vendor</th>
                  <th className="text-left px-3 py-2 font-semibold">Date Incurred</th>
                  <th className="text-right px-3 py-2 font-semibold">Amount</th>
                  <th className="text-center px-3 py-2 font-semibold">Receipt</th>
                  <th className="text-center px-3 py-2 font-semibold">Status</th>
                  <th className="text-center px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(r => {
                  const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.requester_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{r.requester_email || ''}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {CATEGORY_LABELS[r.expense_category] || r.expense_category}
                        {r.expense_category === 'other' && r.expense_category_other ? `: ${r.expense_category_other}` : ''}
                      </td>
                      <td className="px-3 py-2 max-w-[260px]">{r.description}</td>
                      <td className="px-3 py-2 max-w-[140px] break-words whitespace-normal">{r.vendor || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.date_incurred ? format(new Date(r.date_incurred + 'T00:00:00'), 'MMM d, yy') : '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">${Number(r.amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        {r.receipt_url ? (
                          <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center"><Badge className={st.cls}>{st.label}</Badge></td>
                      <td className="px-3 py-2 text-center">
                        {r.status === 'pending' && (
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700 hover:bg-green-50" onClick={() => setStatus.mutate({ id: r.id, status: 'approved' })} title="Approve">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-red-700 hover:bg-red-50" onClick={() => setStatus.mutate({ id: r.id, status: 'rejected', patch: { rejection_reason: 'Rejected by finance' } })} title="Reject">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {r.status === 'approved' && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700 hover:bg-green-50" onClick={() => setStatus.mutate({ id: r.id, status: 'paid' })} title="Mark paid">
                            <Banknote className="w-4 h-4" /> Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}