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
import { CheckCircle, Users, Building2, Heart } from 'lucide-react';
import PhoneInput from './PhoneInput';
import AvailabilitySelector from './AvailabilitySelector';

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

const ORGANIZATION_TYPES = [
  { value: 'corporation', label: 'Corporation / Business' },
  { value: 'church', label: 'Church / Faith Group' },
  { value: 'faculty', label: 'School / University Faculty' },
  { value: 'service_agency', label: 'Service Agency' },
  { value: 'community_group', label: 'Community Group' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  organization_name: '',
  organization_type: 'corporation',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  number_of_volunteers: 5,
  preferred_start_date: '',
  availability: '',
  areas_of_interest: [],
  skills_or_focus: '',
  motivation: '',
  include_donation: false,
  donation_amount: 100,
  donation_message: '',
};

export default function PortalCohortRegistration({ onComplete }) {
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  const handleComplete = () => {
    setSubmitted(false);
    setForm(emptyForm);
    if (onComplete) onComplete();
  };

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const toggleArea = (area) => {
    setForm(p => ({
      ...p,
      areas_of_interest: p.areas_of_interest.includes(area)
        ? p.areas_of_interest.filter(a => a !== area)
        : [...p.areas_of_interest, area],
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const cohortRequest = await base44.entities.VolunteerCohortRequest.create({
        ...form,
        status: 'pending',
      });
      
      // Create a volunteer approval record for tracking
      await base44.entities.VolunteerApproval.create({
        volunteer_id: null,
        volunteer_name: form.organization_name,
        request_type: 'cohort_registration',
        cohort_request_id: cohortRequest.id,
        description: `Cohort volunteer request from ${form.organization_name} (${form.organization_type}). Expected volunteers: ${form.number_of_volunteers}. Areas: ${form.areas_of_interest.join(', ')}`,
        status: 'pending',
      });

      // Notify coordinator
      await base44.functions.invoke('notifyCoordinator', {
        type: 'cohort_registration',
        organizationName: form.organization_name,
        contactName: form.contact_name,
        contactEmail: form.contact_email,
        details: `Organization type: ${form.organization_type}. Volunteers: ${form.number_of_volunteers}. Areas: ${form.areas_of_interest.join(', ')}`,
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
          <h2 className="text-xl font-bold font-display">Cohort Request Submitted!</h2>
          <p className="text-muted-foreground text-sm">
            Thank you for your interest in volunteering as a group! Our team will review your request and contact you within 5-7 business days to discuss opportunities.
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
    <Card className="w-full max-w-2xl shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-lg py-4">
        <CardTitle className="text-foreground text-xl font-display font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Group / Cohort Volunteer Registration
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Register your organization, church, school group, or community team
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Organization Name *</Label>
            <Input 
              value={form.organization_name} 
              onChange={e => update('organization_name', e.target.value)} 
              className="mt-1" 
              placeholder="e.g. ABC Corporation, St. Mary's Church"
            />
          </div>
          <div>
            <Label>Organization Type *</Label>
            <Select value={form.organization_type} onValueChange={v => update('organization_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORGANIZATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Contact Person Name *</Label>
            <Input 
              value={form.contact_name} 
              onChange={e => update('contact_name', e.target.value)} 
              className="mt-1" 
            />
          </div>
          <div>
            <Label>Contact Email *</Label>
            <Input 
              type="email"
              value={form.contact_email} 
              onChange={e => update('contact_email', e.target.value)} 
              className="mt-1" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Contact Phone</Label>
            <PhoneInput 
              value={form.contact_phone} 
              onChange={v => update('contact_phone', v)} 
              className="mt-1" 
            />
          </div>
          <div>
            <Label>Number of Volunteers *</Label>
            <Input 
              type="number"
              value={form.number_of_volunteers} 
              onChange={e => update('number_of_volunteers', parseInt(e.target.value) || 0)} 
              className="mt-1" 
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Preferred Start Date</Label>
            <Input 
              type="date"
              value={form.preferred_start_date} 
              onChange={e => update('preferred_start_date', e.target.value)} 
              className="mt-1" 
            />
          </div>
        </div>

        <div>
          <Label>General Availability</Label>
          <Card className="mt-1 border">
            <CardContent className="p-3">
              <AvailabilitySelector
                value={{ weekly_schedule: form.availability_schedule, blocked_dates: form.blocked_dates }}
                onChange={(data) => {
                  update('availability_schedule', data.weekly_schedule);
                  update('blocked_dates', data.blocked_dates);
                }}
                showBlockedDates={false}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Label className="font-medium">Areas of Interest</Label>
          <div className="mt-2 space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
            {AREAS_OF_INTEREST.map(area => (
              <div key={area} className="flex items-start gap-2">
                <Checkbox
                  id={area}
                  checked={form.areas_of_interest.includes(area)}
                  onCheckedChange={() => toggleArea(area)}
                />
                <label htmlFor={area} className="text-sm cursor-pointer leading-tight">{area}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Group Skills or Focus Areas</Label>
          <Textarea 
            value={form.skills_or_focus} 
            onChange={e => update('skills_or_focus', e.target.value)} 
            rows={2} 
            className="mt-1" 
            placeholder="What special skills or focus does your group bring?"
          />
        </div>

        <div>
          <Label>Why does your organization want to volunteer?</Label>
          <Textarea 
            value={form.motivation} 
            onChange={e => update('motivation', e.target.value)} 
            rows={3} 
            className="mt-1" 
            placeholder="Tell us about your organization's motivation for volunteering..."
          />
        </div>

        <div className="border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-start gap-3 mb-3">
            <Heart className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <Label className="text-base font-semibold">Would you like to include a donation with your volunteer registration?</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Your donation helps support our programs and community impact.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include_donation"
                checked={form.include_donation}
                onChange={e => update('include_donation', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="include_donation" className="text-sm font-medium cursor-pointer">
                Yes, we'd like to make a donation
              </label>
            </div>

            {form.include_donation && (
              <>
                <div>
                  <Label>Donation Amount</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {[100, 250, 500, 1000].map(amount => (
                      <Button
                        key={amount}
                        type="button"
                        variant={form.donation_amount === amount ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => update('donation_amount', amount)}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-xs text-muted-foreground">Other amount:</Label>
                    <Input
                      type="number"
                      value={form.donation_amount}
                      onChange={e => update('donation_amount', parseInt(e.target.value) || 0)}
                      className="w-24"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Dedication Message (Optional)</Label>
                  <Textarea 
                    value={form.donation_message} 
                    onChange={e => update('donation_message', e.target.value)} 
                    rows={2} 
                    className="mt-1" 
                    placeholder="e.g., 'In honor of...' or 'To support...'"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !form.organization_name || !form.contact_name || !form.contact_email || !form.number_of_volunteers}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Cohort Request'}
        </Button>
      </CardContent>
    </Card>
  );
}