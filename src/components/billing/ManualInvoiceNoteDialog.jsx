import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, StickyNote, Pencil, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

// Today's date in the org's Mountain (America/Edmonton) timezone as YYYY-MM-DD.
// `new Date().toISOString()` is UTC, which can land on the wrong calendar day
// relative to Edmonton — so format explicitly in the local zone.
const edmontonToday = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Edmonton',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

/**
 * Add / Edit invoice notes from the Invoices tab. Notes are stored on the
 * month's Invoice Package as `adjustment_notes` — the same field the invoice
 * document renders in its "Adjustment Notes" section — so a note added here
 * appears on the invoice and can be edited or removed here.
 */
export default function ManualInvoiceNoteDialog({ open, onOpenChange, billingMonth, monthLabel }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [pkg, setPkg] = useState(null);
  const [existingNotes, setExistingNotes] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [label, setLabel] = useState('');
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [clientId, setClientId] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPackage = async () => {
    if (!billingMonth) return null;
    let pkgs = await base44.entities.InvoicePackage.filter({ billing_month: billingMonth });
    let p = (pkgs || [])[0];
    if (!p) {
      p = await base44.entities.InvoicePackage.create({
        billing_month: billingMonth,
        prepared_by: user?.email || 'manual-note',
        prepared_by_name: user?.full_name || '',
        prepared_date: edmontonToday(),
        status: 'draft',
      });
    }
    setPkg(p);
    setExistingNotes(p.adjustment_notes || []);
    return p;
  };

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
      await loadPackage();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, billingMonth]);

  const resetForm = () => {
    setLabel('');
    setOldValue('');
    setNewValue('');
    setClientId('');
    setComment('');
    setEditingIdx(null);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice-adjustment-notes'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
  };

  const startEdit = (idx) => {
    const n = existingNotes[idx];
    if (!n) return;
    setEditingIdx(idx);
    setLabel(n.cell_label || '');
    setOldValue(n.old_value || '');
    setNewValue(n.new_value || '');
    setClientId(n.client_id || '');
    setComment(n.comment || '');
  };

  const buildEntry = () => {
    const client = clients.find((c) => c.id === clientId);
    const editing = editingIdx != null ? existingNotes[editingIdx] : null;
    return {
      cell_letter: '',
      cell_label: label.trim(),
      old_value: oldValue.trim(),
      new_value: newValue.trim(),
      client_id: clientId || '',
      client_name: client?.name || '',
      comment: comment.trim(),
      created_by_name: editing?.created_by_name || user?.full_name || user?.email || '',
      created_date: editing?.created_date || edmontonToday(),
      billing_month: billingMonth,
    };
  };

  const persist = async (entries) => {
    let p = pkg;
    if (!p) p = await loadPackage();
    const updated = await base44.entities.InvoicePackage.update(p.id, { adjustment_notes: entries });
    setPkg(updated);
    setExistingNotes(updated.adjustment_notes || entries);
    invalidate();
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
      const entry = buildEntry();
      let next;
      if (editingIdx != null) {
        next = existingNotes.map((n, i) => (i === editingIdx ? entry : n));
      } else {
        next = [...existingNotes, entry];
      }
      await persist(next);
      toast.success(editingIdx != null ? 'Note updated' : 'Note added to the invoice');
      resetForm();
    } catch (e) {
      toast.error('Could not save the note: ' + (e?.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx) => {
    setSaving(true);
    try {
      const next = existingNotes.filter((_, i) => i !== idx);
      await persist(next);
      if (editingIdx === idx) {
        resetForm();
      } else if (editingIdx != null && editingIdx > idx) {
        setEditingIdx(editingIdx - 1);
      }
      toast.success('Note removed');
    } catch (e) {
      toast.error('Could not delete the note: ' + (e?.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  const isEditing = editingIdx != null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-amber-500" />
            {isEditing ? 'Edit Note' : 'Add Note'} — {monthLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Existing Notes</p>
          {existingNotes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">No notes yet for this month — add one below.</p>
          ) : (
            existingNotes.map((n, idx) => (
              <div key={idx} className={`rounded-md border p-2 ${editingIdx === idx ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{n.cell_label}</p>
                    <p className="text-xs text-slate-500">
                      {n.old_value || n.new_value ? `${n.old_value || '—'} → ${n.new_value || '—'}` : ''}
                      {n.client_name ? ` · ${n.client_name}` : ''}
                    </p>
                    {n.comment && <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-wrap break-words">{n.comment}</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {n.created_by_name ? `${n.created_by_name} · ` : ''}
                      {n.created_date ? format(new Date(n.created_date + 'T00:00:00'), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(idx)} disabled={saving}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(idx)} disabled={saving}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 py-1 border-t pt-3">
          {isEditing && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-medium">Editing existing note #{editingIdx + 1}</span>
              <button onClick={resetForm} className="text-slate-500 hover:text-accent underline">Cancel edit</button>
            </div>
          )}
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
          <Button variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }} disabled={saving}>Close</Button>
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isEditing ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {isEditing ? 'Save Changes' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}