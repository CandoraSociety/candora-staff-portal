import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CASE_STATUS_OPTIONS } from '@/lib/rcConstants';

export const SERVICE_CATEGORY_OPTIONS = [
  { value: 'intensive_services', label: 'Intensive Services' },
  { value: 'caregiver_capacity_0_5', label: 'Caregiver Capacity 0-5' },
  { value: 'general', label: 'General' },
];

export const ENGLISH_PROFICIENCY_OPTIONS = [
  { value: 'strong', label: 'Strong' },
  { value: 'acceptable', label: 'Acceptable' },
  { value: 'low', label: 'Low' },
];

export const REASON_OPTIONS = [
  { value: 'program_registration', label: 'Program Registration' },
  { value: 'emergency_food', label: 'Emergency Food' },
  { value: 'emergency_clothing', label: 'Emergency Clothing' },
  { value: 'bus_tickets', label: 'Bus Tickets' },
  { value: 'housing_concerns', label: 'Housing Concerns' },
  { value: 'other', label: 'Other' },
];

export default function ClientFormCore({ form, update }) {
  const isCaregiver = form.service_category === 'caregiver_capacity_0_5';

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><p className="text-sm font-medium text-foreground mb-1">Personal Information</p></div>
      <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.first_name || ''} onChange={(e) => update('first_name', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.last_name || ''} onChange={(e) => update('last_name', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth || ''} onChange={(e) => update('date_of_birth', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Primary Language</Label><Input value={form.preferred_language || ''} onChange={(e) => update('preferred_language', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Additional Languages</Label><Input value={form.additional_languages || ''} onChange={(e) => update('additional_languages', e.target.value)} placeholder="e.g. Arabic, Spanish" /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} /></div>
      <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input value={form.address || ''} onChange={(e) => update('address', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>City</Label><Input value={form.city || ''} onChange={(e) => update('city', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Postal Code</Label><Input value={form.postal_code || ''} onChange={(e) => update('postal_code', e.target.value)} /></div>

      <div className="col-span-2 mt-2">
        <p className="text-sm font-medium text-foreground mb-2">Demographics</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <Checkbox id="indigenous" checked={form.indigenous_first_nations || false} onCheckedChange={(v) => update('indigenous_first_nations', v)} />
            <label htmlFor="indigenous" className="text-sm cursor-pointer">Indigenous / First Nations</label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id="newcomer" checked={form.newcomer || false} onCheckedChange={(v) => update('newcomer', v)} />
            <label htmlFor="newcomer" className="text-sm cursor-pointer">Newcomer</label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id="senior" checked={form.senior || false} onCheckedChange={(v) => update('senior', v)} />
            <label htmlFor="senior" className="text-sm cursor-pointer">Senior</label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id="youth" checked={form.youth_under_25 || false} onCheckedChange={(v) => update('youth_under_25', v)} />
            <label htmlFor="youth" className="text-sm cursor-pointer">Youth (Under 25)</label>
          </div>
        </div>
      </div>

      <div className="col-span-2 mt-2">
        <p className="text-sm font-medium text-foreground mb-2">English Language Proficiency</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Proficiency</Label>
            <Select value={form.english_proficiency || ''} onValueChange={(v) => update('english_proficiency', v === form.english_proficiency ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Basic evaluation" /></SelectTrigger>
              <SelectContent>{ENGLISH_PROFICIENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Proficiency Notes</Label><Input value={form.english_proficiency_notes || ''} onChange={(e) => update('english_proficiency_notes', e.target.value)} /></div>
        </div>
      </div>

      <div className="col-span-2 mt-2"><p className="text-sm font-medium text-foreground mb-1">Emergency Contact</p></div>
      <div className="space-y-1.5"><Label>Name</Label><Input value={form.emergency_contact_name || ''} onChange={(e) => update('emergency_contact_name', e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input value={form.emergency_contact_phone || ''} onChange={(e) => update('emergency_contact_phone', e.target.value)} /></div>

      <div className="col-span-2 mt-2 space-y-1.5">
        <Label>Service Category *</Label>
        <Select value={form.service_category || ''} onValueChange={(v) => update('service_category', v)}>
          <SelectTrigger><SelectValue placeholder="Select a service category" /></SelectTrigger>
          <SelectContent>{SERVICE_CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isCaregiver && (
        <div className="col-span-2 mt-2 p-3 rounded-lg bg-sky-50 border border-sky-200">
          <p className="text-sm font-medium text-sky-900 mb-2">Caregiver Capacity Details</p>
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

      <div className="col-span-2 mt-3 pt-3 border-t border-border space-y-3">
        <div className="space-y-1.5">
          <Label>Reason For Accessing Services</Label>
          <Select value={form.reason_for_accessing || ''} onValueChange={(v) => update('reason_for_accessing', v)}>
            <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
            <SelectContent>{REASON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {form.reason_for_accessing === 'other' && (
          <div className="space-y-1.5"><Label>Other (specify)</Label><Input value={form.reason_for_accessing_other || ''} onChange={(e) => update('reason_for_accessing_other', e.target.value)} /></div>
        )}
        <div className="space-y-1.5"><Label>Identified Needs</Label><Textarea value={form.identified_needs || ''} onChange={(e) => update('identified_needs', e.target.value)} rows={2} /></div>
      </div>

      <div className="col-span-2 mt-4 p-4 rounded-lg bg-muted border border-border/60">
        <p className="text-sm font-medium text-foreground mb-2">Case Management</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Assigned Worker</Label><Input value={form.assigned_worker || ''} onChange={(e) => update('assigned_worker', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Case Status</Label>
            <Select value={form.case_status || 'intake'} onValueChange={(v) => update('case_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CASE_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Intake Date</Label><Input type="date" value={form.intake_date || ''} onChange={(e) => update('intake_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Referral Source</Label><Input value={form.referral_source || ''} onChange={(e) => update('referral_source', e.target.value)} placeholder="How they came to Candora" /></div>
        </div>
      </div>

      <div className="col-span-2 mt-4 pt-3 border-t border-border space-y-1.5"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
    </div>
  );
}