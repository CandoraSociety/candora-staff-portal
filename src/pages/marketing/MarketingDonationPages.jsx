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
import { Plus, Copy, Link, TrendingUp, MousePointer, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  archived: 'bg-slate-100 text-slate-600',
};

function PageForm({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    title: '', slug: '', status: 'draft', headline: '', description: '',
    goal_amount: '', suggested_amounts: [25, 50, 100, 250],
    utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', notes: ''
  });

  const generatedUTM = () => {
    const base = `https://candora.org/donate/${form.slug || 'page'}`;
    const params = new URLSearchParams();
    if (form.utm_source) params.set('utm_source', form.utm_source);
    if (form.utm_medium) params.set('utm_medium', form.utm_medium);
    if (form.utm_campaign) params.set('utm_campaign', form.utm_campaign);
    if (form.utm_content) params.set('utm_content', form.utm_content);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Page Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div>
          <Label>URL Slug</Label>
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground px-2 border border-r-0 rounded-l-md h-9 flex items-center bg-muted">/donate/</span>
            <Input className="rounded-l-none" value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="campaign-name" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Fundraising Goal ($)</Label><Input type="number" value={form.goal_amount || ''} onChange={e => setForm({ ...form, goal_amount: parseFloat(e.target.value) })} /></div>
      </div>
      <div><Label>Headline</Label><Input value={form.headline || ''} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Your donation changes lives" /></div>
      <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>

      <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-sm font-semibold">UTM Tracking</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Source</Label><Input className="h-8 text-sm" value={form.utm_source || ''} onChange={e => setForm({ ...form, utm_source: e.target.value })} placeholder="facebook, email, newsletter" /></div>
          <div><Label className="text-xs">Medium</Label><Input className="h-8 text-sm" value={form.utm_medium || ''} onChange={e => setForm({ ...form, utm_medium: e.target.value })} placeholder="social, cpc, email" /></div>
          <div><Label className="text-xs">Campaign</Label><Input className="h-8 text-sm" value={form.utm_campaign || ''} onChange={e => setForm({ ...form, utm_campaign: e.target.value })} placeholder="giving-tuesday-2025" /></div>
          <div><Label className="text-xs">Content</Label><Input className="h-8 text-sm" value={form.utm_content || ''} onChange={e => setForm({ ...form, utm_content: e.target.value })} placeholder="banner-a, link-1" /></div>
        </div>
        <div className="flex items-center gap-2">
          <Input readOnly value={generatedUTM()} className="text-xs h-8 font-mono bg-background" />
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedUTM()); toast.success('Link copied!'); }}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div><Label>Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save Page</Button>
      </div>
    </div>
  );
}

export default function MarketingDonationPages() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: pages = [] } = useQuery({ queryKey: ['donationPages'], queryFn: () => base44.entities.DonationPage.list('-created_date') });

  const savePage = useMutation({
    mutationFn: d => d.id ? base44.entities.DonationPage.update(d.id, d) : base44.entities.DonationPage.create(d),
    onSuccess: () => { qc.invalidateQueries(['donationPages']); setDialog(false); setEditItem(null); }
  });

  const filtered = pages.filter(p => statusFilter === 'all' || p.status === statusFilter);
  const totalRaised = pages.reduce((s, p) => s + (p.raised_amount || 0), 0);
  const totalVisits = pages.reduce((s, p) => s + (p.total_visits || 0), 0);
  const totalConversions = pages.reduce((s, p) => s + (p.total_conversions || 0), 0);
  const convRate = totalVisits > 0 ? ((totalConversions / totalVisits) * 100).toFixed(1) : '0';

  const copyLink = (page) => {
    const base = `https://candora.org/donate/${page.slug || page.id}`;
    const params = new URLSearchParams();
    if (page.utm_source) params.set('utm_source', page.utm_source);
    if (page.utm_medium) params.set('utm_medium', page.utm_medium);
    if (page.utm_campaign) params.set('utm_campaign', page.utm_campaign);
    const qs = params.toString();
    navigator.clipboard.writeText(qs ? `${base}?${qs}` : base);
    toast.success('Link copied!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">Donation Pages & UTM Links</h1>
          <p className="text-sm text-muted-foreground">Track campaign landing pages and UTM link performance</p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Page
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pages', value: pages.length, icon: Link },
          { label: 'Total Raised', value: `$${totalRaised.toLocaleString()}`, icon: DollarSign },
          { label: 'Total Visits', value: totalVisits.toLocaleString(), icon: MousePointer },
          { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="w-8 h-8 text-primary/70" />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-3"><CardContent className="py-12 text-center text-muted-foreground">No donation pages yet</CardContent></Card>
        ) : filtered.map(page => (
          <Card key={page.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{page.title}</CardTitle>
                <Badge className={STATUS_COLORS[page.status] || ''}>{page.status}</Badge>
              </div>
              {page.slug && <p className="text-xs text-muted-foreground font-mono">/donate/{page.slug}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              {page.goal_amount > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>${(page.raised_amount || 0).toLocaleString()} raised</span>
                    <span>Goal: ${(page.goal_amount).toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, ((page.raised_amount || 0) / page.goal_amount) * 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{page.total_visits || 0} visits</span>
                <span>{page.total_conversions || 0} conversions</span>
                {page.total_visits > 0 && <span>{(((page.total_conversions || 0) / page.total_visits) * 100).toFixed(1)}% conv.</span>}
              </div>
              {(page.utm_source || page.utm_campaign) && (
                <div className="flex flex-wrap gap-1">
                  {page.utm_source && <Badge variant="outline" className="text-xs">{page.utm_source}</Badge>}
                  {page.utm_medium && <Badge variant="outline" className="text-xs">{page.utm_medium}</Badge>}
                  {page.utm_campaign && <Badge variant="outline" className="text-xs">{page.utm_campaign}</Badge>}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => copyLink(page)}>
                  <Copy className="w-3 h-3 mr-1" /> Copy Link
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditItem(page); setDialog(true); }}>Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={v => { if (!v) { setDialog(false); setEditItem(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Page' : 'New Donation Page'}</DialogTitle></DialogHeader>
          <PageForm item={editItem} onClose={() => { setDialog(false); setEditItem(null); }} onSave={d => savePage.mutate(d)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}