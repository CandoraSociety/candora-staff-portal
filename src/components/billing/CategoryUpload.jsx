import { useRef, useState } from 'react';
import { Upload, X, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Per-category manual backup upload control. Lets a staff member attach a
 * manually uploaded file to an invoice-package category (CRT, Invoice,
 * Childminding, Work Exposure, Supporting) as a fallback when the
 * auto-gathered document is missing or incorrect. The parent owns the
 * uploads array and persists changes to the InvoicePackage entity.
 */
export default function CategoryUpload({ category, uploads, onUpload, onRemove, locked }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const catUploads = (uploads || []).filter((u) => u.category === category);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      await onUpload({ category, file_url: res.file_url, file_name: file.name });
    } catch (err) {
      toast.error('Upload failed: ' + (err?.message || 'error'));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
        Upload backup
      </Button>
      {catUploads.map((u) => (
        <span
          key={u.id || u.file_url}
          className="inline-flex items-center gap-1 rounded-md border bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
        >
          <Paperclip className="h-3 w-3 shrink-0" />
          <a
            href={u.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline max-w-[220px] truncate"
            title={u.file_name}
          >
            {u.file_name || 'file'}
          </a>
          {!locked && (
            <button
              type="button"
              onClick={() => onRemove(u)}
              className="text-slate-400 hover:text-red-500 ml-0.5"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}