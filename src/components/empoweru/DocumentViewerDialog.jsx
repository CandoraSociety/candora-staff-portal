import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const OFFICE_EXTS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

const getExtension = (name) => {
  const match = (name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
};

// In-app viewer for EmpowerU documents (private storage): images, PDFs and
// Office files render inline in a dialog — only the Download button downloads.
export default function DocumentViewerDialog({ doc, open, onOpenChange }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !doc) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri, expires_in: 3600 })
      .then(({ signed_url }) => { if (!cancelled) setUrl(signed_url); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not open document'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, doc]);

  if (!doc) return null;

  const ext = getExtension(doc.file_name || doc.file_uri);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[70dvh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (error) {
      return <p className="text-sm text-destructive text-center py-10">{error}</p>;
    }
    if (!url) return null;
    if (IMAGE_EXTS.includes(ext)) {
      return <img src={url} alt={doc.title} className="mx-auto max-w-full max-h-[70dvh] object-contain" />;
    }
    if (ext === 'pdf') {
      // Browsers render PDFs natively — no external viewer needed
      return <iframe src={url} title={doc.title} className="w-full h-[70dvh] rounded-md border bg-white" />;
    }
    if (OFFICE_EXTS.includes(ext)) {
      // Microsoft's embedded Office viewer — no sandbox attribute: it nests
      // frames and postMessages that a sandboxed iframe silently blocks
      const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      return <iframe src={src} title={doc.title} className="w-full h-[70dvh] rounded-md border bg-white" />;
    }
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">This file type can't be previewed in the app.</p>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => window.open(url, '_blank')}>
          <Download className="h-4 w-4" /> Download file
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle className="truncate">{doc.title}</DialogTitle>
            {url && (
              <Button variant="outline" size="sm" className="gap-1 flex-shrink-0" onClick={() => window.open(url, '_blank')}>
                <Download className="h-4 w-4" /> Download
              </Button>
            )}
          </div>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}