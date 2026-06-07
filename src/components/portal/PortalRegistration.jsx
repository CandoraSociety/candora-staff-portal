import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';

const AREAS_OF_INTEREST = [
  "Auntie Bev's Social Venture (Kitchen)",
  "Food Bank Depot",
  "Community Lunch",
  "Kitchen helper for Preschool",
  "Children's Programs (0-1 years)",
  "Children's Programs (1-3 years)",
  "Children's Programs (3-6 years)",
  "Family Programs support",
  "English Language Learning",
  "Digital Literacy",
  "Administrative Support",
  "Tax clinic - March and April (CRA Training)",
  "Handyperson/Maintenance Support",
  "Community Activities/Events",
  "Sewing Support",
];

const CLB_LEVELS = ['CLB 1-2', 'CLB 3-4', 'CLB 5-6', 'CLB 7-8', 'Not Applicable'];
const VOLUNTEER_TYPES = [
  { value: 'community', label: 'Community Volunteer' },
  { value: 'skilled', label: 'Skilled Volunteer' },
  { value: 'practicum', label: 'Practicum Student' },
  { value: 'corporate', label: 'Corporate Group' },
];

const HOW_HEARD = ['Social Media', 'Friend/Family', 'Community Event', 'Website', 'Flyer/Poster', 'School', 'Other'];

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '',
  birth_date: '', gender: '', volunteer_type: 'community',
  ell_level: '', school_name: '', company_name: '',
  address: '', city: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  programs: [], how_heard: '', skills: '', availability: '',
  pictures_consent: 'no', notes: '',
};

export default function PortalRegistration({ onComplete }) {
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const toggleArea = (area) => {
    setForm(p => ({
      ...p,
      programs: p.programs.includes(area)
        ? p.programs.filter(a => a !== area)
        : [...p.programs, area],
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const volunteer = await base44.entities.Volunteer.create({
        ...form,
        status: 'pending',
      });
      await base44.entities.VolunteerApproval.create({
        volunteer_id: volunteer.id,
        volunteer_name: `${form.first_name} ${form.last_name}`,
        request_type: 'new_registration',
        description: `New volunteer registration from portal. Areas of interest: ${form.programs.join(', ')}`,
        status: 'pending',
      });
      // Notify coordinator
      await base44.functions.invoke('notifyCoordinator', {
        type: 'new_registration',
        volunteerName: `${form.first_name} ${form.last_name}`,
        volunteerEmail: form.email,
        details: `Volunteer type: ${form.volunteer_type}. Areas: ${form.programs.join(', ')}`,
      });
    },
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold font-display">Application Submitted!</h2>
          <p className="text-muted-foreground text-sm">
            Thank you, {form.first_name}! Your volunteer application has been received. The Candora Society team will review it and be in touch shortly.
          </p>
          <Button
            className="bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold"
            onClick={onComplete}
          >
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl border-0">
      <CardHeader className="bg-[hsl(45,92%,53%)] rounded-t-lg py-4">
        <CardTitle className="text-[hsl(230,60%,12%)] text-xl font-display font-black flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Volunteer Registration — Page {page} of 2
        </CardTitle>
        <div className="flex gap-1 mt-2">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= page ? 'bg-[hsl(230,60%,20%)]' : 'bg-[hsl(45,60%,70%)]'}`} />
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {page === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name *</Label><Input value={form.first_name} onChange={e => update('first_name', e.target.value)} className="mt-1" /></div>
              <div><Label>Last Name *</Label><Input value={form.last_name} onChange={e => update('last_name', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} className="mt-1" /></div>
            <div><Label>Date of Birth</Label><Input type="date" value={form.birth_date} onChange={e => update('birth_date', e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={v => update('gender', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'].map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Volunteer Type *</Label>
              <Select value={form.volunteer_type} onValueChange={v => update('volunteer_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOLUNTEER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.volunteer_type === 'practicum' && (
              <div><Label>School Name</Label><Input value={form.school_name} onChange={e => update('school_name', e.target.value)} className="mt-1" /></div>
            )}
            {form.volunteer_type === 'corporate' && (
              <div><Label>Company / Organization Name</Label><Input value={form.company_name} onChange={e => update('company_name', e.target.value)} className="mt-1" /></div>
            )}
            <div>
              <Label>English Proficiency Level</Label>
              <Select value={form.ell_level} onValueChange={v => update('ell_level', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {CLB_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold gap-1"
              onClick={() => { if (!form.first_name || !form.last_name) return; setPage(2); }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {page === 2 && (
          <>
            <div><Label>Address</Label><Input value={form.address} onChange={e => update('address', e.target.value)} className="mt-1" /></div>
            <div><Label>City</Label><Input value={form.city} onChange={e => update('city', e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Emergency Contact Name</Label><Input value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} className="mt-1" /></div>
              <div><Label>Emergency Contact Phone</Label><Input value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} className="mt-1" /></div>
            </div>
            <div>
              <Label className="font-medium">Areas of Interest</Label>
              <div className="mt-2 space-y-2 border rounded-lg p-3">
                {AREAS_OF_INTEREST.map(area => (
                  <div key={area} className="flex items-start gap-2">
                    <Checkbox
                      id={area}
                      checked={form.programs.includes(area)}
                      onCheckedChange={() => toggleArea(area)}
                    />
                    <label htmlFor={area} className="text-sm cursor-pointer leading-tight">{area}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>How did you hear about us?</Label>
              <Select value={form.how_heard} onValueChange={v => update('how_heard', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {HOW_HEARD.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Skills & Experience</Label><Textarea value={form.skills} onChange={e => update('skills', e.target.value)} rows={2} className="mt-1" placeholder="Any relevant skills or experience..." /></div>
            <div><Label>Availability</Label><Input value={form.availability} onChange={e => update('availability', e.target.value)} className="mt-1" placeholder="e.g. Weekday mornings, Tuesdays..." /></div>
            <div>
              <Label>Photo Consent</Label>
              <Select value={form.pictures_consent} onValueChange={v => update('pictures_consent', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — I consent to photos being taken</SelectItem>
                  <SelectItem value="no">No — Please do not take my photo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 gap-1" onClick={() => setPage(1)}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                className="flex-1 bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}