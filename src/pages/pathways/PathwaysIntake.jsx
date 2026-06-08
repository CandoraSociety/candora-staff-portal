import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PersonalInfoStep, CaseInfoStep, BarriersStep, ReferralsStep, BackgroundStep } from '@/components/pathways/intake/IntakeSteps';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysIntake() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [barriers, setBarriers] = useState([{ text: '', status: 'unresolved', notes: '', action_steps: '' }]);
  const [sdpItems, setSdpItems] = useState([]);
  const [internalReferrals, setInternalReferrals] = useState([]);
  const [externalReferrals, setExternalReferrals] = useState([]);
  
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
    date_of_birth: '', sex: '', compass_hsid: '', compass_verified: false, compass_verified_date: '',
    compass_verified_by: '', compass_notes: '', residency_status: '', clb_level: '',
    employment_status: '', has_vehicle: '', referral_source: '', service_type: '',
    assigned_worker: '', career_objectives: '', employment_history: '', intake_notes: '',
    intake_date: new Date().toISOString().split('T')[0], status: 'new', program_status: 'in_progress',
    service_start_date: new Date().toISOString().split('T')[0],
  });
  
  const createClientMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Client.create(data),
    onSuccess: () => {
      toast.success('Client created successfully!');
      queryClient.invalidateQueries({ queryKey: ['pathways-clients'] });
      setStep(1);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', date_of_birth: '', sex: '', compass_hsid: '', compass_verified: false, compass_verified_date: '', compass_verified_by: '', compass_notes: '', residency_status: '', clb_level: '', employment_status: '', has_vehicle: '', referral_source: '', service_type: '', assigned_worker: '', career_objectives: '', employment_history: '', intake_notes: '', intake_date: new Date().toISOString().split('T')[0], status: 'new', program_status: 'in_progress', service_start_date: new Date().toISOString().split('T')[0] });
      setBarriers([{ text: '', status: 'unresolved', notes: '', action_steps: '' }]);
      setSdpItems([]);
      setInternalReferrals([]);
      setExternalReferrals([]);
    },
    onError: (error) => toast.error('Failed: ' + error.message),
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (barriers[0]) { payload.barrier_1 = barriers[0].text; payload.barrier_1_status = barriers[0].status; payload.barrier_1_notes = barriers[0].notes; payload.barrier_1_action_steps = barriers[0].action_steps; }
    if (barriers[1]) { payload.barrier_2 = barriers[1].text; payload.barrier_2_status = barriers[1].status; payload.barrier_2_notes = barriers[1].notes; payload.barrier_2_action_steps = barriers[1].action_steps; }
    if (barriers[2]) { payload.barrier_3 = barriers[2].text; payload.barrier_3_status = barriers[2].status; payload.barrier_3_notes = barriers[2].notes; payload.barrier_3_action_steps = barriers[2].action_steps; }
    payload.sdp_items = sdpItems;
    payload.internal_referrals = internalReferrals;
    payload.external_referrals = externalReferrals;
    createClientMutation.mutate(payload);
  };
  
  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  
  const totalSteps = 5;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/pathways"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-800">Client Intake</h1><p className="text-sm text-slate-600">Step {step} of {totalSteps}</p></div>
      </div>
      
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-[#1a237e]' : 'bg-slate-200'}`} />
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && <PersonalInfoStep formData={formData} handleChange={handleChange} />}
        {step === 2 && <CaseInfoStep formData={formData} handleChange={handleChange} workers={WORKERS} />}
        {step === 3 && <BarriersStep barriers={barriers} setBarriers={setBarriers} />}
        {step === 4 && <ReferralsStep sdpItems={sdpItems} setSdpItems={setSdpItems} internalReferrals={internalReferrals} setInternalReferrals={setInternalReferrals} externalReferrals={externalReferrals} setExternalReferrals={setExternalReferrals} />}
        {step === 5 && <BackgroundStep formData={formData} handleChange={handleChange} />}
        
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>Previous</Button>
          {step < totalSteps ? (
            <Button type="button" onClick={() => setStep(s => Math.min(totalSteps, s + 1))}>Next</Button>
          ) : (
            <Button type="submit" className="bg-[#1a237e] hover:bg-[#2c3799]" disabled={createClientMutation.isPending}>{createClientMutation.isPending ? 'Creating...' : 'Create Client'}</Button>
          )}
          <Link to="/pathways"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}