import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';

// Shared upload dialog for EmpowerU Program Documents — 'participant' documents
// are general participant-related files (optionally linked to one participant);
// 'program' documents are program-wide forms and reference sheets.
export default function DocumentUploadDialog({ open, onOpenChange, category, participants = [], cohorts = [], onSaved }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setFile(null); setForm({ title: '', doc_type: '', participant_id: '', cohort_id: '', notes: '' }); if (fileRef.current) fileRef.current.value = ''; }
  }, [open]);

  const pick = (e) => setFile(e.target.files?.[0] || null);

  const submit = async () => {
    if (!form.title || !file || busy) return;
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const me = await base44.auth.me().catch(() => null);
      const participant = participants.find(p => p.id === form.participant_id);
      const cohort = cohorts.find(c => c.id === form.cohort_id);
      await base44.entities.EmpowerUDocument.create({
        title: form.title,
        category,
        doc_type: form.doc_type || null,
        participant_id: category === 'participant' ? form.participant_id : null,
        participant_name: participant ? `${participant.first_name} ${participant.last_name}` : null,
        cohort_id: form.cohort_id || null,
        cohort_name: cohort?.name || null,
        file_uri,
        file_name: file.name,
        notes: form.notes || null,
        uploaded_by_name: me?.full_name || null,
        uploaded_date: new Date().toISOString().split('T')[0],
      });
      toast({ title: 'Document uploaded' });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{category === 'participant' ? 'Add Participant Document' : 'Add Program Form / Reference Sheet'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. United Way facilitator submission" />
          </div>
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Input value={form.doc_type || ''} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))} placeholder="e.g. ID copy, Assessment, Reference sheet" />
          </div>
          {category === 'participant' && (
            <div className="space-y-1.5">
              <Label>Participant (optional)</Label>
              <Select value={form.participant_id || 'none'} onValueChange={v => setForm(f => ({ ...f, participant_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="General (no specific participant)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General (no specific participant)</SelectItem>
                  {participants.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Cohort (optional)</Label>
            <Select value={form.cohort_id || 'none'} onValueChange={v => setForm(f => ({ ...f, cohort_id: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>File *</Label>
            <input ref={fileRef} type="file" onChange={pick} className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title || !file || busy} className="gap-2"><Upload className="h-4 w-4" />{busy ? 'Uploading...' : 'Upload'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}