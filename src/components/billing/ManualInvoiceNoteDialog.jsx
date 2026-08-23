import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, StickyNote } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Manual note added straight from the Invoices tab. The note is stored as an
 * adjustment_note on the month's Invoice Package so it renders in the same
 * "Adjustment Notes" section on the invoice document as the auto-generated
 * tracker-edit notes.
 */
export default function ManualInvoiceNoteDialog({ open, onOpenChange, billingMonth, monthLabel }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [label, setLabel] = useState('');
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [clientId, setClientId] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      if (me) setUser(me);
      const cl = await base44.entities.Client.list('-last_name', 1000).catch(() => []);
      setClients(
        (cl || [])
          .map((c) => ({ id: c.id, name: `${c.first_name || ''} ${c.last_name || ''}`.trim() }))
          .filter((c) => c.name)
      );
    })();
  }, [open]);

  const reset = () => {
    setLabel('');
    setOldValue('');
    setNewValue('');
    setClientId('');
    setComment('');
  };

  const handleSave = async () => {
    if (!billingMonth) {
      toast.error('No month selected');
      return;
    }
    if (!label.trim()) {
      toast.error('Add a short label for the note');
      return;
    }
    setSaving(true);
    try {
      // Find (or create) a package for this month to hold the note.
      let pkgs = await base44.entities.InvoicePackage.filter({ billing_month: billingMonth });
      let pkg = (pkgs || [])[0];
      if (!pkg) {
        pkg = await base44.entities.InvoicePackage.create({
          billing_month: billingMonth,
          prepared_by: user?.email || 'manual-note',
          prepared_by_name: user?.full_name || '',
          prepared_date: new Date().toISOString().slice(0, 10),
          status: 'draft',
        });
      }
      const client = clients.find((c) => c.id === clientId);
      const entry = {
        cell_letter: '',
        cell_label: label.trim(),
        old_value: oldValue.trim(),
        new_value: newValue.trim(),
        client_id: clientId || '',
        client_name: client?.name || '',
        comment: comment.trim(),
        created_by_name: user?.full_name || user?.email || '',
        created_date: new Date().toISOString().slice(0, 10),
        billing_month: billingMonth,
      };
      await base44.entities.InvoicePackage.update(pkg.id, {
        adjustment_notes: [...(pkg.adjustment_notes || []), entry],
      });
      queryClient.invalidateQueries({ queryKey: ['invoice-adjustment-notes'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      toast.success('Note added to the invoice');
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error('Could not save the note: ' + (e?.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-500" />
            Add Note to Invoice — {monthLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-slate-500">
            This note appears in the Adjustment Notes section on the invoice, in the same format as the auto-generated tracker-edit notes.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Label (what this note is about) <span className="text-destructive">*</span></Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Billing correction" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Old value</Label>
              <Input value={oldValue} onChange={(e) => setOldValue(e.target.value)} placeholder="—" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">New value</Label>
              <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="—" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client (optional)</Label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— None —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Comment / details</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Additional context for this note" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <StickyNote className="h-4 w-4 mr-2" />}
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}