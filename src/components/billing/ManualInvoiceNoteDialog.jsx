import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, StickyNote, Pencil, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NOTE_TYPES = [
  { value: 'invoice_adjustment', label: 'Invoice Adjustment', badge: 'bg-amber-100 text-amber-800' },
  { value: 'general', label: 'General', badge: 'bg-slate-100 text-slate-700' },
  { value: 'reminder', label: 'Reminder', badge: 'bg-blue-100 text-blue-700' },
  { value: 'follow_up', label: 'Follow-up', badge: 'bg-purple-100 text-purple-700' },
];
const TYPE_LABEL = Object.fromEntries(NOTE_TYPES.map((t) => [t.value, t.label]));
const TYPE_BADGE = Object.fromEntries(NOTE_TYPES.map((t) => [t.value, t.badge]));

/**
 * Add / Edit invoice notes from the Invoices tab. Notes are stored on the
 * month's Invoice Package as `note_entries` (the same categorized notes
 * managed in the package detail view), so they can be edited or removed here
 * and stay in sync with the package detail screen.
 */
export default function ManualInvoiceNoteDialog({ open, onOpenChange, billingMonth, monthLabel }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [existingNotes, setExistingNotes] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [type, setType] = useState('invoice_adjustment');
  const [text, setText] = useState('');
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
        prepared_date: new Date().toISOString().slice(0, 10),
        status: 'draft',
      });
    }
    setPkg(p);
    setExistingNotes(p.note_entries || []);
    return p;
  };

  useEffect(() => {
    if (!open) return;
    (async () => {
      const me = await base44.auth.me().catch(() => null);
      if (me) setUser(me);
      await loadPackage();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, billingMonth]);

  const resetForm = () => {
    setType('invoice_adjustment');
    setText('');
    setEditingIdx(null);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-adjustment-notes'] });
  };

  const startEdit = (idx) => {
    const n = existingNotes[idx];
    if (!n) return;
    setEditingIdx(idx);
    setType(n.type || 'general');
    setText(n.text || '');
  };

  const persist = async (entries) => {
    let p = pkg;
    if (!p) p = await loadPackage();
    const updated = await base44.entities.InvoicePackage.update(p.id, { note_entries: entries });
    setPkg(updated);
    setExistingNotes(updated.note_entries || entries);
    invalidate();
  };

  const handleSave = async () => {
    if (!billingMonth) {
      toast.error('No month selected');
      return;
    }
    if (!text.trim()) {
      toast.error('Enter the note text');
      return;
    }
    setSaving(true);
    try {
      const editing = editingIdx != null ? existingNotes[editingIdx] : null;
      const entry = {
        type,
        text: text.trim(),
        created_by_name: editing?.created_by_name || user?.full_name || user?.email || '',
        created_date: editing?.created_date || new Date().toISOString().slice(0, 10),
      };
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

        {existingNotes.length > 0 && (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Existing Notes</p>
            {existingNotes.map((n, idx) => (
              <div key={idx} className={`rounded-md border p-2 ${editingIdx === idx ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_BADGE[n.type] || TYPE_BADGE.general}`}>
                        {TYPE_LABEL[n.type] || 'General'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {n.created_by_name ? `${n.created_by_name} · ` : ''}
                        {n.created_date ? format(new Date(n.created_date), 'MMM d, yyyy') : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap break-words">{n.text}</p>
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
            ))}
          </div>
        )}

        <div className="space-y-3 py-1 border-t pt-3">
          {isEditing && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700 font-medium">Editing existing note #{editingIdx + 1}</span>
              <button onClick={resetForm} className="text-slate-500 hover:text-accent underline">Cancel edit</button>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note <span className="text-destructive">*</span></Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Enter the note text" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }} disabled={saving}>Close</Button>
          <Button onClick={handleSave} disabled={saving || !text.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isEditing ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {isEditing ? 'Save Changes' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}