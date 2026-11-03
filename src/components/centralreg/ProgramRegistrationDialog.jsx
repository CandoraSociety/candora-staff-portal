import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Hourglass, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import UniversalRegistrationDialog from '@/components/centralreg/UniversalRegistrationDialog';
import ELLWaitlistCard from '@/components/ell/ELLWaitlistCard';
import WaitlistEntryCard from '@/components/empoweru/WaitlistEntryCard';
import { REG_AREA_LABELS } from '@/lib/centralRegConstants';
import { ELL_CLB_LABELS } from '@/lib/ellConstants';

const asList = (res) => (Array.isArray(res) ? res : res?.items || []);

// One register button, three jobs: take a brand-new registration (which lands on
// the waitlist while anyone is already waiting), hand a seat to someone already
// waiting, and open that person's profile card with their waitlist details.
export default function ProgramRegistrationDialog({ open, onOpenChange, area, program, onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [seatingId, setSeatingId] = useState(null);

  const isEll = area === 'ell';

  const { data: ellWaiters = [] } = useQuery({
    queryKey: ['cr-ell-waitlist'],
    queryFn: async () => asList(await base44.entities.ELLLearner.filter({ enrollment_status: 'waitlisted' }, { limit: 500 })),
    enabled: open && isEll,
  });

  const { data: empowerWaiters = [] } = useQuery({
    queryKey: ['cr-empoweru-waitlist'],
    queryFn: async () => asList(await base44.entities.EmpowerURegistration.filter({ status: 'waitlisted' }, { limit: 500 })),
    enabled: open && !isEll,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['cr-empoweru-participants'],
    queryFn: async () => asList(await base44.entities.EmpowerUParticipant.list({ limit: 2000 })),
    enabled: open && !isEll,
  });

  // Same shape the ELL waitlist page builds, so the shared profile card reads it.
  const waitlist = useMemo(() => {
    const rows = isEll
      ? ellWaiters.map((l) => ({
          id: l.id,
          first_name: l.first_name,
          last_name: l.last_name,
          full_name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
          date_of_birth: l.date_of_birth,
          phone: l.phone,
          email: l.email,
          country_of_origin: l.country_of_origin,
          first_language: l.first_language,
          other_languages: l.other_languages,
          clb_label: ELL_CLB_LABELS[l.clb_level] || null,
          interested_course_name: l.interested_course_name,
          date_added: l.waitlist_date || l.intake_date || l.created_date,
          intake_date: l.intake_date,
          referral_source: l.referral_source,
          waitlist_status: l.waitlist_status || 'waiting',
          last_contact_note: l.last_contact_note,
          last_contacted_date: l.last_contacted_date,
          follow_up_date: l.follow_up_date,
          notes: l.notes,
          progress_notes: l.progress_notes,
        }))
      : empowerWaiters.map((r) => {
          const participant = participants.find((p) => p.id === r.participant_id);
          const parts = (r.participant_name || '').trim().split(/\s+/).filter(Boolean);
          const first = participant?.first_name || parts[0] || '';
          const last = participant?.last_name || parts.slice(1).join(' ') || '';
          return {
            id: r.id,
            registrationId: r.id,
            cohort_id: r.cohort_id,
            cohort_name: r.cohort_name,
            first_name: first,
            last_name: last,
            full_name: `${first} ${last}`.trim() || 'Unknown',
            phone: participant?.phone,
            email: participant?.email,
            date_added: r.registration_date || r.created_date,
            waitlist_status: r.waitlist_status || 'waiting',
            waitlist_position: r.waitlist_position,
            preferred_delivery_mode: r.preferred_delivery_mode,
            accommodation_needs: r.accommodation_needs,
            intake_notes: r.intake_notes,
            notes: r.notes,
            last_contact_note: r.last_contact_note,
            last_contacted_date: r.last_contacted_date,
            follow_up_date: r.follow_up_date,
            participant,
          };
        });
    return [...rows].sort((a, b) => new Date(a.date_added || 0) - new Date(b.date_added || 0));
  }, [isEll, ellWaiters, empowerWaiters, participants]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cr-ell-waitlist'] });
    queryClient.invalidateQueries({ queryKey: ['cr-empoweru-waitlist'] });
    onSaved?.();
  };

  // Hand a seat to someone already waiting — they move off the waitlist into
  // this class/cohort with the same record, so nothing is entered twice.
  const giveSeat = async (entry) => {
    setSeatingId(entry.id);
    try {
      if (isEll) {
        await base44.entities.ELLLearner.update(entry.id, {
          enrollment_status: 'enrolled',
          assigned_class_id: program?.id || null,
          assigned_class_name: program?.name || null,
          interested_course_id: program?.id || null,
          interested_course_name: program?.name || null,
        });
      } else {
        await base44.entities.EmpowerURegistration.update(entry.registrationId, {
          status: 'registered',
          waitlist_position: 0,
          cohort_id: program?.id || entry.cohort_id,
          cohort_name: program?.name || entry.cohort_name,
        });
      }
      toast({
        title: isEll ? 'Learner added to the class' : 'Participant registered',
        description: `${entry.full_name} — ${program?.name || REG_AREA_LABELS[area]}`,
      });
      refresh();
    } catch (err) {
      toast({ title: 'Could not update the registration', description: err.message, variant: 'destructive' });
    } finally {
      setSeatingId(null);
    }
  };

  const areaLabel = REG_AREA_LABELS[area] || 'program';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register — {program?.name || areaLabel}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-border bg-muted/40 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {waitlist.length === 0
                    ? `No one is waiting for ${areaLabel}`
                    : `${waitlist.length} ${waitlist.length === 1 ? 'person is' : 'people are'} on the ${areaLabel} waitlist`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {waitlist.length === 0
                    ? 'New registrations go straight into the program.'
                    : 'New registrations are held on the waitlist. Enter the override code in the form to give a spot right away.'}
                </p>
              </div>
              <Button onClick={() => setNewOpen(true)} className="flex-shrink-0">
                <UserPlus className="h-4 w-4" /> Register someone new
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Hourglass className="h-4 w-4 text-muted-foreground" /> On the waitlist ({waitlist.length})
              </p>
              {waitlist.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nobody is waiting right now.</p>
              ) : (
                <div className="space-y-3">
                  {waitlist.map((entry, index) => (
                    <div key={entry.id} className="space-y-1.5">
                      {isEll ? (
                        <ELLWaitlistCard
                          entry={entry}
                          shaded={index % 2 === 1}
                          position={index + 1}
                          expanded={expandedId === entry.id}
                          onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        />
                      ) : (
                        <WaitlistEntryCard
                          entry={entry}
                          shaded={index % 2 === 1}
                          position={index + 1}
                          expanded={expandedId === entry.id}
                          onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        />
                      )}
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" disabled={seatingId === entry.id} onClick={() => giveSeat(entry)}>
                          <Check className="h-3.5 w-3.5" />
                          {seatingId === entry.id ? 'Adding…' : isEll ? 'Add to this class' : 'Register for this cohort'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UniversalRegistrationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        area={area}
        program={program}
        autoWaitlist={waitlist.length > 0}
        onSaved={() => { setNewOpen(false); refresh(); }}
      />
    </>
  );
}