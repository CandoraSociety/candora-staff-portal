import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, User, MapPin, Phone, Mail, Briefcase, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

const RESIDENCY_STATUS = ['canadian_citizen', 'permanent_resident', 'protected_person', 'convention_refugee', 'refugee_claimant', 'temporary_resident', 'work_permit', 'study_permit', 'visitor', 'other'];
const CLB_LEVELS = ['clb_1', 'clb_2', 'clb_3', 'clb_4', 'clb_5', 'clb_6', 'clb_7', 'clb_8', 'clb_9', 'clb_10', 'clb_11', 'clb_12', 'native_english_french'];
const EMPLOYMENT_STATUS = ['E-RF', 'E-UF', 'E-PT', 'UE', 'UE-LA', 'UE-S', 'NA'];
const SERVICE_TYPES = ['direct_to_employment', 'pathways', 'casual', 'external_referral', 'internal_referral', 'not_eligible'];
const PROGRAM_STATUS = ['in_progress', 'complete', 'incomplete', 'cancelled'];

const STREAM_LABELS = {
  direct_to_employment: 'DEA',
  pathways: 'Pathways',
  casual: 'Casual',
  external_referral: 'External Referral',
  internal_referral: 'Internal Referral',
  not_eligible: 'Not Eligible'
};

const STREAM_BADGE_COLORS = {
  direct_to_employment: 'bg-blue-100 text-blue-800 border-blue-200',
  pathways: 'bg-purple-100 text-purple-800 border-purple-200',
  casual: 'bg-green-100 text-green-800 border-green-200',
  external_referral: 'bg-orange-100 text-orange-800 border-orange-200',
  internal_referral: 'bg-pink-100 text-pink-800 border-pink-200',
  not_eligible: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function ClientProfileOverview({ client, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...client });

  const handleSave = async () => {
    try {
      await onSave(formData);
      
      // Create Compass tasks for stream/status changes
      if (formData.service_type !== client.service_type || formData.program_status !== client.program_status) {
        await base44.entities.CompassTask.create({
          client_id: client.id,
          client_name: `${client.first_name} ${client.last_name}`,
          task_type: 'status_change',
          title: `Service/Status Change - ${client.first_name} ${client.last_name}`,
          instructions: `Service type changed from ${client.service_type} to ${formData.service_type}. Program status changed from ${client.program_status} to ${formData.program_status}.`,
          assigned_worker: formData.assigned_worker,
          status: 'pending'
        });
      }
      
      setEditMode(false);
      toast.success('Client information updated');
    } catch (error) {
      toast.error('Failed to update client');
    }
  };

  const Field = ({ label, value, icon: Icon }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </Label>
      <div className="text-sm font-medium">{value || '—'}</div>
    </div>
  );

  const InputField = ({ label, field, type = 'text', icon: Icon }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </Label>
      <Input
        type={type}
        value={formData[field] || ''}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
      />
    </div>
  );

  const SelectField = ({ label, field, options, icon: Icon }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </Label>
      <Select value={formData[field] || ''} onValueChange={(value) => setFormData({ ...formData, [field]: value })}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt.replace(/_/g, ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      {client.program_stream_switches?.length > 0 && (
        <Alert className="bg-purple-50 border-purple-200">
          <AlertDescription>
            <div className="font-semibold text-purple-900">Stream Switch History</div>
            <div className="text-sm text-purple-700 mt-1">
              This client has switched streams {client.program_stream_switches.length} time(s).
              Most recent: {client.program_stream_switches[client.program_stream_switches.length - 1]?.from_stream?.replace(/_/g, ' ')} → {client.program_stream_switches[client.program_stream_switches.length - 1]?.to_stream?.replace(/_/g, ' ')} on {client.program_stream_switches[client.program_stream_switches.length - 1]?.date}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Demographics
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => editMode ? handleSave() : setEditMode(true)}>
            {editMode ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {editMode ? 'Save' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {editMode ? (
            <>
              <InputField label="First Name" field="first_name" icon={User} />
              <InputField label="Last Name" field="last_name" icon={User} />
              <InputField label="Email" field="email" type="email" icon={Mail} />
              <InputField label="Phone" field="phone" type="tel" icon={Phone} />
              <InputField label="Date of Birth" field="date_of_birth" type="date" />
              <SelectField label="Sex" field="sex" options={['male', 'female']} />
              <div className="md:col-span-3"><InputField label="Address" field="address" icon={MapPin} /></div>
              <InputField label="City" field="city" icon={MapPin} />
              <InputField label="Province" field="state" />
              <InputField label="Postal Code" field="zip" />
              <SelectField label="Residency Status" field="residency_status" options={RESIDENCY_STATUS} />
              <SelectField label="CLB Level" field="clb_level" options={CLB_LEVELS} />
              <SelectField label="Has Vehicle" field="has_vehicle" options={['yes', 'no_has_license', 'no_no_license']} />
            </>
          ) : (
            <>
              <Field label="First Name" value={client.first_name} icon={User} />
              <Field label="Last Name" value={client.last_name} icon={User} />
              <Field label="Email" value={client.email} icon={Mail} />
              <Field label="Phone" value={client.phone} icon={Phone} />
              <Field label="Date of Birth" value={client.date_of_birth} />
              <Field label="Sex" value={client.sex} />
              <Field label="Address" value={client.address} icon={MapPin} />
              <Field label="City" value={client.city} icon={MapPin} />
              <Field label="Province" value={client.state} />
              <Field label="Postal Code" value={client.zip} />
              <Field label="Residency Status" value={client.residency_status?.replace(/_/g, ' ')} />
              <Field label="CLB Level" value={client.clb_level?.replace('_', ' ').toUpperCase()} />
              <Field label="Has Vehicle" value={client.has_vehicle?.replace(/_/g, ' ')} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Case Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {editMode ? (
            <>
              <InputField label="Compass HSID" field="compass_hsid" />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="compass_verified"
                  checked={formData.compass_verified || false}
                  onChange={(e) => setFormData({ ...formData, compass_verified: e.target.checked })}
                />
                <Label htmlFor="compass_verified">Compass Verified</Label>
              </div>
              {formData.compass_verified && (
                <>
                  <InputField label="Verified Date" field="compass_verified_date" type="date" />
                  <InputField label="Verified By" field="compass_verified_by" />
                </>
              )}
              <SelectField label="Service Element" field="service_type" options={SERVICE_TYPES} icon={Briefcase} />
              <SelectField label="Program Status" field="program_status" options={PROGRAM_STATUS} />
              <SelectField label="Employment Status" field="employment_status" options={EMPLOYMENT_STATUS} />
              <SelectField label="Assigned Worker" field="assigned_worker" options={WORKERS.map(w => w.email)} />
              <InputField label="Intake Date" field="intake_date" type="date" />
              <InputField label="Service Start Date" field="service_start_date" type="date" />
              <InputField label="Completion Date" field="completion_date" type="date" />
              <InputField label="90-Day Follow-up Date" field="followup_90day_date" type="date" />
              <SelectField label="90-Day Status" field="followup_90day_status" options={[...EMPLOYMENT_STATUS, 'no_contact']} />
            </>
          ) : (
            <>
              <Field label="Compass HSID" value={client.compass_hsid} />
              <Field label="Compass Verified" value={client.compass_verified ? 'Yes' : 'No'} />
              {client.compass_verified && (
                <>
                  <Field label="Verified Date" value={client.compass_verified_date} />
                  <Field label="Verified By" value={client.compass_verified_by} />
                </>
              )}
              <Field label="Service Element" value={STREAM_LABELS[client.service_type] || client.service_type?.replace(/_/g, ' ')} icon={Briefcase} />
              <Field label="Program Status" value={client.program_status?.replace(/_/g, ' ')} />
              <Field label="Employment Status" value={client.employment_status} />
              <Field label="Assigned Worker" value={client.assigned_worker_name || client.assigned_worker} />
              <Field label="Intake Date" value={client.intake_date} />
              <Field label="Service Start Date" value={client.service_start_date} />
              <Field label="Completion Date" value={client.completion_date} />
              <Field label="90-Day Follow-up Date" value={client.followup_90day_date} />
              <Field label="90-Day Status" value={client.followup_90day_status} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Career Background</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div>
                <Label>Career Objectives</Label>
                <Textarea
                  value={formData.career_objectives || ''}
                  onChange={(e) => setFormData({ ...formData, career_objectives: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Employment History</Label>
                <Textarea
                  value={formData.employment_history || ''}
                  onChange={(e) => setFormData({ ...formData, employment_history: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Intake Notes</Label>
                <Textarea
                  value={formData.intake_notes || ''}
                  onChange={(e) => setFormData({ ...formData, intake_notes: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <Field label="Career Objectives" value={client.career_objectives} />
              <Field label="Employment History" value={client.employment_history} />
              <Field label="Intake Notes" value={client.intake_notes} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}