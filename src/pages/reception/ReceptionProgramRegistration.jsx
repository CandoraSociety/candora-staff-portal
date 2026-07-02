import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import ProgramRegistrationDialog from '@/components/reception/ProgramRegistrationDialog';
import { REG_STATUS_OPTIONS, PROGRAM_PORTAL_LABELS, PROGRAM_PORTAL_PATHS, ELIGIBILITY_LABELS } from '@/lib/receptionConstants';
import { useToast } from '@/components/ui/use-toast';

export default function ReceptionProgramRegistration() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [portalFilter, setPortalFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: registrations = [], isLoading } = useQuery({ queryKey: ['reception-registrations'], queryFn: () => base44.entities.ProgramRegistration.list('-registration_date', 200) });

  const filtered = registrations.filter(r => {
    const matchSearch = (r.participant_name || '').toLowerCase().includes(search.toLowerCase()) || (r.program_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchPortal = portalFilter === 'all' || r.program_portal === portalFilter;
    return matchSearch && matchStatus && matchPortal;
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['reception-registrations'] }); };

  const handleApprove = async (reg) => {
    try {
      await base44.entities.ProgramRegistration.update(reg.id, { status: 'approved', approval_date: new Date().toISOString().split('T')[0] });
      queryClient.invalidateQueries({ queryKey: ['reception-registrations'] });
      toast({ title: 'Registration approved' });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const handleDecline = async (reg) => {
    try {
      await base44.entities.ProgramRegistration.update(reg.id, { status: 'declined', approval_date: new Date().toISOString().split('T')[0] });
      queryClient.invalidateQueries({ queryKey: ['reception-registrations'] });
      toast({ title: 'Registration declined' });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Program Registration</h1><p className="text-muted-foreground text-sm mt-1">Register participants and manage approvals</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Registration</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by participant or program..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={portalFilter} onValueChange={setPortalFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All programs" /></SelectTrigger><SelectContent><SelectItem value="all">All programs</SelectItem>{Object.entries(PROGRAM_PORTAL_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{REG_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{registrations.length === 0 ? 'No registrations yet.' : 'No registrations match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm text-foreground truncate">{r.participant_name}</p><StatusBadge status={r.status} options={REG_STATUS_OPTIONS} /></div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{PROGRAM_PORTAL_LABELS[r.program_portal] || r.program_portal}{r.program_name ? ` — ${r.program_name}` : ''}</span>
                    <span>Registered: {new Date(r.registration_date).toLocaleDateString()}</span>
                    {r.eligibility_status && r.eligibility_status !== 'not_assessed' && <span>Eligibility: {ELIGIBILITY_LABELS[r.eligibility_status]}</span>}
                    {r.requires_approval && r.approver_name && <span>Approver: {r.approver_name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.status === 'pending_approval' && <>
                    <Button size="sm" variant="outline" onClick={() => handleApprove(r)} className="text-green-600"><CheckCircle className="h-4 w-4" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecline(r)} className="text-red-600"><XCircle className="h-4 w-4" /> Decline</Button>
                  </>}
                  {PROGRAM_PORTAL_PATHS[r.program_portal] && <Link to={PROGRAM_PORTAL_PATHS[r.program_portal]}><Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /> Portal</Button></Link>}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <ProgramRegistrationDialog open={dialogOpen} onOpenChange={setDialogOpen} registration={editing} onSaved={onSaved} />
    </div>
  );
}