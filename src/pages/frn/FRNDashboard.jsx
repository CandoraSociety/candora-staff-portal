import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, CheckSquare, UserCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FRN_PROGRAMS, PROGRAM_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/frnConstants';
import StatusBadge from '@/components/frn/StatusBadge';

export default function FRNDashboard() {
  const { data: participants = [] } = useQuery({
    queryKey: ['frn-participants'],
    queryFn: () => base44.entities.FRNParticipant.list(),
  });
  const { data: referrals = [] } = useQuery({
    queryKey: ['frn-referrals'],
    queryFn: () => base44.entities.FRNReferral.list('-created_date', 200),
  });
  const { data: assessments = [] } = useQuery({
    queryKey: ['frn-assessments'],
    queryFn: () => base44.entities.FRNAssessment.list('-created_date', 100),
  });

  const pendingReferrals = referrals.filter(r => ['pending', 'assessment_scheduled'].includes(r.status));
  const assessmentsDue = referrals.filter(r => r.status === 'assessment_scheduled');
  const activeEnrollments = referrals.filter(r => r.status === 'enrolled');

  const stats = [
    { label: 'Participants', value: participants.length, icon: Users, path: '/frn/participants', color: '#0ea5e9' },
    { label: 'Pending Referrals', value: pendingReferrals.length, icon: ClipboardList, path: '/frn/intake', color: '#f59e0b' },
    { label: 'Assessments Due', value: assessmentsDue.length, icon: CheckSquare, path: '/frn/assessments', color: '#8b5cf6' },
    { label: 'Active Enrollments', value: activeEnrollments.length, icon: UserCheck, path: '/frn/intake', color: '#22c55e' },
  ];

  const programBreakdown = FRN_PROGRAMS.filter(p => p.value !== 'other').map(program => {
    const pr = referrals.filter(r => r.program === program.value);
    return {
      ...program,
      total: pr.length,
      enrolled: pr.filter(r => r.status === 'enrolled').length,
      inIntake: pr.filter(r => ['pending', 'assessment_scheduled', 'assessed', 'accepted'].includes(r.status)).length,
      completed: pr.filter(r => r.status === 'completed').length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">FRN Programs Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of targeted FRN program intake and enrollment</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.path}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '15' }}>
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Program Enrollment Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {programBreakdown.map(p => (
              <div key={p.value} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm text-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center"><p className="font-bold text-foreground">{p.inIntake}</p><p className="text-xs text-muted-foreground">In Intake</p></div>
                  <div className="text-center"><p className="font-bold text-foreground">{p.enrolled}</p><p className="text-xs text-muted-foreground">Enrolled</p></div>
                  <div className="text-center"><p className="font-bold text-foreground">{p.completed}</p><p className="text-xs text-muted-foreground">Completed</p></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Referrals</CardTitle>
          <Link to="/frn/intake" className="text-xs text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No referrals yet</p>
          ) : (
            <div className="space-y-2">
              {referrals.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.participant_name}</p>
                    <p className="text-xs text-muted-foreground">{PROGRAM_LABELS[r.program] || r.program}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}