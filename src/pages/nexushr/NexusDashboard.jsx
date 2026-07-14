import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertTriangle, ClipboardList, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '@/components/shared/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import { format } from 'date-fns';

function StatCard({ title, value, icon: Icon, color, to }) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function NexusDashboard() {
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list('-created_date', 100) });
  const { data: reviews = [] } = useQuery({ queryKey: ['reviews'], queryFn: () => base44.entities.PerformanceReview.list('-created_date', 10) });
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.IncidentReport.list('-created_date', 10) });

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'under_investigation').length;
  const pendingReviews = reviews.filter(r => r.status === 'draft').length;

  return (
    <div className="space-y-6">
      <PageHeader title="HR Dashboard" description="Overview of your organization's HR data" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Employees" value={activeEmployees} icon={Users} color="bg-primary/10 text-primary" to="/nexushr/employees" />
        <StatCard title="Open Incidents" value={openIncidents} icon={AlertTriangle} color="bg-destructive/10 text-destructive" to="/nexushr/incidents" />
        <StatCard title="Pending Reviews" value={pendingReviews} icon={ClipboardList} color="bg-accent/10 text-accent-foreground" to="/nexushr/reviews" />
        <StatCard title="Total Employees" value={employees.length} icon={GraduationCap} color="bg-secondary text-secondary-foreground" to="/nexushr/employees" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Incidents</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {incidents.slice(0, 5).map(inc => (
              <div key={inc.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{inc.employee_names?.join(', ')}</p>
                  <p className="text-muted-foreground text-xs">{inc.incident_type?.replace(/_/g, ' ')}</p>
                </div>
                <StatusBadge status={inc.status} />
              </div>
            ))}
            {incidents.length === 0 && <p className="text-sm text-muted-foreground">No incidents recorded</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Reviews</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {reviews.slice(0, 5).map(rev => (
              <div key={rev.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{rev.employee_name}</p>
                  <p className="text-muted-foreground text-xs">{rev.review_period}</p>
                </div>
                <StatusBadge status={rev.overall_rating} />
              </div>
            ))}
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews submitted</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}