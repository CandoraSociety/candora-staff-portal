import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Save, X, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { createCompassTask, taskServiceTypeChange, taskStatusChange } from '@/lib/compassTasks';
import { toast } from 'sonner';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', full_name: 'Priscilla' },
  { email: 'lola@candorasociety.com',      full_name: 'Lola' },
  { email: 'john@candorasociety.com',      full_name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', full_name: 'Dawn' },
  { email: 'olena@candorasociety.com',     full_name: 'Olena' },
];

const RESIDENCY_STATUSES = [
  { value: 'canadian_citizen',   label: 'Canadian Citizen' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'protected_person',   label: 'Protected Person' },
  { value: 'convention_refugee', label: 'Convention Refugee' },
  { value: 'refugee_claimant',   label: 'Refugee Claimant' },
  { value: 'temporary_resident', label: 'Temporary Resident' },
  { value: 'work_permit',        label: 'Work Permit' },
  { value: 'study_permit',       label: 'Study Permit' },
  { value: 'visitor',            label: 'Visitor' },
  { value: 'other',              label: 'Other' },
];

const CLB_LEVELS = ['clb_1','clb_2','clb_3','clb_4','clb_5','clb_6','clb_7','clb_8','clb_9','clb_10','clb_11','clb_12','native_english_french'];
const clbLabel = (v) => v === 'native_english_french' ? 'Native English/French' : v.replace('clb_', 'CLB ');

const VEHICLE_OPTIONS = [
  { value: 'yes',            label: 'Yes' },
  { value: 'no_has_license', label: 'No (has licence)' },
  { value: 'no_no_license',  label: 'No (no licence)' },
];

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
];

const SERVICE_TYPES = [
  { value: 'direct_to_employment', label: 'Direct to Employment (DEA)' },
  { value: 'pathways',             label: 'Pathways' },
  { value: 'casual',               label: 'Casual' },
  { value: 'internal_referral',    label: 'Internal Referral' },
];

const PROGRAM_STATUSES = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete',    label: 'Complete' },
  { value: 'incomplete',  label: 'Incomplete' },
  { value: 'cancelled',   label: 'Cancelled' },
];

const EMPLOYMENT_CODES = ['E-RF','E-UF','E-PT','UE','UE-LFW','UE-S','NA'];

// Read-only display field
function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800">{value || <span className="text-slate-300 italic">—</span>}</p>
    </div>
  );
}

// Edit controls row
function EditControls({ editMode, onEdit, onCancel, onSave, saving }) {
  return (
    <div className="flex justify-end gap-2">
      {editMode ? (
        <>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
      )}
    </div>
  );
}

