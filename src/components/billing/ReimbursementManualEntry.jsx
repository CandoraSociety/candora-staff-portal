import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pencil, Loader2, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { buildBillingDocName } from '@/lib/billingDocName';

const CONFIG = {
  exposure_course: {
    title: 'Exposure Courses',
    badgeClass: 'bg-purple-100 text-purple-700',
    icon: null,
    detailLabel: 'Course Name',
    showStream: true,
  },
  employment_supports: {
    title: 'Employment Supports',
    badgeClass: 'bg-green-100 text-green-700',
    icon: null,
    detailLabel: 'Description',
    showStream: false,
  },
};

// DEA = Direct Employment Assistance (direct_to_employment),
// WD = Workforce Development (pathways).
function streamForClient(client) {
  if (!client?.service_type) return '';
  if (client.service_type === 'direct_to_employment') return 'DEA';
  if (client.service_type === 'pathways') return 'WD';
  return '';
}

export default function ReimbursementManualEntry({ recordType, records, clients, periodLabel }) {
  const cfg = CONFIG[recordType];
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [clientId, setClientId] = useState('');
  const [vendor, setVendor] = useState('');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const fileRef = useRef(null);

  const clientMap = useMemo(() => {
    const map = {};
    (clients || []).forEach((c) => { map[c.id] = c; });
    return map;
  }, [clients]);

  const clientNameMap = useMemo(() => {
    const map = {};
    (clients || []).forEach((c) => { map[c.id] = `${c.first_name} ${c.last_name}`; });
    return map;
  }, [clients]);

  const selectedClient = clientId ? clientMap[clientId] : null;
  const stream = selectedClient ? streamForClient(selectedClient) : '';

  const monthRecords = useMemo(
    () => (records || []).slice().sort((a, b) => (a.client_name || '').localeCompare(b.client_name || '')),
    [records]
  );

  const reimbursableTotal = monthRecords.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const taxTotal = monthRecords.reduce((s, r) => s + (Number(r.tax) || 0), 0);
  const grandTotal = monthRecords.reduce((s, r) => s + (Number(r.total) || 0), 0);

  const resetForm = () => {
    setClientId('');
    setVendor('');
    setDetail('');
    setAmount('');
    setPayDate('');
    setReceiptFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openAdd = () => {
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setClientId(r.client_id || '');
    setVendor(r.vendor || '');
    setDetail(recordType === 'exposure_course' ? (r.course_type_other || r.course_type || '') : (r.description || ''));
    setAmount(r.amount != null ? String(r.amount) : '');
    setPayDate(r.date || '');
    setReceiptFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setOpen(true);
  };

  const handleSave = async () => {
    if (!clientId) { toast.error('Select a client.'); return; }
    if (!vendor.trim()) { toast.error('Enter the vendor name.'); return; }
    if (!detail.trim()) { toast.error(recordType === 'exposure_course' ? 'Enter the course name.' : 'Enter a description.'); return; }
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error('Enter the cost (without GST).'); return; }
    if (!payDate) { toast.error('Select the payment date.'); return; }

    setSaving(true);
    try {
      const clientName = clientNameMap[clientId] || '';
      const billingMonth = String(payDate).slice(0, 7);

      // Upload the receipt (if a new one was chosen) before persisting.
      let receiptUrls = [];
      if (editingId) {
        const existing = monthRecords.find((r) => r.id === editingId);
        receiptUrls = [...(existing?.receipt_urls || [])];
      }
      if (receiptFile) {
        const namedName = buildBillingDocName({
          recordType,
          descriptor: detail.trim(),
          clientName,
          month: billingMonth,
          originalName: receiptFile.name,
        });
        const uploadFile = namedName !== receiptFile.name
          ? new File([receiptFile], namedName, { type: receiptFile.type })
          : receiptFile;
        const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
        receiptUrls.push(file_url);
      }

      const payload = {
        client_id: clientId,
        client_name: clientName,
        vendor: vendor.trim(),
        amount: amt,
        tax: 0,
        total: amt,
        date: payDate,
        billing_month: billingMonth,
        receipt_urls: receiptUrls,
      };
      if (recordType === 'exposure_course') {
        payload.course_type = detail.trim();
        payload.description = detail.trim();
      } else {
        payload.description = detail.trim();
        payload.support_type = detail.trim();
      }

      if (editingId) {
        await base44.entities.FinancialRecord.update(editingId, payload);
        toast.success('Entry updated.');
      } else {
        await base44.entities.FinancialRecord.create({
          ...payload,
          record_type: recordType,
          registration_status: 'registered',
          completion_status: 'completed',
          notes: 'Manual entry',
        });
        toast.success('Entry added.');
      }
      qc.invalidateQueries({ queryKey: ['financial-records'] });
      resetForm();
      setEditingId(null);
      setOpen(false);
    } catch (e) {
      toast.error(e?.message || 'Could not save the entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    if (!confirm('Delete this manual entry?')) return;
    try {
      await base44.entities.FinancialRecord.delete(record.id);
      qc.invalidateQueries({ queryKey: ['financial-records'] });
      toast.success('Entry deleted.');
    } catch (e) {
      toast.error(e?.message || 'Could not delete.');
    }
  };

  const isManual = (r) => r.notes === 'Manual entry';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge className={cfg.badgeClass}>{cfg.title}</Badge>
            <span className="text-xs text-slate-500 font-normal">— {periodLabel}</span>
          </CardTitle>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); resetForm(); } }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Manual Entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? `Edit ${cfg.title} Entry` : `Add ${cfg.title} Entry`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {(clients || []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cfg.showStream && clientId && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-500">Stream:</span>
                      {stream ? (
                        <Badge variant="outline" className={stream === 'DEA' ? 'text-blue-700' : 'text-purple-700'}>{stream}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Not set (no DEA/WD on client file)</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Vendor name</Label>
                  <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vendor / provider" />
                </div>
                <div className="space-y-1.5">
                  <Label>{cfg.detailLabel}</Label>
                  <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={cfg.detailLabel} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cost (without GST)</Label>
                    <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date of payment</Label>
                    <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Receipt</Label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                      {receiptFile ? <Upload className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                      {receiptFile ? receiptFile.name : (editingId ? 'Replace receipt' : 'Upload receipt')}
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {editingId && !receiptFile && (() => {
                      const rec = monthRecords.find((r) => r.id === editingId);
                      return rec?.receipt_urls?.length > 0 ? (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> {rec.receipt_urls.length} attached
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); setEditingId(null); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Entry'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {monthRecords.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No {cfg.title.toLowerCase()} records for {periodLabel}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left py-2 px-2">Client</th>
                  {cfg.showStream && <th className="text-left py-2 px-2">Stream</th>}
                  <th className="text-left py-2 px-2">{cfg.detailLabel}</th>
                  <th className="text-left py-2 px-2">Vendor</th>
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Reimbursable</th>
                  <th className="text-left py-2 px-2">Receipt</th>
                  <th className="text-center py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.map((r, idx) => {
                  const c = r.client_id ? clientMap[r.client_id] : null;
                  const rStream = c ? streamForClient(c) : '';
                  return (
                    <tr key={r.id} className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <td className="py-2 px-2 font-medium whitespace-nowrap">
                        {clientNameMap[r.client_id] || r.client_name || '—'}
                      </td>
                      {cfg.showStream && (
                        <td className="py-2 px-2 whitespace-nowrap">
                          {rStream ? <Badge variant="outline" className={rStream === 'DEA' ? 'text-blue-700' : 'text-purple-700'}>{rStream}</Badge> : <span className="text-slate-400">—</span>}
                        </td>
                      )}
                      <td className="py-2 px-2 max-w-[160px] truncate">
                        {recordType === 'exposure_course' ? (r.course_type_other || r.course_type || r.description || '—') : (r.description || '—')}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">{r.vendor || '—'}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{r.date || '—'}</td>
                      <td className="text-right py-2 px-2 font-semibold">${(Number(r.amount) || 0).toFixed(2)}</td>
                      <td className="py-2 px-2">
                        {r.receipt_urls?.length > 0 ? (
                          <div className="space-y-0.5">
                            {r.receipt_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1" title={url.split('/').pop()}>
                                <ExternalLink className="w-2.5 h-2.5" /> {decodeURIComponent(url.split('/').pop()).slice(0, 24)}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="text-center py-2 px-2">
                        {isManual(r) && (
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(r)} title="Edit">
                              <Pencil className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td colSpan={cfg.showStream ? 5 : 4} className="text-right py-2 px-2 font-semibold">SUBTOTAL:</td>
                  <td className="text-right py-2 px-2 font-bold text-base bg-amber-200/60 text-amber-900">${reimbursableTotal.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}