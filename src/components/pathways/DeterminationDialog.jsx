import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Upload, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DeterminationDialog({ request, currentUser, onClose, onDone }) {
  const isCourse = request.request_type === 'exposure_course';
  const [choice, setChoice] = useState(null);
  const [reason, setReason] = useState(request.rejection_reason || '');
  const [infoNote, setInfoNote] = useState(request.needs_more_info_note || '');
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [pickup, setPickup] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = (parseFloat(amount) || 0) + (parseFloat(tax) || 0);
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setReceiptUrl(res.file_url);
      toast.success('Receipt uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (saving) return;
    if (choice === 'rejected' && !reason.trim()) { toast.error('Please enter a rejection reason'); return; }
    if (choice === 'needs_more_info' && !infoNote.trim()) { toast.error('Please enter what info is needed'); return; }
    if (choice === 'approved' && !isCourse) {
      if (amount === '' || amount === null) { toast.error('Enter the purchase amount (without tax)'); return; }
      if (tax === '' || tax === null) { toast.error('Enter the tax amount (enter 0 if none)'); return; }
      if (!receiptUrl) { toast.error('Receipt upload is required'); return; }
    }
    setSaving(true);
    try {
      const base = {
        reviewed_by: currentUser.email,
        reviewed_by_name: currentUser.full_name || '',
        reviewed_date: today,
        determination_date: today,
      };
      if (choice === 'rejected') {
        await base44.entities.PurchaseRequest.update(request.id, { ...base, status: 'rejected', rejection_reason: reason.trim() });
        toast.success('Request rejected — requester notified');
      } else if (choice === 'needs_more_info') {
        await base44.entities.PurchaseRequest.update(request.id, { ...base, status: 'needs_more_info', needs_more_info_note: infoNote.trim() });
        toast.success('Marked as needing more info — requester notified');
      } else if (choice === 'approved') {
        if (isCourse) {
          // Exposure course approval — no billing / finance portal automations
          await base44.entities.PurchaseRequest.update(request.id, {
            ...base, status: 'approved',
            purchase_notes: notes.trim(),
          });
          toast.success('Exposure course request approved');
        } else {
          const amt = parseFloat(amount) || 0;
          const tx = parseFloat(tax) || 0;
          const tot = amt + tx;
          const billingMonth = purchaseDate.slice(0, 7);
          const fr = await base44.entities.FinancialRecord.create({
            client_id: request.client_id,
            client_name: request.client_name,
            assigned_worker: request.assigned_worker || request.requested_by,
            record_type: 'employment_supports',
            support_type: request.support_type,
            description: request.description,
            amount: amt,
            tax: tx,
            total: tot,
            date: purchaseDate,
            vendor: request.vendor,
            billing_month: billingMonth,
            receipt_urls: [receiptUrl],
            completion_status: 'completed',
            notes: [pickup.trim() ? `Pickup: ${pickup.trim()}` : '', notes.trim()].filter(Boolean).join(' | '),
          });
          await base44.entities.PurchaseRequest.update(request.id, {
            ...base, status: 'approved',
            purchase_date: purchaseDate, amount_without_tax: amt, tax: tx, total: tot,
            pickup_instructions: pickup.trim(), purchase_notes: notes.trim(), receipt_url: receiptUrl,
            linked_financial_record_id: fr?.id || '',
          });
          try { await base44.functions.invoke('syncEmploymentSupportsToInvoiceTracker', { billing_month: billingMonth }); } catch {}
          toast.success('Purchase approved & added to Employment Supports billing');
        }
      }
      onDone();
    } catch (e) { toast.error('Failed to save determination'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Request Determination</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-3">
          {request.client_name} · {request.support_type}
          {request.estimated_amount > 0 && <span className="ml-1">· est ${(request.estimated_amount || 0).toFixed(2)}</span>}
        </div>

        {!choice && (
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => setChoice('approved')} className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-left transition-colors">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div><div className="font-semibold text-green-800">{isCourse ? 'Approve Course' : 'Approve & Purchase'}</div><div className="text-xs text-green-700">{isCourse ? 'Approve this exposure course request' : 'Fill purchase info & upload receipt'}</div></div>
            </button>
            <button onClick={() => setChoice('rejected')} className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-left transition-colors">
              <XCircle className="w-5 h-5 text-red-600" />
              <div><div className="font-semibold text-red-800">Reject</div><div className="text-xs text-red-700">Provide a reason</div></div>
            </button>
            <button onClick={() => setChoice('needs_more_info')} className="flex items-center gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-left transition-colors">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div><div className="font-semibold text-yellow-800">Need More Information</div><div className="text-xs text-yellow-700">Ask the requester for more details</div></div>
            </button>
          </div>
        )}

        {choice === 'rejected' && (
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Explain why this request is rejected..." />
          </div>
        )}

        {choice === 'needs_more_info' && (
          <div className="space-y-2">
            <Label>What information is needed?</Label>
            <Textarea value={infoNote} onChange={e => setInfoNote(e.target.value)} rows={3} placeholder="Describe what you need from the requester..." />
          </div>
        )}

        {choice === 'approved' && isCourse && (
          <div className="space-y-3">
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional approval notes..." />
            </div>
          </div>
        )}

        {choice === 'approved' && !isCourse && (
          <div className="space-y-3">
            <div>
              <Label>Purchase Date *</Label>
              <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Amount (no tax) *</Label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Tax *</Label>
                <Input type="number" step="0.01" value={tax} onChange={e => setTax(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Total</Label>
                <Input value={`$${total.toFixed(2)}`} disabled className="bg-slate-50 font-semibold" />
              </div>
            </div>
            <div>
              <Label>Pick Up Instructions</Label>
              <Textarea value={pickup} onChange={e => setPickup(e.target.value)} rows={2} placeholder="Optional..." />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional..." />
            </div>
            <div>
              <Label>Receipt Upload *</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="file" onChange={handleUpload} accept="image/*,application/pdf" className="text-xs" />
                {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
                {receiptUrl && <Badge className="bg-green-100 text-green-800">Receipt uploaded</Badge>}
              </div>
            </div>
          </div>
        )}

        {choice && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setChoice(null)}>Back</Button>
            <Button onClick={submit} disabled={saving || uploading}>
              {saving ? 'Saving...' : choice === 'approved' ? (isCourse ? 'Approve Course' : 'Mark as Purchased') : choice === 'rejected' ? 'Confirm Rejection' : 'Send'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}