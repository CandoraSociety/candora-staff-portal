import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { propagateEmployerName } from '@/lib/employerNameSync';

export default function EmployerProfileEditDialog({ employer, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: employer.name || '',
    first_name: employer.first_name || '',
    last_name: employer.last_name || '',
    position: employer.position || '',
    contact_email: employer.contact_email || '',
    contact_phone: employer.contact_phone || '',
    address: employer.address || '',
    industry: employer.industry || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      const newName = form.name.trim();
      const nameChanged = employer.name !== newName;
      await base44.entities.Employer.update(employer.id, {
        name: newName,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        position: form.position.trim(),
        contact_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        contact_email: form.contact_email.trim().toLowerCase(),
        contact_phone: form.contact_phone.trim(),
        address: form.address.trim(),
        industry: form.industry.trim(),
      });
      if (nameChanged) await propagateEmployerName(employer.id, newName);
      toast.success('Profile updated');
      onSaved?.();
    } catch (e) {
      toast.error('Update failed: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit company profile</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Changes to your company name will update it everywhere it appears (placements and submitted hours).
        </p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Company name</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Contact first name</Label>
              <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Contact last name</Label>
              <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Position</Label>
              <Input value={form.position} onChange={e => set('position', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Login email</Label>
            <Input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Industry</Label>
            <Input value={form.industry} onChange={e => set('industry', e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</> : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}