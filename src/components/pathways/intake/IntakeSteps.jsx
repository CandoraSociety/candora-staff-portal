import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RESIDENCY_STATUS = [
  { value: 'canadian_citizen', label: 'Canadian Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'protected_person', label: 'Protected Person' },
  { value: 'convention_refugee', label: 'Convention Refugee' },
  { value: 'refugee_claimant', label: 'Refugee Claimant' },
  { value: 'temporary_resident', label: 'Temporary Resident' },
  { value: 'work_permit', label: 'Work Permit' },
  { value: 'study_permit', label: 'Study Permit' },
  { value: 'visitor', label: 'Visitor' },
  { value: 'other', label: 'Other' },
];

const CLB_LEVELS = [
  { value: 'clb_1', label: 'CLB 1' }, { value: 'clb_2', label: 'CLB 2' }, { value: 'clb_3', label: 'CLB 3' },
  { value: 'clb_4', label: 'CLB 4' }, { value: 'clb_5', label: 'CLB 5' }, { value: 'clb_6', label: 'CLB 6' },
  { value: 'clb_7', label: 'CLB 7' }, { value: 'clb_8', label: 'CLB 8' }, { value: 'clb_9', label: 'CLB 9' },
  { value: 'clb_10', label: 'CLB 10' }, { value: 'clb_11', label: 'CLB 11' }, { value: 'clb_12', label: 'CLB 12' },
  { value: 'native_english_french', label: 'Native English/French' },
];

const EMPLOYMENT_STATUS = [
  { value: 'E-RF', label: 'Employed - Regular Full-time' },
  { value: 'E-UF', label: 'Employed - Unstable Full-time' },
  { value: 'E-PT', label: 'Employed - Part-time' },
  { value: 'UE', label: 'Unemployed' },
  { value: 'UE-LA', label: 'Unemployed - Looking' },
  { value: 'UE-S', label: 'Unemployed - Seeking' },
  { value: 'NA', label: 'Not Applicable' },
];

const REFERRAL_SOURCES = [
  { value: 'self', label: 'Self' }, { value: 'family_friend', label: 'Family/Friend' },
  { value: 'school', label: 'School' }, { value: 'employer', label: 'Employer' },
  { value: 'external_agency', label: 'External Agency' }, { value: 'alberta_works', label: 'Alberta Works' },
  { value: 'other', label: 'Other' },
];

export function PersonalInfoStep({ formData, handleChange }) {
  return (
    <Card>
      <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>First Name *</Label><Input value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} required /></div>
        <div><Label>Last Name *</Label><Input value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} required /></div>
        <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} /></div>
        <div className="md:col-span-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} /></div>
        <div><Label>City</Label><Input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} /></div>
        <div><Label>Province/State</Label><Input value={formData.state} onChange={(e) => handleChange('state', e.target.value)} /></div>
        <div><Label>Postal/ZIP Code</Label><Input value={formData.zip} onChange={(e) => handleChange('zip', e.target.value)} /></div>
        <div><Label>Date of Birth</Label><Input type="date" value={formData.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} /></div>
        <div><Label>Sex</Label><Select value={formData.sex} onValueChange={(v) => handleChange('sex', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
      </CardContent>
    </Card>
  );
}

