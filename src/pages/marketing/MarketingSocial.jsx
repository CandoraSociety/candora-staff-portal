import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Share2, Image, Upload, Trash2, Pencil, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PLATFORMS = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'];
const PLATFORM_COLORS = {
  facebook: 'bg-blue-100 text-blue-700', instagram: 'bg-pink-100 text-pink-700',
  twitter: 'bg-sky-100 text-sky-700', linkedin: 'bg-indigo-100 text-indigo-700',
  tiktok: 'bg-slate-100 text-slate-700', youtube: 'bg-red-100 text-red-700',
};
const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700', scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};
const EMPTY_FORM = { title: '', content: '', platforms: [], status: 'draft', media_urls: [], scheduled_date: '', hashtags: [], hashtagText: '', notes: '' };

export default function MarketingSocial() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['mkt-social-all'],
    queryFn: () => base44.entities.SocialPost.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => id ? base44.entities.SocialPost.update(id, data) : base44.entities.SocialPost.create(data),
    onSuccess: () => { qc.invalidateQueries(['mkt-social-all']); qc.invalidateQueries(['mkt-social']); closeForm(); toast.success('Post saved'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.delete(id),
    onSuccess: () => { qc.invalidateQueries(['mkt-social-all']); qc.invalidateQueries(['mkt-social']); },
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...EMPTY_FORM, ...p, hashtagText: (p.hashtags || []).join(' ') }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const togglePlatform = (pl) => {
    setForm(f => ({ ...f, platforms: f.platforms.includes(pl) ? f.platforms.filter(p => p !== pl) : [...f.platforms, pl] }));
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, media_urls: [...(f.media_urls || []), file_url] }));
    setUploading(false);
    toast.success('Media uploaded');
  };

  const handleSave = () => {
    const data = { ...form, hashtags: form.hashtagText ? form.hashtagText.split(/\s+/).filter(Boolean) : [] };
    delete data.hashtagText;
    saveMutation.mutate({ id: editing?.id, data });
  };

  const grouped = { draft: [], scheduled: [], published: [], cancelled: [] };
  posts.forEach(p => { if (grouped[p.status]) grouped[p.status].push(p); });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Social Media Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Draft, schedule, and manage social media content with media attachments.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> New Post</Button>
      </div>

      {/* Kanban-style board */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['draft', 'scheduled', 'published', 'cancelled']).map(status => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-600 capitalize">{status}</h3>
                <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{grouped[status].length}</span>
              </div>
              {grouped[status].length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">Empty</div>
              ) : (
                grouped[status].map(post => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      {(post.media_urls || []).length > 0 && (
                        <div className="mb-2 rounded-md overflow-hidden aspect-video bg-slate-100">
                          <img src={post.media_urls[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <p className="font-medium text-sm text-slate-800 mb-1 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{post.content}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(post.platforms || []).map(pl => (
                          <span key={pl} className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${PLATFORM_COLORS[pl]}`}>{pl}</span>
                        ))}
                      </div>
                      {post.scheduled_date && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-2">
                          <Calendar className="w-2.5 h-2.5" />
                          {format(new Date(post.scheduled_date), 'MMM d, h:mm a')}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(post)}><Pencil className="w-2.5 h-2.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => deleteMutation.mutate(post.id)}><Trash2 className="w-2.5 h-2.5 text-red-500" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Post Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Post' : 'New Social Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div>
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORMS.map(pl => (
                  <button key={pl} type="button" onClick={() => togglePlatform(pl)}
                    className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${form.platforms.includes(pl) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'}`}>
                    {pl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Caption / Content *</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Write your post caption here..." />
            </div>
            <div>
              <Label>Hashtags</Label>
              <Input value={form.hashtagText} onChange={e => setForm(f => ({ ...f, hashtagText: e.target.value }))} placeholder="#nonprofit #community #candora" />
            </div>
            <div>
              <Label>Media (Images/Videos)</Label>
              <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-teal-300 transition-colors mt-1">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{uploading ? 'Uploading...' : 'Upload image or video'}</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
              </label>
              {(form.media_urls || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {form.media_urls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-slate-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setForm(f => ({ ...f, media_urls: f.media_urls.filter((_, j) => j !== i) }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1">You can add logos, watermarks, and branding from the Brand Assets library to your media.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm">
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              {form.status === 'scheduled' && (
                <div><Label>Scheduled Date/Time</Label><Input type="datetime-local" value={form.scheduled_date?.slice(0, 16)} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} /></div>
              )}
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.content || saveMutation.isPending}>Save Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}