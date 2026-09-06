import React, { useRef, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { uid, today } from '@/components/rc/intensive/caseConstants';

export default function CaseDocumentsTab({ documents = [], onAdd, onDelete, meName }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onAdd({ id: uid(), file_name: file.name, file_url, uploaded_date: today(), uploaded_by_name: meName || '' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
    setUploading(false);
    e.target.value = '';
  };

  const sorted = [...documents].sort((a, b) => (b.uploaded_date || '').localeCompare(a.uploaded_date || ''));

  return (
    <div className="space-y-4">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      <Card><CardContent className="p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Relevant Documents</p>
          <p className="text-xs text-muted-foreground mt-1">Assessment forms, support plans, consent forms, and other case documents.</p>
        </div>
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </CardContent></Card>

      {sorted.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <ul className="divide-y divide-border">
            {sorted.map(d => (
              <li key={d.id} className="p-3.5 flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground hover:text-primary hover:underline truncate block">{d.file_name}</a>
                  <p className="text-[10px] text-muted-foreground">
                    {d.uploaded_date || '—'}{d.uploaded_by_name ? ` • ${d.uploaded_by_name}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        </CardContent></Card>
      )}
    </div>
  );
}