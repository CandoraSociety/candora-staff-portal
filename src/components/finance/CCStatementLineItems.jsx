import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Paperclip, Plus, Trash2, CheckCircle2, X } from 'lucide-react';

// One line item row on a monthly card statement — description + amount are
// editable inline, and each line can have its own receipt attached.
function LineItemRow({ item, onDeleted }) {
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
// inline editable rows, one receipt per line, exactly like reimbursement entries.
export default function CCStatementLineItems({ statementId }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['cc-statement-lines', statementId],
    queryFn: () => base44.entities.CCStatementLineItem.filter({ statement_id: statementId }, 'created_date', 500),
    enabled: !!statementId,
  });

  const addLine = async () => {
    if (!newDesc.trim()) { toast({ title: 'Enter a description for the line item.', variant: 'destructive' }); return; }
    if (newAmount === '' || Number.isNaN(Number(newAmount))) { toast({ title: 'Enter an amount for the line item.', variant: 'destructive' }); return; }
    setAdding(true);
    try {
      await base44.entities.CCStatementLineItem.create({
        statement_id: statementId,
        description: newDesc.trim(),
        amount: Number(newAmount),
      });
      setNewDesc('');
      setNewAmount('');
      qc.invalidateQueries({ queryKey: ['cc-statement-lines'] });
    } catch (err) {
      toast({ title: 'Could not add line item', description: err?.message, variant: 'destructive' });
    } finally {
      setAdding(false);
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

      {isLoading ? (
        <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading line items…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/20">
            <tr>
              <th className="text-left px-3 py-1.5 font-semibold">Description</th>
              <th className="text-left px-3 py-1.5 font-semibold">Amount</th>
              <th className="text-left px-3 py-1.5 font-semibold">Receipt</th>
              <th className="px-3 py-1.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => <LineItemRow key={item.id} item={item} />)}
            <tr className="bg-muted/10">
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
    </div>
  );
}