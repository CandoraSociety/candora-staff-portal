import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppointmentDialog from '@/components/rc/AppointmentDialog';
import StatusBadge from '@/components/rc/StatusBadge';
import { APPOINTMENT_STATUS_OPTIONS, LOCATION_TYPE_LABELS } from '@/lib/rcConstants';

export default function RCAppointments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({ queryKey: ['rc-appointments'], queryFn: () => base44.entities.RCAppointment.list('-appointment_date', 200) });

  const filtered = appointments.filter(a => {
    const matchSearch = (a.client_name || '').toLowerCase().includes(search.toLowerCase()) || (a.purpose || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Appointments</h1><p className="text-muted-foreground text-sm mt-1">Schedule and track client appointments. Reminders sent automatically 24h prior.</p></div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Schedule</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by client or purpose..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{APPOINTMENT_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
      </div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{appointments.length === 0 ? 'No appointments yet.' : 'No appointments match your filters.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(a => (
            <Card key={a.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm text-foreground truncate">{a.client_name}</p><StatusBadge status={a.status} options={APPOINTMENT_STATUS_OPTIONS} /></div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{new Date(a.appointment_date).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  <span>{LOCATION_TYPE_LABELS[a.location_type] || a.location_type}</span>
                  {a.location_detail && <span>{a.location_detail}</span>}
                  {a.purpose && <span>{a.purpose}</span>}
                  {a.reminder_sent && <span className="text-green-600">Reminder sent</span>}
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <AppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['rc-appointments'] }); }} />
    </div>
  );
}