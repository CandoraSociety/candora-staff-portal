import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, ExternalLink, Search, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

const categories = ['job_description', 'policy', 'procedure', 'handbook', 'template', 'form', 'pay_grid', 'org_chart', 'other'];

export default function NexusDocuments() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', department: 'All', description: '', file_url: '', access_level: 'managers_only' });
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({ queryKey: ['nexus-documents'], queryFn: () => base44.entities.NexusDocument.list('-created_date', 200) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NexusDocument.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nexus-documents'] }); setShowForm(false); setForm({ title: '', category: '', department: 'All', description: '', file_url: '', access_level: 'managers_only' }); },
  });

  const filtered = documents.filter(d => {
    const matchSearch = `${d.title} ${d.description}`.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />Upload Document</Button>}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No documents" description="Upload your first document." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs capitalize">{doc.category?.replace(/_/g, ' ')}</Badge>
                  {doc.file_url && <a href={doc.file_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" /></a>}
                </div>
                <h3 className="font-semibold text-sm mb-1">{doc.title}</h3>
                {doc.description && <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>}
                {doc.department && <p className="text-xs text-muted-foreground mt-1">{doc.department}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent><DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={val => setForm({ ...form, category: val })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Access Level</Label>
                <Select value={form.access_level} onValueChange={val => setForm({ ...form, access_level: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_staff">All Staff</SelectItem>
                    <SelectItem value="managers_only">Managers Only</SelectItem>
                    <SelectItem value="hr_admin_only">HR Admin Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>File *</Label>
              <Input type="file" onChange={handleFileUpload} disabled={uploading} />
              {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
              {form.file_url && <p className="text-xs text-primary">File uploaded ✓</p>}
            </div>
            <Button type="submit" disabled={createMutation.isPending || !form.file_url} className="w-full">
              {createMutation.isPending ? 'Saving...' : 'Upload Document'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}