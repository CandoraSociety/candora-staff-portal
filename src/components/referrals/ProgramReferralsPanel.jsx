import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ProgramReferralRow from '@/components/referrals/ProgramReferralRow';

export default function ProgramReferralsPanel({ program }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const { data: referrals = [] } = useQuery({
    queryKey: ['program-referrals', program],
    queryFn: async () => {
      const page = await base44.entities.ProgramReferral.filter(
        { program, status: { $in: ['new', 'contacted'] } },
        { sort: '-referral_date', limit: 50 }
      );
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
      queryClient.invalidateQueries({ queryKey: ['program-referrals', program] });
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
        <CardTitle className="text-base">Referrals from Pathways</CardTitle>
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
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}