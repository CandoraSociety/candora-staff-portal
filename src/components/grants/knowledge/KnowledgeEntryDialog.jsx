import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ENTRY_TYPES } from '@/lib/grantKnowledgeConstants';

export default function KnowledgeEntryDialog({ open, initial, funders = [], onClose, onSaved }) {
  const isEdit = !!(initial && initial.id);
  const [title, setTitle] = useState('');
  const [entryType, setEntryType] = useState('note');
  const [relatedFunder, setRelatedFunder] = useState('');
  const [tags, setTags] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || '');
    setEntryType(initial?.entry_type || 'note');
    setRelatedFunder(initial?.related_funder || '');
    setTags((initial?.tags || []).join(', '));
    setEventDate(initial?.event_date || '');
    setContent(initial?.content || '');
  }, [open, initial]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('A title and content are required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        entry_type: entryType,
        related_funder: relatedFunder.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        event_date: eventDate || null,
        content,
      };
      if (isEdit) {
        await base44.entities.GrantKnowledgeEntry.update(initial.id, data);
        toast.success('Knowledge entry updated');
      } else {
        let me = null;
        try { me = await base44.auth.me(); } catch (_) {}
        await base44.entities.GrantKnowledgeEntry.create({
          ...data,
          source_file_url: initial?.source_file_url || null,
          source_file_name: initial?.source_file_name || null,
          created_by_name: me?.full_name || '',
        });
        toast.success('Saved to the knowledge base');
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast.error('Failed to save the knowledge entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose?.(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Knowledge Entry' : 'Add Knowledge'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this entry. Everything here stays searchable for future questions.'
              : 'Dump anything worth remembering: notes, an AI conversation, details about a past grant, etc.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. United Way 2023 application learnings" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={entryType}
                onChange={e => setEntryType(e.target.value)}
                className="w-full h-9 text-sm rounded-md border border-input bg-background px-2"
              >
                {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Related funder</Label>
              <Input value={relatedFunder} onChange={e => setRelatedFunder(e.target.value)} list="knowledge-funder-options" placeholder="e.g. United Way" />
              <datalist id="knowledge-funder-options">
                {funders.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Date (optional)</Label>
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. rejected, capital, youth programs" />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste notes, a conversation transcript, or anything you want the portal to remember..."
              className="min-h-[240px]"
            />
          </div>
          {initial?.source_file_name && (
            <p className="text-xs text-muted-foreground">Extracted from: {initial.source_file_name}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Save to Knowledge Base'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}