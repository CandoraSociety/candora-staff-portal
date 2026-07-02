import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Layers, Users, UserPlus, Landmark, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import { COHORT_STATUS_OPTIONS, ACCOUNT_SETUP_STATUS_OPTIONS } from '@/lib/empoweruConstants';

export default function EmpowerUDashboard() {
  const { data: cohorts = [] } = useQuery({ queryKey: ['empoweru-cohorts'], queryFn: () => base44.entities.EmpowerUCohort.list() });
  const { data: registrations = [] } = useQuery({ queryKey: ['empoweru-registrations'], queryFn: () => base44.entities.EmpowerURegistration.list() });
  const { data: accountSetups = [] } = useQuery({ queryKey: ['empoweru-account-setups'], queryFn: () => base44.entities.EmpowerUAccountSetup.list() });

  const activeCohorts = cohorts.filter(c => ['registration_open', 'in_progress'].includes(c.status));
  const waitlisted = registrations.filter(r => r.status === 'waitlisted');
  const enrolled = registrations.filter(r => r.status === 'enrolled');
  const apptsInProgress = accountSetups.filter(a => !['completed', 'declined', 'participant_unresponsive'].includes(a.status));
  const apptsCompleted = accountSetups.filter(a => a.status === 'completed');
  const now = new Date();
  const needsAttention = accountSetups.filter(a => {
    if (['completed', 'declined'].includes(a.status)) return false;
    if (a.next_action_date && new Date(a.next_action_date) < now) return true;
    if ((a.follow_up_attempts || 0) >= 3 && a.status === 'contacting') return true;
    return false;
  });

  const stats = [
    { label: 'Active Cohorts', value: activeCohorts.length, icon: Layers, path: '/empoweru/cohorts', color: '#8b5cf6' },
    { label: 'Enrolled', value: enrolled.length, icon: Users, path: '/empoweru/participants', color: '#22c55e' },
    { label: 'Waitlisted', value: waitlisted.length, icon: UserPlus, path: '/empoweru/cohorts', color: '#f59e0b' },
    { label: 'Acct Setup Done', value: `${apptsCompleted.length}/${accountSetups.length}`, icon: Landmark, path: '/empoweru/account-setup', color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">EmpowerU Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">10-week financial literacy program · Partnered with United Way · Funded by ATB</p>
      </div>

      {needsAttention.length > 0 && (
        <Link to="/empoweru/account-setup">
          <Card className="border-amber-300 bg-amber-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-200 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-amber-700" /></div>
              <div><p className="font-medium text-amber-900">{needsAttention.length} account setup(s) need attention</p><p className="text-xs text-amber-700">Overdue follow-ups or multiple contact attempts — click to review</p></div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => { const Icon = stat.icon; return (
          <Link key={stat.label} to={stat.path}>
            <Card className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}><Icon className="h-5 w-5" style={{ color: stat.color }} /></div>
              <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
            </CardContent></Card>
          </Link>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Active &amp; Upcoming Cohorts</CardTitle><Link to="/empoweru/cohorts" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {activeCohorts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No active cohorts</p> : (
              <div className="space-y-2">{activeCohorts.sort((a, b) => new Date(a.start_date || '9999') - new Date(b.start_date || '9999')).slice(0, 5).map(c => (
                <Link key={c.id} to={`/empoweru/cohorts/${c.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.start_date ? new Date(c.start_date).toLocaleDateString() : 'TBD'} · {c.facilitator_name || 'No facilitator'}</p></div>
                  <StatusBadge status={c.status} options={COHORT_STATUS_OPTIONS} />
                </Link>
              ))}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Account Setups In Progress</CardTitle><Link to="/empoweru/account-setup" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="h-3 w-3" /></Link></CardHeader>
          <CardContent>
            {apptsInProgress.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No account setups in progress</p> : (
              <div className="space-y-2">{apptsInProgress.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div><p className="text-sm font-medium text-foreground">{a.participant_name}</p><p className="text-xs text-muted-foreground flex items-center gap-1">{a.follow_up_attempts > 0 && <><Clock className="h-3 w-3" /> {a.follow_up_attempts} attempts</>}{a.next_action_date && <span className={new Date(a.next_action_date) < now ? 'text-red-600 font-medium' : ''}>Due: {new Date(a.next_action_date).toLocaleDateString()}</span>}</p></div>
                  <StatusBadge status={a.status} options={ACCOUNT_SETUP_STATUS_OPTIONS} />
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}