import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ClipboardList, Users, ListOrdered, HeartHandshake, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/rc/StatusBadge';
import { REG_STATUS_OPTIONS } from '@/lib/receptionConstants';
import { REG_AREA_OPTIONS, REG_AREA_LABELS, REG_AREA_PATHS } from '@/lib/centralRegConstants';

export default function CentralRegDashboard() {
  const queryClient = useQueryClient();

  const { data: communityRegs = [], isLoading } = useQuery({ queryKey: ['cr-community-regs'], queryFn: () => base44.entities.CommunityRegistration.list('-registration_date', 500) });
  const { data: empowerRegs = [] } = useQuery({ queryKey: ['cr-empower-regs'], queryFn: () => base44.entities.EmpowerURegistration.list('-registration_date', 500) });
  const { data: digilitParticipants = [] } = useQuery({ queryKey: ['cr-digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500) });
  const { data: ellLearners = [] } = useQuery({ queryKey: ['cr-ell-learners'], queryFn: () => base44.entities.ELLLearner.list('-created_date', 500) });
  const { data: phacParticipants = [] } = useQuery({ queryKey: ['cr-phac-participants'], queryFn: () => base44.entities.PHACParticipant.list('-created_date', 500) });
  const { data: programRegs = [] } = useQuery({ queryKey: ['reception-registrations'], queryFn: () => base44.entities.ProgramRegistration.list('-registration_date', 500) });
  const { data: volunteers = [] } = useQuery({ queryKey: ['cr-volunteers'], queryFn: () => base44.entities.Volunteer.list('-created_date', 500) });

  const pendingApprovals = programRegs.filter(r => r.status === 'pending_approval');
  const waitlistCount =
    communityRegs.filter(r => r.status === 'waitlisted').length +
    empowerRegs.filter(r => r.status === 'waitlisted').length +
    digilitParticipants.filter(r => r.status === 'waitlisted').length +
    programRegs.filter(r => r.status === 'waitlisted').length +
    volunteers.filter(v => v.status === 'waitlist').length;
  const volunteerApplications = volunteers.filter(v => v.status === 'pending');

  const areaCounts = {
    community: communityRegs.filter(r => ['registered', 'active'].includes(r.status)).length,
    empoweru: empowerRegs.filter(r => ['registered', 'enrolled'].includes(r.status)).length,
    phac: phacParticipants.length,
    ell: ellLearners.filter(l => ['prospective', 'enrolled', 'active'].includes(l.enrollment_status)).length,
    digilit: digilitParticipants.filter(p => ['registered', 'started'].includes(p.status)).length,
    reception: programRegs.filter(r => ['approved', 'enrolled'].includes(r.status)).length,
    kids_gift_shop: programRegs.filter(r => r.program_name === 'Kids Gift Shop' && ['approved', 'enrolled'].includes(r.status)).length,
    volunteer: volunteers.filter(v => ['pending', 'active', 'occasional'].includes(v.status)).length,
  };

  const stats = [
    { label: 'Pending Approvals', value: pendingApprovals.length, path: '/central-registration/registrations', icon: Users, tint: 'text-amber-600' },
    { label: 'On Waitlists', value: waitlistCount, path: '/central-registration/waitlists', icon: ListOrdered, tint: 'text-purple-600' },
    { label: 'Volunteer Applications', value: volunteerApplications.length, path: '/central-registration/volunteers', icon: HeartHandshake, tint: 'text-pink-600' },
    { label: 'Active Registrations', value: Object.entries(areaCounts).filter(([k]) => k !== 'volunteer').reduce((s, [, v]) => s + v, 0), path: '/central-registration/registrations', icon: ClipboardList, tint: 'text-blue-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Central Registration</h1>
        <p className="text-muted-foreground text-sm mt-1">Register participants for any program, manage waitlists, and process volunteer applications — all in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => { const Icon = s.icon; return (
          <Link key={s.label} to={s.path}>
            <Card className="hover:shadow-md transition-shadow h-full"><CardContent className="p-4">
              <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{s.label}</p><Icon className={`h-4 w-4 ${s.tint}`} /></div>
              <p className="text-3xl font-display font-bold text-foreground mt-1">{s.value}</p>
            </CardContent></Card>
          </Link>
        ); })}
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <>
          {pendingApprovals.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-sm text-foreground">Registrations Awaiting Approval</p>
                  <Link to="/central-registration/registrations"><Button size="sm" variant="ghost">View all<ExternalLink className="h-3.5 w-3.5" /></Button></Link>
                </div>
                <div className="space-y-2">
                  {pendingApprovals.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0"><p className="font-medium text-foreground truncate">{r.participant_name}</p><p className="text-xs text-muted-foreground truncate">{(REG_AREA_LABELS.reception)} — {r.program_name || 'Program pending'}</p></div>
                      <StatusBadge status={r.status} options={REG_STATUS_OPTIONS} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <p className="font-medium text-sm text-foreground mb-3">Registrations by Program Area</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {REG_AREA_OPTIONS.map(a => (
                <Link key={a.key} to="/central-registration/programs">
                  <Card className="hover:shadow-md transition-shadow h-full"><CardContent className="p-4 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-foreground">{a.label}</p><p className="text-2xl font-display font-bold text-foreground">{areaCounts[a.key] ?? 0}</p></div>
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${a.color}1a` }}><Users className="h-4 w-4" style={{ color: a.color }} /></div>
                  </CardContent></Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}