import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

// List of EmpowerU documents — view/download opens a time-limited signed URL
// (files live in private storage); delete removes the record.
export default function DocumentsList({ documents, loading, emptyMessage, onDeleted, showParticipant = false }) {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState(null);

  const openFile = async (doc) => {
    setBusyId(doc.id);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri, expires_in: 300 });
      window.open(signed_url, '_blank');
    } catch (err) {
      toast({ title: 'Could not open document', description: err.message, variant: 'destructive' });
    }
    setBusyId(null);
  };

  const remove = async (doc) => {
    if (busyId) return;
    setBusyId(doc.id);
    try {
      await base44.entities.EmpowerUDocument.delete(doc.id);
      toast({ title: 'Document deleted' });
      onDeleted();
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
    setBusyId(null);
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-6">Loading documents...</p>;
  if (documents.length === 0) return <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>;

  return (
    <div className="divide-y divide-border">
      {documents.map(doc => (
        <div key={doc.id} className="flex items-center gap-3 py-3">
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0"><FileText className="h-4 w-4 text-muted-foreground" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {showParticipant && doc.participant_name ? `${doc.participant_name} · ` : ''}
              {doc.doc_type ? `${doc.doc_type} · ` : ''}
              {doc.cohort_name ? `${doc.cohort_name} · ` : ''}
              {doc.uploaded_date ? `Uploaded ${formatDate(doc.uploaded_date)}` : ''}
              {doc.uploaded_by_name ? ` by ${doc.uploaded_by_name}` : ''}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openFile(doc)} disabled={busyId === doc.id} title="View / download">
              {busyId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className={cn('h-8 w-8 text-muted-foreground hover:text-destructive')} onClick={() => remove(doc)} disabled={busyId === doc.id} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}