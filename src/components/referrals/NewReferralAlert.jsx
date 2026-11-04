import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BellRing, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAM_REFERRAL_LABELS, PROGRAM_REFERRAL_PATHS } from '@/lib/programReferralConstants';

// Live notification for referrals that have just landed. With `program` it only
// speaks for that portal; without it, it covers every internal program
// (Central Registration).
export default function NewReferralAlert({ program }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const { data: referrals = [] } = useQuery({
    queryKey: ['new-program-referrals', program || 'all'],
    queryFn: async () => {
      const query = { status: 'new' };
      if (program) query.program = program;
      const page = await base44.entities.ProgramReferral.filter(query, { sort: '-created_date', limit: 20 });
      return page.items;
    },
  });

  useEffect(() => base44.entities.ProgramReferral.subscribe(() => {
    queryClient.invalidateQueries({ queryKey: ['new-program-referrals'] });
    queryClient.invalidateQueries({ queryKey: ['program-referrals'] });
  }), [queryClient]);

  const markContacted = async (referral) => {
    setBusyId(referral.id);
    try {
      const me = await base44.auth.me();
      await base44.entities.ProgramReferral.update(referral.id, {
        status: 'contacted',
        handled_by_name: me?.full_name || me?.email || '',
        handled_date: new Date().toISOString().split('T')[0],
      });
      queryClient.invalidateQueries({ queryKey: ['new-program-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['program-referrals'] });
      toast.success('Referral marked contacted');
    } catch {
      toast.error('Could not update the referral');
    } finally {
      setBusyId(null);
    }
  };

  if (referrals.length === 0) return null;

  const count = referrals.length;

  return (
    <div className="rounded-xl border border-primary/50 bg-primary/10 p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/25 flex items-center justify-center">
          <BellRing className="h-5 w-5 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {count} new {count === 1 ? 'referral' : 'referrals'} to review
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {program
              ? `Referred into ${PROGRAM_REFERRAL_LABELS[program] || program} and waiting for a first contact.`
              : 'Referred into an internal program from the Central Database or another portal.'}
          </p>

          <div className="mt-3 space-y-2">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md bg-card px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{referral.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {!program && referral.program ? `${PROGRAM_REFERRAL_LABELS[referral.program] || referral.program} · ` : ''}
                    From {referral.source_label || 'the Central Database'}
                    {referral.referral_date ? ` · ${new Date(referral.referral_date + 'T00:00:00').toLocaleDateString()}` : ''}
                  </p>
                  {referral.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{referral.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={PROGRAM_REFERRAL_PATHS[referral.program] || '/central-registration'}>
                    <Button size="sm" variant="outline">
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button size="sm" disabled={busyId === referral.id} onClick={() => markContacted(referral)}>
                    Contacted
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}