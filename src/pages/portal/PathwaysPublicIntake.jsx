import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];

const RESIDENCY_OPTIONS = [
  { value: 'canadian_citizen', label: 'Canadian Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'protected_person', label: 'Protected Person' },
  { value: 'convention_refugee', label: 'Convention Refugee' },
  { value: 'refugee_claimant', label: 'Refugee Claimant' },
  { value: 'work_permit', label: 'Work Permit Holder' },
  { value: 'study_permit', label: 'Study Permit Holder' },
  { value: 'visitor', label: 'Visitor' },
  { value: 'other', label: 'Other' },
];

const LANGUAGE_OPTIONS = [
  { value: 'clb_4', label: 'Beginner — I am still learning English' },
  { value: 'clb_6', label: 'Intermediate — I can communicate in everyday situations' },
  { value: 'clb_8', label: 'Advanced — I am comfortable in most situations' },
  { value: 'native_english_french', label: 'Fluent / Native — English is my primary language' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'UE', label: 'Unemployed' },
  { value: 'UE-LFW', label: 'Unemployed — Laid off from work' },
  { value: 'E-PT', label: 'Employed part-time, seeking full-time' },
  { value: 'E-RF', label: 'Employed full-time' },
  { value: 'NA', label: 'Not currently seeking employment' },
];

const EDUCATION_TYPES = [
  'High School Diploma', 'GED', 'College Diploma', 'College Certificate',
  "Bachelor's Degree", "Master's Degree", 'Trade Certificate', 'Apprenticeship',
  'Professional Certification', 'ESL / LINC Training', 'Other',
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Seasonal', 'Self-employed'];

const EMPTY_EDU = () => ({ institution: '', education_type: '', field_of_study: '', start_date: '', end_date: '' });
const EMPTY_EMP = () => ({ company: '', job_title: '', employment_type: '', start_date: '', end_date: '', responsibilities: '' });

const SectionCard = ({ title, subtitle, children }) => (
  <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <h2 className="text-lg font-semibold text-slate-800 mb-1">{title}</h2>
    {subtitle && <p className="text-sm text-slate-500 mb-4">{subtitle}</p>}
    <div className={subtitle ? '' : 'mt-4'}>{children}</div>
  </section>
);

export default function PathwaysPublicIntake() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', sex: '',
    phone: '', email: '', address: '', city: '', state: 'AB', zip: '',
    residency_status: '', clb_level: '', employment_status: '',
    career_objectives: '', barrier_description: '', additional_notes: '',
    website: '',
  });
  const [education, setEducation] = useState([EMPTY_EDU()]);
  const [employment, setEmployment] = useState([EMPTY_EMP()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [consents, setConsents] = useState({
    eligibility: false,
    accurate: false,
    comply: false,
    counsellor_discretion: false,
  });
  const [officeUse, setOfficeUse] = useState({
    english_proficiency: false,
    translator_assistance: false,
    comments: '',
  });
  const [accessCode, setAccessCode] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const updateEdu = (idx, patch) => setEducation(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  const updateEmp = (idx, patch) => setEmployment(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Please provide your first and last name.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!Object.values(consents).every(Boolean)) {
      setError('Please review and check all acknowledgement boxes before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (accessCode !== '5011') {
      setError('Please enter the correct 4-digit access code provided by the Job Lab attendant.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const cleanedEdu = education.filter(e => e.institution || e.education_type || e.field_of_study);
      const cleanedEmp = employment.filter(e => e.company || e.job_title);
      await base44.functions.invoke('publicPathwaysIntake', {
        ...form,
        education_history: cleanedEdu.length ? JSON.stringify(cleanedEdu) : null,
        employment_history: cleanedEmp.length ? JSON.stringify(cleanedEmp) : null,
        office_english_proficiency: officeUse.english_proficiency,
        office_translator_assistance: officeUse.translator_assistance,
        office_comments: officeUse.comments?.trim() || null,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong. Please try again or call our office.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="px-6 py-4" style={{ background: 'hsl(231,64%,20%)' }}>
          <span style={{ fontFamily: "'Arial Black', 'Impact', sans-serif", fontSize: '20px' }}>
            <span style={{ fontWeight: 900, color: 'hsl(42,100%,54%)' }}>CANDORA</span>
            <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.85)', marginLeft: '6px' }}>Pathways</span>
          </span>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h1>
            <p className="text-slate-600 mb-1">
              Your registration has been received. A career counsellor from the Pathways program will contact you within 2–3 business days.
            </p>
            <p className="text-sm text-slate-400">If you have any questions in the meantime, please call our office.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 py-4" style={{ background: 'hsl(231,64%,20%)' }}>
        <div className="max-w-3xl mx-auto">
          <span style={{ fontFamily: "'Arial Black', 'Impact', sans-serif", fontSize: '20px' }}>
            <span style={{ fontWeight: 900, color: 'hsl(42,100%,54%)' }}>CANDORA</span>
            <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.85)', marginLeft: '6px' }}>Pathways</span>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pathways Program Registration</h1>
          <p className="text-slate-600">
            The Pathways program helps individuals connect with meaningful employment. Please fill out the form below and a career counsellor will reach out to you.
          </p>
          <p className="text-sm text-slate-400 mt-2">Fields marked with * are required.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot */}
          <input type="text" name="website" value={form.website} onChange={e => set('website', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />

          {/* Personal Information */}
          <SectionCard title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">First Name *</Label>
                <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
              </div>
              <div>
                <Label className="mb-1 block">Last Name *</Label>
                <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
              </div>
              <div>
                <Label className="mb-1 block">Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block">Gender</Label>
                <Select value={form.sex} onValueChange={v => set('sex', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Phone Number</Label>
                <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(780) 555-0000" />
              </div>
              <div>
                <Label className="mb-1 block">Email Address</Label>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block">Street Address</Label>
                <Input value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div>
                <Label className="mb-1 block">City</Label>
                <Input value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1 block">Province</Label>
                  <Select value={form.state} onValueChange={v => set('state', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block">Postal Code</Label>
                  <Input value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="T5J 0A1" />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Citizenship & Language */}
          <SectionCard title="Citizenship & Residency Status">
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">What is your current status in Canada?</Label>
                <Select value={form.residency_status} onValueChange={v => set('residency_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select your status" /></SelectTrigger>
                  <SelectContent>
                    {RESIDENCY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">English Language Proficiency</Label>
                <Select value={form.clb_level} onValueChange={v => set('clb_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Education History */}
          <SectionCard title="Education History" subtitle="List your education, starting with the most recent.">
            {education.map((edu, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-4 mb-3 relative">
                {education.length > 1 && (
                  <button type="button" onClick={() => setEducation(prev => prev.filter((_, i) => i !== idx))} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="mb-1 block text-xs">Institution / School</Label>
                    <Input value={edu.institution} onChange={e => updateEdu(idx, { institution: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Credential Type</Label>
                    <Select value={edu.education_type} onValueChange={v => updateEdu(idx, { education_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {EDUCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Field of Study</Label>
                    <Input value={edu.field_of_study} onChange={e => updateEdu(idx, { field_of_study: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Start Date</Label>
                    <Input type="date" value={edu.start_date} onChange={e => updateEdu(idx, { start_date: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">End Date</Label>
                    <Input type="date" value={edu.end_date} onChange={e => updateEdu(idx, { end_date: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setEducation(prev => [...prev, EMPTY_EDU()])} className="gap-1.5">
              <PlusCircle className="w-4 h-4" /> Add Education
            </Button>
          </SectionCard>

          {/* Employment History */}
          <SectionCard title="Employment History" subtitle="List your work experience, starting with the most recent.">
            {employment.map((emp, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-4 mb-3 relative">
                {employment.length > 1 && (
                  <button type="button" onClick={() => setEmployment(prev => prev.filter((_, i) => i !== idx))} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-xs">Company / Employer</Label>
                    <Input value={emp.company} onChange={e => updateEmp(idx, { company: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Job Title</Label>
                    <Input value={emp.job_title} onChange={e => updateEmp(idx, { job_title: e.target.value })} />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Employment Type</Label>
                    <Select value={emp.employment_type} onValueChange={v => updateEmp(idx, { employment_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 block text-xs">Start Date</Label>
                      <Input type="date" value={emp.start_date} onChange={e => updateEmp(idx, { start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="mb-1 block text-xs">End Date</Label>
                      <Input type="date" value={emp.end_date} onChange={e => updateEmp(idx, { end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="mb-1 block text-xs">Key Responsibilities</Label>
                    <Textarea value={emp.responsibilities} onChange={e => updateEmp(idx, { responsibilities: e.target.value })} rows={2} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setEmployment(prev => [...prev, EMPTY_EMP()])} className="gap-1.5">
              <PlusCircle className="w-4 h-4" /> Add Employment
            </Button>
          </SectionCard>

          {/* Current Situation */}
          <SectionCard title="Current Situation">
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">Current Employment Status</Label>
                <Select value={form.employment_status} onValueChange={v => set('employment_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Career Goals & Objectives</Label>
                <Textarea value={form.career_objectives} onChange={e => set('career_objectives', e.target.value)} rows={3} placeholder="What kind of work are you looking for? What are your career goals?" />
              </div>
            </div>
          </SectionCard>

          {/* Additional Information — subtle barrier self-identification */}
          <SectionCard title="Additional Information">
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">
                  Are there any circumstances in your life that may make it difficult to find or retain employment?
                </Label>
                <p className="text-xs text-slate-400 mb-2">
                  This information helps us connect you with the right supports. Share as much or as little as you're comfortable with.
                </p>
                <Textarea value={form.barrier_description} onChange={e => set('barrier_description', e.target.value)} rows={4} placeholder="Optional — describe in your own words" />
              </div>
              <div>
                <Label className="mb-1 block">Is there anything else you'd like us to know?</Label>
                <Textarea value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} rows={3} placeholder="Optional" />
              </div>
            </div>
          </SectionCard>

          {/* Acknowledgements */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Acknowledgements</h2>
            <div className="space-y-4">
              {[
                { key: 'eligibility', text: 'I understand that following submission of this form I will be assessed for eligibility for participation in the program. Submission of this form does not guarantee acceptance into the Pathways program.' },
                { key: 'accurate', text: 'I acknowledge that everything in this form is accurate and true to the best of my knowledge.' },
                { key: 'comply', text: 'I understand that if accepted into the Pathways program, I must comply with the expectations of the program and my personal Action Plan, which will be reviewed with a Candora Career Counsellor and mutually agreed upon if accepted into the program. Failure to comply may result in removal from the Pathways Program.' },
                { key: 'counsellor_discretion', text: 'I understand that, if accepted into the program, the Career Counsellor will evaluate progress and program suitability. It is at the Career Counsellor\u2019s discretion at any time to determine if continuation in the program is appropriate. A Career Counsellor may determine that the Pathways program is not (or is no longer) a suitable option for a variety of reasons, including changes in life circumstances for the participant, participant challenges that make employability unfeasible, etc. This is not an exhaustive list. In the case that the Career Counsellor discontinues the program, they will attempt to work with participants to make referrals to appropriate program and service options.' },
              ].map(item => (
                <div key={item.key} className="flex items-start gap-3">
                  <Checkbox
                    checked={consents[item.key]}
                    onCheckedChange={v => setConsents(prev => ({ ...prev, [item.key]: v }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Ribbon */}
          <div className="rounded-lg px-6 py-4 text-center" style={{ background: 'hsl(45,92%,53%)' }}>
            <p className="font-semibold text-slate-800">
              Form Complete. Please advise the Job Lab attendant to review and complete your submission.
            </p>
          </div>

          {/* For Office Use Only */}
          <section className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-1">For Office Use Only</h2>
            <p className="text-xs text-slate-400 mb-4">To be completed by Job Lab attendant.</p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={officeUse.english_proficiency}
                  onCheckedChange={v => setOfficeUse(prev => ({ ...prev, english_proficiency: v }))}
                  className="mt-0.5"
                />
                <span className="text-sm text-slate-600">English Proficiency</span>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={officeUse.translator_assistance}
                  onCheckedChange={v => setOfficeUse(prev => ({ ...prev, translator_assistance: v }))}
                  className="mt-0.5"
                />
                <span className="text-sm text-slate-600">Required a translator or other significant assistance to complete form</span>
              </div>
              <div>
                <Label className="mb-1 block text-sm">Comments</Label>
                <Textarea
                  value={officeUse.comments}
                  onChange={e => setOfficeUse(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                  placeholder="Office comments (optional)"
                />
              </div>
            </div>
          </section>

          {/* Access Code + Submit */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-end">
            <div>
              <Label className="mb-1 block text-sm">Access Code</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit code"
                className="w-32"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !Object.values(consents).every(Boolean) || accessCode !== '5011'}
              size="lg"
              style={{ background: 'hsl(231,64%,20%)', color: 'hsl(45,92%,53%)' }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Your information is kept confidential and used only for program registration purposes.
        </p>
      </main>
    </div>
  );
}