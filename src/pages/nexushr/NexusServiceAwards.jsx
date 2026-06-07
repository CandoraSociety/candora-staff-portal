import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccessLevel } from '@/lib/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, RefreshCw, Trophy, Clock, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';
import { format, addYears, isBefore, addDays } from 'date-fns';
import { toast } from 'sonner';

const MILESTONE_YEARS = [1, 3, 5, 10, 15, 20, 25, 30];
const milestoneColor = (years) => {
  if (years >= 25) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (years >= 15) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (years >= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (years >= 5) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

function AwardCard({ award, onUpdate, isHRAdmin }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{award.employee_name}</h3>
            <p className="text-xs text-muted-foreground">Hired: {award.hire_date ? format(new Date(award.hire_date), 'MMM d, yyyy') : '—'}</p>
          </div>
          <Badge className={`${milestoneColor(award.years_of_service)} border text-sm font-bold`}>🏆 {award.years_of_service}yr</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Anniversary: {award.award_date ? format(new Date(award.award_date), 'MMM d, yyyy') : '—'}</p>
        {isHRAdmin && award.status === 'upcoming' && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onUpdate.mutate({ id: award.id, data: { status: 'acknowledged' } })}>Acknowledge</Button>
            <Button size="sm" className="flex-1" onClick={() => onUpdate.mutate({ id: award.id, data: { status: 'presented' } })}>Presented</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function NexusServiceAwards() {
  const { isHRAdmin, isManager } = useAccessLevel();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: awards = [] } = useQuery({ queryKey: ['service-awards'], queryFn: () => base44.entities.ServiceAward.list('-award_date', 200) });
  const { data: employees = [] } = useQuery({ queryKey: ['employees-awards'], queryFn: () => base44.entities.Employee.filter({ status: 'active' }, '-hire_date', 500) });

  const updateAward = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ServiceAward.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-awards'] }),
  });
  const createAward = useMutation({
    mutationFn: (data) => base44.entities.ServiceAward.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-awards'] }),
  });

  if (!isManager) return <AccessDenied />;

  const today = new Date();
  const upcomingMilestones = [];
  employees.forEach(emp => {
    if (!emp.hire_date) return;
    const hireDate = new Date(emp.hire_date);
    MILESTONE_YEARS.forEach(years => {
      const milestoneDate = addYears(hireDate, years);
      const inWindow = isBefore(milestoneDate, addDays(today, 90)) && isBefore(today, milestoneDate);
      const alreadyTracked = awards.find(a => a.employee_id === emp.id && a.years_of_service === years);
      if (inWindow && !alreadyTracked) upcomingMilestones.push({ emp, years, milestoneDate });
    });
  });

  const handleRefreshMilestones = async () => {
    setRefreshing(true);
    for (const { emp, years, milestoneDate } of upcomingMilestones) {
      await createAward.mutateAsync({
        employee_id: emp.id, employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_email: emp.email, hire_date: emp.hire_date, years_of_service: years,
        award_date: format(milestoneDate, 'yyyy-MM-dd'), status: 'upcoming', notified: false,
      });
    }
    setRefreshing(false);
    toast.success(`${upcomingMilestones.length} upcoming milestone(s) added.`);
  };

  const upcoming = awards.filter(a => a.status === 'upcoming');
  const acknowledged = awards.filter(a => a.status === 'acknowledged' || a.status === 'presented');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Awards"
        actions={
          <Button variant="outline" size="sm" onClick={handleRefreshMilestones} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Scan Milestones {upcomingMilestones.length > 0 && `(${upcomingMilestones.length} new)`}
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Upcoming (90 days)', value: upcoming.length, icon: Clock, color: 'text-amber-500' },
          { label: 'Acknowledged', value: acknowledged.length, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Total Tracked', value: awards.length, icon: Trophy, color: 'text-blue-500' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div><p className="text-xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {awards.length === 0 ? (
        <EmptyState icon={Award} title="No awards tracked" description="Click 'Scan Milestones' to find upcoming anniversaries." />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3">Upcoming Milestones</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map(award => <AwardCard key={award.id} award={award} onUpdate={updateAward} isHRAdmin={isHRAdmin} />)}
              </div>
            </div>
          )}
          {acknowledged.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3">Acknowledged / Presented</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {acknowledged.map(award => <AwardCard key={award.id} award={award} onUpdate={updateAward} isHRAdmin={isHRAdmin} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}