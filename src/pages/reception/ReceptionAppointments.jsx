import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/rc/StatusBadge';
import AppointmentDialog from '@/components/reception/AppointmentDialog';
import { APPT_STATUS_OPTIONS } from '@/lib/receptionConstants';
import { useToast } from '@/components/ui/use-toast';

export default function ReceptionAppointments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery({ queryKey: ['reception-appointments'], queryFn: () => base44.entities.ReceptionAppointment.list('-appointment_date', 200) });

  const filtered = appointments.filter(a => {
    const matchSearch = (a.visitor_name || '').toLowerCase().includes(search.toLowerCase()) || (a.staff_member || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (a) => { setEditing(a); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['reception-appointments'] }); };

  const handleCheckIn = async (appt) => {
    try {
      await base44.entities.ReceptionAppointment.update(appt.id, { status: 'checked_in', check_in_time: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ['reception-appointments'] });
      toast({ title: `${appt.visitor_name} checked in` });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Appointments</h1><p className="text-muted-foreground text-sm mt-1">Manage visitor appointments</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Appointment</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by visitor or staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{APPT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{appointments.length === 0 ? 'No appointments yet.' : 'No appointments match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(a => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm text-foreground truncate">{a.visitor_name}</p><StatusBadge status={a.status} options={APPT_STATUS_OPTIONS} /></div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{new Date(a.appointment_date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  {a.staff_member && <span>Visiting: {a.staff_member}</span>}
                  {a.purpose && <span>{a.purpose}</span>}
                  {a.visitor_phone && <span>{a.visitor_phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {a.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => handleCheckIn(a)}><CheckCircle className="h-4 w-4" /> Check In</Button>}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <AppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} appointment={editing} onSaved={onSaved} />
    </div>
  );
}