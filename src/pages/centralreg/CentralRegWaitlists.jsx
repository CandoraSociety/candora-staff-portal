import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowUp, X, ListOrdered } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { REG_AREA_OPTIONS, REG_AREA_LABELS, WAITLIST_ACTIONS, AREA_STATUS_OPTIONS } from '@/lib/centralRegConstants';

// Aggregated waitlist manager. Promote/Remove actions write back to the same
// records each portal reads, so both views always match.
export default function CentralRegWaitlists() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [areaFilter, setAreaFilter] = useState('all');

  const { data: communityRegs = [], isLoading } = useQuery({ queryKey: ['cr-community-regs'], queryFn: () => base44.entities.CommunityRegistration.list('-registration_date', 500) });
  const { data: empowerRegs = [] } = useQuery({ queryKey: ['cr-empower-regs'], queryFn: () => base44.entities.EmpowerURegistration.list('-registration_date', 500) });
  const { data: digilitParticipants = [] } = useQuery({ queryKey: ['cr-digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500) });
  const { data: ellLearners = [] } = useQuery({ queryKey: ['cr-ell-learners'], queryFn: () => base44.entities.ELLLearner.list('-created_date', 500) });
  const { data: phacParticipants = [] } = useQuery({ queryKey: ['cr-phac-participants'], queryFn: () => base44.entities.PHACParticipant.list('-created_date', 500) });
  const { data: programRegs = [] } = useQuery({ queryKey: ['reception-registrations'], queryFn: () => base44.entities.ProgramRegistration.list('-registration_date', 500) });
  const { data: volunteers = [] } = useQuery({ queryKey: ['cr-volunteers'], queryFn: () => base44.entities.Volunteer.list('-created_date', 500) });

  const rows = useMemo(() => {
    const wl = [];
    communityRegs.filter(r => r.status === 'waitlisted').forEach(r => wl.push({ key: `c-${r.id}`, area: 'community', id: r.id, name: r.participant_name, program: r.program_name, position: null, date: r.registration_date }));
    empowerRegs.filter(r => r.status === 'waitlisted').forEach(r => wl.push({ key: `e-${r.id}`, area: 'empoweru', id: r.id, name: r.participant_name, program: r.cohort_name, position: r.waitlist_position, date: r.registration_date }));
    digilitParticipants.filter(p => p.status === 'waitlisted').forEach(p => wl.push({ key: `d-${p.id}`, area: 'digilit', id: p.id, name: `${p.first_name} ${p.last_name}`, program: 'Digital Literacy', position: null, date: p.registration_date }));
    ellLearners.filter(l => l.enrollment_status === 'waitlisted').forEach(l => wl.push({ key: `l-${l.id}`, area: 'ell', id: l.id, name: `${l.first_name} ${l.last_name}`, program: 'ELL Program', position: null, date: l.intake_date }));
    phacParticipants.filter(p => p.status === 'waitlisted').forEach(p => wl.push({ key: `ph-${p.id}`, area: 'phac', id: p.id, name: `${p.child_first_name} ${p.child_last_name}`, program: 'PHAC Programs (0-6)', position: null, date: p.first_visit_date }));
    programRegs.filter(r => r.status === 'waitlisted').forEach(r => wl.push({ key: `r-${r.id}`, area: r.program_name === 'Kids Gift Shop' ? 'kids_gift_shop' : 'reception', id: r.id, name: r.participant_name, program: r.program_name, position: r.waitlist_position || null, date: r.registration_date }));
    volunteers.filter(v => v.status === 'waitlist').forEach(v => wl.push({ key: `v-${v.id}`, area: 'volunteer', id: v.id, name: `${v.first_name} ${v.last_name}`, program: 'Volunteer Program', position: null, date: null }));
    return wl.sort((a, b) => (a.position || 99) - (b.position || 99));
  }, [communityRegs, empowerRegs, digilitParticipants, ellLearners, phacParticipants, programRegs, volunteers]);

  const filtered = rows.filter(r => areaFilter === 'all' || r.area === areaFilter);

  const apply = async (row, kind) => {
    const action = WAITLIST_ACTIONS[row.area];
    if (!action) return;
    try {
      const update = { status: kind === 'promote' ? action.promote : action.remove };
      if (kind === 'promote' && action.hasPosition) update.waitlist_position = 0;
      await base44.entities[action.entity].update(row.id, update);
      queryClient.invalidateQueries();
      toast({ title: kind === 'promote' ? 'Promoted off the waitlist' : 'Removed from the waitlist', description: `${row.name} — ${REG_AREA_LABELS[row.area]}` });
    } catch (err) {
      toast({ title: 'Error updating waitlist', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Waitlists</h1>
          <p className="text-muted-foreground text-sm mt-1">Everyone waiting for a spot, across all program areas. Promoting or removing someone here updates their record in the program's portal too.</p>
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}><SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All areas" /></SelectTrigger><SelectContent><SelectItem value="all">All program areas</SelectItem>{REG_AREA_OPTIONS.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
        filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <ListOrdered className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            No one is on a waitlist right now.
          </CardContent></Card>
        ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const area = REG_AREA_OPTIONS.find(a => a.key === r.area);
            return (
              <Card key={r.key} className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${area.color}1a`, color: area.color }}>{area.label}</span>
                      <p className="font-medium text-sm text-foreground truncate">{r.name}</p>
                      <StatusBadge status="waitlisted" options={[{ value: 'waitlisted', label: 'Waitlisted', color: '#a855f7' }]} />
                      {r.position ? <span className="text-xs text-muted-foreground">#{r.position}</span> : null}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{r.program || '—'}</span>
                      {r.date && <span>Since {new Date(r.date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => apply(r, 'promote')}><ArrowUp className="h-3.5 w-3.5" /> Promote</Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => apply(r, 'remove')}><X className="h-3.5 w-3.5" /> Remove</Button>
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
}