import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DELIVERY_MODE_OPTIONS } from '@/lib/empoweruConstants';

export default function ParticipantFormCore({ form, update }) {
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
      <div className="space-y-1.5 col-span-2"><Label>Referral Source</Label><Input value={form.referral_source || ''} onChange={(e) => update('referral_source', e.target.value)} placeholder="How they heard about EmpowerU" /></div>
      <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
    </div>
  );
}