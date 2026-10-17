import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileUp } from 'lucide-react';
import { toast } from 'sonner';

// Import an old grant document: the file is uploaded, the AI reads it and
// extracts everything grant-relevant into organized notes, then the entry
// dialog opens pre-filled so staff can title/tag it before it's retained.
export default function KnowledgeDocImport({ open, onClose, onExtracted }) {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('');
  const busy = !!stage;

  const close = () => {
    if (busy) return;
    setFile(null);
    setStage('');
    onClose?.();
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setStage('Uploading the document...');
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });

      setStage('The AI is reading the document and extracting the key information...');
      const signed = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: file_uri, expires_in: 900 });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: 'Extract ALL substantive information from this document into organized notes for a grant knowledge base. Capture every grant-relevant detail: funder names, grant/program names, amounts, dates, deadlines, requirements, eligibility criteria, decisions and outcomes, commitments, reporting obligations, contact people, and any other notable content. Organize with clear headings and bullet points, and preserve specific names, numbers and dates exactly.',
        file_urls: [signed.signed_url],
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short title (max 8 words) describing this document' },
            notes: { type: 'string', description: 'The organized extraction notes' },
          },
          required: ['title', 'notes'],
        },
      });

      onExtracted?.({
        title: res?.title || file.name.replace(/\.[^.]+$/, ''),
        content: res?.notes || '',
        entry_type: 'document',
        source_file_url: file_uri,
        source_file_name: file.name,
      });
      setFile(null);
      setStage('');
      close();
    } catch (e) {
      toast.error('Failed to extract the document');
      setStage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import a Grant Document</DialogTitle>
          <DialogDescription>
            Upload an old grant document (PDF, Word, Excel, text or image). The AI reads it and turns it into a knowledge entry the portal can draw from later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/40 px-4 py-8 cursor-pointer hover:bg-muted/70 transition-colors">
            <FileUp className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-medium">{file ? file.name : 'Click to choose a file'}</span>
            <span className="text-xs text-muted-foreground">.pdf · .docx · .xlsx · .txt · .png / .jpg</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.png,.jpg,.jpeg"
              className="hidden"
              disabled={busy}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {stage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/60 border rounded-md px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" /> {stage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || busy} className="gap-1">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Extract &amp; Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}