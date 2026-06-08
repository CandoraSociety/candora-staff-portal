import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Clock, TrendingUp, Briefcase, DollarSign } from 'lucide-react';
import moment from 'moment';

export default function PathwaysSupervisor() {
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });
  
  const { data: financials = [] } = useQuery({
    queryKey: ['pathways-financials'],
    queryFn: () => base44.entities.FinancialRecord.list('-date', 500),
  });
  
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    new_this_month: clients.filter(c => moment(c.created_date).format('YYYY-MM') === moment().format('YYYY-MM')).length,
    employed: clients.filter(c => ['E-RF', 'E-UF', 'E-PT'].includes(c.employment_status)).length,
    total_expenses: financials.reduce((sum, f) => sum + (f.total || 0), 0),
  };
  
  const byWorker = WORKERS.map(w => ({
    name: w.name,
    email: w.email,
    count: clients.filter(c => c.assigned_worker === w.email).length,
    active: clients.filter(c => c.assigned_worker === w.email && c.status === 'active').length,
  }));
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Supervisor Dashboard</h1>
        <p className="text-sm text-slate-600">System oversight and performance metrics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total Clients" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Active" value={stats.active} icon={CheckCircle} color="green" />
        <StatCard title="New This Month" value={stats.new_this_month} icon={TrendingUp} color="yellow" />
        <StatCard title="Employed" value={stats.employed} icon={Briefcase} color="emerald" />
        <StatCard title="Total Expenses" value={`$${stats.total_expenses.toLocaleString()}`} icon={DollarSign} color="red" />
      </div>
      
      <Card>
        <CardHeader><CardTitle>Caseload by Worker</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {byWorker.map(w => (
              <div key={w.email} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-sm text-slate-600">{w.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{w.active} / {w.count}</p>
                  <p className="text-xs text-slate-500">Active / Total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Service Type Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['direct_to_employment', 'pathways', 'casual', 'external_referral', 'internal_referral'].map(type => {
              const count = clients.filter(c => c.service_type === type).length;
              const pct = Math.round((count / clients.length) * 100) || 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-32 text-sm">{type.replace(/_/g, ' ')}</div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1a237e]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">{count} ({pct}%)</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', yellow: 'bg-yellow-100 text-yellow-600', emerald: 'bg-emerald-100 text-emerald-600', red: 'bg-red-100 text-red-600' };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${colors[color]}`}><Icon className="h-6 w-6" /></div>
          <div><p className="text-sm text-slate-600">{title}</p><p className="text-2xl font-bold">{value}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];