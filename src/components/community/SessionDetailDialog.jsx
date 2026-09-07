import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Trash2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const isImage = (name) => /\.(jpe?g|png|gif|webp|heic)$/i.test(name || '');

export default function SessionDetailDialog({ open, onOpenChange, session, onSaved }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [attended, setAttended] = useState([]);
  const [plan, setPlan] = useState('');
  const [docs, setDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: registrations = [] } = useQuery({
    queryKey: ['community-registrations', session?.program_id],
    queryFn: () => base44.entities.CommunityRegistration.filter({ program_id: session.program_id }, '-registration_date', 500),
    enabled: open && !!session?.program_id,
  });

  useEffect(() => {
    if (open && session) {
      setAttended(session.attended_participant_ids || []);
      setPlan(session.plan || '');
      setDocs(session.documents || []);
    }
  }, [open, session]);

  const registered = session?.registered_participant_ids || [];
  const seen = new Set();
  const participants = (registrations || []).filter(r => {
    if (!r.participant_id || seen.has(r.participant_id)) return false;
    if (registered.length && !registered.includes(r.participant_id)) return false;
    seen.add(r.participant_id);
    return true;
  });

  const toggle = (id) => setAttended(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const persist = async (patch, message) => {
    setSaving(true);
    try {
      await base44.entities.CommunitySession.update(session.id, patch);
      toast({ title: message });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => persist({ attended_participant_ids: attended, plan, documents: docs }, 'Session details saved');
  const handleComplete = () => persist({ attended_participant_ids: attended, plan, documents: docs, status: 'completed' }, 'Attendance saved — session completed');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocs(prev => [...prev, {
        id: crypto.randomUUID(),
        file_name: file.name,
        file_url,
        uploaded_date: new Date().toISOString().split('T')[0],
      }]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (id) => setDocs(prev => prev.filter(d => d.id !== id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session?.title || session?.program_name || 'Session'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-1">
          <div className="space-y-2">
            <Label>Attendance ({attended.length} / {participants.length} attending)</Label>
            {participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No participants registered for this program yet.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                {participants.map(r => (
                  <label key={r.participant_id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                    <input type="checkbox" checked={attended.includes(r.participant_id)} onChange={() => toggle(r.participant_id)} className="rounded" />
                    <span className="text-sm">{r.participant_name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Session Plan</Label>
            <Textarea rows={3} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Projects, activities, materials planned for this session..." />
          </div>

          <div className="space-y-2">
            <Label>Documents &amp; Images ({docs.length})</Label>
            <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-border rounded-lg py-5 px-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload patterns, photos, documents'}</span>
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            {docs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {docs.map(d => (
                  <div key={d.id} className="border rounded-lg overflow-hidden">
                    {isImage(d.file_name) && (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                        <img src={d.file_url} alt={d.file_name} className="h-20 w-full object-cover" />
                      </a>
                    )}
                    <div className="flex items-center gap-1 p-1.5">
                      <span className="text-[11px] truncate flex-1" title={d.file_name}>{d.file_name}</span>
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5 text-muted-foreground" /></a>
                      <button type="button" onClick={() => removeDoc(d.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={handleSave} disabled={saving || uploading}>Save</Button>
          <Button onClick={handleComplete} disabled={saving || uploading}>Save &amp; Mark Completed</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}