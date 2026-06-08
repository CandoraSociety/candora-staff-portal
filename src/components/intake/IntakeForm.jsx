import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Upload, X, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', full_name: 'Priscilla' },
  { email: 'lola@candorasociety.com', full_name: 'Lola' },
  { email: 'john@candorasociety.com', full_name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', full_name: 'Dawn' },
  { email: 'olena@candorasociety.com', full_name: 'Olena' },
];

const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'];

const CAREER_PRESETS = [
  'Administrative / Clerical', 'Agriculture / Farming', 'Automotive / Trades',
  'Childcare / Early Education', 'Construction / Labourer', 'Customer Service / Retail',
  'Driving / Transportation', 'Food Service / Hospitality', 'Healthcare / Personal Support',
  'Housekeeping / Cleaning', 'IT / Technology', 'Landscaping / Grounds',
  'Manufacturing / Warehouse', 'Oil & Gas / Energy', 'Security / Safety',
  'Social Services / Nonprofit', 'Skilled Trades / Apprenticeship', 'Teaching / Tutoring',
];

const INDUSTRIES = [
  'Agriculture', 'Automotive', 'Construction', 'Education', 'Finance',
  'Food Service / Hospitality', 'Healthcare', 'IT / Technology', 'Landscaping',
  'Manufacturing', 'Oil / Gas', 'Retail / Customer Service', 'Security',
  'Social Services', 'Transportation', 'Trades', 'Childcare', 'Cleaning / Janitorial',
  'Administrative', 'Other',
];

const JOB_TITLES = [
  'Administrative Assistant', 'Cashier', 'Childcare Worker', 'Cleaner / Janitor',
  'Cook / Kitchen Helper', 'Customer Service Representative', 'Data Entry Clerk',
  'Delivery Driver', 'Dishwasher', 'Electrician', 'Farm Worker', 'Food Service Worker',
  'Forklift Operator', 'General Labourer', 'Groundskeeper / Landscaper', 'Healthcare Aide',
  'Home Support Worker', 'Housekeeper', 'IT Technician', 'Inventory Clerk',
  'Mechanic', 'Nanny / Babysitter', 'Office Administrator', 'Painter',
  'Personal Support Worker', 'Plumber', 'Receptionist', 'Retail Associate',
  'Security Guard', 'Server / Waiter', 'Social Worker', 'Teacher / Tutor',
  'Truck Driver', 'Warehouse Worker', 'Welder', 'Carpenter', 'Electrician Apprentice',
  'Pipefitter', 'Millwright', 'Other',
];

const EDUCATION_TYPES = [
  'High School Diploma', 'GED / Adult Learning Certificate',
  'College Diploma', 'College Certificate', "Bachelor's Degree", "Master's Degree", 'Doctorate',
  'Trade Certificate', 'Apprenticeship', 'Professional Certification',
  'ESL / LINC Training', 'Workshop', 'Short Course', 'On-the-Job Training',
];

const validate = (data) => {
  const errs = {};
  if (!data.first_name?.trim()) errs.first_name = 'First name is required.';
  if (!data.last_name?.trim()) errs.last_name = 'Last name is required.';
  if (data.phone) {
    const digits = data.phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) errs.phone = 'Phone must be 10 digits (or 11 with country code).';
  }
  if (data.zip) {
    const postal = data.zip.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postal)) errs.zip = 'Postal code must be in format A1A 1A1.';
  }
  if (data.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Enter a valid email address.';
  }
  return errs;
};

const EMPTY_EMPLOYMENT = () => ({ company: '', industry: '', job_title: '', job_title_other: '', employment_type: '', start_date: '', end_date: '', responsibilities: '' });
const EMPTY_EDUCATION = () => ({ institution: '', education_type: '', field_of_study: '', start_date: '', end_date: '', description: '' });

