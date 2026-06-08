import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, GraduationCap, ChevronLeft, X } from 'lucide-react';

const INSTITUTIONS = [
  'MacEwan University',
  'NorQuest College',
  'University of Alberta',
  'NAIT',
  'University of Calgary',
  'SAIT',
  'Bow Valley College',
  'Other',
];

export default function PortalPracticumRegistration({ onComplete }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    student_name: '',
    student_email: '',
    student_phone: '',
    institution: '',
    institution_other: '',
    faculty: '',
    program: '',
    year_of_study: '',
    practicum_start_date: '',
    practicum_end_date: '',
    total_hours_required: '',
    coordinator_name: '',
    coordinator_email: '',
    coordinator_phone: '',
    placement_preferences: '',
    learning_goals: '',
    additional_requirements: '',
    vulnerable_sector_check: false,
  });

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const submitMutation = useMutation({
    mutationFn: async () => {
      const institutionName = form.institution === 'Other' ? form.institution_other : form.institution;
      
      // Create practicum cohort request
      const cohortRequest = await base44.entities.VolunteerCohortRequest.create({
        organization_name: institutionName,
        organization_type: 'faculty',
        contact_name: form.student_name,
        contact_email: form.student_email,
        contact_phone: form.student_phone,
        number_of_volunteers: 1,
        preferred_start_date: form.practicum_start_date,
        availability: `${form.practicum_start_date} to ${form.practicum_end_date}, ${form.total_hours_required} hours required`,
        areas_of_interest: [form.placement_preferences],
        skills_or_focus: form.learning_goals,
        motivation: `Practicum placement for ${form.program} program at ${institutionName}`,
        status: 'pending',
        notes: `Faculty: ${form.faculty} | Program: ${form.program} | Year: ${form.year_of_study} | Coordinator: ${form.coordinator_name} (${form.coordinator_email}, ${form.coordinator_phone}) | Additional requirements: ${form.additional_requirements}`,
        institution_name: institutionName,
        faculty: form.faculty,
        program: form.program,
        year_of_study: form.year_of_study,
        practicum_start_date: form.practicum_start_date,
        practicum_end_date: form.practicum_end_date,
        total_hours_required: form.total_hours_required,
        coordinator_name: form.coordinator_name,
        coordinator_email: form.coordinator_email,
        coordinator_phone: form.coordinator_phone,
        placement_preferences: form.placement_preferences,
        learning_goals: form.learning_goals,
        additional_requirements: form.additional_requirements,
        vulnerable_sector_check: form.vulnerable_sector_check,
        student_phone: form.student_phone,
      });

      // Create approval record for practicum
      await base44.entities.VolunteerApproval.create({
        volunteer_id: cohortRequest.id,
        volunteer_name: form.student_name,
        volunteer_email: form.student_email,
        request_type: 'practicum_placement',
        description: `Practicum placement request from ${institutionName} (${form.faculty}, ${form.program}). Duration: ${form.total_hours_required} hours from ${form.practicum_start_date} to ${form.practicum_end_date}. Year of study: ${form.year_of_study}. Coordinator: ${form.coordinator_name}`,
        status: 'pending',
        institution_name: institutionName,
        faculty: form.faculty,
        program: form.program,
        year_of_study: form.year_of_study,
        practicum_start_date: form.practicum_start_date,
        practicum_end_date: form.practicum_end_date,
        total_hours_required: form.total_hours_required,
        coordinator_name: form.coordinator_name,
        coordinator_email: form.coordinator_email,
        coordinator_phone: form.coordinator_phone,
        placement_preferences: form.placement_preferences,
        learning_goals: form.learning_goals,
        additional_requirements: form.additional_requirements,
        vulnerable_sector_check: form.vulnerable_sector_check,
        student_phone: form.student_phone,
      });

      // Notify coordinator
      await base44.functions.invoke('notifyCoordinator', {
        type: 'practicum_request',
        volunteerName: form.student_name,
        volunteerEmail: form.student_email,
        details: `Practicum placement request from ${institutionName} (${form.faculty}, ${form.program}, Year ${form.year_of_study}). Duration: ${form.total_hours_required} hours from ${form.practicum_start_date} to ${form.practicum_end_date}. Coordinator: ${form.coordinator_name}`,
      });
    },
    onSuccess: () => setSubmitted(true),
  });

  const handleComplete = () => {
    setSubmitted(false);
    setForm({
      student_name: '',
      student_email: '',
      student_phone: '',
      institution: '',
      institution_other: '',
      faculty: '',
      program: '',
      year_of_study: '',
      practicum_start_date: '',
      practicum_end_date: '',
      total_hours_required: '',
      coordinator_name: '',
      coordinator_email: '',
      coordinator_phone: '',
      placement_preferences: '',
      learning_goals: '',
      additional_requirements: '',
    });
    if (onComplete) onComplete();
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold font-display">Practicum Request Submitted!</h2>
          <p className="text-muted-foreground text-sm">
            Thank you, {form.student_name}! Your practicum placement request has been received. Our team will review it within 5-7 business days.
          </p>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={handleComplete}
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-xl font-display font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Practicum Placement Request
          </CardTitle>
          <button onClick={onComplete} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div>
          <Label>Student Name *</Label>
          <Input value={form.student_name} onChange={e => update('student_name', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Student Email *</Label>
          <Input type="email" value={form.student_email} onChange={e => update('student_email', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Student Phone</Label>
          <Input type="tel" value={form.student_phone} onChange={e => update('student_phone', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Institution *</Label>
          <select
            value={form.institution}
            onChange={e => update('institution', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          >
            <option value="">Select institution...</option>
            {INSTITUTIONS.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>
        {form.institution === 'Other' && (
          <div>
            <Label>Other Institution Name *</Label>
            <Input value={form.institution_other} onChange={e => update('institution_other', e.target.value)} className="mt-1" />
          </div>
        )}
        <div>
          <Label>Faculty / Department *</Label>
          <Input value={form.faculty} onChange={e => update('faculty', e.target.value)} className="mt-1" placeholder="e.g., Faculty of Nursing, School of Business" />
        </div>
        <div>
          <Label>Program / Course *</Label>
          <Input value={form.program} onChange={e => update('program', e.target.value)} className="mt-1" placeholder="e.g., Bachelor of Nursing, Social Work" />
        </div>
        <div>
          <Label>Year of Study *</Label>
          <select
            value={form.year_of_study}
            onChange={e => update('year_of_study', e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          >
            <option value="">Select year...</option>
            <option value="Year 1">Year 1</option>
            <option value="Year 2">Year 2</option>
            <option value="Year 3">Year 3</option>
            <option value="Year 4">Year 4</option>
            <option value="Year 5+">Year 5+</option>
            <option value="Graduate Student">Graduate Student</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Practicum Start Date *</Label>
            <Input type="date" value={form.practicum_start_date} onChange={e => update('practicum_start_date', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Practicum End Date *</Label>
            <Input type="date" value={form.practicum_end_date} onChange={e => update('practicum_end_date', e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Total Hours Required *</Label>
          <Input 
            type="number" 
            value={form.total_hours_required} 
            onChange={e => update('total_hours_required', e.target.value)} 
            className="mt-1" 
            placeholder="e.g., 120"
          />
        </div>
        <div>
          <Label>Practicum Coordinator Name *</Label>
          <Input value={form.coordinator_name} onChange={e => update('coordinator_name', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Practicum Coordinator Email *</Label>
          <Input type="email" value={form.coordinator_email} onChange={e => update('coordinator_email', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Practicum Coordinator Phone</Label>
          <Input type="tel" value={form.coordinator_phone} onChange={e => update('coordinator_phone', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Placement Area Preferences</Label>
          <Textarea 
            value={form.placement_preferences} 
            onChange={e => update('placement_preferences', e.target.value)} 
            rows={2} 
            className="mt-1" 
            placeholder="e.g., Food Bank, Community Programs, Administrative Support"
          />
        </div>
        <div>
          <Label>Learning Goals</Label>
          <Textarea 
            value={form.learning_goals} 
            onChange={e => update('learning_goals', e.target.value)} 
            rows={3} 
            className="mt-1" 
            placeholder="What do you hope to learn from this practicum experience?"
          />
        </div>
        <div>
          <Label>Additional Requirements or Accommodations</Label>
          <Textarea 
            value={form.additional_requirements} 
            onChange={e => update('additional_requirements', e.target.value)} 
            rows={2} 
            className="mt-1" 
            placeholder="Any special requirements, certifications, or accommodations needed"
          />
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <Checkbox
              id="vulnerable_sector_check_practicum"
              checked={form.vulnerable_sector_check}
              onCheckedChange={(checked) => update('vulnerable_sector_check', checked)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <label htmlFor="vulnerable_sector_check_practicum" className="text-sm font-medium cursor-pointer">
                Vulnerable Sector Check Consent
              </label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By checking this box, I consent to undergoing a Vulnerable Sector Check as part of my practicum placement requirements. I understand this may be required before starting my placement.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 gap-1" onClick={onComplete}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !form.student_name || !form.student_email || !form.institution || !form.faculty || !form.program || !form.year_of_study || !form.practicum_start_date || !form.practicum_end_date || !form.total_hours_required || !form.coordinator_name || !form.coordinator_email}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}