import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';

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

export default function PathwaysIntake() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
    date_of_birth: '', sex: '',
    compass_hsid: '', compass_verified: false, residency_status: '', clb_level: '', employment_status: '',
    has_vehicle: '', referral_source: '', service_type: '', assigned_worker: '', status: 'new',
    service_start_date: '',
    barrier_1: '', barrier_1_status: 'unresolved', barrier_1_notes: '', barrier_1_action_steps: '',
    barrier_2: '', barrier_2_status: 'unresolved', barrier_2_notes: '', barrier_2_action_steps: '',
    barrier_3: '', barrier_3_status: 'unresolved', barrier_3_notes: '', barrier_3_action_steps: '',
    internal_referrals: [], external_referrals: [], sdp_items: [],
    career_objectives: '', employment_history: '', intake_notes: '',
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-unassigned'],
    queryFn: () => base44.entities.Client.list('-created_date', 500),
  });
  
  const unassignedClients = clients.filter(c => !c.assigned_worker);
  
  const createClientMutation = useMutation({
    mutationFn: async (data) => {
      const existing = clients.find(c => 
        (c.email && c.email === data.email) ||
        (c.phone && c.phone === data.phone) ||
        (c.compass_hsid && c.compass_hsid === data.compass_hsid)
      );
      if (existing) throw new Error(`Duplicate: ${existing.first_name} ${existing.last_name}`);
      const client = await base44.entities.Client.create(data);
      await base44.entities.CompassTask.create({
        client_id: client.id, client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: data.compass_hsid, task_type: 'new_client',
        title: 'Enter new client into Compass',
        instructions: `Create new client in Compass.\nName: ${client.first_name} ${client.last_name}\nHSID: ${data.compass_hsid || 'TBD'}`,
        assigned_worker: data.assigned_worker, assigned_worker_name: WORKERS.find(w => w.email === data.assigned_worker)?.name,
        status: 'pending',
      });
      return client;
    },
    onSuccess: () => {
      toast.success('Client registered!');
      queryClient.invalidateQueries({ queryKey: ['pathways-clients-unassigned'] });
      setCurrentStep(1);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
        date_of_birth: '', sex: '', compass_hsid: '', compass_verified: false, residency_status: '', clb_level: '', employment_status: '',
        has_vehicle: '', referral_source: '', service_type: '', assigned_worker: '', status: 'new', service_start_date: '',
        barrier_1: '', barrier_1_status: 'unresolved', barrier_1_notes: '', barrier_1_action_steps: '',
        barrier_2: '', barrier_2_status: 'unresolved', barrier_2_notes: '', barrier_2_action_steps: '',
        barrier_3: '', barrier_3_status: 'unresolved', barrier_3_notes: '', barrier_3_action_steps: '',
        internal_referrals: [], external_referrals: [], sdp_items: [],
        career_objectives: '', employment_history: '', intake_notes: '',
      });
    },
  });
  
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSubmit = () => {
    if (currentStep < 5) { setCurrentStep(currentStep + 1); return; }
    createClientMutation.mutate({ ...formData, intake_date: moment().format('YYYY-MM-DD') });
  };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Client Intake</h1>
        <p className="text-sm text-slate-600">Register new clients and view unassigned files</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Unassigned Clients ({unassignedClients.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedClients.slice(0, 20).map(c => (
                <Link key={c.id} to={`/pathways/client/${c.id}`} className="block p-3 border rounded-lg hover:bg-slate-50">
                  <p className="font-medium">{c.first_name} {c.last_name}</p>
                  <p className="text-sm text-slate-600">{c.email || c.phone}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{c.service_type?.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline">{c.clb_level?.replace('_', ' ')}</Badge>
                  </div>
                </Link>
              ))}
              {unassignedClients.length === 0 && <p className="text-center text-slate-500 py-8">No unassigned clients</p>}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>New Client Registration</CardTitle>
              <Badge>Step {currentStep} of 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name *</Label><Input value={formData.first_name} onChange={(e) => updateField('first_name', e.target.value)} required /></div>
                <div><Label>Last Name *</Label><Input value={formData.last_name} onChange={(e) => updateField('last_name', e.target.value)} required /></div>
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
                <div className="col-span-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => updateField('address', e.target.value)} /></div>
                <div><Label>City</Label><Input value={formData.city} onChange={(e) => updateField('city', e.target.value)} /></div>
                <div><Label>Province</Label><Input value={formData.state} onChange={(e) => updateField('state', e.target.value)} /></div>
                <div><Label>Postal Code</Label><Input value={formData.zip} onChange={(e) => updateField('zip', e.target.value)} /></div>
                <div><Label>Date of Birth</Label><Input type="date" value={formData.date_of_birth} onChange={(e) => updateField('date_of_birth', e.target.value)} /></div>
                <div><Label>Sex</Label><Select value={formData.sex} onValueChange={(v) => updateField('sex', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Compass HSID</Label><Input value={formData.compass_hsid} onChange={(e) => updateField('compass_hsid', e.target.value)} /></div>
                <div><Label>Residency Status</Label><Select value={formData.residency_status} onValueChange={(v) => updateField('residency_status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RESIDENCY_STATUS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>CLB Level</Label><Select value={formData.clb_level} onValueChange={(v) => updateField('clb_level', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLB_LEVELS.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Employment Status</Label><Select value={formData.employment_status} onValueChange={(v) => updateField('employment_status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EMPLOYMENT_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Service Type *</Label><Select value={formData.service_type} onValueChange={(v) => updateField('service_type', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Assigned Worker *</Label><Select value={formData.assigned_worker} onValueChange={(v) => updateField('assigned_worker', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{WORKERS.map(w => <SelectItem key={w.email} value={w.email}>{w.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="space-y-4">
                {['barrier_1', 'barrier_2', 'barrier_3'].map((key, idx) => (
                  <div key={key} className="p-3 border rounded-lg space-y-2">
                    <Label>Barrier {idx + 1}</Label>
                    <Input value={formData[key]} onChange={(e) => updateField(key, e.target.value)} placeholder="Describe barrier" />
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={formData[`${key}_status`]} onValueChange={(v) => updateField(`${key}_status`, v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unresolved">Unresolved</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select>
                      <Input value={formData[`${key}_notes`]} onChange={(e) => updateField(`${key}_notes`, e.target.value)} placeholder="Notes" />
                      <Input value={formData[`${key}_action_steps`]} onChange={(e) => updateField(`${key}_action_steps`, e.target.value)} placeholder="Action Steps" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {currentStep === 4 && (
              <div className="space-y-4">
                <div><Label>Career Objectives</Label><textarea className="w-full border rounded-md p-2" rows={3} value={formData.career_objectives} onChange={(e) => updateField('career_objectives', e.target.value)} /></div>
                <div><Label>Employment History</Label><textarea className="w-full border rounded-md p-2" rows={4} value={formData.employment_history} onChange={(e) => updateField('employment_history', e.target.value)} /></div>
              </div>
            )}
            
            {currentStep === 5 && (
              <div className="space-y-4">
                <div><Label>Intake Notes</Label><textarea className="w-full border rounded-md p-2" rows={4} value={formData.intake_notes} onChange={(e) => updateField('intake_notes', e.target.value)} /></div>
                <div><Label>Service Start Date</Label><Input type="date" value={formData.service_start_date} onChange={(e) => updateField('service_start_date', e.target.value)} /></div>
              </div>
            )}
            
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}><ChevronLeft className="h-4 w-4 mr-2" />Back</Button>
              <Button onClick={handleSubmit}>{currentStep === 5 ? 'Submit' : 'Next'}<ChevronRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}