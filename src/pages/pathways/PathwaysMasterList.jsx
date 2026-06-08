import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Filter, X } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysMasterList() {
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    service_type: '',
    residency_status: '',
    followup_90day: '',
    worker: '',
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });
  
  const filteredClients = clients.filter(c => {
    const isActive = activeTab === 'active' ? c.status !== 'closed' : c.status === 'closed';
    if (!isActive) return false;
    if (searchTerm && !`${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.service_type && c.service_type !== filters.service_type) return false;
    if (filters.residency_status && c.residency_status !== filters.residency_status) return false;
    if (filters.followup_90day) {
      if (filters.followup_90day === 'due' && (!c.followup_90day_date || moment(c.followup_90day_date).isAfter(moment().add(14, 'days')))) return false;
      if (filters.followup_90day === 'overdue' && (!c.followup_90day_date || !moment(c.followup_90day_date).isBefore(moment()))) return false;
      if (filters.followup_90day === 'completed' && !c.followup_90day_status) return false;
    }
    if (filters.worker && c.assigned_worker !== filters.worker) return false;
    return true;
  });
  
  const clearFilters = () => setFilters({ service_type: '', residency_status: '', followup_90day: '', worker: '' });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Master Client List</h1>
        <p className="text-sm text-slate-600">Browse all client files</p>
      </div>
      
      <div className="flex gap-2">
        <Input placeholder="Search clients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}><Filter className="h-4 w-4 mr-2" /> Filters</Button>
        {Object.values(filters).some(f => f !== '') && <Button variant="ghost" onClick={clearFilters}><X className="h-4 w-4 mr-2" /> Clear</Button>}
      </div>
      
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Residency Status</Label>
                <Select value={filters.residency_status} onValueChange={(v) => setFilters({ ...filters, residency_status: v })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    <SelectItem value="canadian_citizen">Canadian Citizen</SelectItem>
                    <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                    <SelectItem value="refugee_claimant">Refugee Claimant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>90-Day Follow-Up</Label>
                <Select value={filters.followup_90day} onValueChange={(v) => setFilters({ ...filters, followup_90day: v })}>
                  <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All</SelectItem>
                    <SelectItem value="due">Due (within 14 days)</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Files ({clients.filter(c => c.status !== 'closed').length})</TabsTrigger>
          <TabsTrigger value="closed">Closed Files ({clients.filter(c => c.status === 'closed').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab === 'active' ? 'active' : 'closed'}>
          <Card>
            <CardHeader><CardTitle>{activeTab === 'active' ? 'Active' : 'Closed'} Clients ({filteredClients.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredClients.map(c => (
                  <Link key={c.id} to={`/pathways/client/${c.id}`} className="block p-4 border rounded-lg hover:bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-lg">{c.first_name} {c.last_name}</p>
                        <p className="text-sm text-slate-600">{c.email || c.phone}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge>{c.status}</Badge>
                          <Badge variant="outline">{c.service_type?.replace(/_/g, ' ')}</Badge>
                          {c.program_status && <Badge variant="outline">{c.program_status.replace(/_/g, ' ')}</Badge>}
                          {c.employment_status?.startsWith('E-') && <Badge className="bg-green-100 text-green-800">Employed</Badge>}
                          {c.assigned_worker && <Badge variant="outline">{WORKERS.find(w => w.email === c.assigned_worker)?.name || c.assigned_worker}</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        {c.followup_90day_date && (
                          <p className="text-sm">
                            <span className={moment(c.followup_90day_date).isBefore(moment()) ? 'text-red-600 font-medium' : 'text-slate-600'}>
                              90-day: {moment(c.followup_90day_date).format('MMM D, YYYY')}
                            </span>
                          </p>
                        )}
                        {c.program_stream_switches?.length > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            {c.program_stream_switches[c.program_stream_switches.length - 1].from_stream} → {c.program_stream_switches[c.program_stream_switches.length - 1].to_stream}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                {filteredClients.length === 0 && <p className="text-center text-slate-500 py-8">No clients found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}