import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { RESOURCE_CATEGORY_OPTIONS } from '@/lib/receptionConstants';

const EMPTY = { name: '', description: '', category: 'other', subcategory: '', type: 'internal', provider_organization: '', contact_name: '', contact_phone: '', contact_email: '', address: '', city: '', website_url: '', eligibility_criteria: '', service_area: '', cost: '', hours: '', keywords: [], is_active: true, notes: '' };

export default function ResourceDialog({ open, onOpenChange, resource, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => { if (open) setForm(resource ? { ...resource } : EMPTY); }, [open, resource]);
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const addKeyword = () => { if (keywordInput.trim()) { update('keywords', [...(form.keywords || []), keywordInput.trim()]); setKeywordInput(''); } };
  const removeKeyword = (kw) => update('keywords', (form.keywords || []).filter(k => k !== kw));

  const handleSave = async () => {
    if (!form.name || !form.category || !form.type) { toast({ title: 'Name, category, and type are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (resource) await base44.entities.DirectoryResource.update(resource.id, form);
      else await base44.entities.DirectoryResource.create(form);
      toast({ title: resource ? 'Resource updated' : 'Resource created' });
      onSaved?.();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{resource ? 'Edit Resource' : 'New Resource'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2"><Label>Name *</Label><Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={3} placeholder="Detailed description of what this resource offers" /></div>
          <div className="space-y-1.5"><Label>Category *</Label><Select value={form.category} onValueChange={(v) => update('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESOURCE_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Subcategory</Label><Input value={form.subcategory || ''} onChange={(e) => update('subcategory', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Type *</Label><Select value={form.type} onValueChange={(v) => update('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internal">Internal (Candora)</SelectItem><SelectItem value="external">External</SelectItem></SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Provider Organization</Label><Input value={form.provider_organization || ''} onChange={(e) => update('provider_organization', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact Name</Label><Input value={form.contact_name || ''} onChange={(e) => update('contact_name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact Phone</Label><Input value={form.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Contact Email</Label><Input type="email" value={form.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input value={form.address || ''} onChange={(e) => update('address', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>City</Label><Input value={form.city || ''} onChange={(e) => update('city', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Website</Label><Input value={form.website_url || ''} onChange={(e) => update('website_url', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Eligibility Criteria</Label><Textarea value={form.eligibility_criteria || ''} onChange={(e) => update('eligibility_criteria', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Service Area</Label><Input value={form.service_area || ''} onChange={(e) => update('service_area', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Cost</Label><Input value={form.cost || ''} onChange={(e) => update('cost', e.target.value)} placeholder="Free, sliding scale, etc." /></div>
          <div className="space-y-1.5 col-span-2"><Label>Hours</Label><Input value={form.hours || ''} onChange={(e) => update('hours', e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Keywords</Label><div className="flex gap-2"><Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }} placeholder="Type and press Enter" /><Button type="button" size="sm" onClick={addKeyword}>Add</Button></div><div className="flex flex-wrap gap-1 mt-2">{(form.keywords || []).map(kw => <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">{kw}<button onClick={() => removeKeyword(kw)} className="text-muted-foreground hover:text-destructive">×</button></span>)}</div></div>
          <div className="flex items-center gap-2 col-span-2"><Checkbox id="active" checked={form.is_active ?? true} onCheckedChange={(v) => update('is_active', v)} /><label htmlFor="active" className="text-sm cursor-pointer">Active</label></div>
          <div className="space-y-1.5 col-span-2"><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}