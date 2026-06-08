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
import { Users, AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import moment from 'moment';
import { Link } from 'react-router-dom';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysWorkerDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-assigned'],
    queryFn: async () => {
      const all = await base44.entities.Client.list('-created_date', 1000);
      const user = await base44.auth.me();
      if (user?.email === 'Dawn.williston@candorasociety.com') {
        return all.filter(c => c.barriers_addressed === true);
      }
      return all.filter(c => c.assigned_worker === user?.email);
    },
  });
  
  const { data: tasks = [] } = useQuery({
    queryKey: ['pathways-compass-tasks'],
    queryFn: () => base44.entities.CompassTask.filter({ status: 'pending' }),
  });
  
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    new: clients.filter(c => c.status === 'new').length,
    overdue: clients.filter(c => {
      if (!c.followup_90day_date) return false;
      return moment(c.followup_90day_date).isBefore(moment(), 'day');
    }).length,
  };
  
  const deaClosingSoon = clients.filter(c => {
    if (c.service_type !== 'casual') return false;
    const periodEnd = moment().add(2, 'weeks').endOf('isoWeek');
    return moment().isSameOrAfter(periodEnd.subtract(3, 'days'));
  });
  
  const followupsDue = clients.filter(c => {
    if (!c.followup_90day_date || c.program_status !== 'complete') return false;
    const daysUntil = moment(c.followup_90day_date).diff(moment(), 'days');
    return daysUntil >= 0 && daysUntil <= 14;
  });
  
  const filteredClients = clients.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const myTasks = tasks.filter(t => t.assigned_worker === (WORKERS.find(w => w.name === 'Current')?.email));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Worker Dashboard</h1>
        <p className="text-sm text-slate-600">Monitor your caseload and priority alerts</p>
      </div>
      
      {/* Alert Panels */}
      {(deaClosingSoon.length > 0 || followupsDue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deaClosingSoon.length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" /> DEA Closing Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700 mb-2">{deaClosingSoon.length} client(s) within 3 days of 2-week period end</p>
                <div className="space-y-1">
                  {deaClosingSoon.map(c => (
                    <Link key={c.id} to={`/pathways/client/${c.id}`} className="block text-sm text-yellow-900 hover:underline">
                      {c.first_name} {c.last_name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {followupsDue.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Clock className="h-5 w-5" /> 90-Day Follow-Ups Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-2">{followupsDue.length} client(s) due within 14 days</p>
                <div className="space-y-1">
                  {followupsDue.map(c => (
                    <Link key={c.id} to={`/pathways/client/${c.id}`} className="block text-sm text-orange-900 hover:underline">
                      {c.first_name} {c.last_name} - Due: {moment(c.followup_90day_date).format('MMM D')}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={stats.total} color="blue" />
        <StatCard title="Active" value={stats.active} color="green" />
        <StatCard title="New" value={stats.new} color="yellow" />
        <StatCard title="Overdue Follow-Ups" value={stats.overdue} color="red" />
      </div>
      
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('clients')} className={`px-4 py-2 ${activeTab === 'clients' ? 'border-b-2 border-primary font-medium' : 'text-slate-600'}`}>My Clients ({filteredClients.length})</button>
        <button onClick={() => setActiveTab('compass')} className={`px-4 py-2 ${activeTab === 'compass' ? 'border-b-2 border-primary font-medium' : 'text-slate-600'}`}>Compass Queue ({myTasks.length})</button>
      </div>
      
      {activeTab === 'clients' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Clients</CardTitle>
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredClients.map(c => (
                <Link key={c.id} to={`/pathways/client/${c.id}`} className="block p-3 border rounded-lg hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{c.first_name} {c.last_name}</p>
                      <p className="text-sm text-slate-600">{c.email} • {c.phone}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge>{c.status}</Badge>
                        <Badge variant="outline">{c.service_type?.replace(/_/g, ' ')}</Badge>
                        {c.employment_status?.startsWith('E-') && <Badge className="bg-green-100 text-green-800">Employed</Badge>}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </Link>
              ))}
              {filteredClients.length === 0 && <p className="text-center text-slate-500 py-8">No clients found</p>}
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'compass' && (
        <Card>
          <CardHeader><CardTitle>My Compass Tasks ({myTasks.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myTasks.map(t => (
                <div key={t.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-slate-600">{t.instructions}</p>
                  <Badge className="mt-2">{t.task_type}</Badge>
                </div>
              ))}
              {myTasks.length === 0 && <p className="text-center text-slate-500 py-8">No pending tasks</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colors = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', yellow: 'bg-yellow-100 text-yellow-600', red: 'bg-red-100 text-red-600' };
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-slate-600">{title}</p>
        <p className={`text-3xl font-bold ${colors[color].split(' ')[1]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}