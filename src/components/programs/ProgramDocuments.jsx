import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Trash2, Loader2, ExternalLink } from 'lucide-react';

const fmtDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

/**
 * Documents attached to a program — course materials, handouts, curriculum.
 * Files are stored privately; opening one signs a short-lived link.
 */
export default function ProgramDocuments({ documents = [], onChange, emptyText = 'No documents uploaded for this program yet.' }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState('');

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const me = await base44.auth.me().catch(() => null);
      const added = [];
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        added.push({
          title: file.name,
          file_name: file.name,
          file_uri,
          uploaded_by: me?.full_name || me?.email || '',
          uploaded_at: new Date().toISOString(),
        });
      }
      await onChange([...(documents || []), ...added]);
    } catch (err) {
      setError(err?.message || 'The document could not be uploaded.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const openDocument = async (doc) => {
    setOpeningId(doc.file_uri);
    setError('');
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri, expires_in: 3600 });
      window.open(signed_url, '_blank');
    } catch (err) {
      setError(err?.message || 'That document could not be opened.');
    } finally {
      setOpeningId(null);
    }
  };

  const removeDocument = async (doc) => {
    if (!window.confirm(`Remove "${doc.title || doc.file_name}" from this program?`)) return;
    await onChange((documents || []).filter(d => d.file_uri !== doc.file_uri));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Documents ({(documents || []).length})
        </p>
        <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {(documents || []).length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {(documents || []).map(doc => (
            <div key={doc.file_uri} className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{doc.title || doc.file_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {[fmtDate(doc.uploaded_at), doc.uploaded_by].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" title="Open" disabled={openingId === doc.file_uri} onClick={() => openDocument(doc)}>
                {openingId === doc.file_uri ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Remove" onClick={() => removeDocument(doc)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}