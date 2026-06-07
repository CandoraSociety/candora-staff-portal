import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, ClipboardList } from 'lucide-react';
import moment from 'moment';

const PRESET_POSITIONS = [
  'Tutor/ESL', 'Driver', 'Admin Support', 'Greeter', 'Event Helper',
  'Food Bank', 'Childcare', 'Interpreter', 'Mentor', 'Fundraising', 'Outreach', 'Other'
];

const ENGLISH_LEVELS = ['Level 1', 'Level 2', 'Intermediate', 'Advanced', 'Not Required'];

export default function StaffVolunteerRequestForm() {
  const [form, setForm] = useState({
    submission_date: moment().format('YYYY-MM-DD'),
    requester_name: '',
    requester_email: '',
    requester_department: '',
    program: '',
    position_title: '',
    position_custom: '',
    volunteers_needed: 1,
    location: '',
    when_needed: '',
    duration: '',
    duties: '',
    personal_qualities: '',
    english_level: 'Not Required',
    criminal_record_check: false,
    intervention_record_check: false,
    additional_notes: '',
    status: 'pending',
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const submitMutation = useMutation({
    mutationFn: () => {
      const positionTitle = form.position_title === 'Other' ? form.position_custom : form.position_title;
      return base44.entities.StaffVolunteerRequest.create({
        ...form,
        position_title: positionTitle,
        position_custom: undefined,
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
          <h2 className="text-xl font-bold font-display">Request Submitted!</h2>
          <p className="text-muted-foreground text-sm">
            Your volunteer request has been submitted to the Volunteer Coordinator. You will be contacted once volunteers have been matched.
          </p>
          <Button
            className="bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold"
            onClick={() => setSubmitted(false)}
          >
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl border-0">
      <CardHeader className="bg-[hsl(45,92%,53%)] rounded-t-lg py-4">
        <CardTitle className="text-[hsl(230,60%,12%)] text-xl font-display font-black flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Staff Volunteer Request Form
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Today's Date</Label><Input type="date" value={form.submission_date} onChange={e => update('submission_date', e.target.value)} className="mt-1" /></div>
          <div><Label>Your Name *</Label><Input value={form.requester_name} onChange={e => update('requester_name', e.target.value)} className="mt-1" required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Your Email</Label><Input type="email" value={form.requester_email} onChange={e => update('requester_email', e.target.value)} className="mt-1" /></div>
          <div><Label>Your Department</Label><Input value={form.requester_department} onChange={e => update('requester_department', e.target.value)} className="mt-1" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Program</Label><Input value={form.program} onChange={e => update('program', e.target.value)} className="mt-1" placeholder="e.g. Community Lunch" /></div>
          <div><Label>Number of Volunteers Needed *</Label><Input type="number" min={1} value={form.volunteers_needed} onChange={e => update('volunteers_needed', Number(e.target.value))} className="mt-1" /></div>
        </div>
        <div>
          <Label>Position Title *</Label>
          <Select value={form.position_title} onValueChange={v => update('position_title', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select a position..." /></SelectTrigger>
            <SelectContent>
              {PRESET_POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.position_title === 'Other' && (
            <Input placeholder="Describe the position..." value={form.position_custom} onChange={e => update('position_custom', e.target.value)} className="mt-2" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Location</Label><Input value={form.location} onChange={e => update('location', e.target.value)} className="mt-1" /></div>
          <div><Label>When Needed</Label><Input value={form.when_needed} onChange={e => update('when_needed', e.target.value)} className="mt-1" placeholder="e.g. Tuesday mornings" /></div>
        </div>
        <div><Label>Duration</Label><Input value={form.duration} onChange={e => update('duration', e.target.value)} className="mt-1" placeholder="e.g. 3 hours/week, ongoing" /></div>
        <div><Label>Specific Duties</Label><Textarea value={form.duties} onChange={e => update('duties', e.target.value)} rows={3} className="mt-1" /></div>
        <div><Label>Personal Qualities Sought</Label><Textarea value={form.personal_qualities} onChange={e => update('personal_qualities', e.target.value)} rows={2} className="mt-1" /></div>
        <div>
          <Label>English Level Required</Label>
          <Select value={form.english_level} onValueChange={v => update('english_level', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENGLISH_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 border rounded-lg p-3">
            <input type="checkbox" id="crc" checked={form.criminal_record_check} onChange={e => update('criminal_record_check', e.target.checked)} className="w-4 h-4" />
            <label htmlFor="crc" className="text-sm font-medium cursor-pointer">Criminal Record Check Required</label>
          </div>
          <div className="flex items-center gap-2 border rounded-lg p-3">
            <input type="checkbox" id="irc" checked={form.intervention_record_check} onChange={e => update('intervention_record_check', e.target.checked)} className="w-4 h-4" />
            <label htmlFor="irc" className="text-sm font-medium cursor-pointer">Intervention Record Check Required</label>
          </div>
        </div>
        <div><Label>Additional Notes</Label><Textarea value={form.additional_notes} onChange={e => update('additional_notes', e.target.value)} rows={2} className="mt-1" /></div>
        <Button
          className="w-full bg-[hsl(45,92%,53%)] text-[hsl(230,60%,12%)] hover:bg-[hsl(45,92%,45%)] font-semibold"
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !form.requester_name || !form.position_title}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
        </Button>
      </CardContent>
    </Card>
  );
}