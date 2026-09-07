import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppointmentsCalendar from '@/components/rc/AppointmentsCalendar';
import AppointmentDialog from '@/components/rc/AppointmentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Worker-scoped appointments calendar — defaults to the logged-in worker's own
// appointments across all their clients, with a switch to view another worker
// or everyone's appointments at once.
export default function WorkerAppointmentsPanel() {
  const queryClient = useQueryClient();
  const [workerFilter, setWorkerFilter] = useState('mine');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['rc-appointments'],
    queryFn: () => base44.entities.RCAppointment.list('-appointment_date', 200),
  });

  const workers = [...new Set(appointments.map(a => a.worker_name).filter(Boolean))].sort();

  const filtered = workerFilter === 'all'
    ? appointments
    : workerFilter === 'mine'
      ? appointments.filter(a => a.worker_name === me?.full_name)
      : appointments.filter(a => a.worker_name === workerFilter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={workerFilter} onValueChange={setWorkerFilter}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mine">My appointments</SelectItem>
            {workers.filter(w => w !== me?.full_name).map(w => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
            <SelectItem value="all">All workers</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Schedule
        </Button>
      </div>
      {isLoading
        ? <div className="text-center py-8 text-muted-foreground">Loading...</div>
        : <AppointmentsCalendar appointments={filtered} />}
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['rc-appointments'] }); }}
      />
    </div>
  );
}