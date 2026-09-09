import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ClientFormCore from '@/components/rc/ClientFormCore';
import { CASEWORK_REASON_OPTIONS } from '@/lib/rcConstants';
import { useToast } from '@/components/ui/use-toast';
import { todayStr } from '@/lib/rcClientVisits';

const CLIENT_FIELDS = [
  'first_name', 'last_name', 'date_of_birth', 'phone', 'email', 'address', 'city', 'postal_code',
  'preferred_language', 'additional_languages', 'emergency_contact_name', 'emergency_contact_phone',
  'service_category', 'has_children_0_6', 'children_count_0_6', 'children_ages_detail',
  'english_proficiency', 'english_proficiency_notes', 'indigenous_first_nations', 'newcomer',
  'senior', 'youth_under_25', 'reason_for_accessing', 'reason_for_accessing_other',
  'identified_needs', 'assigned_worker', 'case_status', 'intake_date', 'referral_source', 'notes',
];

// Drop-in casework and scheduled visits — collects the same information as the
// Central Database intake form, then routes the visit to the assigned caseworker.
export default function CaseworkVisitDialog({ open, onOpenChange, client, mode, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: caseworkers = [] } = useQuery({
    queryKey: ['rc-caseworkers'],
    queryFn: () => base44.entities.RCCaseworker.list(),
    enabled: open,
  });
  const { data: appointments = [] } = useQuery({
    queryKey: ['rc-appts-client', client?.id],
    queryFn: () => base44.entities.RCAppointment.filter({ client_id: client.id }),
    enabled: open && !!client && mode === 'scheduled',
  });

  // Next upcoming (or today's) scheduled appointment — its worker is auto-assigned
  const scheduledAppt = useMemo(() => {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const upcoming = (appointments || [])
      .filter(a => a.status !== 'cancelled' && a.appointment_date && new Date(a.appointment_date) >= startOfToday)
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    return upcoming[0] || null;
  }, [appointments]);

  useEffect(() => {
    if (open && client) {
      setForm(CLIENT_FIELDS.reduce((acc, f) => ({ ...acc, [f]: client[f] ?? '' }), {}));
      setDurationMinutes(0);
    }
  }, [open, client]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) { toast({ title: 'First and last name are required', variant: 'destructive' }); return; }
    if (!form.service_category) { toast({ title: 'Service category is required', variant: 'destructive' }); return; }
    if (mode === 'scheduled' && !scheduledAppt) { toast({ title: 'No upcoming scheduled appointment found for this client', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const workerName = (mode === 'scheduled' ? scheduledAppt?.worker_name : form.assigned_worker || client.assigned_worker || '').trim();
      const caseworker = caseworkers.find(c => (c.display_name || '').toLowerCase() === workerName.toLowerCase());
      const clientName = `${form.first_name} ${form.last_name}`.trim();
      await base44.entities.RCClient.update(client.id, form);
      await base44.entities.RCClientVisit.create({
        client_id: client.id,
        client_name: clientName,
        visit_date: todayStr(),
        visit_type: mode,
        duration_minutes: durationMinutes || 0,
        intake_snapshot: { ...form },
        caseworker_name: workerName,
        caseworker_email: caseworker?.staff_email || '',
        appointment_id: mode === 'scheduled' ? scheduledAppt?.id || '' : '',
        status: 'pending',
        created_by_name: 'Reception',
      });
      toast({
        title: mode === 'scheduled' ? 'Scheduled visit logged' : 'Drop-in casework visit logged',
        description: workerName ? `Added to ${workerName}'s worker dashboard` : 'No caseworker assigned — set one on the client profile',
      });
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast({ title: 'Error logging visit', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'scheduled' ? 'Scheduled Visit' : 'Drop-In Casework'}</DialogTitle>
        </DialogHeader>
        {mode === 'scheduled' && (
          <Alert className={scheduledAppt ? '' : 'border-destructive/40'}>
            <CalendarClock className="h-4 w-4" />
            <AlertTitle>
              {scheduledAppt
                ? `${new Date(scheduledAppt.appointment_date).toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} with ${scheduledAppt.worker_name || 'assigned worker'}${scheduledAppt.purpose ? ` — ${scheduledAppt.purpose}` : ''}`
                : 'No upcoming scheduled appointment found for this client. Book one from the client profile first.'}
            </AlertTitle>
          </Alert>
        )}
        <ClientFormCore form={form} update={update} reasonOptions={CASEWORK_REASON_OPTIONS} reasonLabel="Reason for Visit" />
        <div className="space-y-1.5 mt-3">
          <Label htmlFor="visit-duration">Hours of Service (minutes)</Label>
          <Input
            id="visit-duration"
            type="number"
            min="0"
            value={durationMinutes || ''}
            placeholder="e.g. 45"
            onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Submitting...' : 'Submit'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}