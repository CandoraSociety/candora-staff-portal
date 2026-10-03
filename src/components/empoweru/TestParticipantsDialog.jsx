import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus } from 'lucide-react';
import { TEST_PARTICIPANT_BG, TEST_PARTICIPANT_TEXT, TEST_PARTICIPANT_MUTED, isTestParticipant, generateTestParticipantData } from '@/lib/empoweruTestClients';

// Create and delete EmpowerU test participants. Deleting a test participant
// also removes their registrations, service logs and account setup records.
export default function TestParticipantsDialog({ open, onOpenChange, participants = [] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const testParticipants = participants.filter(isTestParticipant);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['empoweru-participants'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-registrations'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-service-logs-all'] });
    queryClient.invalidateQueries({ queryKey: ['empoweru-account-setups'] });
  };

  const createTestParticipant = async () => {
    setBusy(true);
    try {
      const data = generateTestParticipantData();
      await base44.entities.EmpowerUParticipant.create(data);
      refresh();
      toast({ title: 'Test participant created', description: `${data.first_name} ${data.last_name}` });
    } catch (err) {
      toast({ title: 'Error creating test participant', description: err.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const deleteTestParticipant = async (p, related = {}) => {
    setBusy(true);
    try {
      await Promise.all([
        ...related.registrations.map(r => base44.entities.EmpowerURegistration.delete(r.id)),
        ...related.serviceLogs.map(s => base44.entities.EmpowerUServiceLog.delete(s.id)),
        ...related.accountSetups.map(a => base44.entities.EmpowerUAccountSetup.delete(a.id)),
        base44.entities.EmpowerUParticipant.delete(p.id),
      ]);
      refresh();
      toast({ title: 'Test participant deleted', description: `${p.first_name} ${p.last_name}` });
    } catch (err) {
      toast({ title: 'Error deleting test participant', description: err.message, variant: 'destructive' });
      refresh();
    } finally { setBusy(false); }
  };

  const deleteAll = async () => {
    if (!window.confirm(`Delete all ${testParticipants.length} test participants (and their registrations, service logs and account setups)? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const [registrations, serviceLogs, accountSetups] = await Promise.all([
        base44.entities.EmpowerURegistration.list(),
        base44.entities.EmpowerUServiceLog.list(),
        base44.entities.EmpowerUAccountSetup.list(),
      ]);
      const ids = new Set(testParticipants.map(p => p.id));
      const relatedFor = (id) => ({
        registrations: registrations.filter(r => r.participant_id === id),
        serviceLogs: serviceLogs.filter(s => s.participant_id === id),
        accountSetups: accountSetups.filter(a => a.participant_id === id),
      });
      await Promise.all(testParticipants.map(p => {
        const related = relatedFor(p.id);
        return Promise.all([
          ...related.registrations.map(r => base44.entities.EmpowerURegistration.delete(r.id)),
          ...related.serviceLogs.map(s => base44.entities.EmpowerUServiceLog.delete(s.id)),
          ...related.accountSetups.map(a => base44.entities.EmpowerUAccountSetup.delete(a.id)),
          base44.entities.EmpowerUParticipant.delete(p.id),
        ]);
      }));
      refresh();
      toast({ title: 'All test participants deleted', description: `${testParticipants.length} participant${testParticipants.length === 1 ? '' : 's'} removed` });
    } catch (err) {
      toast({ title: 'Error deleting test participants', description: err.message, variant: 'destructive' });
      refresh();
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Test Participants</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">Create realistic test participants for trying out the portal. Deleting a test participant also removes their registrations, service logs and account setups.</p>
        <Button onClick={createTestParticipant} disabled={busy}><Plus className="h-4 w-4" /> Create Test Participant</Button>
        <div className="space-y-2">
          {testParticipants.length === 0 && <p className="text-sm text-muted-foreground py-2">No test participants yet.</p>}
          {testParticipants.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-md px-3 py-2" style={{ backgroundColor: TEST_PARTICIPANT_BG }}>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate block text-left" style={{ color: TEST_PARTICIPANT_TEXT }}>{p.first_name} {p.last_name}</p>
                <p className="text-xs truncate" style={{ color: TEST_PARTICIPANT_MUTED }}>{[p.email, p.phone].filter(Boolean).join(' · ') || 'No contact info'}</p>
              </div>
              <Button size="sm" variant="destructive" className="flex-shrink-0" disabled={busy} onClick={() => {
                Promise.all([
                  base44.entities.EmpowerURegistration.list(),
                  base44.entities.EmpowerUServiceLog.list(),
                  base44.entities.EmpowerUAccountSetup.list(),
                ]).then(([registrations, serviceLogs, accountSetups]) => deleteTestParticipant(p, {
                  registrations: registrations.filter(r => r.participant_id === p.id),
                  serviceLogs: serviceLogs.filter(s => s.participant_id === p.id),
                  accountSetups: accountSetups.filter(a => a.participant_id === p.id),
                }));
              }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
            </div>
          ))}
        </div>
        {testParticipants.length > 0 && (
          <DialogFooter>
            <Button variant="destructive" onClick={deleteAll} disabled={busy}><Trash2 className="h-3.5 w-3.5" /> {busy ? 'Working...' : 'Delete All Test Participants'}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}