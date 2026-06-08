import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysIntake() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', sex: '',
    compass_hsid: '', residency_status: '', clb_level: '', employment_status: '',
    has_vehicle: '', referral_source: '', service_type: '', assigned_worker: '',
    status: 'new', service_start_date: '', intake_notes: '',
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
      setDialogOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', sex: '',
        compass_hsid: '', residency_status: '', clb_level: '', employment_status: '',
        has_vehicle: '', referral_source: '', service_type: '', assigned_worker: '',
        status: 'new', service_start_date: '', intake_notes: '',
      });
    },
  });
  
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSubmit = () => createClientMutation.mutate({ ...formData, intake_date: moment().format('YYYY-MM-DD') });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Client Intake</h1>
          <p className="text-sm text-slate-600">View and register new clients</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Client Registration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input value={formData.first_name} onChange={(e) => updateField('first_name', e.target.value)} />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={formData.last_name} onChange={(e) => updateField('last_name', e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={formData.date_of_birth} onChange={(e) => updateField('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <Label>Sex</Label>
                  <Select value={formData.sex} onValueChange={(v) => updateField('sex', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Compass HSID</Label>
                  <Input value={formData.compass_hsid} onChange={(e) => updateField('compass_hsid', e.target.value)} />
                </div>
                <div>
                  <Label>Service Type *</Label>
                  <Select value={formData.service_type} onValueChange={(v) => updateField('service_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct_to_employment">Direct to Employment</SelectItem>
                      <SelectItem value="pathways">Pathways</SelectItem>
                      <SelectItem value="casual">DEA</SelectItem>
                      <SelectItem value="external_referral">External Referral</SelectItem>
                      <SelectItem value="internal_referral">Internal Referral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Assigned Worker *</Label>
                  <Select value={formData.assigned_worker} onValueChange={(v) => updateField('assigned_worker', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {WORKERS.map(w => <SelectItem key={w.email} value={w.email}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.first_name || !formData.last_name || !formData.service_type || !formData.assigned_worker}>
                  Register Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Unassigned Clients ({unassignedClients.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {unassignedClients.map(c => (
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
    </div>
  );
}