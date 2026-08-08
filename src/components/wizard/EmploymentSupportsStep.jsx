import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, DollarSign, Link as LinkIcon, ShoppingCart, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const SUPPORT_TYPES = [
  'PPE (Personal Protective Equipment)',
  'Bus Pass / Transit',
  'Work Clothes',
  'Safety Boots',
  'Tools / Equipment',
  'Training Certificates',
  'First Aid Certification',
  'Police Information Check',
  'Driver\'s License',
  'Childcare',
  'Internet / Phone',
  'Other',
];

const SUPPORT_TYPE_SHORT = {
  'PPE (Personal Protective Equipment)': 'PPE',
  'Bus Pass / Transit': 'Bus Pass',
  'Work Clothes': 'Work Clothes',
  'Safety Boots': 'Safety Boots',
  'Tools / Equipment': 'Tools',
  'Training Certificates': 'Training Cert',
  'First Aid Certification': 'First Aid',
  'Police Information Check': 'Police Check',
  'Driver\'s License': 'Driver\'s License',
  'Childcare': 'Childcare',
  'Internet / Phone': 'Internet/Phone',
  'Other': 'Other',
};

const STATUS_BADGE = {
  pending: { className: 'bg-amber-100 text-amber-800', label: 'Pending', icon: Clock },
  needs_more_info: { className: 'bg-yellow-100 text-yellow-800', label: 'Needs More Info', icon: AlertCircle },
  approved: { className: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle2 },
  rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
};

