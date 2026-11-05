import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import DonationDialog from '@/components/donors/DonationDialog';
import { formatMoneyExact, labelFor, DONATION_TYPES, PAYMENT_METHODS } from '@/lib/donorConstants';
import { recalcDonorTotals } from '@/lib/donorTotals';

export default function Donations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('all');
  const [campaign, setCampaign] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list('-donation_date', 500),
  });
  const { data: donors = [] } = useQuery({ queryKey: ['donors'], queryFn: () => base44.entities.Donor.list('-created_date', 500) });
  const { data: campaigns = [] } = useQuery({
    queryKey: ['donation-campaigns'],
    queryFn: () => base44.entities.DonationCampaign.list('-created_date'),
  });

  const years = useMemo(() => {
    const set = new Set(donations.filter((d) => d.donation_date).map((d) => moment(d.donation_date).year()));
    return Array.from(set).sort((a, b) => b - a);
  }, [donations]);

  const filtered = donations.filter((d) => {
    const matchesSearch = !search || (d.donor_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesYear = year === 'all' || (d.donation_date && String(moment(d.donation_date).year()) === year);
    const matchesCampaign = campaign === 'all'
      || (campaign === 'general' ? !d.campaign_id : d.campaign_id === campaign);
    return matchesSearch && matchesYear && matchesCampaign;
  });

  const total = filtered.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const removeGift = useMutation({
    mutationFn: async (gift) => {
      await base44.entities.Donation.delete(gift.id);
      await recalcDonorTotals(gift.donor_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donations'] });
      qc.invalidateQueries({ queryKey: ['donors'] });
    },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Gifts</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} gift{filtered.length === 1 ? '' : 's'} · {formatMoneyExact(total)}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Record gift
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search donor" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={campaign} onValueChange={setCampaign}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            <SelectItem value="general">General giving</SelectItem>
            {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No gifts match this view.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {gift.donation_date ? moment(gift.donation_date).format('MMM D, YYYY') : '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{gift.donor_name || '—'}</TableCell>
                    <TableCell className="text-sm">{gift.campaign_name || 'General'}</TableCell>
                    <TableCell className="text-sm">{labelFor(DONATION_TYPES, gift.donation_type)}</TableCell>
                    <TableCell className="text-sm">{labelFor(PAYMENT_METHODS, gift.payment_method)}</TableCell>
                    <TableCell>
                      {gift.receipt_issued
                        ? <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Issued</Badge>
                        : <span className="text-xs text-muted-foreground">Not issued</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">{formatMoneyExact(gift.amount)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <button className="p-1 rounded hover:bg-muted" onClick={() => { setEditing(gift); setDialogOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-muted text-destructive"
                          onClick={() => { if (window.confirm('Delete this gift?')) removeGift.mutate(gift); }}
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

      <DonationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        donation={editing}
        donors={donors}
        campaigns={campaigns}
      />
    </div>
  );
}