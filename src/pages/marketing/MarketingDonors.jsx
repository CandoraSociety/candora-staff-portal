import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Users, DollarSign, TrendingUp, Heart } from 'lucide-react';

const GIVING_LEVELS = {
  prospect: { label: 'Prospect', color: 'bg-gray-100 text-gray-700' },
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  recurring: { label: 'Recurring', color: 'bg-green-100 text-green-700' },
  major: { label: 'Major', color: 'bg-purple-100 text-purple-700' },
  lapsed: { label: 'Lapsed', color: 'bg-amber-100 text-amber-700' },
  inactive: { label: 'Inactive', color: 'bg-red-100 text-red-700' },
};

const DONOR_TYPES = ['individual', 'corporate', 'foundation', 'government', 'other'];

function DonorForm({ donor, onClose, onSave }) {
  const [form, setForm] = useState(donor || {
    first_name: '', last_name: '', organization: '', donor_type: 'individual',
    email: '', phone: '', giving_level: 'prospect', notes: '', do_not_contact: false
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>First Name</Label>
          <Input value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Organization</Label>
          <Input value={form.organization || ''} onChange={e => setForm({ ...form, organization: e.target.value })} />
        </div>
        <div>
          <Label>Donor Type</Label>
          <Select value={form.donor_type} onValueChange={v => setForm({ ...form, donor_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DONOR_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Giving Level</Label>
        <Select value={form.giving_level} onValueChange={v => setForm({ ...form, giving_level: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(GIVING_LEVELS).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save Donor</Button>
      </div>
    </div>
  );
}

function DonationForm({ donorId, donorName, onClose, onSave }) {
  const [form, setForm] = useState({
    donor_id: donorId, donor_name: donorName,
    amount: '', donation_date: new Date().toISOString().split('T')[0],
    donation_type: 'one_time', payment_method: 'cheque', receipt_issued: false, notes: ''
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Amount ($) *</Label>
          <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })} />
        </div>
        <div>
          <Label>Date *</Label>
          <Input type="date" value={form.donation_date} onChange={e => setForm({ ...form, donation_date: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={form.donation_type} onValueChange={v => setForm({ ...form, donation_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">One-Time</SelectItem>
              <SelectItem value="recurring_monthly">Recurring Monthly</SelectItem>
              <SelectItem value="recurring_annual">Recurring Annual</SelectItem>
              <SelectItem value="in_kind">In-Kind</SelectItem>
              <SelectItem value="pledge">Pledge</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Payment Method</Label>
          <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="e_transfer">e-Transfer</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Record Donation</Button>
      </div>
    </div>
  );
}

export default function MarketingDonors() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showDonorDialog, setShowDonorDialog] = useState(false);
  const [editDonor, setEditDonor] = useState(null);
  const [donationDonor, setDonationDonor] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);

  const { data: donors = [] } = useQuery({ queryKey: ['donors'], queryFn: () => base44.entities.Donor.list('-created_date') });
  const { data: donations = [] } = useQuery({ queryKey: ['donations'], queryFn: () => base44.entities.Donation.list('-donation_date') });

  const saveDonor = useMutation({
    mutationFn: d => d.id ? base44.entities.Donor.update(d.id, d) : base44.entities.Donor.create(d),
    onSuccess: () => { qc.invalidateQueries(['donors']); setShowDonorDialog(false); setEditDonor(null); }
  });

  const saveDonation = useMutation({
    mutationFn: d => base44.entities.Donation.create(d),
    onSuccess: async (_, vars) => {
      const donor = donors.find(d => d.id === vars.donor_id);
      if (donor) {
        const total = donations.filter(d => d.donor_id === vars.donor_id).reduce((s, d) => s + (d.amount || 0), 0) + (vars.amount || 0);
        await base44.entities.Donor.update(vars.donor_id, { total_donated: total, last_donation_date: vars.donation_date });
      }
      qc.invalidateQueries(['donations']); qc.invalidateQueries(['donors']); setDonationDonor(null);
    }
  });

  const filtered = donors.filter(d => {
    const q = search.toLowerCase();
    const nameMatch = `${d.first_name} ${d.last_name} ${d.organization}`.toLowerCase().includes(q);
    const lvlMatch = levelFilter === 'all' || d.giving_level === levelFilter;
    return nameMatch && lvlMatch;
  });

  const totalDonors = donors.length;
  const totalRaised = donations.reduce((s, d) => s + (d.amount || 0), 0);
  const recurringDonors = donors.filter(d => d.giving_level === 'recurring').length;
  const majorDonors = donors.filter(d => d.giving_level === 'major').length;

  const donorDonations = selectedDonor ? donations.filter(d => d.donor_id === selectedDonor.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">Donor Management</h1>
          <p className="text-sm text-muted-foreground">Track donors, giving history, and relationships</p>
        </div>
        <Button onClick={() => { setEditDonor(null); setShowDonorDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Donor
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Donors', value: totalDonors, icon: Users, color: 'text-blue-600' },
          { label: 'Total Raised', value: `$${totalRaised.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'Recurring', value: recurringDonors, icon: TrendingUp, color: 'text-purple-600' },
          { label: 'Major Donors', value: majorDonors, icon: Heart, color: 'text-rose-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search donors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {Object.entries(GIVING_LEVELS).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No donors found</CardContent></Card>
          ) : filtered.map(donor => (
            <Card key={donor.id} className={`cursor-pointer transition-colors ${selectedDonor?.id === donor.id ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}
              onClick={() => setSelectedDonor(donor)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{donor.first_name} {donor.last_name}</p>
                  {donor.organization && <p className="text-xs text-muted-foreground">{donor.organization}</p>}
                  <p className="text-xs text-muted-foreground">{donor.email}</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={GIVING_LEVELS[donor.giving_level]?.color || ''}>{GIVING_LEVELS[donor.giving_level]?.label}</Badge>
                  <p className="text-sm font-semibold">${(donor.total_donated || 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          {selectedDonor ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{selectedDonor.first_name} {selectedDonor.last_name}</CardTitle>
                {selectedDonor.organization && <p className="text-xs text-muted-foreground">{selectedDonor.organization}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setDonationDonor(selectedDonor)}>
                    <DollarSign className="w-3 h-3 mr-1" /> Record Donation
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditDonor(selectedDonor); setShowDonorDialog(true); }}>Edit</Button>
                </div>
                <div className="text-sm space-y-1">
                  {selectedDonor.email && <p><span className="text-muted-foreground">Email:</span> {selectedDonor.email}</p>}
                  {selectedDonor.phone && <p><span className="text-muted-foreground">Phone:</span> {selectedDonor.phone}</p>}
                  <p><span className="text-muted-foreground">Total Given:</span> <strong>${(selectedDonor.total_donated || 0).toLocaleString()}</strong></p>
                  {selectedDonor.last_donation_date && <p><span className="text-muted-foreground">Last Gift:</span> {selectedDonor.last_donation_date}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">DONATION HISTORY</p>
                  {donorDonations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No donations recorded</p>
                  ) : donorDonations.map(don => (
                    <div key={don.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{don.donation_date}</span>
                      <span className="font-medium">${(don.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Select a donor to view details</CardContent></Card>
          )}
        </div>
      </div>

      <Dialog open={showDonorDialog} onOpenChange={v => { setShowDonorDialog(v); if (!v) setEditDonor(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editDonor ? 'Edit Donor' : 'Add Donor'}</DialogTitle></DialogHeader>
          <DonorForm donor={editDonor} onClose={() => setShowDonorDialog(false)} onSave={d => saveDonor.mutate(d)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!donationDonor} onOpenChange={v => !v && setDonationDonor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Donation — {donationDonor?.first_name} {donationDonor?.last_name}</DialogTitle></DialogHeader>
          {donationDonor && <DonationForm donorId={donationDonor.id} donorName={`${donationDonor.first_name} ${donationDonor.last_name}`} onClose={() => setDonationDonor(null)} onSave={d => saveDonation.mutate(d)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}