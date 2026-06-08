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
import { Users, Filter, X } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import IntakeSteps from '@/components/pathways/intake/IntakeSteps';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysIntake() {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    service_type: '',
    program_status: '',
    employment_status: '',
    clb_level: '',
    worker: '',
    age_min: '',
    age_max: '',
    duration_min: '',
    duration_max: '',
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-unassigned'],
    queryFn: () => base44.entities.Client.list('-created_date', 500),
  });
  
  const unassignedClients = clients.filter(c => !c.assigned_worker);
  
  const filteredClients = unassignedClients.filter(c => {
    if (filters.service_type && c.service_type !== filters.service_type) return false;
    if (filters.program_status && c.program_status !== filters.program_status) return false;
    if (filters.employment_status && c.employment_status !== filters.employment_status) return false;
    if (filters.clb_level && c.clb_level !== filters.clb_level) return false;
    if (filters.worker && c.assigned_worker !== filters.worker) return false;
    if (filters.age_min || filters.age_max) {
      const age = moment().diff(moment(c.date_of_birth), 'years');
      if (filters.age_min && age < parseInt(filters.age_min)) return false;
      if (filters.age_max && age > parseInt(filters.age_max)) return false;
    }
    if (filters.duration_min || filters.duration_max) {
      const duration = moment().diff(moment(c.service_start_date), 'days');
      if (filters.duration_min && duration < parseInt(filters.duration_min) * 30) return false;
      if (filters.duration_max && duration > parseInt(filters.duration_max) * 30) return false;
    }
    return true;
  });
  
  const createClientMutation = useMutation({
    mutationFn: async (data) => {
      // Check for duplicates
      const existing = clients.find(c => 
        (c.email && c.email === data.email) ||
        (c.phone && c.phone === data.phone) ||
        (c.compass_hsid && c.compass_hsid === data.compass_hsid)
      );
      
      if (existing) {
        throw new Error(`Duplicate detected: ${existing.first_name} ${existing.last_name} already exists with matching email/phone/HSID`);
      }
      
      const client = await base44.entities.Client.create(data);
      
      // Auto-create Compass task
      await base44.entities.CompassTask.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: data.compass_hsid,
        task_type: 'new_client',
        title: 'Enter new client into Compass',
        instructions: `Create new client file in Compass system.\nName: ${client.first_name} ${client.last_name}\nHSID: ${data.compass_hsid || 'TBD'}\nService Type: ${data.service_type}`,
        assigned_worker: data.assigned_worker,
        assigned_worker_name: WORKERS.find(w => w.email === data.assigned_worker)?.name || data.assigned_worker,
        status: 'pending',
      });
      
      return client;
    },
    onSuccess: () => {
      toast.success('Client registered and Compass task created');
      queryClient.invalidateQueries({ queryKey: ['pathways-clients-unassigned'] });
      setCurrentStep(1);
      setFormData({});
    },
  });
  
  const handleSubmit = (stepData) => {
    setFormData({ ...formData, ...stepData });
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      createClientMutation.mutate({
        ...formData,
        ...stepData,
        intake_date: moment().format('YYYY-MM-DD'),
        status: 'active',
      });
    }
  };
  
  const clearFilters = () => {
    setFilters({
      service_type: '',
      program_status: '',
      employment_status: '',
      clb_level: '',
      worker: '',
      age_min: '',
      age_max: '',
      duration_min: '',
      duration_max: '',
    });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Client Intake</h1>
        <p className="text-sm text-slate-600">Register new clients and view unassigned files</p>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" /> Filters
        </Button>
        {Object.values(filters).some(f => f !== '') && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" /> Clear
          </Button>
        )}
      </div>
      
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Service Type</Label>
                <Select value={filters.service_type} onValueChange={(v) => setFilters({ ...filters, service_type: v })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    <SelectItem value="direct_to_employment">Direct to Employment</SelectItem>
                    <SelectItem value="pathways">Pathways</SelectItem>
                    <SelectItem value="casual">DEA</SelectItem>
                    <SelectItem value="external_referral">External Referral</SelectItem>
                    <SelectItem value="internal_referral">Internal Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Program Status</Label>
                <Select value={filters.program_status} onValueChange={(v) => setFilters({ ...filters, program_status: v })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employment Status</Label>
                <Select value={filters.employment_status} onValueChange={(v) => setFilters({ ...filters, employment_status: v })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    <SelectItem value="E-RF">Employed Full-Time</SelectItem>
                    <SelectItem value="E-UF">Employed Part-Time</SelectItem>
                    <SelectItem value="E-PT">Employed Temporary</SelectItem>
                    <SelectItem value="UE">Unemployed</SelectItem>
                    <SelectItem value="UE-LA">Layoff</SelectItem>
                    <SelectItem value="UE-S">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CLB Level</Label>
                <Select value={filters.clb_level} onValueChange={(v) => setFilters({ ...filters, clb_level: v })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    <SelectItem value="clb_1">CLB 1</SelectItem>
                    <SelectItem value="clb_4">CLB 4</SelectItem>
                    <SelectItem value="clb_7">CLB 7</SelectItem>
                    <SelectItem value="clb_10">CLB 10</SelectItem>
                    <SelectItem value="native_english_french">Native</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Worker</Label>
                <Select value={filters.worker} onValueChange={(v) => setFilters({ ...filters, worker: v })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    {WORKERS.map(w => <SelectItem key={w.email} value={w.email}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Age Min</Label>
                <Input type="number" value={filters.age_min} onChange={(e) => setFilters({ ...filters, age_min: e.target.value })} placeholder="18" />
              </div>
              <div>
                <Label>Age Max</Label>
                <Input type="number" value={filters.age_max} onChange={(e) => setFilters({ ...filters, age_max: e.target.value })} placeholder="65" />
              </div>
              <div>
                <Label>Duration (months)</Label>
                <Input type="number" value={filters.duration_min} onChange={(e) => setFilters({ ...filters, duration_min: e.target.value })} placeholder="0" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client List */}
        <Card>
          <CardHeader><CardTitle>Unassigned Clients ({filteredClients.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredClients.map(c => (
                <Link key={c.id} to={`/pathways/client/${c.id}`} className="block p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{c.first_name} {c.last_name}</p>
                      <p className="text-sm text-slate-600">{c.email || c.phone}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge>{c.service_type?.replace(/_/g, ' ')}</Badge>
                        {c.clb_level && <Badge variant="outline">{c.clb_level.replace('_', ' ').toUpperCase()}</Badge>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredClients.length === 0 && <p className="text-center text-slate-500 py-8">No unassigned clients</p>}
            </div>
          </CardContent>
        </Card>
        
        {/* Intake Form */}
        <Card>
          <CardHeader><CardTitle>New Client Registration</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className={`flex-1 h-2 rounded ${step <= currentStep ? 'bg-primary' : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className="text-sm text-slate-600 mb-4">Step {currentStep} of 5</p>
            <IntakeSteps step={currentStep} data={formData} onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}