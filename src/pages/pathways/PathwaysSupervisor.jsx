import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, Clock } from 'lucide-react';

export default function PathwaysSupervisor() {
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });
  
  const { data: tasks = [] } = useQuery({
    queryKey: ['pathways-compass-tasks'],
    queryFn: () => base44.entities.CompassTask.list('-created_date', 100),
  });
  
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    new: clients.filter(c => c.status === 'new').length,
    pending_tasks: tasks.filter(t => t.status === 'pending').length,
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Supervisor Portal</h1>
        <p className="text-sm text-slate-600">System oversight and reporting</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg"><Users className="h-6 w-6 text-blue-600" /></div>
              <div><p className="text-sm text-slate-600">Total Clients</p><p className="text-2xl font-bold">{stats.total}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-sm text-slate-600">Active</p><p className="text-2xl font-bold">{stats.active}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg"><Users className="h-6 w-6 text-yellow-600" /></div>
              <div><p className="text-sm text-slate-600">New This Month</p><p className="text-2xl font-bold">{stats.new}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg"><Clock className="h-6 w-6 text-red-600" /></div>
              <div><p className="text-sm text-slate-600">Pending Tasks</p><p className="text-2xl font-bold">{stats.pending_tasks}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>System Overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-600">Supervisor dashboard with staff performance metrics and system-wide reporting will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}