export default function IntakeForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    first_name: client?.first_name || '',
    last_name: client?.last_name || '',
    date_of_birth: client?.date_of_birth || '',
    sex: client?.sex || '',
    phone: client?.phone || '',
    email: client?.email || '',
    compass_hsid: client?.compass_hsid || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || 'AB',
    zip: client?.zip || '',
    referral_source: client?.referral_source || '',
    service_type: client?.service_type || '',
    assigned_worker: client?.assigned_worker || '',
    assigned_worker_name: client?.assigned_worker_name || '',
    status: client?.status || 'new',
    residency_status: client?.residency_status || '',
    clb_level: client?.clb_level || '',
    employment_status: client?.employment_status || '',
    has_vehicle: client?.has_vehicle || '',
    career_objectives: client?.career_objectives || '',
    intake_notes: client?.intake_notes || '',
    resume_urls: client?.resume_urls || [],
  });

  const [employmentEntries, setEmploymentEntries] = useState(() => {
    try { return JSON.parse(client?.employment_history || '[]'); } catch { return []; }
  });
  const [educationEntries, setEducationEntries] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleWorkerSelect = (email) => {
    const w = WORKERS.find(w => w.email === email);
    set('assigned_worker', email);
    set('assigned_worker_name', w?.full_name || '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const empHistoryStr = JSON.stringify(employmentEntries);
    onSave({ ...form, employment_history: empHistoryStr });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('resume_urls', [...form.resume_urls, file_url]);
    }
    setUploading(false);
  };

  const removeResume = (idx) => {
    set('resume_urls', form.resume_urls.filter((_, i) => i !== idx));
  };

  const appendCareerPreset = (preset) => {
    set('career_objectives', form.career_objectives ? `${form.career_objectives}\n${preset}` : preset);
  };

  const Field = ({ label, error, children }) => (
    <div>
      <Label className="text-sm font-medium text-slate-700 mb-1 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  const updateEmp = (idx, patch) => setEmploymentEntries(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
  const updateEdu = (idx, patch) => setEducationEntries(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold text-slate-800">
          {client ? 'Edit Client' : 'New Client Intake'}
        </h2>
      </div>

      {/* Demographics */}
      <Card>
        <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First Name *" error={errors.first_name}>
            <Input className={errors.first_name ? 'border-red-400' : ''} value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          </Field>
          <Field label="Last Name *" error={errors.last_name}>
            <Input className={errors.last_name ? 'border-red-400' : ''} value={form.last_name} onChange={e => set('last_name', e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
          </Field>
          <Field label="Sex">
            <Select value={form.sex} onValueChange={v => set('sex', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input className={errors.phone ? 'border-red-400' : ''} value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input className={errors.email ? 'border-red-400' : ''} value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
          <Field label="Compass HSID#">
            <Input placeholder="Government of Alberta HSID number" value={form.compass_hsid} onChange={e => set('compass_hsid', e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={e => set('city', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Province">
              <Select value={form.state} onValueChange={v => set('state', v)}>
                <SelectTrigger><SelectValue placeholder="Province" /></SelectTrigger>
                <SelectContent>
                  {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Postal Code" error={errors.zip}>
              <Input className={errors.zip ? 'border-red-400' : ''} placeholder="A1A 1A1" maxLength={7} value={form.zip} onChange={e => set('zip', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Case & Service Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Case &amp; Service Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Referral Source">
            <Select value={form.referral_source} onValueChange={v => set('referral_source', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="family_friend">Family / Friend</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="employer">Employer</SelectItem>
                <SelectItem value="external_agency">External Agency</SelectItem>
                <SelectItem value="alberta_works">Alberta Works</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Service Element (Stream)">
            <Select value={form.service_type} onValueChange={v => set('service_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="direct_to_employment">Direct to Employment (DEA)</SelectItem>
                <SelectItem value="pathways">Pathways</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="internal_referral">Internal Referral</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assign to Worker">
            <Select value={form.assigned_worker} onValueChange={handleWorkerSelect}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>
                {WORKERS.map(w => (
                  <SelectItem key={w.email} value={w.email}>
                    {w.full_name} ({w.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Residency Status">
            <Select value={form.residency_status} onValueChange={v => set('residency_status', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="canadian_citizen">Canadian Citizen</SelectItem>
                <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                <SelectItem value="protected_person">Protected Person</SelectItem>
                <SelectItem value="convention_refugee">Convention Refugee</SelectItem>
                <SelectItem value="refugee_claimant">Refugee Claimant / Asylum Seeker</SelectItem>
                <SelectItem value="temporary_resident">Temporary Resident</SelectItem>
                <SelectItem value="work_permit">Work Permit Holder</SelectItem>
                <SelectItem value="study_permit">Study Permit Holder</SelectItem>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="CLB Level">
            <Select value={form.clb_level} onValueChange={v => set('clb_level', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={`clb_${i + 1}`}>CLB {i + 1}</SelectItem>
                ))}
                <SelectItem value="native_english_french">Native English / French Speaker</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Employment Status">
            <Select value={form.employment_status} onValueChange={v => set('employment_status', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="E-RF">Employed - Related Field</SelectItem>
                <SelectItem value="E-UF">Employed - Unrelated Field</SelectItem>
                <SelectItem value="E-PT">Employed - Part Time</SelectItem>
                <SelectItem value="UE">Unemployed</SelectItem>
                <SelectItem value="UE-LA">Unemployed - Laid Off</SelectItem>
                <SelectItem value="UE-S">Unemployed - Seasonal</SelectItem>
                <SelectItem value="NA">N/A</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Has Vehicle">
            <Select value={form.has_vehicle} onValueChange={v => set('has_vehicle', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no_has_license">No (has driver's license)</SelectItem>
                <SelectItem value="no_no_license">No (no driver's license)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Career Objectives */}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Career Objectives</Label>
            <Textarea
              rows={4}
              placeholder="Describe the client's career goals and employment objectives..."
              value={form.career_objectives}
              onChange={e => set('career_objectives', e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2 mb-1.5">Quick add career type:</p>
            <div className="flex flex-wrap gap-1.5">
              {CAREER_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  className="text-xs px-2 py-1 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors"
                  onClick={() => appendCareerPreset(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Employment History */}
          <div className="md:col-span-2 space-y-3">
            <Label className="text-sm font-medium text-slate-700 block">Employment History</Label>
            {employmentEntries.map((entry, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-700">Position {idx + 1}</h4>
                  <button type="button" onClick={() => setEmploymentEntries(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-600">Company</Label>
                    <Input className="mt-1" value={entry.company} onChange={e => updateEmp(idx, { company: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Industry</Label>
                    <Select value={entry.industry} onValueChange={v => updateEmp(idx, { industry: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{INDUSTRIES.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-slate-600">Job Title</Label>
                    <Select value={entry.job_title} onValueChange={v => updateEmp(idx, { job_title: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{JOB_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    {entry.job_title === 'Other' && (
                      <Input className="mt-1" placeholder="Custom job title" value={entry.job_title_other} onChange={e => updateEmp(idx, { job_title_other: e.target.value })} />
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Employment Type</Label>
                    <Select value={entry.employment_type} onValueChange={v => updateEmp(idx, { employment_type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Full-time','Part-time','Temp','Contract','Seasonal','Internship','Volunteer','Self-employed'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-slate-600">Start Date</Label>
                      <Input type="date" className="mt-1" value={entry.start_date} onChange={e => updateEmp(idx, { start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">End Date</Label>
                      <Input type="date" className="mt-1" value={entry.end_date} onChange={e => updateEmp(idx, { end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-slate-600">Responsibilities</Label>
                    <Textarea rows={2} className="mt-1" value={entry.responsibilities} onChange={e => updateEmp(idx, { responsibilities: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={() => setEmploymentEntries(prev => [...prev, EMPTY_EMPLOYMENT()])}>
              + Add Position
            </Button>
          </div>

          {/* Education & Training */}
          <div className="md:col-span-2 space-y-3">
            <Label className="text-sm font-medium text-slate-700 block">Education &amp; Training</Label>
            {educationEntries.map((entry, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-700">Education {idx + 1}</h4>
                  <button type="button" onClick={() => setEducationEntries(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-600">Institution / School</Label>
                    <Input className="mt-1" value={entry.institution} onChange={e => updateEdu(idx, { institution: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Education Type</Label>
                    <Select value={entry.education_type} onValueChange={v => updateEdu(idx, { education_type: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{EDUCATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-slate-600">Field of Study / Program</Label>
                    <Input className="mt-1" value={entry.field_of_study} onChange={e => updateEdu(idx, { field_of_study: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-slate-600">Start Date</Label>
                      <Input type="date" className="mt-1" value={entry.start_date} onChange={e => updateEdu(idx, { start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">End / Expected Date</Label>
                      <Input type="date" className="mt-1" value={entry.end_date} onChange={e => updateEdu(idx, { end_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-slate-600">Description / Achievements</Label>
                    <Textarea rows={2} className="mt-1" value={entry.description} onChange={e => updateEdu(idx, { description: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full" onClick={() => setEducationEntries(prev => [...prev, EMPTY_EDUCATION()])}>
              + Add Education / Training
            </Button>
          </div>

          {/* Resumes & Documents */}
          <div className="md:col-span-2 space-y-2">
            <Label className="text-sm font-medium text-slate-700 block">Resumes &amp; Documents</Label>
            <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-sm text-slate-500">
                  {uploading ? 'Uploading...' : 'Click to upload resume or document (PDF, image, Word)'}
                </span>
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            {form.resume_urls.map((url, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-3 py-2">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
                  Document {i + 1}
                </a>
                <button type="button" onClick={() => removeResume(i)} className="text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Intake Notes */}
          <div className="md:col-span-2">
            <Label className="text-sm font-medium text-slate-700 mb-1 block">Intake Notes</Label>
            <Textarea rows={4} placeholder="Additional notes about the client..." value={form.intake_notes} onChange={e => set('intake_notes', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="gap-2">
          <Save className="w-4 h-4" /> {client ? 'Save Changes' : 'Save Client'}
        </Button>
      </div>
    </form>
  );
}