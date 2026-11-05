import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import DonorDialog from '@/components/donors/DonorDialog';
import DonationDialog from '@/components/donors/DonationDialog';
import { GIVING_LEVELS, DONOR_TYPES, formatMoney, formatMoneyExact, labelFor, donorName } from '@/lib/donorConstants';
import { recalcDonorTotals } from '@/lib/donorTotals';

export default function DonorDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [donorOpen, setDonorOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [editingGift, setEditingGift] = useState(null);

  const { data: donor, isLoading } = useQuery({
    queryKey: ['donor', id],
    queryFn: () => base44.entities.Donor.get(id),
    enabled: !!id,
  });
  const { data: giftsPage } = useQuery({
    queryKey: ['donations', 'donor', id],
    queryFn: () => base44.entities.Donation.filter({ donor_id: id }, { sort: '-donation_date', limit: 200 }),
    enabled: !!id,
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ['donation-campaigns'],
    queryFn: () => base44.entities.DonationCampaign.list('-created_date'),
  });

  const gifts = giftsPage?.items || [];

  const removeGift = useMutation({
    mutationFn: async (gift) => {
      await base44.entities.Donation.delete(gift.id);
      await recalcDonorTotals(gift.donor_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donations'] });
      qc.invalidateQueries({ queryKey: ['donor', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="p-6">
        <Link to="/donors/list" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to donors
        </Link>
        <Card><CardContent className="py-16 text-center text-muted-foreground">This donor could not be found.</CardContent></Card>
      </div>
    );
  }

  const level = GIVING_LEVELS[donor.giving_level] || GIVING_LEVELS.prospect;

  return (
    <div className="p-6 space-y-5">
      <Link to="/donors/list" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to donors
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">{donorName(donor)}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={level.className}>{level.label}</Badge>
            <span className="text-sm text-muted-foreground">{labelFor(DONOR_TYPES, donor.donor_type)}</span>
            {donor.do_not_contact && <Badge className="bg-rose-100 text-rose-700">Do not contact</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDonorOpen(true)}><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
          <Button onClick={() => { setEditingGift(null); setGiftOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Record gift</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Lifetime giving', value: formatMoney(donor.total_donated) },
          { label: 'Gifts recorded', value: gifts.length },
          { label: 'First gift', value: donor.first_donation_date ? moment(donor.first_donation_date).format('MMM D, YYYY') : '—' },
          { label: 'Last gift', value: donor.last_donation_date ? moment(donor.last_donation_date).format('MMM D, YYYY') : '—' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</div>
              <div className="text-lg font-semibold mt-1">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Email: </span>{donor.email || '—'}</div>
            <div><span className="text-muted-foreground">Phone: </span>{donor.phone || '—'}</div>
            <div>
              <span className="text-muted-foreground">Address: </span>
              {[donor.address, donor.city, donor.province, donor.postal_code].filter(Boolean).join(', ') || '—'}
            </div>
            <div><span className="text-muted-foreground">Receipts: </span>{donor.receipt_preference || 'email'}</div>
            {donor.notes && (
              <div className="pt-2 border-t">
                <div className="text-muted-foreground mb-1">Notes</div>
                <p className="whitespace-pre-line">{donor.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Gift history</CardTitle></CardHeader>
          <CardContent className="p-0">
            {gifts.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">No gifts recorded for this donor yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gifts.map((gift) => (
                    <TableRow key={gift.id}>
                      <TableCell className="text-sm">{gift.donation_date ? moment(gift.donation_date).format('MMM D, YYYY') : '—'}</TableCell>
                      <TableCell className="text-sm">{gift.campaign_name || 'General'}</TableCell>
                      <TableCell className="text-sm capitalize">{(gift.donation_type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoneyExact(gift.amount)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <button
                            className="p-1 rounded hover:bg-muted"
                            onClick={() => { setEditingGift(gift); setGiftOpen(true); }}
                            title="Edit gift"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-muted text-destructive"
                            onClick={() => { if (window.confirm('Delete this gift?')) removeGift.mutate(gift); }}
                            title="Delete gift"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DonorDialog open={donorOpen} onOpenChange={setDonorOpen} donor={donor} />
      <DonationDialog
        open={giftOpen}
        onOpenChange={setGiftOpen}
        donation={editingGift}
        donors={[donor]}
        defaultDonorId={donor.id}
        campaigns={campaigns}
      />
    </div>
  );
}