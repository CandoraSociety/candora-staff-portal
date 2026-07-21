import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, X, Paperclip, DollarSign, FileText, CheckCircle2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const RECORD_TYPE_LABELS = {
  exposure_course: 'Exposure Course',
  paid_external_placement: 'Paid External Placement',
  employment_supports: 'Employment Supports',
};

const RECORD_TYPE_BADGE = {
  exposure_course: 'bg-purple-100 text-purple-800',
  paid_external_placement: 'bg-indigo-100 text-indigo-800',
  employment_supports: 'bg-green-100 text-green-800',
};

const COMPLETION_COLORS = {
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  not_started: 'bg-slate-100 text-slate-700',
  did_not_complete: 'bg-red-100 text-red-800',
};

const SUPPORT_TYPES = [
  'PPE (Personal Protective Equipment)',
  'Bus Pass / Transit',
  'Work Clothes',
  'Safety Boots',
  'Tools / Equipment',
  'Training Certificates',
  'First Aid Certification',
  'Police Information Check',
  'Other',
];

function deriveBillingMonth(dateStr) {
  if (!dateStr) return format(new Date(), 'yyyy-MM');
  try { return format(new Date(dateStr), 'yyyy-MM'); } catch { return format(new Date(), 'yyyy-MM'); }
}

