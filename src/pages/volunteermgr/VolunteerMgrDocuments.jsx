import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, ExternalLink, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import moment from 'moment';

const docTypes = ['waiver', 'agreement', 'background_check', 'confidentiality', 'code_of_conduct', 'volunteer_policies', 'other'];

const emptyForm = { volunteer_id: '', volunteer_name: '', document_type: 'waiver', title: '', file_url: '', signed: false, signed_date: '', expiry_date: '', notes: '' };

export default function VolunteerMgrDocuments() {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['vol-documents'],
    queryFn: () => base44.entities.VolunteerDocument.list('-created_date', 200),
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['vol-volunteers'],
    queryFn: () => base44.entities.Volunteer.list('-created_date', 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.VolunteerDocument.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vol-documents'] }); setFormOpen(false); setForm(emptyForm); },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, file_url }));
    setUploading(false);
  };

  const selectVolunteer = (volId) => {
    const vol = volunteers.find(v => v.id === volId);
    setForm(p => ({ ...p, volunteer_id: volId, volunteer_name: vol ? `${vol.first_name} ${vol.last_name}` : '' }));
  };

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const filtered = documents.filter(d =>
    (d.volunteer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">{documents.length} documents on file</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Upload Document</Button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3">
        {filtered.map(doc => (
          <Card key={doc.id} className="shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.volunteer_name} · {doc.document_type?.replace(/_/g, ' ')}</p>
                {doc.expiry_date && <p className="text-xs text-muted-foreground">Exp: {moment(doc.expiry_date).format('MMM D, YYYY')}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{doc.signed ? 'Signed' : 'Unsigned'}</Badge>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">No documents found.</div>}
      </div>

      <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); if (!o) setForm(emptyForm); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Volunteer *</Label>
              <Select value={form.volunteer_id} onValueChange={selectVolunteer}>
                <SelectTrigger><SelectValue placeholder="Select volunteer..." /></SelectTrigger>
                <SelectContent>{volunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.first_name} {v.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Document Type *</Label>
              <Select value={form.document_type} onValueChange={v => update('document_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{docTypes.map(d => <SelectItem key={d} value={d}>{d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => update('title', e.target.value)} required /></div>
            <div>
              <Label>File</Label>
              <Input type="file" onChange={handleFileUpload} />
              {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="signed" checked={form.signed} onCheckedChange={v => update('signed', v)} />
              <Label htmlFor="signed">Document is signed</Label>
            </div>
            {form.signed && <div><Label>Signed Date</Label><Input type="date" value={form.signed_date} onChange={e => update('signed_date', e.target.value)} /></div>}
            <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending || uploading}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}