function RequestPurchaseForm({ client, existing, onDone, onCancel }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [rec, setRec] = useState(existing || {
    support_type: SUPPORT_TYPES[0],
    support_type_other: '',
    description: '',
    product_link: '',
    purchase_exact_item: false,
    estimated_amount: '',
    vendor: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const update = (f, v) => setRec(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!rec.estimated_amount && rec.estimated_amount !== 0) {
      toast.error('Please enter an estimated amount');
      return;
    }
    setSaving(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      const data = {
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        support_type: rec.support_type,
        support_type_other: rec.support_type === 'Other' ? rec.support_type_other : '',
        description: rec.description,
        product_link: rec.product_link,
        purchase_exact_item: !!rec.purchase_exact_item,
        estimated_amount: parseFloat(rec.estimated_amount) || 0,
        vendor: rec.vendor,
        requested_date: existing?.requested_date || today,
        requested_by: existing?.requested_by || me?.email || client.assigned_worker || '',
        requested_by_name: existing?.requested_by_name || me?.full_name || '',
        assigned_worker: client.assigned_worker || '',
        notes: rec.notes,
        status: existing?.status || 'pending',
      };
      if (existing) {
        await base44.entities.PurchaseRequest.update(existing.id, data);
      } else {
        await base44.entities.PurchaseRequest.create(data);
      }
      toast.success(existing ? 'Purchase request updated' : 'Purchase request submitted to managers');
      onDone();
    } catch { toast.error('Failed to submit request'); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-green-600" />
          {existing ? 'Edit Purchase Request' : 'Request Purchase'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Support Type</Label>
            <Select value={rec.support_type} onValueChange={v => update('support_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={today} disabled className="mt-1 bg-slate-50 text-slate-500" />
          </div>
        </div>

        {rec.support_type === 'Other' && (
          <div>
            <Label className="text-xs">Specify Other</Label>
            <Input value={rec.support_type_other} onChange={e => update('support_type_other', e.target.value)} className="mt-1" placeholder="Describe the support..." />
          </div>
        )}

        <div>
          <Label className="text-xs">Description</Label>
          <Input value={rec.description} onChange={e => update('description', e.target.value)} className="mt-1" placeholder="Brief description..." />
        </div>

        <div>
          <Label className="text-xs">Product Link</Label>
          <div className="relative mt-1">
            <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              value={rec.product_link}
              onChange={e => update('product_link', e.target.value)}
              className="pl-8"
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!rec.purchase_exact_item}
              onChange={e => update('purchase_exact_item', e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span className="text-xs text-slate-600">Purchase exact item in link</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Estimated Amount ($)</Label>
            <Input type="number" step="0.01" value={rec.estimated_amount} onChange={e => update('estimated_amount', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Vendor</Label>
            <Input value={rec.vendor} onChange={e => update('vendor', e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea value={rec.notes} onChange={e => update('notes', e.target.value)} rows={2} className="mt-1 text-xs" />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Submitting...' : 'Request Purchase'}
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmploymentSupportsStep({ client, onSave }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const recs = await base44.entities.PurchaseRequest.filter({
        client_id: client.id,
      }, '-requested_date');
      setRecords(recs);
    } catch { toast.error('Failed to load purchase requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [client.id]);

  const handleDone = async () => {
    setShowForm(false);
    setEditingRecord(null);
    await fetchRecords();
    if (onSave) await onSave({ employment_supports: true });
  };

  const totalRequested = records.reduce((s, r) => s + (r.estimated_amount || 0), 0);
  const pending = records.filter(r => r.status === 'pending');
  const approved = records.filter(r => r.status === 'approved');
  const pendingTotal = pending.reduce((s, r) => s + (r.estimated_amount || 0), 0);
  const approvedTotal = approved.reduce((s, r) => s + (r.estimated_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Employment Supports
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Request purchases of employment supports (PPE, bus passes, work clothes, etc.) for manager approval.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingRecord(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Request Purchase
        </Button>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total Requested</div>
            <div className="text-lg font-bold text-slate-800">${totalRequested.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{records.length} request{records.length !== 1 ? 's' : ''}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</div>
            <div className="text-lg font-bold text-amber-700">${pendingTotal.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{pending.length} pending</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</div>
            <div className="text-lg font-bold text-green-700">${approvedTotal.toFixed(2)}</div>
            <div className="text-xs text-slate-400">{approved.length} approved</div>
          </CardContent>
        </Card>
      </div>

      {showForm && !editingRecord && (
        <RequestPurchaseForm client={client} onDone={handleDone} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No purchase requests yet. Click "Request Purchase" to submit one for manager approval.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map(rec => {
            const StatusIcon = STATUS_BADGE[rec.status]?.icon || Clock;
            return editingRecord?.id === rec.id
              ? <RequestPurchaseForm key={rec.id} client={client} existing={rec} onDone={handleDone} onCancel={() => setEditingRecord(null)} />
              : (
                <Card key={rec.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {SUPPORT_TYPE_SHORT[rec.support_type] || rec.support_type}
                            {rec.support_type === 'Other' && rec.support_type_other ? `: ${rec.support_type_other}` : ''}
                          </Badge>
                          <Badge className={`text-xs ${STATUS_BADGE[rec.status]?.className || ''}`}>
                            <StatusIcon className="w-3 h-3 mr-0.5" /> {STATUS_BADGE[rec.status]?.label || rec.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{rec.requested_date || '—'}</span>
                        </div>
                        {rec.description && <div className="text-sm mt-1 truncate">{rec.description}</div>}
                        {rec.product_link && (
                          <a href={rec.product_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 w-fit">
                            <LinkIcon className="w-3 h-3" /> Product Link
                          </a>
                        )}
                        {rec.purchase_exact_item && (
                          <Badge className="text-xs bg-blue-100 text-blue-800 w-fit mt-0.5">Purchase exact item</Badge>
                        )}
                        {(rec.vendor || rec.requested_by_name) && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {rec.vendor && <span>Vendor: {rec.vendor} · </span>}
                            <span>Requested by {rec.requested_by_name || rec.requested_by || '—'}</span>
                          </div>
                        )}
                        {rec.estimated_amount > 0 && (
                          <div className="text-xs font-medium mt-1">
                            Estimated: ${(rec.estimated_amount || 0).toFixed(2)}
                          </div>
                        )}
                        {rec.status === 'rejected' && rec.rejection_reason && (
                          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-1">
                            <span className="font-semibold">Rejected:</span> {rec.rejection_reason}
                            {rec.reviewed_by_name && <span className="block text-red-500 mt-0.5">by {rec.reviewed_by_name}</span>}
                          </div>
                        )}
                        {rec.status === 'needs_more_info' && rec.needs_more_info_note && (
                          <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2 mt-1">
                            <span className="font-semibold">Needs more info:</span> {rec.needs_more_info_note}
                          </div>
                        )}
                        {rec.status === 'approved' && (
                          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2 mt-1 space-y-0.5">
                            <div className="font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved & Purchased</div>
                            {rec.purchase_date && <div>Purchased: {rec.purchase_date} · ${(rec.total||0).toFixed(2)}</div>}
                            {rec.pickup_instructions && <div>Pickup: {rec.pickup_instructions}</div>}
                            {rec.purchase_notes && <div>Notes: {rec.purchase_notes}</div>}
                            {rec.receipt_url && <a href={rec.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 w-fit"><LinkIcon className="w-3 h-3" /> Receipt</a>}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => { setEditingRecord(rec); setShowForm(false); }}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
          })}
        </div>
      )}
    </div>
  );
}