import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const RECORD_TYPE_LABELS = {
  exposure_course:         'Exposure Course',
  paid_external_placement: 'Paid External Placement',
  employment_supports:     'Employment Supports',
};

const COMPLETION_COLORS = {
  completed:       'bg-green-100 text-green-800',
  in_progress:     'bg-blue-100 text-blue-800',
  not_started:     'bg-slate-100 text-slate-700',
  did_not_complete:'bg-red-100 text-red-800',
};

function RecordForm({ client, existing, onDone, onCancel }) {
  const [rec, setRec] = useState(existing || {
    record_type: 'exposure_course',
    course_type: '',
    description: '',
    amount: '',
    tax: '',
    date: '',
    vendor: '',
    registration_status: 'not_registered',
    completion_status: 'not_started',
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
        ...rec,
        amount: parseFloat(rec.amount) || 0,
        tax: parseFloat(rec.tax) || 0,
        total,
        receipt_urls: receiptUrls,
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        assigned_worker: client.assigned_worker,
      };
      if (existing) {
        await base44.entities.FinancialRecord.update(existing.id, data);
      } else {
        await base44.entities.FinancialRecord.create(data);
      }
      toast.success('Record saved');
      onDone();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{existing ? 'Edit Record' : 'New Record'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Record Type</Label>
            <Select value={rec.record_type} onValueChange={v => update('record_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(RECORD_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={rec.date} onChange={e => update('date', e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Description</Label>
          <Input value={rec.description} onChange={e => update('description', e.target.value)} className="mt-1" />
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
        <div>
          <Label className="text-xs">Vendor</Label>
          <Input value={rec.vendor} onChange={e => update('vendor', e.target.value)} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Registration Status</Label>
            <Select value={rec.registration_status} onValueChange={v => update('registration_status', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_registered">Not Registered</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
          <Button onClick={handleSave} disabled={saving} size="sm">{saving ? 'Saving...' : 'Save Record'}</Button>
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExposuresSupportsStep({ client, onSave }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const recs = await base44.entities.FinancialRecord.filter({ client_id: client.id }, '-created_date');
      setRecords(recs);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [client.id]);

  const handleDone = async () => {
    setShowForm(false);
    setEditingRecord(null);
    await fetchRecords();
    // Update client flags based on record types
    const fresh = await base44.entities.FinancialRecord.filter({ client_id: client.id });
    const hasExposure = fresh.some(r => r.record_type === 'exposure_course');
    const hasPaid = fresh.some(r => r.record_type === 'paid_external_placement');
    const hasSupports = fresh.some(r => r.record_type === 'employment_supports');
    if (hasExposure || hasPaid || hasSupports) {
      await onSave({
        exposure_course: hasExposure,
        paid_external_placement: hasPaid,
        employment_supports: hasSupports,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Exposure Courses &amp; Supports</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Track financial records for courses, placements, and supports.</p>
        </div>
        <Button size="sm" onClick={() => { setEditingRecord(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Record
        </Button>
      </div>

      {showForm && !editingRecord && (
        <RecordForm client={client} onDone={handleDone} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No financial records yet. Click "Add Record" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map(rec => (
            editingRecord?.id === rec.id
              ? <RecordForm key={rec.id} client={client} existing={rec} onDone={handleDone} onCancel={() => setEditingRecord(null)} />
              : (
                <Card key={rec.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{RECORD_TYPE_LABELS[rec.record_type] || rec.record_type}</Badge>
                          <Badge className={`text-xs ${COMPLETION_COLORS[rec.completion_status] || ''}`}>{rec.completion_status?.replace(/_/g, ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">{rec.date}</span>
                        </div>
                        {rec.description && <div className="text-sm mt-1 truncate">{rec.description}</div>}
                        {rec.vendor && <div className="text-xs text-muted-foreground">{rec.vendor}</div>}
                        {rec.total > 0 && <div className="text-xs font-medium mt-1">${rec.total.toFixed(2)}</div>}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => { setEditingRecord(rec); setShowForm(false); }}>Edit</Button>
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