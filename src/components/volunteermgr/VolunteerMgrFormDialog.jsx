import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';

const volunteerTypes = [
  { value: 'community', label: 'Community Volunteer' },
  { value: 'skilled', label: 'Skilled Volunteer' },
  { value: 'practicum', label: 'Practicum Student' },
  { value: 'corporate', label: 'Corporate Volunteer Group' },
  { value: 'internal_placement', label: 'Pathways Internal Placement' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'occasional', label: 'Occasional' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const defaultForm = {
  first_name: '', last_name: '', email: '', phone: '', address: '', city: '', birth_date: '', gender: '',
  emergency_contact_name: '', emergency_contact_phone: '', volunteer_type: 'community', company_name: '', school_name: '',
  skills: '', availability: '', status: 'pending', notes: '', pin_code: '',
  allergies: '', food_restriction: '', pictures_consent: '', how_heard: '', ell_level: '',
  corporate_members: [], programs: [], is_deceased: false, deceased_date: '', start_date: '',
};

export default function VolunteerMgrFormDialog({ open, onOpenChange, volunteer, onSave }) {
  const [form, setForm] = useState(volunteer || defaultForm);
  const [saving, setSaving] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '' });

  useEffect(() => {
    if (open) {
      setForm(volunteer || defaultForm);
      setNewMember({ name: '', email: '' });
    }
  }, [open, volunteer]);

  const { data: programs = [] } = useQuery({
    queryKey: ['vol-programs'],
    queryFn: () => base44.entities.VolunteerProgram.list('name', 200),
    enabled: open,
  });

  const toggleProgram = (name) => {
    const current = form.programs || [];
    const updated = current.includes(name) ? current.filter((p) => p !== name) : [...current, name];
    update('programs', updated);
  };

  const addMember = () => {
    if (!newMember.name.trim()) return;
    update('corporate_members', [...(form.corporate_members || []), { ...newMember }]);
    setNewMember({ name: '', email: '' });
  };

  const removeMember = (index) => {
    update('corporate_members', form.corporate_members.filter((_, i) => i !== index));
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const isCorporate = form.volunteer_type === 'corporate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{volunteer ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            {isCorporate ? (
              <>
                <div>
                  <Label>Company Name *</Label>
                  <Input value={form.company_name} onChange={(e) => update('company_name', e.target.value)} required placeholder="e.g. Acme Corp" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name (optional)</Label>
                    <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} placeholder="e.g. John" />
                  </div>
                  <div>
                    <Label>Last Name (optional)</Label>
                    <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} placeholder="e.g. Smith" />
                  </div>
                </div>
                <div>
                  <Label>Primary Contact Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="email@company.com" />
                </div>
                <div>
                  <Label>Primary Contact Phone</Label>
                  <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
              </>
            )}
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Volunteer Type *</Label>
              <Select value={form.volunteer_type} onValueChange={(v) => update('volunteer_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {volunteerTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Corporate Members */}
          {isCorporate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Group Members</Label>
                <Badge variant="secondary">{(form.corporate_members || []).length} members</Badge>
              </div>
              {(form.corporate_members || []).length > 0 && (
                <div className="grid gap-2">
                  {form.corporate_members.map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                      </div>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeMember(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Member name"
                  value={newMember.name}
                  onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  placeholder="Member email"
                  value={newMember.email}
                  onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))}
                  className="flex-1"
                />
                <Button type="button" size="sm" onClick={addMember}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* Practicum School */}
          {form.volunteer_type === 'practicum' && (
            <div>
              <Label>School Name</Label>
              <Input value={form.school_name} onChange={(e) => update('school_name', e.target.value)} />
            </div>
          )}

          {/* Programs */}
          {programs.length > 0 && (
            <div>
              <Label>Programs</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {programs.map((p) => (
                  <Badge
                    key={p.id}
                    variant={(form.programs || []).includes(p.name) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleProgram(p.name)}
                  >
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Personal Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Personal Details</h3>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <Input value={form.gender} onChange={(e) => update('gender', e.target.value)} placeholder="e.g. Female, Male, Non-binary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Emergency Contact Name</Label>
                <Input value={form.emergency_contact_name} onChange={(e) => update('emergency_contact_name', e.target.value)} />
              </div>
              <div>
                <Label>Emergency Contact Phone</Label>
                <Input value={form.emergency_contact_phone} onChange={(e) => update('emergency_contact_phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Additional Information</h3>
            <div>
              <Label>Skills & Qualifications</Label>
              <Textarea value={form.skills} onChange={(e) => update('skills', e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Availability</Label>
              <Textarea value={form.availability} onChange={(e) => update('availability', e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Allergies</Label>
              <Input value={form.allergies} onChange={(e) => update('allergies', e.target.value)} placeholder="e.g. Peanuts, Latex" />
            </div>
            <div>
              <Label>Food Restrictions</Label>
              <Input value={form.food_restriction} onChange={(e) => update('food_restriction', e.target.value)} placeholder="e.g. Vegetarian, Gluten-free" />
            </div>
            <div>
              <Label>ELL Level</Label>
              <Input value={form.ell_level} onChange={(e) => update('ell_level', e.target.value)} placeholder="e.g. Beginner, Intermediate" />
            </div>
            <div>
              <Label>How They Heard About Us</Label>
              <Input value={form.how_heard} onChange={(e) => update('how_heard', e.target.value)} />
            </div>
            <div>
              <Label>Photo Consent</Label>
              <Input value={form.pictures_consent} onChange={(e) => update('pictures_consent', e.target.value)} placeholder="e.g. Yes, No, Social Media Only" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
            </div>
          </div>

          {/* Deceased */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_deceased"
              checked={form.is_deceased}
              onChange={(e) => update('is_deceased', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="is_deceased" className="text-sm">Deceased</Label>
          </div>
          {form.is_deceased && (
            <div>
              <Label>Deceased Date</Label>
              <Input type="date" value={form.deceased_date} onChange={(e) => update('deceased_date', e.target.value)} />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}