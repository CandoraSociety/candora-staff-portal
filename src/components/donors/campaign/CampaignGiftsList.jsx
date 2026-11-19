import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import moment from 'moment';
import { formatMoneyExact, labelFor, DONATION_TYPES } from '@/lib/donorConstants';

// Every gift recorded against this campaign — staff-recorded and paid online.
export default function CampaignGiftsList({ gifts = [] }) {
  const total = gifts.reduce((sum, gift) => sum + (Number(gift.amount) || 0), 0);

  if (gifts.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          No gifts recorded against this campaign yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <span className="text-sm font-medium">{gifts.length} gifts</span>
          <span className="text-sm font-semibold">{formatMoneyExact(total)}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Option</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gifts.map((gift) => (
              <TableRow key={gift.id}>
                <TableCell>
                  <div className="font-medium">{gift.is_anonymous ? 'Anonymous' : gift.donor_name || '—'}</div>
                  {gift.source === 'online_campaign' && (
                    <Badge className="mt-1 bg-blue-100 text-blue-700">Online</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{gift.product_name || '—'}</TableCell>
                <TableCell className="text-sm">{labelFor(DONATION_TYPES, gift.donation_type)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {gift.donation_date ? moment(gift.donation_date).format('MMM D, YYYY') : '—'}
                </TableCell>
                <TableCell className="text-right font-medium">{formatMoneyExact(gift.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}