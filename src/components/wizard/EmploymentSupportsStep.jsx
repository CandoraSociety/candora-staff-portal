import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Pencil, CheckCircle2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

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

function SupportForm({ client, existing, onDone, onCancel }) {
  const [rec, setRec] = useState(existing || {
    support_type: SUPPORT_TYPES[0],
    support_type_other: '',
    description: '',
    amount: '',
    tax: '',
    date: '',
    vendor: '',
    reimbursed: false,
    reimbursement_date: '',
    notes: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptUrls, setReceiptUrls] = useState(existing?.receipt_urls || []);

  const update = (f, v) => setRec(p => ({ ...p, [f]: v }));
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
      const data = {
        record_type: 'employment_supports',
        support_type: rec.support_type === 'Other' ? 'Other' : rec.support_type,
        support_type_other: rec.support_type === 'Other' ? rec.support_type_other : '',
        description: rec.description,
        amount: parseFloat(rec.amount) || 0,
        tax: parseFloat(rec.tax) || 0,
        total,
        date: rec.date,
        vendor: rec.vendor,
        reimbursed: rec.reimbursed,
        reimbursement_date: rec.reimbursed ? rec.reimbursement_date : '',
        receipt_urls: receiptUrls,
        notes: rec.notes,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
      };
      if (existing) {
        await base44.entities.FinancialRecord.update(existing.id, data);
      } else {
        await base44.entities.FinancialRecord.create(data);
      }
      toast.success('Support record saved');
      onDone();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{existing ? 'Edit Support' : 'Add Employment Support'}</CardTitle>
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
            <Input type="date" value={rec.date} onChange={e => update('date', e.target.value)} className="mt-1" />
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

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <Label className="text-xs">Vendor</Label>
            <Input value={rec.vendor} onChange={e => update('vendor', e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="reimbursed"
              checked={rec.reimbursed}
              onChange={e => update('reimbursed', e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <Label htmlFor="reimbursed" className="text-xs cursor-pointer">Reimbursed</Label>
          </div>
        </div>

        {rec.reimbursed && (
          <div>
            <Label className="text-xs">Reimbursement Date</Label>
            <Input type="date" value={rec.reimbursement_date} onChange={e => update('reimbursement_date', e.target.value)} className="mt-1 max-w-[200px]" />
          </div>
        )}

        <div>
          <Label className="text-xs">Receipts</Label>
          <Input type="file" multiple accept="image/*,.pdf" disabled={uploading}
            onChange={e => handleUpload(Array.from(e.target.files))} className="mt-1 text-xs" />
          {receiptUrls.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {receiptUrls.map(url => (
                <Badge key={url} variant="outline" className="text-xs flex gap-1">
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

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">{saving ? 'Saving...' : 'Save Support'}</Button>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmploymentSupportsStep({ client, onSave, onComplete }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const recs = await base44.entities.FinancialRecord.filter({
        client_id: client.id,
        record_type: 'employment_supports',
      }, '-created_date');
      setRecords(recs);
    } catch { toast.error('Failed to load support records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [client.id]);

  const handleDone = async () => {
    setShowForm(false);
    setEditingRecord(null);
    await fetchRecords();
    if (records.length > 0 || true) {
      await onSave({ employment_supports: true });
    }
  };

  const totalSpent = records.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalReimbursed = records.filter(r => r.reimbursed).reduce((sum, r) => sum + (r.total || 0), 0);
  const outstanding = totalSpent - totalReimbursed;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Employment Supports
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track financial support provided to the client (PPE, bus passes, work clothes, etc.) and reimbursement status.
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditingRecord(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Support
        </Button>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total Spent</div>
            <div className="text-lg font-bold text-slate-800">${totalSpent.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Reimbursed</div>
            <div className="text-lg font-bold text-green-700">${totalReimbursed.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Outstanding</div>
            <div className="text-lg font-bold text-amber-700">${outstanding.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {showForm && !editingRecord && (
        <SupportForm client={client} onDone={handleDone} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No employment support records yet. Click "Add Support" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map(rec => (
            editingRecord?.id === rec.id
              ? <SupportForm key={rec.id} client={client} existing={rec} onDone={handleDone} onCancel={() => setEditingRecord(null)} />
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
                          {rec.reimbursed ? (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Reimbursed
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-amber-100 text-amber-800">Pending Reimbursement</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{rec.date || '—'}</span>
                        </div>
                        {rec.description && <div className="text-sm mt-1 truncate">{rec.description}</div>}
                        {rec.vendor && <div className="text-xs text-muted-foreground">{rec.vendor}</div>}
                        {rec.total > 0 && (
                          <div className="text-xs font-medium mt-1">
                            ${rec.total.toFixed(2)}
                            {rec.reimbursed && rec.reimbursement_date && (
                              <span className="text-green-600 ml-2">Reimbursed {rec.reimbursement_date}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => { setEditingRecord(rec); setShowForm(false); }}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
          ))}
        </div>
      )}
    </div>
  );
}