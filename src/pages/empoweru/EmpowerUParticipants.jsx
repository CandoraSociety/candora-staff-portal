import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Users, History, TestTube2 } from 'lucide-react';
import TestParticipantsDialog from '@/components/empoweru/TestParticipantsDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ParticipantCard from '@/components/empoweru/ParticipantCard';

// Registration statuses that mean the participant is still active in the program.
const ACTIVE_STATUSES = ['registered', 'waitlisted', 'enrolled'];
// A participant is "past" only when every cohort registration they have is closed out.
const CLOSED_STATUSES = ['completed', 'withdrawn', 'declined'];

export default function EmpowerUParticipants() {
  const [search, setSearch] = useState('');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading } = useQuery({ queryKey: ['empoweru-participants'], queryFn: () => base44.entities.EmpowerUParticipant.list() });
  const { data: registrations = [] } = useQuery({ queryKey: ['empoweru-registrations'], queryFn: () => base44.entities.EmpowerURegistration.list() });
  const { data: serviceLogs = [] } = useQuery({ queryKey: ['empoweru-service-logs-all'], queryFn: () => base44.entities.EmpowerUServiceLog.list() });
  const { data: accountSetups = [] } = useQuery({ queryKey: ['empoweru-account-setups'], queryFn: () => base44.entities.EmpowerUAccountSetup.list() });

  const matches = (p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) || (p.email || '').toLowerCase().includes(search.toLowerCase());
  const regsFor = (id) => registrations.filter(r => r.participant_id === id);
  const followUpsFor = (id) => serviceLogs.filter(s => s.participant_id === id && s.follow_up_needed).length;
  const setupFor = (id) => accountSetups.filter(a => a.participant_id === id).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))[0] || null;

  const active = participants.filter(p => { const regs = regsFor(p.id); return regs.length === 0 || regs.some(r => ACTIVE_STATUSES.includes(r.status)); });
  const past = participants.filter(p => { const regs = regsFor(p.id); return regs.length > 0 && regs.every(r => CLOSED_STATUSES.includes(r.status)); });
  const activeFiltered = active.filter(matches);
  const pastFiltered = past.filter(matches);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['empoweru-service-logs-all'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups'] });
  };

  const renderCard = (p) => (
    <ParticipantCard
      key={p.id}
      participant={p}
      registrations={regsFor(p.id)}
      accountSetup={setupFor(p.id)}
      followUpsNeeded={followUpsFor(p.id)}
    />
  );

  const renderSection = (title, icon, list, emptyText, filtered) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-heading font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">({filtered.length})</span>
      </div>
      {filtered.length === 0
        ? <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">{emptyText}</CardContent></Card>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{list.map(renderCard)}</div>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Participants</h1>
          <p className="text-muted-foreground text-sm mt-1">All active and past EmpowerU participants, with program status and progress items. New profiles are created from the Intake tab.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTestDialogOpen(true)}><TestTube2 className="h-4 w-4" /> Test Participants</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
        <>
          {renderSection('Active Participants', <Users className="h-4 w-4 text-success" />, active,
            participants.length === 0 ? 'No participants yet — create one from the Intake tab.' : 'No active participants.', activeFiltered)}
          {renderSection('Past Participants', <History className="h-4 w-4 text-muted-foreground" />, past,
            'No past participants yet.', pastFiltered)}
        </>
      )}

      <TestParticipantsDialog open={testDialogOpen} onOpenChange={setTestDialogOpen} participants={participants} />
    </div>
  );
}