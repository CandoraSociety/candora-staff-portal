import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uid } from './caseConstants';

// Generic structured-record list + add/edit dialog, used for contacts, reviews,
// outcomes and post-service follow-ups. fields: { key, label, type: text|textarea|date|number|select|checkbox, options?, required?, full?, rows? }
export default function CaseRecordSection({ title, description, fields = [], records = [], onAdd, onUpdate, onDelete, defaults, titleOf }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const label = (r) => (titleOf ? titleOf(r) : r.date || '—');

  const openNew = () => {
    setEditId(null);
    const base = Object.fromEntries(fields.map(f => [f.key, f.type === 'checkbox' ? false : '']));
    setForm({ ...base, ...defaults });
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditId(r.id);
    const base = Object.fromEntries(fields.map(f => [f.key, r[f.key] ?? (f.type === 'checkbox' ? false : '')]));
    setForm(base);
    setOpen(true);
  };

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    const missing = fields.find(f => f.required && !String(form[f.key] || '').trim());
    if (missing) return;
    const clean = { ...form };
    fields.forEach(f => {
      if (f.type === 'number') clean[f.key] = form[f.key] === '' || form[f.key] == null ? null : Number(form[f.key]);
    });
    if (editId) onUpdate(editId, clean);
    else onAdd({ id: uid(), ...clean });
    setOpen(false);
  };

  const sorted = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const renderInput = (f) => {
    if (f.type === 'select') {
      return (
        <Select value={form[f.key] || 'none'} onValueChange={(v) => set(f.key, v === 'none' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder={f.label} /></SelectTrigger>
          <SelectContent>
            {(f.options || []).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    if (f.type === 'textarea') return <Textarea rows={f.rows || 2} value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />;
    if (f.type === 'checkbox') {
      return (
        <div className="flex items-center gap-2 pt-2">
          <Checkbox checked={!!form[f.key]} onCheckedChange={(v) => set(f.key, !!v)} id={`f-${f.key}`} />
          <Label htmlFor={`f-${f.key}`} className="text-sm font-normal">{f.label}</Label>
        </div>
      );
    }
    return <Input type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title} ({records.length})</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Add</Button>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nothing recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map(r => (
              <div key={r.id} className="p-3 rounded-md border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-primary">{label(r)}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-1.5">
                  {fields.map(f => {
                    if (f.type === 'checkbox') {
                      return r[f.key] ? <p key={f.key} className="text-xs text-foreground sm:col-span-2"><span className="font-medium">{f.label}</span></p> : null;
                    }
                    const v = r[f.key];
                    if (v === undefined || v === null || v === '') return null;
                    const display = f.type === 'select' ? (f.options || []).find(o => o.value === v)?.label || v : v;
                    return (
                      <p key={f.key} className={`text-xs text-muted-foreground ${f.full ? 'sm:col-span-2' : ''}`}>
                        <span className="font-medium text-foreground">{f.label}:</span> {display}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? `Edit ${title.replace(/s$/, '')}` : `Add ${title.replace(/s$/, '')}`}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key} className={`space-y-1.5 ${f.full ? 'col-span-2' : ''} ${f.type === 'checkbox' ? 'flex items-center' : ''}`}>
                {f.type !== 'checkbox' && <Label className="text-xs">{f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}</Label>}
                {renderInput(f)}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? 'Save' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}