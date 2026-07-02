import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PROGRAM_PORTAL_OPTIONS, STAFF_ROLE_OPTIONS } from '@/lib/receptionConstants';

const EMPTY = { staff_email: '', staff_name: '', program_portal: 'ell', program_name: '', role: 'facilitator', role_label: '', is_active: true, notes: '' };

export default function StaffProgramRoleDialog({ open, onOpenChange, role, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.filter({ is_deleted: false }), enabled: open });

  useEffect(() => { if (open) setForm(role ? { ...role } : EMPTY); }, [open, role]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleEmployeeSelect = (email) => {
    const emp = employees.find(e => e.email === email);
    update('staff_email', email);
    if (emp) update('staff_name', `${emp.first_name} ${emp.last_name}`);
  };

  const handleSave = async () => {
    if (!form.staff_email || !form.staff_name || !form.program_portal || !form.role) { toast({ title: 'Staff member, program portal, and role are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (role) await base44.entities.StaffProgramRole.update(role.id, form);
      else await base44.entities.StaffProgramRole.create(form);
      toast({ title: role ? 'Role updated' : 'Role added' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{role ? 'Edit Program Role' : 'Add Program Role'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Staff Member *</Label><Select value={form.staff_email} onValueChange={handleEmployeeSelect}><SelectTrigger><SelectValue placeholder="Select staff member..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.email}>{e.first_name} {e.last_name} — {e.position}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Program Portal *</Label><Select value={form.program_portal} onValueChange={(v) => update('program_portal', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAM_PORTAL_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5 col-span-2"><Label>Program Name</Label><Input value={form.program_name || ''} onChange={(e) => update('program_name', e.target.value)} placeholder="e.g. EmpowerU Fall 2026" /></div>
          <div className="space-y-1.5"><Label>Role *</Label><Select value={form.role} onValueChange={(v) => update('role', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STAFF_ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Custom Label</Label><Input value={form.role_label || ''} onChange={(e) => update('role_label', e.target.value)} placeholder="More specific title" /></div>
          <div className="flex items-center gap-2 col-span-2"><Checkbox id="active" checked={form.is_active ?? true} onCheckedChange={(v) => update('is_active', v)} /><label htmlFor="active" className="text-sm cursor-pointer">Active role</label></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}