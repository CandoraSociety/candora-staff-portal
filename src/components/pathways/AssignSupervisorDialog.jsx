import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

const PLACEMENT_TYPES = [
  { value: 'cleaning_arc',           label: 'Cleaning (ARC)' },
  { value: 'food_services_onsite',   label: 'Food Services (Onsite)' },
  { value: 'food_services_offsite',  label: 'Food Services (Offsite)' },
  { value: 'reception',              label: 'Reception' },
  { value: 'childcare',              label: 'Childcare' },
];

export default function AssignSupervisorDialog({ open, onOpenChange, onAssigned }) {
  const queryClient = useQueryClient();
  const [employees, setEmployees] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [clients, setClients] = useState([]);
  const [mode, setMode] = useState('existing');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [selectedTraining, setSelectedTraining] = useState('');
  const [newPlacement, setNewPlacement] = useState({
    client_id: '',
    placement_type: '',
    training_goals: '',
    referral_date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.entities.Employee.filter({ status: 'active' }),
      base44.entities.InternalTraining.list('-referral_date', 200),
      base44.entities.Client.filter({ status: 'active' }),
    ]).then(([emps, trains, cls]) => {
      setEmployees(emps.filter(e => e.user_id));
      setTrainings(trains);
      setClients(cls);
    }).catch(() => toast.error('Failed to load data'));
  }, [open]);

  const handleAssign = async () => {
    if (!selectedSupervisor) { toast.error('Select a supervisor'); return; }
    const emp = employees.find(e => e.id === selectedSupervisor);
    if (!emp) return;

    setSaving(true);
    try {
      const supervisorName = `${emp.first_name} ${emp.last_name}`;
      if (mode === 'existing') {
        if (!selectedTraining) { toast.error('Select a placement'); return; }
        await base44.entities.InternalTraining.update(selectedTraining, {
          supervisor_email: emp.email,
          supervisor_name: supervisorName,
        });
      } else {
        if (!newPlacement.client_id || !newPlacement.placement_type) {
          toast.error('Client and placement type required');
          return;
        }
        const client = clients.find(c => c.id === newPlacement.client_id);
        await base44.entities.InternalTraining.create({
          ...newPlacement,
          client_name: `${client.first_name} ${client.last_name}`,
          supervisor_email: emp.email,
          supervisor_name: supervisorName,
          status: 'referred',
        });
      }
      toast.success('Supervisor assigned to placement');
      queryClient.invalidateQueries({ queryKey: ['pathways-trainings'] });
      onAssigned?.();
      onOpenChange(false);
      setSelectedSupervisor('');
      setSelectedTraining('');
      setNewPlacement({ client_id: '', placement_type: '', training_goals: '', referral_date: new Date().toISOString().split('T')[0] });
    } catch {
      toast.error('Failed to assign supervisor');
    }
    setSaving(false);
  };

  const unassignedTrainings = trainings.filter(t => !t.supervisor_email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign Supervisor to Placement</DialogTitle>
          <DialogDescription>
            Select a staff member with a user account and assign them to an existing or new internal training placement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Supervisor selection */}
          <div>
            <Label className="text-xs font-semibold">Supervisor (staff with user account)</Label>
            <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select supervisor..." /></SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} — {emp.position || emp.department || 'Staff'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {employees.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No active employees with user accounts found.</p>
            )}
          </div>

          {/* Mode tabs */}
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="existing">Existing Placement</TabsTrigger>
              <TabsTrigger value="new">New Placement</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="mt-3">
              <Label className="text-xs font-semibold">Select Placement</Label>
              <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select placement..." /></SelectTrigger>
                <SelectContent>
                  {unassignedTrainings.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.client_name} — {PLACEMENT_TYPES.find(p => p.value === t.placement_type)?.label || t.placement_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unassignedTrainings.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">All placements have supervisors assigned. Create a new one instead.</p>
              )}
            </TabsContent>

            <TabsContent value="new" className="mt-3 space-y-3">
              <div>
                <Label className="text-xs font-semibold">Client</Label>
                <Select value={newPlacement.client_id} onValueChange={v => setNewPlacement(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Placement Type</Label>
                <Select value={newPlacement.placement_type} onValueChange={v => setNewPlacement(p => ({ ...p, placement_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {PLACEMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Training Goals</Label>
                <Textarea
                  value={newPlacement.training_goals}
                  onChange={e => setNewPlacement(p => ({ ...p, training_goals: e.target.value }))}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Referral Date</Label>
                <Input
                  type="date"
                  value={newPlacement.referral_date}
                  onChange={e => setNewPlacement(p => ({ ...p, referral_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={saving}>
            {saving ? 'Assigning...' : 'Assign Supervisor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}