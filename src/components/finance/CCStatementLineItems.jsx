import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Paperclip, Plus, Trash2, CheckCircle2, X, FileScan, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import CCStaffReceiptPickerDialog from '@/components/finance/CCStaffReceiptPickerDialog';
import { useCCReceiptSelection } from '@/components/finance/CCReceiptSelectionContext';

// Statement lines that aren't purchases — skipped when reading the statement
// (interest charges and payments made onto the credit card aren't receiptable)
const EXCLUDED_LINE_RE = /\binterest\b|\bpayment\b/i;

// One line item row on a monthly card statement — description + amount are
// editable inline, and each line can have its own receipt attached.
function LineItemRow({ item, onDeleted, onPickReceipt }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [description, setDescription] = useState(item.description || '');
  const [amount, setAmount] = useState(item.amount ?? '');
  const [uploading, setUploading] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['cc-statement-lines'] });

  const update = useMutation({
    mutationFn: data => base44.entities.CCStatementLineItem.update(item.id, data),
    onSuccess: invalidate,
    onError: err => toast({ title: 'Update failed', description: err?.message, variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: () => base44.entities.CCStatementLineItem.delete(item.id),
    onSuccess: () => { invalidate(); onDeleted?.(); },
    onError: err => toast({ title: 'Delete failed', description: err?.message, variant: 'destructive' }),
  });

  const saveField = () => {
    const patch = {};
    if (description !== (item.description || '')) patch.description = description;
    const numAmount = amount === '' || amount === null ? null : Number(amount);
    const origAmount = item.amount ?? null;
    if (numAmount !== origAmount && !(Number.isNaN(numAmount) && origAmount === null)) patch.amount = Number.isNaN(numAmount) ? origAmount : numAmount;
    if (Object.keys(patch).length > 0) update.mutate(patch);
  };

  const attachReceipt = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.CCStatementLineItem.update(item.id, {
        receipt_url: file_url,
        receipt_file_name: file.name,
      });
      invalidate();
    } catch (err) {
      toast({ title: 'Receipt upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-3 py-1.5 text-center text-xs text-muted-foreground align-middle w-24 font-mono">{item.ref_number ?? '—'}</td>
      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap align-middle">
        {item.date ? format(parseISO(item.date), 'MMM d') : '—'}
      </td>
      <td className="px-3 py-1.5">
        <Input
          className="h-8 text-sm"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onBlur={saveField}
          placeholder="Line item description"
        />
      </td>
      <td className="px-3 py-1.5 w-32">
        <Input
          className="h-8 text-sm"
          type="number"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onBlur={saveField}
          placeholder="0.00"
        />
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          {item.receipt_url ? (
            <>
              <a href={item.receipt_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-primary hover:underline max-w-[220px] truncate">
                <Paperclip className="w-3.5 h-3.5 shrink-0" /> {item.receipt_file_name || 'Receipt'}
              </a>
              <Button
                size="sm" variant="ghost" className="h-7 px-1.5"
                title="Remove receipt"
                onClick={() => update.mutate({ receipt_url: '', receipt_file_name: '' })}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm" variant="outline" className="h-7 px-2 gap-1.5 text-xs"
                disabled={uploading}
                onClick={() => document.getElementById(`receipt-${item.id}`)?.click()}
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />} Attach Receipt
              </Button>
              <input id={`receipt-${item.id}`} type="file" className="hidden" accept="application/pdf,image/*" onChange={attachReceipt} />
              <Button
                size="sm" variant="outline" className="h-7 px-2 gap-1.5 text-xs whitespace-nowrap"
                onClick={() => onPickReceipt?.(item)}
                title="Attach one of the receipts checked in the Staff MasterCard Receipts section"
              >
                <UserCheck className="w-3.5 h-3.5" /> Add from Staff Receipts
              </Button>
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-1.5 text-center">
        <Button size="sm" variant="ghost" className="h-7 px-2" title="Delete line item" onClick={() => remove.mutate()}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

// Line-items section shown under a statement in the Finance MasterCard tab —
// reads the actual line items out of the uploaded statement PDF and turns
// them into editable rows, each with its own attachable receipt.
export default function CCStatementLineItems({ statement }) {
  const statementId = statement?.id;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [picking, setPicking] = useState(null); // statement line the staff-receipt picker is open on
  const { remove: unselectReceipt } = useCCReceiptSelection();

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['cc-statement-lines', statementId],
    queryFn: () => base44.entities.CCStatementLineItem.filter({ statement_id: statementId }, 'created_date', 500),
    enabled: !!statementId,
  });

  // Display line items in the same order the statement prints them
  const refOrder = v => {
    const n = Number(v?.ref_number);
    return String(v?.ref_number ?? '') !== '' && Number.isFinite(n) ? n : 1e9;
  };
  const items = useMemo(
    () => [...rawItems].sort((a, b) =>
      refOrder(a) - refOrder(b) ||
      new Date(a.created_date) - new Date(b.created_date)),
    [rawItems]);

  // Read the statement's own line items straight from the uploaded PDF and
  // create an editable copy of them — one row per statement line.
  const extractFromStatement = async () => {
    setExtracting(true);
    try {
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: statement.file_url,
        json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              description: 'EVERY transaction line from the statement transaction table, in the order printed. For each one, read its REF # and Trans.Date from the statement columns — never leave them blank. If Trans.Date is printed like "SEP 04", convert it to YYYY-MM-DD using the statement year.',
              items: {
                type: 'object',
                properties: {
                  ref_number: { type: 'string', description: 'The REF # printed on the statement for this transaction, exactly as shown (keep any leading zeros)' },
                  trans_date: { type: 'string', description: 'The Trans.Date printed on the statement for this transaction, in YYYY-MM-DD format' },
                  description: { type: 'string', description: 'The transaction/line item description exactly as printed on the statement' },
                  amount: { type: 'number', description: 'The transaction amount as a number' },
                },
                required: ['ref_number', 'trans_date', 'description', 'amount'],
              },
            },
          },
          required: ['items'],
        },
      });
      const all = (res?.output?.items || res?.items || [])
        .filter(i => i && typeof i.description === 'string' && i.description.trim());
      const rows = all
        .filter(i => !EXCLUDED_LINE_RE.test(i.description))
        .map(i => ({
          statement_id: statementId,
          ref_number: i.ref_number != null && String(i.ref_number).trim() !== '' ? String(i.ref_number).trim() : null,
          date: typeof (i.trans_date ?? i.date) === 'string' ? ((i.trans_date ?? i.date).match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null) : null,
          description: i.description.trim(),
          amount: typeof i.amount === 'number' ? i.amount : Number(String(i.amount ?? '').replace(/[^0-9.\-]/g, '')) || 0,
        }));
      const skipped = all.length - rows.length;
      if (rows.length === 0) {
        toast({ title: 'No line items found', description: 'Add them manually below instead.', variant: 'destructive' });
        return;
      }
      if (rawItems.length > 0) await base44.entities.CCStatementLineItem.deleteMany({ statement_id: statementId });
      await base44.entities.CCStatementLineItem.bulkCreate(rows);
      qc.invalidateQueries({ queryKey: ['cc-statement-lines'] });
      toast({
        title: `Read ${rows.length} line item${rows.length === 1 ? '' : 's'} from the statement`,
        description: skipped > 0 ? `Skipped ${skipped} interest/payment line${skipped === 1 ? '' : 's'}. Attach a receipt to each row below.` : 'Edit any row and attach its receipt below.',
      });
    } catch (err) {
      toast({ title: 'Could not read the statement', description: err?.message || 'Try adding the line items manually instead.', variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  };

  const addLine = async () => {
    if (!newDesc.trim()) { toast({ title: 'Enter a description for the line item.', variant: 'destructive' }); return; }
    if (newAmount === '' || Number.isNaN(Number(newAmount))) { toast({ title: 'Enter an amount for the line item.', variant: 'destructive' }); return; }
    setAdding(true);
    try {
      await base44.entities.CCStatementLineItem.create({
        statement_id: statementId,
        date: newDate || null,
        description: newDesc.trim(),
        amount: Number(newAmount),
      });
      setNewDesc('');
      setNewAmount('');
      setNewDate('');
      qc.invalidateQueries({ queryKey: ['cc-statement-lines'] });
    } catch (err) {
      toast({ title: 'Could not add line item', description: err?.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  // Attach a staff-checked receipt (Staff MasterCard Receipts section) to the
  // statement line the picker was opened on
  const pickReceipt = async entry => {
    const line = picking;
    setPicking(null);
    if (!line || !entry?.receipt_url) return;
    try {
      await base44.entities.CCStatementLineItem.update(line.id, {
        receipt_url: entry.receipt_url,
        receipt_file_name: entry.description || 'Staff receipt',
      });
      unselectReceipt(entry.id);
      qc.invalidateQueries({ queryKey: ['cc-statement-lines'] });
      qc.invalidateQueries({ queryKey: ['cc-statement-lines-all'] });
      toast({ title: 'Receipt attached', description: `“${entry.description || 'Receipt'}” added to line${line.ref_number ? ` #${line.ref_number}` : ''}.` });
    } catch (err) {
      toast({ title: 'Could not attach receipt', description: err?.message, variant: 'destructive' });
    }
  };

  const withReceipt = items.filter(i => i.receipt_url).length;

  return (
    <div className="border-t">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-muted/30 border-b">
        <Paperclip className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Line Items</h4>
        <p className="text-xs text-muted-foreground hidden md:block">Add each statement line and attach its receipt — one receipt per line.</p>
        {items.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> {withReceipt}/{items.length} receipts attached
          </span>
        )}
      </div>

      {!isLoading && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-muted/10">
          <Button
            size="sm" variant="outline" className="h-8 gap-1.5"
            disabled={extracting}
            onClick={() => {
              if (items.length > 0 && !window.confirm(`This will replace the ${items.length} existing line item(s) — including their attached receipts — with a fresh read of the statement. Continue?`)) return;
              extractFromStatement();
            }}
          >
            {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileScan className="w-4 h-4" />} Read Line Items from Statement
          </Button>
          <p className="text-xs text-muted-foreground">Scans the statement and auto-fills each line's number, date, description and amount — then attach a receipt to each one below.</p>
        </div>
      )}

      {isLoading ? (
        <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading line items…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/20">
            <tr>
              <th className="text-center px-3 py-1.5 font-semibold w-24">REF #</th>
              <th className="text-left px-3 py-1.5 font-semibold">Date</th>
              <th className="text-left px-3 py-1.5 font-semibold">Description</th>
              <th className="text-left px-3 py-1.5 font-semibold">Amount</th>
              <th className="text-left px-3 py-1.5 font-semibold">Receipt</th>
              <th className="px-3 py-1.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => <LineItemRow key={item.id} item={item} onPickReceipt={setPicking} />)}
            <tr className="bg-muted/10">
              <td />
              <td className="px-3 py-1.5 w-32">
                <Input
                  className="h-8 text-sm"
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLine()}
                />
              </td>
              <td className="px-3 py-1.5">
                <Input
                  className="h-8 text-sm"
                  placeholder="New line item…"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLine()}
                />
              </td>
              <td className="px-3 py-1.5 w-32">
                <Input
                  className="h-8 text-sm"
                  type="number" step="0.01" placeholder="0.00"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLine()}
                />
              </td>
              <td colSpan={2} className="px-3 py-1.5">
                <Button size="sm" className="h-8 gap-1.5" onClick={addLine} disabled={adding}>
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      )}

      <CCStaffReceiptPickerDialog lineItem={picking} onClose={() => setPicking(null)} onPick={pickReceipt} />
    </div>
  );
}