function PayableForm({ clients, existing, onDone, onCancel }) {
  const [rec, setRec] = useState(existing || {
    client_id: '',
    record_type: 'employment_supports',
    support_type: SUPPORT_TYPES[0],
    description: '',
    amount: '',
    tax: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    billing_month: format(new Date(), 'yyyy-MM'),
    vendor: '',
    reimbursed: false,
    reimbursement_date: '',
    completion_status: 'not_started',
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptUrls, setReceiptUrls] = useState(existing?.receipt_urls || []);

  const update = (f, v) => setRec(p => {
    const next = { ...p, [f]: v };
    if (f === 'date') next.billing_month = deriveBillingMonth(v);
    return next;
  });
  const total = (parseFloat(rec.amount) || 0) + (parseFloat(rec.tax) || 0);

  const selectedClient = clients.find(c => c.id === rec.client_id);

  const handleUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setReceiptUrls(p => [...p, file_url]);
      }
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!rec.client_id) { toast.error('Please select a client'); return; }
    setSaving(true);
    try {
      const data = {
        record_type: rec.record_type,
        support_type: rec.record_type === 'employment_supports' ? rec.support_type : undefined,
        description: rec.description,
        amount: parseFloat(rec.amount) || 0,
        tax: parseFloat(rec.tax) || 0,
        total,
        date: rec.date,
        billing_month: rec.billing_month || deriveBillingMonth(rec.date),
        vendor: rec.vendor,
        reimbursed: rec.reimbursed,
        reimbursement_date: rec.reimbursed ? rec.reimbursement_date : '',
        completion_status: rec.completion_status,
        receipt_urls: receiptUrls,
        notes: rec.notes,
        client_id: rec.client_id,
        client_name: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '',
        assigned_worker: selectedClient?.assigned_worker || '',
      };
      if (existing) {
        await base44.entities.FinancialRecord.update(existing.id, data);
      } else {
        await base44.entities.FinancialRecord.create(data);
      }
      toast.success(existing ? 'Payable updated' : 'Payable added');
      onDone();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Payable' : 'Add Payable'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client *</Label>
              <Select value={rec.client_id} onValueChange={v => update('client_id', v)} disabled={!!existing}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Record Type</Label>
              <Select value={rec.record_type} onValueChange={v => update('record_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RECORD_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {rec.record_type === 'employment_supports' && (
            <div>
              <Label className="text-xs">Support Type</Label>
              <Select value={rec.support_type} onValueChange={v => update('support_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Description</Label>
            <Input value={rec.description} onChange={e => update('description', e.target.value)} className="mt-1" placeholder="Brief description..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" step="0.01" value={rec.amount} onChange={e => update('amount', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tax ($)</Label>
              <Input type="number" step="0.01" value={rec.tax} onChange={e => update('tax', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Total ($)</Label>
              <Input value={total.toFixed(2)} disabled className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={rec.date} onChange={e => update('date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Billing Month</Label>
              <Input type="month" value={rec.billing_month} onChange={e => update('billing_month', e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Vendor</Label>
              <Input value={rec.vendor} onChange={e => update('vendor', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Completion Status</Label>
              <Select value={rec.completion_status} onValueChange={v => update('completion_status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="did_not_complete">Did Not Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="reimbursed-payable" checked={rec.reimbursed} onChange={e => update('reimbursed', e.target.checked)} className="accent-primary w-4 h-4" />
            <Label htmlFor="reimbursed-payable" className="text-xs cursor-pointer">Reimbursed</Label>
            {rec.reimbursed && (
              <Input type="date" value={rec.reimbursement_date} onChange={e => update('reimbursement_date', e.target.value)} className="ml-2 max-w-[180px]" />
            )}
          </div>

          <div>
            <Label className="text-xs">Receipts / Supporting Documents</Label>
            <Input type="file" multiple accept="image/*,.pdf" disabled={uploading} onChange={e => handleUpload(Array.from(e.target.files))} className="mt-1 text-xs" />
            {uploading && <div className="text-xs text-muted-foreground mt-1">Uploading...</div>}
            {receiptUrls.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {receiptUrls.map(url => (
                  <Badge key={url} variant="outline" className="text-xs flex gap-1 items-center">
                    <Paperclip className="w-3 h-3" />
                    {url.split('/').pop().slice(0, 20)}
                    <button onClick={() => setReceiptUrls(p => p.filter(u => u !== url))}><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={rec.notes} onChange={e => update('notes', e.target.value)} rows={2} className="mt-1 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Payable'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InlineEditRow({ record, clients, onDone, onCancel }) {
  const [rec, setRec] = useState({
    ...record,
    amount: record.amount || '',
    tax: record.tax || '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptUrls, setReceiptUrls] = useState(record.receipt_urls || []);

  const update = (f, v) => setRec(p => {
    const next = { ...p, [f]: v };
    if (f === 'date') next.billing_month = deriveBillingMonth(v);
    return next;
  });
  const total = (parseFloat(rec.amount) || 0) + (parseFloat(rec.tax) || 0);

  const handleUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setReceiptUrls(p => [...p, file_url]);
      }
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.FinancialRecord.update(record.id, {
        amount: parseFloat(rec.amount) || 0,
        tax: parseFloat(rec.tax) || 0,
        total,
        date: rec.date,
        billing_month: rec.billing_month || deriveBillingMonth(rec.date),
        vendor: rec.vendor,
        reimbursed: rec.reimbursed,
        reimbursement_date: rec.reimbursed ? rec.reimbursement_date : '',
        completion_status: rec.completion_status,
        receipt_urls: receiptUrls,
        notes: rec.notes,
      });
      toast.success('Updated');
      onDone();
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <tr className="bg-amber-50/40 border-b border-slate-100">
      <td colSpan={9} className="p-3">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <Label className="text-xs">Amount ($)</Label>
            <Input type="number" step="0.01" value={rec.amount} onChange={e => update('amount', e.target.value)} className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Tax ($)</Label>
            <Input type="number" step="0.01" value={rec.tax} onChange={e => update('tax', e.target.value)} className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Total</Label>
            <Input value={`$${total.toFixed(2)}`} disabled className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Vendor</Label>
            <Input value={rec.vendor || ''} onChange={e => update('vendor', e.target.value)} className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={rec.date || ''} onChange={e => update('date', e.target.value)} className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Billing Month</Label>
            <Input type="month" value={rec.billing_month || ''} onChange={e => update('billing_month', e.target.value)} className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Completion</Label>
            <Select value={rec.completion_status || 'not_started'} onValueChange={v => update('completion_status', v)}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="did_not_complete">Did Not Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2 pb-1">
            <input type="checkbox" id={`reb-${record.id}`} checked={rec.reimbursed || false} onChange={e => update('reimbursed', e.target.checked)} className="accent-primary w-4 h-4" />
            <Label htmlFor={`reb-${record.id}`} className="text-xs cursor-pointer">Reimbursed</Label>
            {rec.reimbursed && (
              <Input type="date" value={rec.reimbursement_date || ''} onChange={e => update('reimbursement_date', e.target.value)} className="h-8 text-xs max-w-[140px]" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Label className="text-xs">Receipts:</Label>
          <Input type="file" multiple accept="image/*,.pdf" disabled={uploading} onChange={e => handleUpload(Array.from(e.target.files))} className="text-xs max-w-[250px] h-8" />
          {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
          {receiptUrls.map(url => (
            <Badge key={url} variant="outline" className="text-xs flex gap-1 items-center">
              <Paperclip className="w-3 h-3" />{url.split('/').pop().slice(0, 15)}
              <button onClick={() => setReceiptUrls(p => p.filter(u => u !== url))}><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
        {(rec.notes !== undefined) && (
          <Input value={rec.notes || ''} onChange={e => update('notes', e.target.value)} className="mt-2 h-8 text-xs" placeholder="Notes..." />
        )}
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </td>
    </tr>
  );
}

export default function PayablesTab({ financialRecords, clients }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterReimbursed, setFilterReimbursed] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState({});

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => await base44.entities.FinancialRecord.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-records'] });
    },
  });

  const toggleReimbursed = async (rec) => {
    const newReimbursed = !rec.reimbursed;
    try {
      await updateMutation.mutateAsync({
        id: rec.id,
        data: {
          reimbursed: newReimbursed,
          reimbursement_date: newReimbursed ? format(new Date(), 'yyyy-MM-dd') : '',
        },
      });
      toast.success(newReimbursed ? 'Marked as reimbursed' : 'Reimbursement cleared');
    } catch { toast.error('Failed to update'); }
  };

  const toggleInvoiced = async (rec) => {
    try {
      await updateMutation.mutateAsync({ id: rec.id, data: { invoiced: !rec.invoiced } });
      toast.success(!rec.invoiced ? 'Marked as invoiced' : 'Invoiced flag cleared');
    } catch { toast.error('Failed to update'); }
  };

  // Derive available billing months
  const availableMonths = useMemo(() => {
    const months = new Set();
    financialRecords.forEach(r => { if (r.billing_month) months.add(r.billing_month); });
    return Array.from(months).sort().reverse();
  }, [financialRecords]);

  // Filter records
  const filtered = useMemo(() => {
    return financialRecords.filter(r => {
      if (filterType !== 'all' && r.record_type !== filterType) return false;
      if (filterMonth !== 'all' && r.billing_month !== filterMonth) return false;
      if (filterReimbursed === 'yes' && !r.reimbursed) return false;
      if (filterReimbursed === 'no' && r.reimbursed) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (r.client_name || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const vendor = (r.vendor || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !vendor.includes(q)) return false;
      }
      return true;
    });
  }, [financialRecords, filterType, filterMonth, filterReimbursed, search]);

  // Group by billing month
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const month = r.billing_month || 'Unassigned';
      if (!map[month]) map[month] = [];
      map[month].push(r);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // Summary stats
  const totalAmount = filtered.reduce((s, r) => s + (r.total || 0), 0);
  const totalReimbursed = filtered.filter(r => r.reimbursed).reduce((s, r) => s + (r.total || 0), 0);
  const outstanding = totalAmount - totalReimbursed;
  const uninvoiced = filtered.filter(r => !r.invoiced).reduce((s, r) => s + (r.total || 0), 0);

  const toggleMonth = (month) => {
    setExpandedMonths(p => ({ ...p, [month]: !p[month] }));
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Payables</div>
            <div className="text-lg font-bold text-slate-800">${totalAmount.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{filtered.length} records</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Reimbursed</div>
            <div className="text-lg font-bold text-green-700">${totalReimbursed.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Outstanding Reimbursement</div>
            <div className="text-lg font-bold text-amber-700">${outstanding.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Not Yet Invoiced</div>
            <div className="text-lg font-bold text-blue-700">${uninvoiced.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search client, description, vendor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Billing Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(RECORD_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterReimbursed} onValueChange={setFilterReimbursed}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Reimbursement" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="no">Pending Reimbursement</SelectItem>
            <SelectItem value="yes">Reimbursed</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Payable
        </Button>
      </div>

      {showForm && (
        <PayableForm clients={clients} onDone={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['financial-records'] }); }} onCancel={() => setShowForm(false)} />
      )}

      {/* Grouped table */}
      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No payables found. Records created in client profiles (Employment Supports, Exposure Courses, Work Exposure Placements) will appear here automatically.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(([month, records]) => {
            const monthTotal = records.reduce((s, r) => s + (r.total || 0), 0);
            const isExpanded = expandedMonths[month] !== false; // default expanded
            return (
              <Card key={month} className="overflow-hidden">
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span className="font-semibold text-sm text-slate-700">
                      {month === 'Unassigned' ? 'Unassigned Month' : format(new Date(month + '-01'), 'MMMM yyyy')}
                    </span>
                    <Badge variant="outline" className="text-xs">{records.length} {records.length === 1 ? 'record' : 'records'}</Badge>
                  </div>
                  <span className="text-sm font-bold text-slate-700">${monthTotal.toFixed(2)}</span>
                </button>
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Client</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Type</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Description / Vendor</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Amount</th>
                          <th className="text-right px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Total</th>
                          <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Date</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Receipts</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Status</th>
                          <th className="text-center px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {records.map(rec => (
                          <Fragment key={rec.id}>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-700">{rec.client_name || '—'}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <Badge className={`text-xs ${RECORD_TYPE_BADGE[rec.record_type] || ''}`}>{RECORD_TYPE_LABELS[rec.record_type] || rec.record_type}</Badge>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="text-slate-700 truncate max-w-[200px]">{rec.description || rec.support_type || '—'}</div>
                                {rec.vendor && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{rec.vendor}</div>}
                                {rec.record_type === 'paid_external_placement' && (rec.hours_worked > 0 || rec.hourly_rate > 0) && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {rec.hours_worked > 0 && <span>{rec.hours_worked} hrs</span>}
                                    {rec.hours_worked > 0 && rec.hourly_rate > 0 && <span> × </span>}
                                    {rec.hourly_rate > 0 && <span>${rec.hourly_rate}/hr</span>}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right text-slate-600 whitespace-nowrap">${(rec.amount || 0).toFixed(2)}</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-slate-700 whitespace-nowrap">${(rec.total || 0).toFixed(2)}</td>
                              <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                {rec.date ? format(new Date(rec.date), 'MMM d, yy') : '—'}
                                {rec.record_type === 'paid_external_placement' && rec.work_end_date && (
                                  <div className="text-xs text-slate-400">to {format(new Date(rec.work_end_date), 'MMM d, yy')}</div>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {rec.receipt_urls?.length > 0 ? (
                                  <Badge variant="outline" className="text-xs flex gap-1 items-center w-fit mx-auto">
                                    <Paperclip className="w-3 h-3" />{rec.receipt_urls.length}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                <div className="flex flex-col gap-1 items-center">
                                  <button onClick={() => toggleReimbursed(rec)} className="text-xs">
                                    {rec.reimbursed
                                      ? <Badge className="text-xs bg-green-100 text-green-800">Reimbursed</Badge>
                                      : <Badge className="text-xs bg-amber-100 text-amber-800">Pending</Badge>}
                                  </button>
                                  {rec.invoiced && <Badge className="text-xs bg-blue-100 text-blue-800">Invoiced</Badge>}
                                  {rec.completion_status && (
                                    <Badge className={`text-xs ${COMPLETION_COLORS[rec.completion_status] || ''}`}>{rec.completion_status.replace(/_/g, ' ')}</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                <div className="flex justify-center gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(editingId === rec.id ? null : rec.id)}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleInvoiced(rec)} title="Toggle invoiced">
                                    <FileText className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {editingId === rec.id && (
                              <InlineEditRow
                                record={rec}
                                clients={clients}
                                onDone={() => { setEditingId(null); queryClient.invalidateQueries({ queryKey: ['financial-records'] }); }}
                                onCancel={() => setEditingId(null)}
                              />
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}