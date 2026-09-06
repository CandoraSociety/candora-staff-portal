import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RISK_CATEGORY_LABELS, RISK_CATEGORY_COLORS, RISK_SEVERITY_OPTIONS, RISK_SEVERITY_COLORS, RISK_STATUS_OPTIONS, uid, today } from './caseConstants';

const EMPTY = { category: '', description: '', severity: 'medium', status: 'active', mitigation: '', date_identified: '', review_date: '' };

export default function CaseRisksTab({ risks = [], onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const openNew = () => { setEditId(null); setForm({ ...EMPTY, date_identified: today() }); setOpen(true); };
  const openEdit = (r) => { setEditId(r.id); setForm({ category: r.category || '', description: r.description || '', severity: r.severity || 'medium', status: r.status || 'active', mitigation: r.mitigation || '', date_identified: r.date_identified || '', review_date: r.review_date || '' }); setOpen(true); };

  const save = () => {
    if (!form.description.trim()) return;
    if (editId) onUpdate(editId, { ...form, description: form.description.trim() });
    else onAdd({ id: uid(), ...form, description: form.description.trim() });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Risk Factors</CardTitle><Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Add Risk Factor</Button></CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">Risks related to family, individual, or child stability or safety.</p>
        {risks.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No risk factors recorded</p> : (
          <div className="space-y-2">
            {risks.map(r => (
              <div key={r.id} className="p-3 rounded-md border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: (RISK_CATEGORY_COLORS[r.category] || '#64748b') + '22', color: RISK_CATEGORY_COLORS[r.category] || '#64748b' }}>{RISK_CATEGORY_LABELS[r.category] || r.category}</span>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: (RISK_SEVERITY_COLORS[r.severity] || '#94a3b8') + '22', color: RISK_SEVERITY_COLORS[r.severity] || '#94a3b8' }}>{(RISK_SEVERITY_OPTIONS.find(s => s.value === r.severity) || {}).label || r.severity}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select value={r.status || 'active'} onValueChange={(v) => onUpdate(r.id, { status: v })}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{RISK_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <p className="text-sm text-foreground mt-1.5">{r.description}</p>
                {r.mitigation && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Mitigation:</span> {r.mitigation}</p>}
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {r.date_identified && <span>Identified: {r.date_identified}</span>}
                  {r.review_date && <span>Review: {r.review_date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Risk Factor' : 'Add Risk Factor'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category || 'family'} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="family">Family</SelectItem><SelectItem value="individual">Individual</SelectItem><SelectItem value="child">Child</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Severity</Label>
              <Select value={form.severity} onValueChange={(v) => set('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RISK_SEVERITY_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date Identified</Label><Input type="date" value={form.date_identified} onChange={(e) => set('date_identified', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Review Date</Label><Input type="date" value={form.review_date} onChange={(e) => set('review_date', e.target.value)} /></div>
            <div className="space-y-1.5 col-span-2"><Label>Mitigation / Actions</Label><Textarea rows={2} value={form.mitigation} onChange={(e) => set('mitigation', e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? 'Save' : 'Add'}</Button></div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}