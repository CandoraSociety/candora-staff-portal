import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import ClientPicker from '@/components/centralreg/ClientPicker';
import { KIDS_GIFT_SHOP_TIME_SLOTS, REGISTRATION_OVERRIDE_CODE, today } from '@/lib/centralRegConstants';

const EMPTY_PARENT = { first_name: '', last_name: '', phone: '', email: '' };

// Kids Gift Shop registration — parent/guardian, one or more children (name + age),
// and a time slot. Saved as a ProgramRegistration so it shows in All Registrations.
export default function KidsGiftShopRegistrationDialog({ open, onOpenChange, forceWaitlist = false, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [parent, setParent] = useState(EMPTY_PARENT);
  const [children, setChildren] = useState([{ first_name: '', age: '' }]);
  const [timeSlot, setTimeSlot] = useState('');
  const [waitlist, setWaitlist] = useState(false);
  const [overrideCode, setOverrideCode] = useState('');

  // A full program still allows a confirmed registration with the override code.
  const forced = forceWaitlist && overrideCode.trim() !== REGISTRATION_OVERRIDE_CODE;

  useEffect(() => {
    if (open) {
      setParent(EMPTY_PARENT);
      setChildren([{ first_name: '', age: '' }]);
      setTimeSlot('');
      setWaitlist(false);
      setOverrideCode('');
    }
  }, [open]);

  const updateParent = (f, v) => setParent(p => ({ ...p, [f]: v }));
  const updateChild = (i, f, v) => setChildren(p => p.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  const addChild = () => setChildren(p => [...p, { first_name: '', age: '' }]);
  const removeChild = (i) => setChildren(p => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!parent.first_name || !parent.last_name) {
      toast({ title: 'Parent/guardian first and last name are required', variant: 'destructive' });
      return;
    }
    const validChildren = children.filter(c => c.first_name?.trim());
    if (validChildren.length === 0) {
      toast({ title: 'Add at least one child', variant: 'destructive' });
      return;
    }
    if (validChildren.some(c => !c.age && c.age !== 0)) {
      toast({ title: 'Enter an age for each child', variant: 'destructive' });
      return;
    }
    if (!timeSlot) {
      toast({ title: 'Select a time slot', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const parentName = `${parent.first_name} ${parent.last_name}`;
      await base44.entities.ProgramRegistration.create({
        participant_first_name: parent.first_name,
        participant_last_name: parent.last_name,
        participant_name: parentName,
        participant_phone: parent.phone,
        participant_email: parent.email,
        program_portal: 'other',
        program_name: 'Kids Gift Shop',
        registration_date: today(),
        status: (waitlist || forced) ? 'waitlisted' : 'approved',
        parent_guardian_name: parentName,
        parent_guardian_phone: parent.phone,
        parent_guardian_email: parent.email,
        children: validChildren.map(c => ({ first_name: c.first_name.trim(), age: Number(c.age) })),
        time_slot: timeSlot,
      });
      toast({
        title: (waitlist || forced) ? 'Added to the waitlist' : 'Registration created',
        description: `${parentName} — Kids Gift Shop (${KIDS_GIFT_SHOP_TIME_SLOTS.find(s => s.value === timeSlot)?.label})`,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error creating registration', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Kids Gift Shop Registration</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Parent / Guardian</p>
            <div className="space-y-1.5 mb-3">
              <Label>Find an existing client (optional)</Label>
              <ClientPicker onSelect={(c) => setParent(p => ({ ...p, first_name: c.first_name || '', last_name: c.last_name || '', phone: c.phone || '', email: c.email || '' }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>First Name *</Label><Input value={parent.first_name} onChange={(e) => updateParent('first_name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Last Name *</Label><Input value={parent.last_name} onChange={(e) => updateParent('last_name', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={parent.phone} onChange={(e) => updateParent('phone', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={parent.email} onChange={(e) => updateParent('email', e.target.value)} /></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Children *</p>
              <Button type="button" size="sm" variant="outline" onClick={addChild}><Plus className="h-3.5 w-3.5" /> Add child</Button>
            </div>
            <div className="space-y-2">
              {children.map((c, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5"><Label>{i === 0 ? "Child's Name *" : "Child's Name"}</Label><Input value={c.first_name} onChange={(e) => updateChild(i, 'first_name', e.target.value)} placeholder="First name" /></div>
                  <div className="w-24 space-y-1.5"><Label>Age{i === 0 ? ' *' : ''}</Label><Input type="number" min="0" value={c.age} onChange={(e) => updateChild(i, 'age', e.target.value)} /></div>
                  {children.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" className="text-red-600" onClick={() => removeChild(i)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Time Slot *</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger>
              <SelectContent>
                {KIDS_GIFT_SHOP_TIME_SLOTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {forceWaitlist && (
              <div className="space-y-1.5 pt-2">
                <Label>Override code (optional)</Label>
                <Input value={overrideCode} onChange={(e) => setOverrideCode(e.target.value)} placeholder="Enter code to register anyway" />
                {overrideCode.trim() === REGISTRATION_OVERRIDE_CODE && <p className="text-xs text-green-600">Override accepted — this registration will be confirmed even though the program is full.</p>}
              </div>
            )}
            {forced && <p className="text-xs text-amber-600 pt-1">Registration is full, but you can still add to the waitlist</p>}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox id="kgs-waitlist" checked={forced ? true : waitlist} disabled={forced} onCheckedChange={(v) => setWaitlist(v === true)} />
              <Label htmlFor="kgs-waitlist" className="cursor-pointer">Add to the waitlist instead of confirming this slot</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (waitlist || forced) ? 'Add to Waitlist' : 'Register'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}