import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, X } from 'lucide-react';
import moment from 'moment';
import { formatMoney } from '@/lib/donorConstants';

const STATUS = {
  scheduled: { label: 'Scheduled', className: 'bg-amber-100 text-amber-800' },
  delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', className: 'bg-rose-100 text-rose-700' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
};

// Every greeting card sent for this campaign — who it is for, when it goes out,
// and whether it arrived. A card can be sent early or called off here.
export default function CampaignDeliveriesPanel({ campaign }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['campaign-gift-cards', campaign.id],
    queryFn: async () =>
      (await base44.entities.CampaignGiftCard.filter(
        { campaign_id: campaign.id },
        { sort: '-created_date', limit: 200 }
      )).items || [],
  });

  const sendNow = async (card) => {
    setBusy(card.id);
    setError('');
    try {
      const response = await base44.functions.invoke('sendScheduledCampaignGiftCards', { card_id: card.id });
      if (response.data?.error) throw new Error(response.data.error);
      qc.invalidateQueries({ queryKey: ['campaign-gift-cards', campaign.id] });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'The card could not be sent.');
    }
    setBusy('');
  };

  const cancel = async (card) => {
    setBusy(card.id);
    await base44.entities.CampaignGiftCard.update(card.id, { status: 'cancelled' });
    qc.invalidateQueries({ queryKey: ['campaign-gift-cards', campaign.id] });
    setBusy('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          No gift cards yet. When a supporter makes a gift in someone's honour, it appears here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>For</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Cause</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Gift</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => {
                const status = STATUS[card.status] || STATUS.scheduled;
                return (
                  <TableRow key={card.id}>
                    <TableCell>
                      <div className="font-medium">{card.recipient_name}</div>
                      <div className="text-xs text-muted-foreground">{card.recipient_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{card.donor_name || 'Anonymous'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {card.pillar_name || 'Whole campaign'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {card.deliver_at ? moment(card.deliver_at).format('MMM D, YYYY h:mm a') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>{status.label}</Badge>
                      {card.failure_reason && (
                        <div className="text-xs text-destructive mt-1">{card.failure_reason}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(card.amount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {card.status !== 'delivered' && card.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendNow(card)}
                            disabled={busy === card.id}
                          >
                            {busy === card.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                        {card.status === 'scheduled' && (
                          <Button variant="ghost" size="sm" onClick={() => cancel(card)} disabled={busy === card.id}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Cards send themselves at their delivery time. Sending one early needs an administrator account.
      </p>
    </div>
  );
}