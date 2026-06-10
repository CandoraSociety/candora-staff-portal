import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Search, Image, FileText, Video, Plus, Trash2, Download, Tag, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const ASSET_TYPES = ['logo', 'banner', 'photo', 'video', 'document', 'template', 'icon', 'font', 'other'];
const CATEGORIES = ['brand', 'program', 'event', 'fundraising', 'social_media', 'print', 'web', 'other'];

const TYPE_ICONS = {
  logo: Image, banner: Image, photo: Image, video: Video, document: FileText,
  template: FileText, icon: Image, font: FileText, other: FileText,
};

export default function MarketingAssets() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', asset_type: 'logo', category: 'brand', description: '', tags: '', program_event: '' });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['mkt-assets-all'],
    queryFn: () => base44.entities.MarketingAsset.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => id
      ? base44.entities.MarketingAsset.update(id, data)
      : base44.entities.MarketingAsset.create(data),
    onSuccess: () => { qc.invalidateQueries(['mkt-assets-all']); qc.invalidateQueries(['mkt-assets']); closeForm(); toast.success('Asset saved'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingAsset.delete(id),
    onSuccess: () => { qc.invalidateQueries(['mkt-assets-all']); qc.invalidateQueries(['mkt-assets']); toast.success('Asset deleted'); },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const ext = file.name.split('.').pop().toUpperCase();
    setForm(f => ({ ...f, file_url, file_type: ext, file_size: file.size, name: f.name || file.name }));
    setUploading(false);
  };

  const openNew = () => { setEditing(null); setForm({ name: '', asset_type: 'logo', category: 'brand', description: '', tags: '', program_event: '' }); setShowForm(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...a, tags: (a.tags || []).join(', ') }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = () => {
    const data = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
    saveMutation.mutate({ id: editing?.id, data });
  };

  const filtered = assets.filter(a => {
    if (filterType && a.asset_type !== filterType) return false;
    if (filterCategory && a.category !== filterCategory) return false;
    if (search && !`${a.name} ${a.description} ${(a.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brand Assets</h1>
          <p className="text-sm text-slate-500 mt-1">Logos, banners, photos, templates, and all branded materials.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Add Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search assets..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Types</SelectItem>
            {ASSET_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} assets</p>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading assets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No assets found. Upload your first asset to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(asset => {
            const Icon = TYPE_ICONS[asset.asset_type] || FileText;
            return (
              <Card key={asset.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {asset.file_url && ['logo', 'banner', 'photo', 'icon'].includes(asset.asset_type) ? (
                    <img src={asset.file_url} alt={asset.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(asset)} className="p-1.5 bg-white rounded-md hover:bg-slate-100">
                      <Pencil className="w-3.5 h-3.5 text-slate-700" />
                    </button>
                    {asset.file_url && (
                      <a href={asset.file_url} download target="_blank" rel="noreferrer" className="p-1.5 bg-white rounded-md hover:bg-slate-100">
                        <Download className="w-3.5 h-3.5 text-slate-700" />
                      </a>
                    )}
                    <button onClick={() => deleteMutation.mutate(asset.id)} className="p-1.5 bg-white rounded-md hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium text-slate-800 truncate">{asset.name}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 capitalize">{asset.asset_type}</span>
                    {asset.file_type && <span className="text-[10px] bg-slate-100 rounded px-1">{asset.file_type}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Asset name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.asset_type} onValueChange={v => setForm(f => ({ ...f, asset_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Program / Event (optional)</Label>
              <Input value={form.program_event} onChange={e => setForm(f => ({ ...f, program_event: e.target.value }))} placeholder="e.g. Annual Gala 2025" />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="logo, brand, primary" />
            </div>
            <div>
              <Label>File</Label>
              <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-4 cursor-pointer hover:border-pink-300 transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">
                  {uploading ? 'Uploading...' : form.file_url ? 'Replace file' : 'Upload file'}
                </span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              {form.file_url && <p className="text-xs text-green-600 mt-1">✓ File uploaded</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}