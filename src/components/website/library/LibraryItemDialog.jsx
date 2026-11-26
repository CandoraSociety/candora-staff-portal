import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = {
  title: '', kind: 'document', category: '', description: '',
  file_url: '', external_url: '', image_url: '', is_published: true, display_order: 0,
};

// Documents are stored publicly because they are meant to be read by anyone on
// the website; the record holds the address, never the file itself.
export default function LibraryItemDialog({ open, onOpenChange, item, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, ...(item || {}) });
  }, [open, item]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadPublicFile({ file });
      set('file_url', result.file_url);
      toast.success('File uploaded.');
    } catch (error) {
      toast.error(error?.message || 'The file could not be uploaded.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Give the item a title first.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, display_order: Number(form.display_order) || 0 };
      delete payload.id;
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.created_by_id;
      if (item?.id) await base44.entities.WebsiteLibraryItem.update(item.id, payload);
      else await base44.entities.WebsiteLibraryItem.create(payload);
      toast.success('Saved.');
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || 'The item could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{item?.id ? 'Edit item' : 'New item'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Kind</Label>
              <Select value={form.kind} onValueChange={(value) => set('kind', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document we publish</SelectItem>
                  <SelectItem value="resource">Link to another site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Group on the website</Label>
            <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Annual reports" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {form.kind === 'document' ? (
            <div className="space-y-1.5">
              <Label className="text-xs">File (stored publicly — anyone with the link can open it)</Label>
              <div className="flex gap-2">
                <Input value={form.file_url} onChange={(e) => set('file_url', e.target.value)} placeholder="https://…" />
                <Button variant="outline" asChild disabled={uploading}>
                  <label className="cursor-pointer">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {uploading ? 'Uploading…' : 'Upload'}
                    <input type="file" className="hidden" onChange={upload} />
                  </label>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Address of the resource</Label>
              <Input value={form.external_url} onChange={(e) => set('external_url', e.target.value)} placeholder="https://…" />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Picture address (optional)</Label>
              <Input value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">List position</Label>
              <Input type="number" value={form.display_order} onChange={(e) => set('display_order', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={!!form.is_published} onCheckedChange={(value) => set('is_published', value)} />
            Show on the website
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}