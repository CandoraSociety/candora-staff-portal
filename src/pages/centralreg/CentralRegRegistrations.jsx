import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { REG_AREA_OPTIONS, REG_AREA_LABELS, REG_AREA_PATHS, AREA_STATUS_OPTIONS, AREA_ENTITIES, AREA_STATUS_LABELS } from '@/lib/centralRegConstants';

// Unified view across every registration store. Each row links back to the
// entity its own portal uses, so status changes made here show up there too.
export default function CentralRegRegistrations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');

  const { data: communityRegs = [], isLoading } = useQuery({ queryKey: ['cr-community-regs'], queryFn: () => base44.entities.CommunityRegistration.list('-registration_date', 500) });
  const { data: empowerRegs = [] } = useQuery({ queryKey: ['cr-empower-regs'], queryFn: () => base44.entities.EmpowerURegistration.list('-registration_date', 500) });
  const { data: digilitParticipants = [] } = useQuery({ queryKey: ['cr-digilit-participants'], queryFn: () => base44.entities.DigiLitParticipant.list('-registration_date', 500) });
  const { data: ellLearners = [] } = useQuery({ queryKey: ['cr-ell-learners'], queryFn: () => base44.entities.ELLLearner.list('-created_date', 500) });
  const { data: phacParticipants = [] } = useQuery({ queryKey: ['cr-phac-participants'], queryFn: () => base44.entities.PHACParticipant.list('-created_date', 500) });
  const { data: programRegs = [] } = useQuery({ queryKey: ['reception-registrations'], queryFn: () => base44.entities.ProgramRegistration.list('-registration_date', 500) });

  const rows = useMemo(() => [
    ...communityRegs.map(r => ({ key: `c-${r.id}`, area: 'community', id: r.id, name: r.participant_name, program: r.program_name, date: r.registration_date, status: r.status })),
    ...empowerRegs.map(r => ({ key: `e-${r.id}`, area: 'empoweru', id: r.id, name: r.participant_name, program: r.cohort_name, date: r.registration_date, status: r.status })),
    ...digilitParticipants.map(p => ({ key: `d-${p.id}`, area: 'digilit', id: p.id, name: `${p.first_name} ${p.last_name}`, program: 'Digital Literacy', date: p.registration_date, status: p.status })),
    ...ellLearners.map(l => ({ key: `l-${l.id}`, area: 'ell', id: l.id, name: `${l.first_name} ${l.last_name}`, program: l.assigned_class_name || 'ELL Program', date: l.intake_date, status: l.enrollment_status })),
    ...phacParticipants.map(p => ({ key: `p-${p.id}`, area: 'phac', id: p.id, name: `${p.child_first_name} ${p.child_last_name}`, program: 'PHAC Programs (0-6)', date: p.first_visit_date, status: null })),
    ...programRegs.map(r => ({ key: `r-${r.id}`, area: 'reception', id: r.id, name: r.participant_name, program: r.program_name, date: r.registration_date, status: r.status })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [communityRegs, empowerRegs, digilitParticipants, ellLearners, phacParticipants, programRegs]);

  const filtered = rows.filter(r => {
    const matchSearch = !search || (r.name || '').toLowerCase().includes(search.toLowerCase()) || (r.program || '').toLowerCase().includes(search.toLowerCase());
    const matchArea = areaFilter === 'all' || r.area === areaFilter;
    return matchSearch && matchArea;
  });

  const handleStatusChange = async (row, newStatus) => {
    try {
      const entity = AREA_ENTITIES[row.area];
      const update = row.area === 'ell' ? { enrollment_status: newStatus } : { status: newStatus };
      await base44.entities[entity].update(row.id, update);
      queryClient.invalidateQueries();
      toast({ title: 'Status updated', description: `${row.name} → ${AREA_STATUS_LABELS[row.area]?.[newStatus] || newStatus}` });
    } catch (err) {
      toast({ title: 'Error updating status', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">All Registrations</h1>
        <p className="text-muted-foreground text-sm mt-1">Every registration across all program areas. Changes made here update the program's own portal immediately.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by participant or program..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={areaFilter} onValueChange={setAreaFilter}><SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All areas" /></SelectTrigger><SelectContent><SelectItem value="all">All program areas</SelectItem>{REG_AREA_OPTIONS.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
        filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">No registrations match your filters.</CardContent></Card> : (
        <div className="space-y-2">
          {filtered.map(r => {
            const area = REG_AREA_OPTIONS.find(a => a.key === r.area);
            const statusOptions = AREA_STATUS_OPTIONS[r.area];
            return (
              <Card key={r.key} className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${area.color}1a`, color: area.color }}>{area.label}</span>
                      <p className="font-medium text-sm text-foreground truncate">{r.name}</p>
                      {r.status ? <StatusBadge status={r.status} options={statusOptions || []} /> : <span className="text-xs text-muted-foreground">Participant</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{r.program || '—'}</span>
                      {r.date && <span>Registered: {new Date(r.date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {statusOptions && (
                      <Select value={r.status || ''} onValueChange={(v) => handleStatusChange(r, v)}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
                        <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                    <Link to={REG_AREA_PATHS[r.area]}><Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button></Link>
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