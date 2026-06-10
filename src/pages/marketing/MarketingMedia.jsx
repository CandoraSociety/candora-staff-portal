import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Newspaper, Users, FileText, Search } from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  distributed: 'bg-green-100 text-green-700',
  archived: 'bg-slate-100 text-slate-600',
};

const RELATIONSHIP_COLORS = {
  cold: 'bg-slate-100 text-slate-600',
  warm: 'bg-amber-100 text-amber-700',
  strong: 'bg-green-100 text-green-700',
};

const SENTIMENT_COLORS = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-700',
  negative: 'bg-red-100 text-red-700',
};

function PressReleaseForm({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { title: '', status: 'draft', category: 'general', body: '', release_date: '', contact_name: '', contact_email: '' });
  return (
    <div className="space-y-3">
      <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
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
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['program_update', 'event', 'fundraising', 'award', 'partnership', 'general'].map(c => (
                <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Release Date</Label><Input type="date" value={form.release_date || ''} onChange={e => setForm({ ...form, release_date: e.target.value })} /></div>
      <div><Label>Body</Label><Textarea value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} rows={6} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Media Contact Name</Label><Input value={form.contact_name || ''} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
        <div><Label>Media Contact Email</Label><Input value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </div>
    </div>
  );
}

function MediaContactForm({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { name: '', outlet: '', outlet_type: 'online', beat: '', email: '', phone: '', relationship: 'cold' });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Outlet</Label><Input value={form.outlet || ''} onChange={e => setForm({ ...form, outlet: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Outlet Type</Label>
          <Select value={form.outlet_type} onValueChange={v => setForm({ ...form, outlet_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['newspaper', 'tv', 'radio', 'online', 'podcast', 'magazine', 'blog', 'other'].map(t => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Relationship</Label>
          <Select value={form.relationship} onValueChange={v => setForm({ ...form, relationship: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="strong">Strong</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Beat / Topics</Label><Input value={form.beat || ''} onChange={e => setForm({ ...form, beat: e.target.value })} placeholder="e.g. community, nonprofits, immigration" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Email</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div><Label>Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </div>
    </div>
  );
}

function CoverageForm({ onClose, onSave }) {
  const [form, setForm] = useState({ headline: '', outlet: '', outlet_type: 'online', coverage_date: new Date().toISOString().split('T')[0], url: '', sentiment: 'positive', notes: '' });
  return (
    <div className="space-y-3">
      <div><Label>Headline *</Label><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Outlet *</Label><Input value={form.outlet} onChange={e => setForm({ ...form, outlet: e.target.value })} /></div>
        <div><Label>Date *</Label><Input type="date" value={form.coverage_date} onChange={e => setForm({ ...form, coverage_date: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Sentiment</Label>
          <Select value={form.sentiment} onValueChange={v => setForm({ ...form, sentiment: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>URL</Label><Input value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} /></div>
      </div>
      <div><Label>Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </div>
    </div>
  );
}

export default function MarketingMedia() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('press');
  const [dialog, setDialog] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');

  const { data: releases = [] } = useQuery({ queryKey: ['pressReleases'], queryFn: () => base44.entities.PressRelease.list('-created_date') });
  const { data: contacts = [] } = useQuery({ queryKey: ['mediaContacts'], queryFn: () => base44.entities.MediaContact.list() });
  const { data: coverage = [] } = useQuery({ queryKey: ['mediaCoverage'], queryFn: () => base44.entities.MediaCoverage.list('-coverage_date') });

  const saveRelease = useMutation({
    mutationFn: d => d.id ? base44.entities.PressRelease.update(d.id, d) : base44.entities.PressRelease.create(d),
    onSuccess: () => { qc.invalidateQueries(['pressReleases']); setDialog(null); setEditItem(null); }
  });
  const saveContact = useMutation({
    mutationFn: d => d.id ? base44.entities.MediaContact.update(d.id, d) : base44.entities.MediaContact.create(d),
    onSuccess: () => { qc.invalidateQueries(['mediaContacts']); setDialog(null); setEditItem(null); }
  });
  const saveCoverage = useMutation({
    mutationFn: d => base44.entities.MediaCoverage.create(d),
    onSuccess: () => { qc.invalidateQueries(['mediaCoverage']); setDialog(null); }
  });

  const q = search.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">Media & Press</h1>
          <p className="text-sm text-muted-foreground">Press releases, media contacts, and coverage tracking</p>
        </div>
        <div className="flex gap-2">
          {tab === 'press' && <Button onClick={() => { setEditItem(null); setDialog('release'); }}><Plus className="w-4 h-4 mr-1" /> New Release</Button>}
          {tab === 'contacts' && <Button onClick={() => { setEditItem(null); setDialog('contact'); }}><Plus className="w-4 h-4 mr-1" /> Add Contact</Button>}
          {tab === 'coverage' && <Button onClick={() => setDialog('coverage')}><Plus className="w-4 h-4 mr-1" /> Log Coverage</Button>}
        </div>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="press"><FileText className="w-4 h-4 mr-1" />Press Releases <Badge variant="outline" className="ml-1 text-xs">{releases.length}</Badge></TabsTrigger>
          <TabsTrigger value="contacts"><Users className="w-4 h-4 mr-1" />Media Contacts <Badge variant="outline" className="ml-1 text-xs">{contacts.length}</Badge></TabsTrigger>
          <TabsTrigger value="coverage"><Newspaper className="w-4 h-4 mr-1" />Coverage Log <Badge variant="outline" className="ml-1 text-xs">{coverage.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="press" className="space-y-3 mt-4">
          {releases.filter(r => r.title?.toLowerCase().includes(q)).map(r => (
            <Card key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setEditItem(r); setDialog('release'); }}>
              <CardContent className="p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.release_date} · {r.category?.replace('_', ' ')}</p>
                </div>
                <Badge className={STATUS_COLORS[r.status] || ''}>{r.status}</Badge>
              </CardContent>
            </Card>
          ))}
          {releases.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No press releases yet</CardContent></Card>}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-3 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contacts.filter(c => `${c.name} ${c.outlet}`.toLowerCase().includes(q)).map(c => (
              <Card key={c.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setEditItem(c); setDialog('contact'); }}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium">{c.name}</p>
                    <Badge className={RELATIONSHIP_COLORS[c.relationship] || ''}>{c.relationship}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.outlet} · {c.outlet_type}</p>
                  {c.beat && <p className="text-xs text-muted-foreground mt-1">Beat: {c.beat}</p>}
                  {c.email && <p className="text-xs mt-1">{c.email}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          {contacts.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No media contacts yet</CardContent></Card>}
        </TabsContent>

        <TabsContent value="coverage" className="space-y-3 mt-4">
          {coverage.filter(c => `${c.headline} ${c.outlet}`.toLowerCase().includes(q)).map(c => (
            <Card key={c.id}>
              <CardContent className="p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium">{c.headline}</p>
                  <p className="text-xs text-muted-foreground">{c.outlet} · {c.coverage_date}</p>
                  {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Article →</a>}
                </div>
                <Badge className={SENTIMENT_COLORS[c.sentiment] || ''}>{c.sentiment}</Badge>
              </CardContent>
            </Card>
          ))}
          {coverage.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No coverage logged yet</CardContent></Card>}
        </TabsContent>
      </Tabs>

      <Dialog open={dialog === 'release'} onOpenChange={v => { if (!v) { setDialog(null); setEditItem(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Press Release' : 'New Press Release'}</DialogTitle></DialogHeader>
          <PressReleaseForm item={editItem} onClose={() => { setDialog(null); setEditItem(null); }} onSave={d => saveRelease.mutate(d)} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'contact'} onOpenChange={v => { if (!v) { setDialog(null); setEditItem(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Contact' : 'Add Media Contact'}</DialogTitle></DialogHeader>
          <MediaContactForm item={editItem} onClose={() => { setDialog(null); setEditItem(null); }} onSave={d => saveContact.mutate(d)} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'coverage'} onOpenChange={v => !v && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Media Coverage</DialogTitle></DialogHeader>
          <CoverageForm onClose={() => setDialog(null)} onSave={d => saveCoverage.mutate(d)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}