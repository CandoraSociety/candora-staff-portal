import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import ProgramDialog from '@/components/community/ProgramDialog';
import { PROGRAM_CATEGORY_OPTIONS, PROGRAM_STATUS_OPTIONS, FUNDER_CATEGORY_OPTIONS, FUNDER_CATEGORY_LABELS } from '@/lib/communityConstants';

export default function CommunityPrograms() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({ queryKey: ['community-programs'], queryFn: () => base44.entities.CommunityProgram.list('name', 200) });
  const { data: registrations = [] } = useQuery({ queryKey: ['community-registrations-all'], queryFn: () => base44.entities.CommunityRegistration.list('-registration_date', 500) });
  const { data: sessions = [] } = useQuery({ queryKey: ['community-sessions'], queryFn: () => base44.entities.CommunitySession.list('-session_date', 200) });

  const filtered = programs.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['community-programs'] }); };

  const getRegCount = (programId) => registrations.filter(r => r.program_id === programId && r.status !== 'withdrawn').length;
  const getSessionCount = (programId) => sessions.filter(s => s.program_id === programId).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Programs</h1><p className="text-muted-foreground text-sm mt-1">Manage all occasional and volunteer-run programs</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Program</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All categories" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{PROGRAM_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{PROGRAM_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{programs.length === 0 ? 'No programs yet. Create your first one!' : 'No programs match your filters.'}</CardContent></Card> :
      (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => {
            const cat = PROGRAM_CATEGORY_OPTIONS.find(c => c.value === p.category);
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow"><CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1"><span className="text-xl">{cat?.icon}</span><div className="min-w-0"><p className="font-medium text-sm text-foreground truncate">{p.name}</p><p className="text-xs text-muted-foreground">{cat?.label}</p></div></div>
                  <StatusBadge status={p.status} options={PROGRAM_STATUS_OPTIONS} />
                </div>
                {p.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {p.schedule_description && <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.schedule_description}</p>}
                  {p.lead_facilitator_name && <p>Lead: {p.lead_facilitator_name}</p>}
                  {p.is_volunteer_run && <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Volunteer-run</span>}
                  {p.funder_category && p.funder_category !== 'none' && <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 ml-1">Funder: {FUNDER_CATEGORY_LABELS[p.funder_category]}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {getRegCount(p.id)} registered</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {getSessionCount(p.id)} sessions</span>
                  <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <ProgramDialog open={dialogOpen} onOpenChange={setDialogOpen} program={editing} onSaved={onSaved} />
    </div>
  );
}