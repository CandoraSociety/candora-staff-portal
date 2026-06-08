import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Users, AlertCircle, Clock, CheckCircle, Search } from 'lucide-react';
import moment from 'moment';

export default function PathwaysWorkerDashboard() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });
  
  const { data: compassTasks = [] } = useQuery({
    queryKey: ['pathways-compass-tasks'],
    queryFn: () => base44.entities.CompassTask.filter({ status: 'pending' }, '-created_date', 100),
  });
  
  // Filter clients by search
  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.first_name.toLowerCase().includes(search.toLowerCase()) ||
      c.last_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);
  
  // Priority alerts
  const today = moment();
  const followupsDue = clients.filter(c => {
    if (!c.followup_90day_date) return false;
    const daysUntil = moment(c.followup_90day_date).diff(today, 'days');
    return daysUntil <= 7 && daysUntil >= 0 && c.status !== 'closed';
  });
  
  const stats = {
    total: filteredClients.length,
    active: filteredClients.filter(c => c.status === 'active').length,
    new: filteredClients.filter(c => c.status === 'new').length,
    closed: filteredClients.filter(c => c.status === 'closed').length,
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Career Counsellor Dashboard</h1>
        <p className="text-sm text-slate-600">Manage your assigned clients and tasks</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Clients</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">New Files</p>
                <p className="text-2xl font-bold">{stats.new}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Follow-ups Due</p>
                <p className="text-2xl font-bold">{followupsDue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredClients
              .filter(c => filter === 'all' || c.status === filter)
              .slice(0, 20)
              .map((client) => (
                <Link key={client.id} to={`/pathways/client/${client.id}`}>
                  <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium">{client.first_name} {client.last_name}</p>
                      <p className="text-sm text-slate-600">{client.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={client.status === 'active' ? 'default' : client.status === 'new' ? 'secondary' : 'outline'}>
                        {client.status}
                      </Badge>
                      <Badge variant="outline">{client.service_type?.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            
            {filteredClients.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No clients found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Compass Tasks */}
      {compassTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Compass Tasks ({compassTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {compassTasks.slice(0, 10).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-slate-600">{task.client_name}</p>
                  </div>
                  <Badge>{task.task_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}