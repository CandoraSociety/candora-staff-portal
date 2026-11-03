import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ProgramReferralRow from '@/components/referrals/ProgramReferralRow';

// Open internal program referrals. With `program` it shows one receiving
// portal's referrals; without it, every open referral (Central Registration).
export default function ProgramReferralsPanel({ program, title, description }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const { data: referrals = [] } = useQuery({
    queryKey: ['program-referrals', program || 'all'],
    queryFn: async () => {
      const query = { status: { $in: ['new', 'contacted'] } };
      if (program) query.program = program;
      const page = await base44.entities.ProgramReferral.filter(query, { sort: '-referral_date', limit: 50 });
      return page.items;
    },
  });

  const handleUpdate = async (referral, status) => {
    setBusyId(referral.id);
    try {
      const me = await base44.auth.me();
      await base44.entities.ProgramReferral.update(referral.id, {
        status,
        handled_by_name: me?.full_name || me?.email || '',
        handled_date: new Date().toISOString().split('T')[0],
      });
      queryClient.invalidateQueries({ queryKey: ['program-referrals', program || 'all'] });
      toast.success(status === 'completed' ? 'Referral marked complete' : 'Referral marked contacted');
    } catch {
      toast.error('Could not update the referral');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{title || 'Referrals from other programs'}</CardTitle>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <span className="text-xs text-muted-foreground">{referrals.length} open</span>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No open referrals</p>
        ) : (
          <div className="space-y-2">
            {referrals.map(referral => (
              <ProgramReferralRow
                key={referral.id}
                referral={referral}
                busy={busyId === referral.id}
                onUpdate={handleUpdate}
                showProgram={!program}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}