export function CaseInfoStep({ formData, handleChange, workers }) {
  return (
    <Card>
      <CardHeader><CardTitle>Case Information</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Compass HSID #</Label><Input value={formData.compass_hsid} onChange={(e) => handleChange('compass_hsid', e.target.value)} /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="cv" checked={formData.compass_verified} onChange={(e) => handleChange('compass_verified', e.target.checked)} /><Label htmlFor="cv">Compass Verified</Label></div>
        {formData.compass_verified && (<><div><Label>Verification Date</Label><Input type="date" value={formData.compass_verified_date} onChange={(e) => handleChange('compass_verified_date', e.target.value)} /></div><div><Label>Verified By</Label><Input value={formData.compass_verified_by} onChange={(e) => handleChange('compass_verified_by', e.target.value)} /></div></>)}
        <div><Label>Residency Status</Label><Select value={formData.residency_status} onValueChange={(v) => handleChange('residency_status', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{RESIDENCY_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>CLB Level</Label><Select value={formData.clb_level} onValueChange={(v) => handleChange('clb_level', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CLB_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Employment Status</Label><Select value={formData.employment_status} onValueChange={(v) => handleChange('employment_status', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{EMPLOYMENT_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Has Vehicle</Label><Select value={formData.has_vehicle} onValueChange={(v) => handleChange('has_vehicle', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no_has_license">No (has license)</SelectItem><SelectItem value="no_no_license">No (no license)</SelectItem></SelectContent></Select></div>
        <div><Label>Referral Source</Label><Select value={formData.referral_source} onValueChange={(v) => handleChange('referral_source', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{REFERRAL_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Service Type *</Label><Select value={formData.service_type} onValueChange={(v) => handleChange('service_type', v)} required><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{[{value:'direct_to_employment',label:'Direct to Employment (DEA)'},{value:'pathways',label:'Pathways'},{value:'casual',label:'Casual'},{value:'external_referral',label:'External Referral'},{value:'internal_referral',label:'Internal Referral'},{value:'not_eligible',label:'Not Eligible'}].map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Assigned Worker *</Label><Select value={formData.assigned_worker} onValueChange={(v) => handleChange('assigned_worker', v)} required><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{workers.map(w => <SelectItem key={w.email} value={w.email}>{w.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => handleChange('status', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="new">New</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
        <div><Label>Service Start Date</Label><Input type="date" value={formData.service_start_date} onChange={(e) => handleChange('service_start_date', e.target.value)} /></div>
      </CardContent>
    </Card>
  );
}

export function BarriersStep({ barriers, setBarriers }) {
  const addBarrier = () => { if (barriers.length < 3) setBarriers([...barriers, { text: '', status: 'unresolved', notes: '', action_steps: '' }]); };
  const updateBarrier = (idx, field, value) => { const updated = [...barriers]; updated[idx] = { ...updated[idx], [field]: value }; setBarriers(updated); };
  
  return (
    <Card>
      <CardHeader><CardTitle>Barriers to Employment</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {barriers.map((barrier, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between"><Label>Barrier {idx + 1}</Label>{idx === barriers.length - 1 && barriers.length < 3 && <button type="button" onClick={addBarrier} className="text-sm text-blue-600">+ Add</button>}</div>
            <div><Label>Description</Label><textarea className="w-full border rounded-md p-2 text-sm" rows={2} value={barrier.text} onChange={(e) => updateBarrier(idx, 'text', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Status</Label><Select value={barrier.status} onValueChange={(v) => updateBarrier(idx, 'status', v)}><SelectTrigger className="text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unresolved">Unresolved</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select></div>
              <div><Label>Notes</Label><Input className="text-sm" value={barrier.notes} onChange={(e) => updateBarrier(idx, 'notes', e.target.value)} /></div>
            </div>
            <div><Label>Action Steps</Label><textarea className="w-full border rounded-md p-2 text-sm" rows={2} value={barrier.action_steps} onChange={(e) => updateBarrier(idx, 'action_steps', e.target.value)} /></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReferralsStep({ sdpItems, setSdpItems, internalReferrals, setInternalReferrals, externalReferrals, setExternalReferrals }) {
  const SDP_ITEMS = ['Resume Development', 'Job Search Skills', 'Interview Preparation', 'Workplace Culture', 'Language Training', 'Credential Assessment', 'Skills Training', 'Work Placement', 'Mentorship', 'Other'];
  const toggleSdp = (item) => setSdpItems(sdpItems.includes(item) ? sdpItems.filter(i => i !== item) : [...sdpItems, item]);
  
  return (
    <Card>
      <CardHeader><CardTitle>Referrals & Service Plan</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div><Label className="mb-2 block">SDP Items</Label><div className="flex flex-wrap gap-2">{SDP_ITEMS.map(item => <button key={item} type="button" onClick={() => toggleSdp(item)} className={`px-3 py-1 rounded-full text-sm ${sdpItems.includes(item) ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>{item}</button>)}</div></div>
        <div><div className="flex justify-between mb-2"><Label>Internal Referrals</Label><button type="button" onClick={() => setInternalReferrals([...internalReferrals, ''])} className="text-sm text-blue-600">+ Add</button></div>{internalReferrals.map((ref, idx) => <div key={idx} className="flex gap-2 mb-2"><Input value={ref} onChange={(e) => { const u = [...internalReferrals]; u[idx] = e.target.value; setInternalReferrals(u); }} placeholder="Referral" /><button type="button" onClick={() => setInternalReferrals(internalReferrals.filter((_, i) => i !== idx))} className="text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>)}</div>
        <div><div className="flex justify-between mb-2"><Label>External Referrals</Label><button type="button" onClick={() => setExternalReferrals([...externalReferrals, ''])} className="text-sm text-blue-600">+ Add</button></div>{externalReferrals.map((ref, idx) => <div key={idx} className="flex gap-2 mb-2"><Input value={ref} onChange={(e) => { const u = [...externalReferrals]; u[idx] = e.target.value; setExternalReferrals(u); }} placeholder="Agency" /><button type="button" onClick={() => setExternalReferrals(externalReferrals.filter((_, i) => i !== idx))} className="text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>)}</div>
      </CardContent>
    </Card>
  );
}

export function BackgroundStep({ formData, handleChange }) {
  return (
    <Card>
      <CardHeader><CardTitle>Background & Notes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Career Objectives</Label><textarea className="w-full border rounded-md p-2" rows={3} value={formData.career_objectives} onChange={(e) => handleChange('career_objectives', e.target.value)} /></div>
        <div><Label>Employment History</Label><textarea className="w-full border rounded-md p-2" rows={4} value={formData.employment_history} onChange={(e) => handleChange('employment_history', e.target.value)} /></div>
        <div><Label>Intake Notes</Label><textarea className="w-full border rounded-md p-2" rows={4} value={formData.intake_notes} onChange={(e) => handleChange('intake_notes', e.target.value)} /></div>
        <div><Label>Intake Date</Label><Input type="date" value={formData.intake_date} onChange={(e) => handleChange('intake_date', e.target.value)} required /></div>
      </CardContent>
    </Card>
  );
}

// Combined component that renders the appropriate step
export default function IntakeSteps({ step, data, onSubmit }) {
  const handleChange = (field, value) => {
    onSubmit({ ...data, [field]: value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };
  
  switch(step) {
    case 1: return <PersonalInfoStep formData={data} handleChange={handleChange} />;
    case 2: return <CaseInfoStep formData={data} handleChange={handleChange} />;
    case 3: return <BarriersStep formData={data} handleChange={handleChange} />;
    case 4: return <ReferralsStep formData={data} handleChange={handleChange} />;
    case 5: return <BackgroundStep formData={data} handleChange={handleChange} />;
    default: return null;
  }
}