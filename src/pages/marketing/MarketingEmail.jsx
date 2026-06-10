import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Mail, Users, FileText, Send, BarChart2, Trash2, Upload, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_BADGE = {
  draft: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MarketingEmail() {
  const qc = useQueryClient();

  const { data: campaigns = [] } = useQuery({ queryKey: ['email-campaigns'], queryFn: () => base44.entities.EmailCampaign.list('-created_date') });
  const { data: lists = [] } = useQuery({ queryKey: ['email-lists'], queryFn: () => base44.entities.EmailList.list() });
  const { data: templates = [] } = useQuery({ queryKey: ['email-templates'], queryFn: () => base44.entities.EmailTemplate.list() });

  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({ name: '', subject: '', from_name: 'The Candora Society', from_email: '', preview_text: '', html_content: '', campaign_type: 'newsletter', email_list_ids: [] });
  const [listForm, setListForm] = useState({ name: '', description: '' });
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', category: 'newsletter', html_content: '', preview_text: '' });
  const [subscribersText, setSubscribersText] = useState('');

  const saveCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.EmailCampaign.update(id, data) : base44.entities.EmailCampaign.create(data),
    onSuccess: () => { qc.invalidateQueries(['email-campaigns']); setShowCampaignForm(false); toast.success('Campaign saved'); },
  });

  const saveListMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailList.create(data),
    onSuccess: () => { qc.invalidateQueries(['email-lists']); setShowListForm(false); toast.success('List created'); },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => { qc.invalidateQueries(['email-templates']); setShowTemplateForm(false); toast.success('Template saved'); },
  });

  const markSentMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailCampaign.update(id, { status: 'sent', sent_date: new Date().toISOString(), total_sent: showSendDialog?.total_recipients || 0 }),
    onSuccess: () => { qc.invalidateQueries(['email-campaigns']); setShowSendDialog(null); toast.success('Campaign marked as sent'); },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailCampaign.delete(id),
    onSuccess: () => qc.invalidateQueries(['email-campaigns']),
  });

  const openCampaignEdit = (c) => {
    setEditingCampaign(c);
    setCampaignForm({ ...c, email_list_ids: c.email_list_ids || [] });
    setShowCampaignForm(true);
  };

  const openNewCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm({ name: '', subject: '', from_name: 'The Candora Society', from_email: '', preview_text: '', html_content: '', campaign_type: 'newsletter', email_list_ids: [] });
    setShowCampaignForm(true);
  };

  const handleSaveList = () => {
    const subscribers = subscribersText.split('\n').filter(Boolean).map(line => {
      const [email, first_name = '', last_name = ''] = line.split(',').map(s => s.trim());
      return { email, first_name, last_name, subscribed: true };
    });
    saveListMutation.mutate({ ...listForm, subscribers, total_subscribers: subscribers.length });
  };

  const UNSUBSCRIBE_FOOTER = `
<div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
  <p>You are receiving this email because you subscribed to our mailing list.</p>
  <p>To unsubscribe, <a href="{{unsubscribe_link}}" style="color:#6b7280;">click here</a>.</p>
  <p>The Candora Society &middot; Edmonton, AB</p>
</div>`;

  const getSelectedListsCount = () => {
    return (campaignForm.email_list_ids || []).reduce((sum, id) => {
      const list = lists.find(l => l.id === id);
      return sum + (list?.total_subscribers || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
        <p className="text-sm text-slate-500 mt-1">Build, send, and track email campaigns with personalization and unsubscribe management.</p>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="lists">Email Lists</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* ── CAMPAIGNS ── */}
        <TabsContent value="campaigns" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={openNewCampaign} className="gap-2"><Plus className="w-4 h-4" /> New Campaign</Button>
          </div>
          {campaigns.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><Mail className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No campaigns yet.</p></div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => {
                const openRate = c.total_sent > 0 ? Math.round((c.total_opened / c.total_sent) * 100) : null;
                return (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-800">{c.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{c.subject}</p>
                          {c.status === 'sent' && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span>📤 {c.total_sent || 0} sent</span>
                              <span>👁 {c.total_opened || 0} opened {openRate !== null && `(${openRate}%)`}</span>
                              <span>🖱 {c.total_clicked || 0} clicks</span>
                              <span>🚫 {c.total_unsubscribed || 0} unsubs</span>
                            </div>
                          )}
                          {c.sent_date && <p className="text-xs text-slate-400 mt-1">Sent {format(new Date(c.sent_date), 'MMM d, yyyy h:mm a')}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.status === 'draft' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openCampaignEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" onClick={() => setShowSendDialog(c)} className="gap-1"><Send className="w-3.5 h-3.5" /> Send</Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteCampaignMutation.mutate(c.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── EMAIL LISTS ── */}
        <TabsContent value="lists" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowListForm(true)} className="gap-2"><Plus className="w-4 h-4" /> New List</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map(list => (
              <Card key={list.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    {list.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{list.description}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-green-600 font-medium">{list.total_subscribers || 0} subscribed</span>
                    <span className="text-slate-400">{list.total_unsubscribed || 0} unsubscribed</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {lists.length === 0 && <p className="text-slate-400 col-span-full text-center py-12">No email lists yet.</p>}
          </div>
        </TabsContent>

        {/* ── TEMPLATES ── */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowTemplateForm(true)} className="gap-2"><Plus className="w-4 h-4" /> New Template</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-slate-800">{t.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{t.subject}</p>
                  <Badge variant="outline" className="text-xs capitalize">{t.category}</Badge>
                </CardContent>
              </Card>
            ))}
            {templates.length === 0 && <p className="text-slate-400 col-span-full text-center py-12">No templates yet.</p>}
          </div>
        </TabsContent>

        {/* ── ANALYTICS ── */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Campaigns Sent', value: campaigns.filter(c => c.status === 'sent').length, color: 'text-blue-600' },
              { label: 'Total Recipients', value: campaigns.reduce((s, c) => s + (c.total_sent || 0), 0).toLocaleString(), color: 'text-slate-700' },
              { label: 'Total Opens', value: campaigns.reduce((s, c) => s + (c.total_opened || 0), 0).toLocaleString(), color: 'text-green-600' },
              { label: 'Avg Open Rate', value: (() => { const sent = campaigns.reduce((s,c) => s+(c.total_sent||0),0); const opened = campaigns.reduce((s,c) => s+(c.total_opened||0),0); return sent > 0 ? `${Math.round(opened/sent*100)}%` : 'N/A'; })(), color: 'text-purple-600' },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Campaign Performance</CardTitle></CardHeader>
            <CardContent>
              {campaigns.filter(c => c.status === 'sent').length === 0 ? (
                <p className="text-slate-400 text-center py-8">No sent campaigns yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-slate-500 text-left">
                      <th className="pb-2 pr-4">Campaign</th>
                      <th className="pb-2 pr-4">Sent</th>
                      <th className="pb-2 pr-4">Opened</th>
                      <th className="pb-2 pr-4">Open Rate</th>
                      <th className="pb-2 pr-4">Clicks</th>
                      <th className="pb-2">Unsubs</th>
                    </tr></thead>
                    <tbody>
                      {campaigns.filter(c => c.status === 'sent').map(c => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{c.name}</td>
                          <td className="py-2 pr-4">{c.total_sent || 0}</td>
                          <td className="py-2 pr-4">{c.total_opened || 0}</td>
                          <td className="py-2 pr-4">{c.total_sent > 0 ? `${Math.round(c.total_opened/c.total_sent*100)}%` : '—'}</td>
                          <td className="py-2 pr-4">{c.total_clicked || 0}</td>
                          <td className="py-2">{c.total_unsubscribed || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Form Dialog */}
      <Dialog open={showCampaignForm} onOpenChange={setShowCampaignForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCampaign ? 'Edit Campaign' : 'New Email Campaign'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Campaign Name *</Label><Input value={campaignForm.name} onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Subject Line *</Label><Input value={campaignForm.subject} onChange={e => setCampaignForm(f => ({ ...f, subject: e.target.value }))} placeholder="Your email subject line" /></div>
              <div><Label>From Name</Label><Input value={campaignForm.from_name} onChange={e => setCampaignForm(f => ({ ...f, from_name: e.target.value }))} /></div>
              <div><Label>From Email</Label><Input value={campaignForm.from_email} onChange={e => setCampaignForm(f => ({ ...f, from_email: e.target.value }))} placeholder="noreply@candora.ca" /></div>
            </div>
            <div>
              <Label>Preview Text</Label>
              <Input value={campaignForm.preview_text} onChange={e => setCampaignForm(f => ({ ...f, preview_text: e.target.value }))} placeholder="Short preview shown in inbox..." />
            </div>
            <div>
              <Label>Email Lists</Label>
              <div className="space-y-1 mt-1">
                {lists.map(list => (
                  <label key={list.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox"
                      checked={(campaignForm.email_list_ids || []).includes(list.id)}
                      onChange={e => {
                        const ids = campaignForm.email_list_ids || [];
                        setCampaignForm(f => ({ ...f, email_list_ids: e.target.checked ? [...ids, list.id] : ids.filter(i => i !== list.id) }));
                      }}
                    />
                    {list.name} <span className="text-slate-400">({list.total_subscribers || 0} subscribers)</span>
                  </label>
                ))}
                {lists.length === 0 && <p className="text-xs text-slate-400">Create email lists first.</p>}
              </div>
            </div>
            <div>
              <Label>Email Body (HTML)</Label>
              <p className="text-xs text-slate-500 mb-1">Use <code className="bg-slate-100 px-1 rounded">{'{{first_name}}'}</code> for personalization. An unsubscribe footer is automatically appended.</p>
              <Textarea value={campaignForm.html_content} onChange={e => setCampaignForm(f => ({ ...f, html_content: e.target.value }))} rows={10} placeholder={`<h1>Hello {{first_name}},</h1>\n<p>Your email content here...</p>`} className="font-mono text-xs" />
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border text-xs text-slate-500">
              <strong>Auto-appended unsubscribe footer:</strong> All campaigns automatically include a compliant unsubscribe link at the bottom.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignForm(false)}>Cancel</Button>
            <Button onClick={() => saveCampaignMutation.mutate({ id: editingCampaign?.id, data: campaignForm })} disabled={!campaignForm.name || !campaignForm.subject || saveCampaignMutation.isPending}>
              Save Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email List Dialog */}
      <Dialog open={showListForm} onOpenChange={setShowListForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Email List</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>List Name *</Label><Input value={listForm.name} onChange={e => setListForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={listForm.description} onChange={e => setListForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div>
              <Label>Import Subscribers</Label>
              <p className="text-xs text-slate-500 mb-1">One per line: <code className="bg-slate-100 px-1 rounded">email, first_name, last_name</code></p>
              <Textarea value={subscribersText} onChange={e => setSubscribersText(e.target.value)} rows={6} placeholder="john@example.com, John, Smith&#10;jane@example.com, Jane, Doe" className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListForm(false)}>Cancel</Button>
            <Button onClick={handleSaveList} disabled={!listForm.name || saveListMutation.isPending}>Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Email Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Template Name *</Label><Input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Default Subject</Label><Input value={templateForm.subject} onChange={e => setTemplateForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div>
              <Label>Category</Label>
              <Select value={templateForm.category} onValueChange={v => setTemplateForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['newsletter','fundraising','event','announcement','follow_up','other'].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>HTML Content</Label>
              <Textarea value={templateForm.html_content} onChange={e => setTemplateForm(f => ({ ...f, html_content: e.target.value }))} rows={12} className="font-mono text-xs" placeholder="<h1>Hello {{first_name}},</h1>..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateForm(false)}>Cancel</Button>
            <Button onClick={() => saveTemplateMutation.mutate(templateForm)} disabled={!templateForm.name}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={!!showSendDialog} onOpenChange={() => setShowSendDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Send Campaign</DialogTitle></DialogHeader>
          {showSendDialog && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Ready to send <strong>{showSendDialog.name}</strong>?</p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                <p><span className="text-slate-500">Subject:</span> {showSendDialog.subject}</p>
                <p><span className="text-slate-500">From:</span> {showSendDialog.from_name}</p>
                <p><span className="text-slate-500">Recipients:</span> {getSelectedListsCount()} subscribers</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                ⚠️ An unsubscribe link will be included at the bottom of this email.
                Use <code>{'{{first_name}}'}</code> in content for personalization.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(null)}>Cancel</Button>
            <Button onClick={() => markSentMutation.mutate(showSendDialog.id)} disabled={markSentMutation.isPending} className="gap-1">
              <Send className="w-3.5 h-3.5" /> Confirm Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}