export default function ClientProfileOverview({ client, onSave }) {
  const [form, setForm] = useState({ ...client });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCancel = () => {
    setForm({ ...client });
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      const clientBase = { ...client, ...form };
      if (form.service_type !== client.service_type) {
        await createCompassTask({
          client_id: client.id,
          task_type: 'service_type_change',
          ...taskServiceTypeChange(clientBase, client.service_type, form.service_type),
        });
      }
      if (form.program_status !== client.program_status) {
        await createCompassTask({
          client_id: client.id,
          task_type: 'status_change',
          ...taskStatusChange(clientBase, client.program_status, form.program_status),
        });
      }
      setEditMode(false);
      toast.success('Client information updated');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const switches = client.program_stream_switches || [];

  return (
    <div className="space-y-6">

      {/* Top Controls */}
      <EditControls editMode={editMode} onEdit={() => setEditMode(true)} onCancel={handleCancel} onSave={handleSave} saving={saving} />

      {/* Stream Switch Alert */}
      {switches.length > 0 && (
        <div className="bg-purple-50 border-2 border-purple-400 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-purple-800">Program Stream Switch(es) on File</span>
          </div>
          {switches.map((sw, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap text-sm">
              <span className="text-purple-600 font-medium">{sw.date}</span>
              <span className="bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-lg text-xs font-medium">
                {sw.from_stream?.replace(/_/g, ' ')}
              </span>
              <ArrowRight className="w-4 h-4 text-purple-400" />
              <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                {sw.to_stream?.replace(/_/g, ' ')}
              </span>
              {sw.reason && (
                <span className="text-purple-600 italic">
                  — {sw.reason === 'other' ? sw.reason_other : sw.reason?.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Demographics Card */}
      <Card>
        <CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editMode ? (
            <>
              <div><Label>First Name</Label><Input value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} /></div>
              <div><Label>Last Name</Label><Input value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} /></div>
              <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)} /></div>
              <div>
                <Label>Sex</Label>
                <Select value={form.gender || ''} onValueChange={v => set('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{GENDER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Phone</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
              <div><Label>Compass HSID#</Label><Input value={form.compass_hsid || ''} onChange={e => set('compass_hsid', e.target.value)} /></div>
              <div><Label>Address</Label><Input value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
              <div><Label>City</Label><Input value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
              <div>
                <Label>Residency Status</Label>
                <Select value={form.residency_status || ''} onValueChange={v => set('residency_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{RESIDENCY_STATUSES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>CLB Level</Label>
                <Select value={form.clb_level || ''} onValueChange={v => set('clb_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{CLB_LEVELS.map(v => <SelectItem key={v} value={v}>{clbLabel(v)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Has Vehicle</Label>
                <Select value={form.has_vehicle || ''} onValueChange={v => set('has_vehicle', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{VEHICLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <Field label="First Name" value={client.first_name} />
              <Field label="Last Name" value={client.last_name} />
              <Field label="Date of Birth" value={client.date_of_birth} />
              <Field label="Sex" value={GENDER_OPTIONS.find(o => o.value === client.gender)?.label || client.sex} />
              <Field label="Phone" value={client.phone} />
              <Field label="Email" value={client.email} />
              <Field label="Compass HSID#" value={client.compass_hsid} />
              <Field label="Address" value={client.address} />
              <Field label="City" value={client.city} />
              <Field label="Residency Status" value={RESIDENCY_STATUSES.find(o => o.value === client.residency_status)?.label} />
              <Field label="CLB Level" value={client.clb_level ? clbLabel(client.clb_level) : null} />
              <Field label="Has Vehicle" value={VEHICLE_OPTIONS.find(o => o.value === client.has_vehicle)?.label} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Case Info Card */}
      <Card>
        <CardHeader><CardTitle>Case Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editMode ? (
            <>
              <div>
                <Label>Service Element</Label>
                <Select value={form.service_type || ''} onValueChange={v => set('service_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{SERVICE_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Program Status</Label>
                <Select value={form.program_status || ''} onValueChange={v => set('program_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{PROGRAM_STATUSES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Worker</Label>
                <Select value={form.assigned_worker || ''} onValueChange={v => {
                  const w = WORKERS.find(w => w.email === v);
                  setForm(prev => ({ ...prev, assigned_worker: v, assigned_worker_name: w?.full_name || '' }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{WORKERS.map(w => <SelectItem key={w.email} value={w.email}>{w.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employment Status</Label>
                <Select value={form.employment_status || ''} onValueChange={v => set('employment_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_CODES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Intake Date</Label><Input type="date" value={form.intake_date || ''} onChange={e => set('intake_date', e.target.value)} /></div>
              <div><Label>Service Start Date</Label><Input type="date" value={form.service_start_date || ''} onChange={e => set('service_start_date', e.target.value)} /></div>
              <div><Label>Completion Date</Label><Input type="date" value={form.completion_date || ''} onChange={e => set('completion_date', e.target.value)} /></div>
              <div><Label>90-Day Follow-Up Date</Label><Input type="date" value={form.followup_90day_date || ''} onChange={e => set('followup_90day_date', e.target.value)} /></div>
              <div>
                <Label>90-Day Employment Status</Label>
                <Select value={form.followup_90day_status || ''} onValueChange={v => set('followup_90day_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_CODES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    <SelectItem value="no_contact">No Contact</SelectItem>
                    <SelectItem value="UTC">UTC — Unable to Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <Field label="Service Element" value={SERVICE_TYPES.find(o => o.value === client.service_type)?.label} />
              <Field label="Program Status" value={PROGRAM_STATUSES.find(o => o.value === client.program_status)?.label} />
              <Field label="Assigned Worker" value={client.assigned_worker_name || client.assigned_worker} />
              <Field label="Employment Status" value={client.employment_status} />
              <Field label="Intake Date" value={client.intake_date} />
              <Field label="Service Start Date" value={client.service_start_date} />
              <Field label="Completion Date" value={client.completion_date} />
              <Field label="90-Day Follow-Up Date" value={client.followup_90day_date} />
              <Field label="90-Day Employment Status" value={client.followup_90day_status} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Career Background Card */}
      <Card>
        <CardHeader><CardTitle>Career Background</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div>
                <Label>Career / Employment Objectives</Label>
                <Textarea rows={4} value={form.career_objectives || ''} onChange={e => set('career_objectives', e.target.value)} />
              </div>
              <div>
                <Label>Employment History / Education</Label>
                <Textarea rows={4} value={form.employment_history || ''} onChange={e => set('employment_history', e.target.value)} />
              </div>
              <div>
                <Label>Intake Notes</Label>
                <Textarea rows={4} value={form.intake_notes || ''} onChange={e => set('intake_notes', e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <Field label="Career / Employment Objectives" value={client.career_objectives} />
              <Field label="Employment History / Education" value={client.employment_history} />
              <Field label="Intake Notes" value={client.intake_notes} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Compass Entry Verification Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Compass Entry Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="compass_verified"
                  checked={!!form.compass_verified}
                  onCheckedChange={v => set('compass_verified', v)}
                />
                <Label htmlFor="compass_verified">Client file has been entered into Compass</Label>
              </div>
              {form.compass_verified && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Date Verified</Label><Input type="date" value={form.compass_verified_date || ''} onChange={e => set('compass_verified_date', e.target.value)} /></div>
                  <div><Label>Verified By</Label><Input value={form.compass_verified_by || ''} onChange={e => set('compass_verified_by', e.target.value)} placeholder="Name of person who verified…" /></div>
                  <div className="md:col-span-2">
                    <Label>Compass Notes / Discrepancies</Label>
                    <Textarea rows={3} value={form.compass_notes || ''} onChange={e => set('compass_notes', e.target.value)} placeholder="Note any discrepancies…" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${client.compass_verified ? 'bg-green-100' : 'bg-amber-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${client.compass_verified ? 'bg-green-500' : 'bg-amber-400'}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {client.compass_verified ? 'Entered into Compass' : 'Not yet entered into Compass'}
                </span>
              </div>
              {client.compass_verified ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Field label="Date Verified" value={client.compass_verified_date} />
                  <Field label="Verified By" value={client.compass_verified_by} />
                  {client.compass_notes && <div className="md:col-span-2"><Field label="Notes" value={client.compass_notes} /></div>}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-600">
                  ⚠ This client has not been verified as entered in Compass.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom duplicate controls */}
      {editMode && (
        <EditControls editMode={editMode} onEdit={() => {}} onCancel={handleCancel} onSave={handleSave} saving={saving} />
      )}

    </div>
  );
}