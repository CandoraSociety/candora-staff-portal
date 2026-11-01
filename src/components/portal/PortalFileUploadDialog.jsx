import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToPortalStorage } from '@/lib/vaultFiles';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.png,.jpg,.jpeg';

export default function PortalFileUploadDialog({ open, onOpenChange, portal, portalName }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const reset = () => { setFile(null); setDescription(''); };

  const choose = (chosen) => {
    if (chosen) setFile(chosen);
  };

  const upload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    try {
      const saved = await uploadToPortalStorage(file, { portal, portalName, description });
      queryClient.invalidateQueries({ queryKey: ['portal-uploads', portal] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['all-files-search'] });
      toast.success(`Saved to the ${saved.folder} folder in SharePoint.`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isUploading) { if (!next) reset(); onOpenChange(next); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload to {portalName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!file ? (
            <div
              className="cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all hover:border-primary/50"
              onClick={() => document.getElementById('portal-file-input')?.click()}
            >
              <input id="portal-file-input" type="file" className="hidden" accept={ACCEPT}
                onChange={(event) => choose(event.target.files?.[0])} />
              <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Drop a file here or click to browse</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, CSV, text or images</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <FileText className="h-6 w-6 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={reset} title="Remove file"><X className="h-4 w-4" /></Button>
            </div>
          )}

          <div>
            <Label>Note (optional)</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="h-20" placeholder="What this file is for" />
          </div>

          <p className="text-xs text-muted-foreground">
            The file is saved in the {portalName} folder in SharePoint and appears in the File Manager.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancel</Button>
            <Button onClick={upload} disabled={!file || isUploading} className="gap-2">
              {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload file</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}