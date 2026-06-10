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
import { Plus, Inbox, Upload, Eye, CheckCircle, XCircle, Pencil, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const REQUEST_TYPES = [
  'poster', 'social_media_post', 'email_campaign', 'event_promotion',
  'program_promotion', 'video', 'photo', 'print_material', 'website_update', 'other'
];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const STATUS_COLORS = {
  submitted: 'bg-orange-100 text-orange-700',
  in_review: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
};
const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-600', normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
};

const EMPTY_REQUEST = {
  request_type: 'poster', title: '', description: '', requester_name: '', requester_email: '',
  requester_department: '', program_event_name: '', deadline: '', priority: 'normal', specs: '', file_urls: []
};

export default function MarketingRequests() {
  const qc = useQueryClient();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [form, setForm] = useState(EMPTY_REQUEST);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['mkt-requests-all'],
    queryFn: () => base44.entities.MarketingRequest.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingRequest.create(data),
    onSuccess: () => { qc.invalidateQueries(['mkt-requests-all']); qc.invalidateQueries(['mkt-requests']); setShowNewRequest(false); setForm(EMPTY_REQUEST); toast.success('Request submitted!'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MarketingRequest.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['mkt-requests-all']); qc.invalidateQueries(['mkt-requests']); setViewingRequest(null); toast.success('Request updated'); },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_urls: [...(f.file_urls || []), file_url] }));
    setUploading(false);
  };

  const filtered = requests.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const counts = { submitted: 0, in_review: 0, in_progress: 0, completed: 0, declined: 0 };
  requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Submit and manage marketing requests from staff across all departments.</p>
        </div>
        <Button onClick={() => setShowNewRequest(true)} className="gap-2"><Plus className="w-4 h-4" /> Submit Request</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="submitted">New ({counts.submitted})</TabsTrigger>
          <TabsTrigger value="in_review">In Review ({counts.in_review})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({counts.in_progress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Inbox className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No requests here.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <Card key={req.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingRequest(req)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-800">{req.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>{req.status?.replace('_', ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[req.priority]}`}>{req.priority}</span>
                    </div>
                    <p className="text-xs text-slate-500 capitalize mb-1">{req.request_type?.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-600 line-clamp-1">{req.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                      <span>By: {req.requester_name}</span>
                      {req.requester_department && <span>Dept: {req.requester_department}</span>}
                      {req.deadline && <span>Due: {format(new Date(req.deadline), 'MMM d, yyyy')}</span>}
                      {req.program_event_name && <span>For: {req.program_event_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {(req.file_urls || []).length > 0 && (
                      <span className="text-xs text-slate-400">{req.file_urls.length} file(s)</span>
                    )}
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submit Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submit Marketing Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Request Type *</Label>
                <Select value={form.request_type} onValueChange={v => setForm(f => ({ ...f, request_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REQUEST_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Request Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title of your request" /></div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe what you need in detail..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Your Name *</Label><Input value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} /></div>
              <div><Label>Your Email *</Label><Input type="email" value={form.requester_email} onChange={e => setForm(f => ({ ...f, requester_email: e.target.value }))} /></div>
              <div><Label>Department</Label><Input value={form.requester_department} onChange={e => setForm(f => ({ ...f, requester_department: e.target.value }))} /></div>
              <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
            </div>
            <div><Label>Program / Event Name (if applicable)</Label><Input value={form.program_event_name} onChange={e => setForm(f => ({ ...f, program_event_name: e.target.value }))} /></div>
            <div><Label>Specifications (size, format, colour, etc.)</Label><Textarea value={form.specs} onChange={e => setForm(f => ({ ...f, specs: e.target.value }))} rows={3} placeholder="e.g. 8.5x11 poster, CMYK, must include logo, print-ready PDF..." /></div>
            <div>
              <Label>Attach Reference Files</Label>
              <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-pink-300 transition-colors mt-1">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Uploading...' : 'Upload file'}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              {(form.file_urls || []).length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.file_urls.map((url, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 rounded p-2">
                      <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> File {i + 1}</a>
                      <button onClick={() => setForm(f => ({ ...f, file_urls: f.file_urls.filter((_, j) => j !== i) }))} className="text-red-500 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.title || !form.requester_name || !form.requester_email || createMutation.isPending}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Manage Request Dialog */}
      {viewingRequest && (
        <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{viewingRequest.title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[viewingRequest.status]}`}>{viewingRequest.status?.replace('_', ' ')}</span>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${PRIORITY_COLORS[viewingRequest.priority]}`}>{viewingRequest.priority} priority</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Type:</span> <span className="capitalize">{viewingRequest.request_type?.replace(/_/g, ' ')}</span></div>
                <div><span className="text-slate-500">Requestor:</span> {viewingRequest.requester_name}</div>
                <div><span className="text-slate-500">Email:</span> {viewingRequest.requester_email}</div>
                <div><span className="text-slate-500">Department:</span> {viewingRequest.requester_department || '—'}</div>
                <div><span className="text-slate-500">Deadline:</span> {viewingRequest.deadline ? format(new Date(viewingRequest.deadline), 'MMM d, yyyy') : '—'}</div>
                <div><span className="text-slate-500">Event:</span> {viewingRequest.program_event_name || '—'}</div>
              </div>
              <div><p className="text-slate-500 text-sm font-medium mb-1">Description</p><p className="text-sm">{viewingRequest.description}</p></div>
              {viewingRequest.specs && <div><p className="text-slate-500 text-sm font-medium mb-1">Specifications</p><p className="text-sm whitespace-pre-wrap">{viewingRequest.specs}</p></div>}
              {(viewingRequest.file_urls || []).length > 0 && (
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">Attached Files</p>
                  {viewingRequest.file_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline mb-1">
                      <ExternalLink className="w-3 h-3" /> File {i + 1}
                    </a>
                  ))}
                </div>
              )}
              {/* Staff actions */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {['in_review', 'in_progress', 'completed', 'declined'].map(s => (
                    <Button key={s} variant="outline" size="sm" className="capitalize text-xs"
                      onClick={() => updateMutation.mutate({ id: viewingRequest.id, data: { status: s } })}>
                      {s.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingRequest(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}