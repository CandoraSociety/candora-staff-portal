import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { CAMPAIGN_TYPES, formatMoney, labelFor } from '@/lib/donorConstants';

const EMPTY = {
  name: '', description: '', campaign_type: 'appeal', goal_amount: '',
  start_date: '', end_date: '', is_active: true, owner_name: '', notes: '',
};

export default function Campaigns() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['donation-campaigns'],
    queryFn: () => base44.entities.DonationCampaign.list('-created_date'),
  });
  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: () => base44.entities.Donation.list('-donation_date', 500),
  });

  const save = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.DonationCampaign.update(editing.id, data)
      : base44.entities.DonationCampaign.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donation-campaigns'] });
      setOpen(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.DonationCampaign.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donation-campaigns'] }),
  });

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (campaign) => {
    setEditing(campaign);
    setForm({ ...EMPTY, ...campaign, goal_amount: campaign.goal_amount ?? '' });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) return;
    save.mutate({ ...form, goal_amount: form.goal_amount ? Number(form.goal_amount) : undefined });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Appeals and drives, with progress from recorded gifts</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New campaign</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">
          No campaigns yet. Create one to start tracking gifts against a goal.
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const raised = donations
              .filter((d) => d.campaign_id === campaign.id)
              .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
            const pct = campaign.goal_amount ? Math.min(100, Math.round((raised / campaign.goal_amount) * 100)) : 0;
            return (
              <Card key={campaign.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold leading-tight">{campaign.name}</h3>
                      <div className="text-xs text-muted-foreground">{labelFor(CAMPAIGN_TYPES, campaign.campaign_type)}</div>
                    </div>
                    <Badge className={campaign.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                      {campaign.is_active ? 'Active' : 'Closed'}
                    </Badge>
                  </div>

                  {campaign.description && <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>}

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{formatMoney(raised)}</span>
                      <span className="text-muted-foreground">
                        {campaign.goal_amount ? `of ${formatMoney(campaign.goal_amount)}` : 'no goal set'}
                      </span>
                    </div>
                    <div className="h-2 mt-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {campaign.start_date && moment(campaign.start_date).format('MMM D, YYYY')}
                    {campaign.end_date ? ` – ${moment(campaign.end_date).format('MMM D, YYYY')}` : ''}
                  </div>

                  <div className="flex justify-end gap-1 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(campaign)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => { if (window.confirm('Delete this campaign? Gifts stay on their donor records.')) remove.mutate(campaign.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit campaign' : 'New campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Goal (CAD)</Label>
                <Input type="number" min="0" value={form.goal_amount}
                  onChange={(e) => setForm({ ...form, goal_amount: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input type="date" value={form.start_date || ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="date" value={form.end_date || ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Campaign owner</Label>
              <Input value={form.owner_name || ''} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Still accepting gifts
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save campaign'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}