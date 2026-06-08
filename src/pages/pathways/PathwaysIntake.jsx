import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, FileText, BarChart3, LogOut } from 'lucide-react';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

const SERVICE_LABELS = {
  direct_to_employment: 'DEA',
  pathways: 'Pathways',
  casual: 'Casual',
  external_referral: 'External Referral',
  internal_referral: 'Internal Referral',
  not_eligible: 'Not Eligible',
};

const PROGRAM_STATUS_LABELS = {
  in_progress: 'In Progress',
  complete: 'Complete',
  incomplete: 'Incomplete',
  cancelled: 'Cancelled',
};

export default function PathwaysIntake() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
    date_of_birth: '', sex: '', compass_hsid: '', service_type: '', assigned_worker: '',
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-unassigned'],
    queryFn: () => base44.entities.Client.list('-created_date', 500),
  });
  
  const unassignedClients = clients.filter(c => !c.assigned_worker);
  
  const createClientMutation = useMutation({
    mutationFn: async (data) => {
      const existing = clients.find(c => 
        (c.email && c.email.toLowerCase() === data.email?.toLowerCase()) ||
        (c.phone && c.phone === data.phone) ||
        (c.compass_hsid && c.compass_hsid === data.compass_hsid)
      );
      if (existing) throw new Error(`Duplicate: ${existing.first_name} ${existing.last_name}`);
      
      const client = await base44.entities.Client.create(data);
      await base44.entities.CompassTask.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: data.compass_hsid,
        task_type: 'new_client',
        title: 'Enter new client into Compass',
        instructions: `Create new client in Compass.\nName: ${client.first_name} ${client.last_name}\nHSID: ${data.compass_hsid || 'TBD'}`,
        assigned_worker: data.assigned_worker,
        assigned_worker_name: WORKERS.find(w => w.email === data.assigned_worker)?.name,
        status: 'pending',
      });
      return client;
    },
    onSuccess: () => {
      toast.success('Client registered!');
      queryClient.invalidateQueries({ queryKey: ['pathways-clients-unassigned'] });
      setDialogOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
        date_of_birth: '', sex: '', compass_hsid: '', service_type: '', assigned_worker: '',
      });
    },
  });
  
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSubmit = () => {
    createClientMutation.mutate({
      ...formData,
      intake_date: moment().format('YYYY-MM-DD'),
      status: 'new',
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Intake — Unassigned Clients</h1>
            <p className="text-sm text-slate-600 mt-1">
              {unassignedClients.length} awaiting assignment
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate('/pathways/master')}>
              <FileText className="h-4 w-4 mr-2" /> Master List
            </Button>
            <Button variant="outline" onClick={() => navigate('/pathways/reports')}>
              <BarChart3 className="h-4 w-4 mr-2" /> Reports
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> New Client</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <div className="col-span-2">
                      <Label>Address</Label>
                      <Input value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input value={formData.city} onChange={(e) => updateField('city', e.target.value)} />
                    </div>
                    <div>
                      <Label>Province</Label>
                      <Input value={formData.state} onChange={(e) => updateField('state', e.target.value)} />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input value={formData.zip} onChange={(e) => updateField('zip', e.target.value)} />
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
                          <SelectItem value="direct_to_employment">DEA</SelectItem>
                          <SelectItem value="pathways">Pathways</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
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
                          {WORKERS.map(w => (
                            <SelectItem key={w.email} value={w.email}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={!formData.first_name || !formData.last_name || !formData.service_type || !formData.assigned_worker}
                    >
                      Register Client
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Unassigned Clients ({unassignedClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {unassignedClients.length === 0 ? (
            <p className="text-center text-slate-500 py-8">All clients have been assigned to a career counsellor.</p>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>HSID#</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Program Status</TableHead>
                    <TableHead>Intake Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedClients.map(c => (
                    <TableRow key={c.id} className="hover:bg-slate-50">
                      <TableCell>
                        <Link to={`/pathways/client/${c.id}`} className="font-semibold text-primary hover:underline">
                          {c.first_name} {c.last_name}
                        </Link>
                      </TableCell>
                      <TableCell>{c.compass_hsid || '—'}</TableCell>
                      <TableCell>{c.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge>{SERVICE_LABELS[c.service_type] || c.service_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.program_status === 'complete' ? 'success' : 'default'}>
                          {PROGRAM_STATUS_LABELS[c.program_status] || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.intake_date ? moment(c.intake_date).format('MMM D, YYYY') : '—'}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/pathways/client/${c.id}`)}>
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}