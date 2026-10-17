import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { TYPE_LABELS, TYPE_BADGES } from '@/lib/grantKnowledgeConstants';

export default function KnowledgeEntryCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openingSource, setOpeningSource] = useState(false);

  const openSource = async () => {
    if (!entry.source_file_url) return;
    setOpeningSource(true);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: entry.source_file_url, expires_in: 300 });
      window.open(signed_url, '_blank', 'noopener');
    } catch (_) { /* signed URL fetch failure is non-fatal for the card */ }
    setOpeningSource(false);
  };
  const content = entry.content || '';
  const isLong = content.length > 300;
  const preview = expanded || !isLong ? content : content.slice(0, 300) + '…';
  const dateLabel = entry.event_date || (entry.created_date ? entry.created_date.slice(0, 10) : '');

  return (
    <>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate">{entry.title}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGES[entry.entry_type] || TYPE_BADGES.note}`}>
                {TYPE_LABELS[entry.entry_type] || 'Note'}
              </span>
              {entry.related_funder && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {entry.related_funder}
                </span>
              )}
              {dateLabel && <span className="text-[10px] text-muted-foreground">{dateLabel}</span>}
              {(entry.tags || []).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>
              ))}
              {entry.created_by_name && (
                <span className="text-[10px] text-muted-foreground hidden sm:inline">· added by {entry.created_by_name}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(entry)} title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">{preview}</p>

        <div className="mt-2 flex items-center gap-3">
          {isLong && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
              {expanded ? 'Show less' : 'Show more'} <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          {entry.source_file_name && (
            <button onClick={openSource} disabled={openingSource} className="text-xs text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-60">
              {openingSource && <Loader2 className="w-3 h-3 animate-spin" />}
              Source: {entry.source_file_name}
            </button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this knowledge entry?</AlertDialogTitle>
            <AlertDialogDescription>
              "{entry.title}" will be removed from the knowledge base and the assistant will no longer draw from it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(entry.id); setConfirmDelete(false); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}