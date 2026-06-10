import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Megaphone, DollarSign, Target, CalendarDays, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CAMPAIGN_TYPES = ['marketing', 'fundraising', 'event_promotion', 'program_promotion', 'awareness', 'annual'];
const STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled'];
const CHANNELS = ['Email', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Print', 'Poster', 'Radio', 'Website', 'Other'];

const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  name: '', campaign_type: 'marketing', status: 'planning', description: '', goals: '',
  target_audience: '', budget: '', fundraising_goal: '', start_date: '', end_date: '',
  channels: [], is_annual: false, annual_month: '', notes: '', assigned_to_name: ''
};

export default function MarketingCampaigns() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('all');

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['mkt-campaigns-all'],
    queryFn: () => base44.entities.MarketingCampaign.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.MarketingCampaign.update(id, data) : base44.entities.MarketingCampaign.create(data),
    onSuccess: () => { qc.invalidateQueries(['mkt-campaigns-all']); qc.invalidateQueries(['mkt-campaigns']); closeForm(); toast.success('Campaign saved'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingCampaign.delete(id),
    onSuccess: () => { qc.invalidateQueries(['mkt-campaigns-all']); qc.invalidateQueries(['mkt-campaigns']); toast.success('Deleted'); },
  });

  const updateStatus = (id, status) => {
    base44.entities.MarketingCampaign.update(id, { status }).then(() => qc.invalidateQueries(['mkt-campaigns-all']));
  };

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...EMPTY_FORM, ...c, channels: c.channels || [] }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const toggleChannel = (ch) => {
    setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }));
  };

  const handleSave = () => {
    const data = { ...form, budget: form.budget ? parseFloat(form.budget) : undefined, fundraising_goal: form.fundraising_goal ? parseFloat(form.fundraising_goal) : undefined };
    saveMutation.mutate({ id: editing?.id, data });
  };

  const filtered = campaigns.filter(c => {
    if (activeTab === 'all') return true;
    if (activeTab === 'fundraising') return c.campaign_type === 'fundraising';
    if (activeTab === 'annual') return c.is_annual;
    return c.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Plan and manage marketing, fundraising, and promotional campaigns.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Campaign</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
          <TabsTrigger value="annual">Annual</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Megaphone className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No campaigns here yet.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-800">{c.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                      {c.is_annual && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Annual</span>}
                    </div>
                    <p className="text-xs text-slate-500 capitalize mb-2">{c.campaign_type?.replace(/_/g, ' ')}</p>
                    {c.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{c.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {c.start_date && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {format(new Date(c.start_date), 'MMM d')} – {c.end_date ? format(new Date(c.end_date), 'MMM d, yyyy') : 'ongoing'}</span>}
                      {c.budget && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Budget: ${c.budget.toLocaleString()}</span>}
                      {c.fundraising_goal && <span className="flex items-center gap-1"><Target className="w-3 h-3 text-green-500" /> Goal: ${c.fundraising_goal.toLocaleString()}</span>}
                    </div>
                    {(c.channels || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.channels.map(ch => <span key={ch} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{ch}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEdit(c)}><Pencil className="w-3 h-3" /></Button>
                    {c.status !== 'completed' && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateStatus(c.id, 'completed')}>
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                  </div>
                </div>
                {c.campaign_type === 'fundraising' && c.fundraising_goal > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Raised: ${(c.fundraising_raised || 0).toLocaleString()}</span>
                      <span>Goal: ${c.fundraising_goal.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round(((c.fundraising_raised || 0) / c.fundraising_goal) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Campaign' : 'New Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Campaign Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.campaign_type} onValueChange={v => setForm(f => ({ ...f, campaign_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div><Label>Goals</Label><Textarea value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} rows={2} /></div>
            <div><Label>Target Audience</Label><Input value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Budget ($)</Label><Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
              {form.campaign_type === 'fundraising' && (
                <div><Label>Fundraising Goal ($)</Label><Input type="number" value={form.fundraising_goal} onChange={e => setForm(f => ({ ...f, fundraising_goal: e.target.value }))} /></div>
              )}
            </div>
            <div>
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHANNELS.map(ch => (
                  <button key={ch} type="button" onClick={() => toggleChannel(ch)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.channels.includes(ch) ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'}`}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_annual" checked={form.is_annual} onChange={e => setForm(f => ({ ...f, is_annual: e.target.checked }))} />
              <label htmlFor="is_annual" className="text-sm font-medium">Annual recurring campaign</label>
            </div>
            {form.is_annual && (
              <div>
                <Label>Recurrence Month</Label>
                <Select value={form.annual_month?.toString()} onValueChange={v => setForm(f => ({ ...f, annual_month: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                  <SelectContent>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div><Label>Assigned To</Label><Input value={form.assigned_to_name} onChange={e => setForm(f => ({ ...f, assigned_to_name: e.target.value }))} placeholder="Staff member name" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || saveMutation.isPending}>Save Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}