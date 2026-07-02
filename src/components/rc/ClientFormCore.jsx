import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FUNDER_CATEGORIES, CASE_STATUS_OPTIONS } from '@/lib/rcConstants';

export default function ClientFormCore({ form, update }) {
  const isPHAC = (form.funder_categories || []).includes('phac_caregiver_capacity');

  const toggleFunder = (value) => {
    const current = form.funder_categories || [];
    update('funder_categories', current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><p className="text-sm font-medium text-foreground mb-1">Personal Information</p></div>
      <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.first_name || ''} onChange={(e) => update('first_name', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.last_name || ''} onChange={(e) => update('last_name', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Preferred Language</Label><Input value={form.preferred_language || ''} onChange={(e) => update('preferred_language', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} /></div>
      <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input value={form.address || ''} onChange={(e) => update('address', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>City</Label><Input value={form.city || ''} onChange={(e) => update('city', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Postal Code</Label><Input value={form.postal_code || ''} onChange={(e) => update('postal_code', e.target.value)} /></div>

      <div className="col-span-2 mt-2"><p className="text-sm font-medium text-foreground mb-1">Emergency Contact</p></div>
      <div className="space-y-1.5"><Label>Name</Label><Input value={form.emergency_contact_name || ''} onChange={(e) => update('emergency_contact_name', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={form.emergency_contact_phone || ''} onChange={(e) => update('emergency_contact_phone', e.target.value)} /></div>

      <div className="col-span-2 mt-2">
        <p className="text-sm font-medium text-foreground mb-1">Funder Categories</p>
        <p className="text-xs text-muted-foreground mb-2">Select all that apply. PHAC clients can be isolated for reporting.</p>
        <div className="flex flex-wrap gap-3">
          {FUNDER_CATEGORIES.map(f => (
            <div key={f.value} className="flex items-center gap-1.5">
              <Checkbox id={`funder-${f.value}`} checked={(form.funder_categories || []).includes(f.value)} onCheckedChange={() => toggleFunder(f.value)} />
              <label htmlFor={`funder-${f.value}`} className="text-sm cursor-pointer" style={{ color: f.color }}>{f.label}</label>
            </div>
          ))}
        </div>
      </div>

      {isPHAC && (
        <div className="col-span-2 mt-2 p-3 rounded-lg bg-sky-50 border border-sky-200">
          <p className="text-sm font-medium text-sky-900 mb-2">PHAC Caregiver Capacity Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 col-span-2">
              <Checkbox id="has-children" checked={form.has_children_0_6 || false} onCheckedChange={(v) => update('has_children_0_6', v)} />
              <label htmlFor="has-children" className="text-sm cursor-pointer">Has children aged 0-6</label>
            </div>
            <div className="space-y-1.5"><Label>Number of children (0-6)</Label><Input type="number" min="0" value={form.children_count_0_6 ?? ''} onChange={(e) => update('children_count_0_6', parseInt(e.target.value) || 0)} /></div>
            <div className="space-y-1.5"><Label>Children's Ages (details)</Label><Input value={form.children_ages_detail || ''} onChange={(e) => update('children_ages_detail', e.target.value)} placeholder="e.g. 2yr, 4yr" /></div>
          </div>
        </div>
      )}

      <div className="col-span-2 mt-2"><p className="text-sm font-medium text-foreground mb-1">Case Management</p></div>
      <div className="space-y-1.5"><Label>Assigned Worker</Label><Input value={form.assigned_worker || ''} onChange={(e) => update('assigned_worker', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Case Status</Label>
        <Select value={form.case_status || 'intake'} onValueChange={(v) => update('case_status', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CASE_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Intake Date</Label><Input type="date" value={form.intake_date || ''} onChange={(e) => update('intake_date', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Referral Source</Label><Input value={form.referral_source || ''} onChange={(e) => update('referral_source', e.target.value)} placeholder="How they came to the Resource Centre" /></div>
      <div className="space-y-1.5 col-span-2"><Label>Presenting Needs</Label><Textarea value={form.presenting_needs || ''} onChange={(e) => update('presenting_needs', e.target.value)} rows={2} /></div>
      <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
    </div>
  );
}