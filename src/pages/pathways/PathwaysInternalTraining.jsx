import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Plus } from 'lucide-react';
import moment from 'moment';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc', label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite', label: 'Food Services (On-site)' },
  { value: 'food_services_offsite', label: 'Food Services (Off-site)' },
  { value: 'reception', label: 'Reception' },
  { value: 'childcare', label: 'Childcare' },
];

export default function PathwaysInternalTraining() {
  const queryClient = useQueryClient();
  
  const { data: trainings = [] } = useQuery({
    queryKey: ['pathways-trainings'],
    queryFn: () => base44.entities.InternalTraining.list('-referral_date', 100),
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['pathways-staff-active'],
    queryFn: () => base44.entities.PathwaysStaff.filter({ is_active: true }, 'name'),
  });
  
  const createTrainingMutation = useMutation({
    mutationFn: async (data) => await base44.entities.InternalTraining.create(data),
    onSuccess: () => {
      toast.success('Training referral created');
      queryClient.invalidateQueries({ queryKey: ['pathways-trainings'] });
    },
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Internal Training Placements</h1>
        <p className="text-sm text-slate-600">Manage client placements in internal programs</p>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Create Training Referral</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client *</Label>
              <select id="tclient" className="w-full border rounded-md p-2">
                <option value="">Select client</option>
                {clients.filter(c => c.status === 'active').map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Placement Type *</Label>
              <Select id="ttype"><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{PLACEMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
            </div>
            <div>
              <Label>Assigned Worker</Label>
              <select id="tworker" className="w-full border rounded-md p-2">
                <option value="">Select worker</option>
                {staff.map(s => (
                  <option key={s.id} value={s.email}>{s.name}</option>
                ))}
              </select>
            </div>
            <div><Label>Referral Date</Label><Input id="tdate" type="date" defaultValue={moment().format('YYYY-MM-DD')} /></div>
          </div>
          <div><Label>Training Goals</Label><Textarea id="tgoals" rows={3} /></div>
          <div><Label>Referral Notes</Label><Textarea id="tnotes" rows={3} /></div>
          <Button onClick={() => {
            const clientId = document.getElementById('tclient').value;
            const type = document.getElementById('ttype').value;
            if (!clientId || !type) { toast.error('Client and placement type required'); return; }
            const client = clients.find(c => c.id === clientId);
            createTrainingMutation.mutate({
              client_id: clientId,
              client_name: `${client.first_name} ${client.last_name}`,
              placement_type: type,
              assigned_worker: document.getElementById('tworker').value,
              referral_date: document.getElementById('tdate').value,
              training_goals: document.getElementById('tgoals').value,
              referral_notes: document.getElementById('tnotes').value,
              status: 'referred',
            });
          }}><Plus className="h-4 w-4 mr-2" />Create Referral</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Active Placements ({trainings.filter(t => t.status === 'active' || t.status === 'referred').length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trainings.filter(t => t.status === 'active' || t.status === 'referred').map(t => (
              <div key={t.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{t.client_name}</p>
                    <p className="text-sm text-slate-600">{PLACEMENT_TYPES.find(p => p.value === t.placement_type)?.label || t.placement_type}</p>
                    <p className="text-xs text-slate-500">Referred: {t.referral_date} • Worker: {t.assigned_worker_name || t.assigned_worker}</p>
                  </div>
                  <Badge>{t.status}</Badge>
                </div>
                {t.training_goals && <p className="text-sm text-slate-600 mt-2">{t.training_goals}</p>}
              </div>
            ))}
            {trainings.filter(t => t.status === 'active' || t.status === 'referred').length === 0 && <p className="text-center text-slate-500 py-8">No active placements</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}