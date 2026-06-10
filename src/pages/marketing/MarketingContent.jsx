import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FileText, Calendar, List } from 'lucide-react';

const STATUSES = {
  idea: { label: 'Idea', color: 'bg-gray-100 text-gray-600' },
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  review: { label: 'Review', color: 'bg-purple-100 text-purple-700' },
  approved: { label: 'Approved', color: 'bg-teal-100 text-teal-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
};

const CONTENT_TYPES = ['blog_post', 'newsletter', 'website_page', 'case_study', 'impact_story', 'video_script', 'other'];

function ContentForm({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    title: '', content_type: 'blog_post', status: 'idea',
    description: '', body: '', target_audience: '',
    assigned_to_name: '', due_date: '', publish_date: '', notes: ''
  });

  return (
    <div className="space-y-3">
      <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Content Type</Label>
          <Select value={form.content_type} onValueChange={v => setForm({ ...form, content_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUSES).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Description / Brief</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Assigned To</Label><Input value={form.assigned_to_name || ''} onChange={e => setForm({ ...form, assigned_to_name: e.target.value })} /></div>
        <div><Label>Target Audience</Label><Input value={form.target_audience || ''} onChange={e => setForm({ ...form, target_audience: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Due Date</Label><Input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
        <div><Label>Publish Date</Label><Input type="date" value={form.publish_date || ''} onChange={e => setForm({ ...form, publish_date: e.target.value })} /></div>
      </div>
      <div><Label>Content Body</Label><Textarea value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} rows={6} placeholder="Write content here..." /></div>
      {form.status === 'published' && (
        <div><Label>Published URL</Label><Input value={form.publish_url || ''} onChange={e => setForm({ ...form, publish_url: e.target.value })} /></div>
      )}
      <div><Label>Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </div>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function CalendarView({ pieces }) {
  const year = new Date().getFullYear();
  const byMonth = {};
  pieces.forEach(p => {
    const d = p.publish_date || p.due_date;
    if (d) {
      const m = parseInt(d.split('-')[1]) - 1;
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(p);
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {MONTHS.map((month, i) => (
        <Card key={month}>
          <CardContent className="p-3">
            <p className="font-semibold text-sm mb-2">{month} {year}</p>
            {(byMonth[i] || []).length === 0
              ? <p className="text-xs text-muted-foreground">—</p>
              : (byMonth[i] || []).map(p => (
                <div key={p.id} className="text-xs py-0.5">
                  <span className={`inline-block px-1 rounded mr-1 ${STATUSES[p.status]?.color}`}>•</span>
                  {p.title}
                </div>
              ))
            }
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MarketingContent() {
  const qc = useQueryClient();
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { data: pieces = [] } = useQuery({ queryKey: ['contentPieces'], queryFn: () => base44.entities.ContentPiece.list('-created_date') });

  const saveItem = useMutation({
    mutationFn: d => d.id ? base44.entities.ContentPiece.update(d.id, d) : base44.entities.ContentPiece.create(d),
    onSuccess: () => { qc.invalidateQueries(['contentPieces']); setDialog(false); setEditItem(null); }
  });

  const filtered = pieces.filter(p => {
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) &&
      (statusFilter === 'all' || p.status === statusFilter) &&
      (typeFilter === 'all' || p.content_type === typeFilter)
    );
  });

  const countsByStatus = Object.keys(STATUSES).reduce((acc, s) => {
    acc[s] = pieces.filter(p => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">Content Planner</h1>
          <p className="text-sm text-muted-foreground">Plan, assign, and track blog posts, newsletters, and website content</p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Content
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUSES).map(([s, { label, color }]) => (
          <div key={s} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${color}`}>
            {label} <span className="font-bold">{countsByStatus[s]}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUSES).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex border rounded-md overflow-hidden">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm ${view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setView('calendar')} className={`px-3 py-1.5 text-sm ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView pieces={filtered} />
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No content pieces found</CardContent></Card>
          ) : filtered.map(p => (
            <Card key={p.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setEditItem(p); setDialog(true); }}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.content_type?.replace(/_/g, ' ')} {p.assigned_to_name && `· ${p.assigned_to_name}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.due_date && <span className="text-xs text-muted-foreground">Due {p.due_date}</span>}
                  <Badge className={STATUSES[p.status]?.color || ''}>{STATUSES[p.status]?.label}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={v => { if (!v) { setDialog(false); setEditItem(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Content' : 'New Content Piece'}</DialogTitle></DialogHeader>
          <ContentForm item={editItem} onClose={() => { setDialog(false); setEditItem(null); }} onSave={d => saveItem.mutate(d)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}