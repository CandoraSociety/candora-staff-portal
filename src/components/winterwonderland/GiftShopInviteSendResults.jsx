import React from 'react';
import { AlertCircle, CheckCircle2, Download, MailWarning, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const COPY_LABEL = { failed: 'Not emailed', no_email: 'No email address', skipped: 'Skipped' };

function downloadLinks(results) {
  const header = 'Guardian,Email,Status,Link';
  const lines = results
    .filter(row => row.link)
    .map(row => [row.guardian_name || '', row.guardian_email || '', row.status || '', row.link]
      .map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'kids-gift-shop-invitation-links.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

// What happened to each family after a send, and a way to finish by hand for
// anyone the email could not reach.
export default function GiftShopInviteSendResults({ results, onDone }) {
  const { toast } = useToast();
  const sent = results.filter(r => r.status === 'sent');
  const needing = results.filter(r => r.status !== 'sent');
  const linked = results.filter(r => r.central_db_status === 'linked').length;
  const created = results.filter(r => r.central_db_status === 'created').length;

  const copy = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Link copied' });
    } catch {
      toast({ title: 'Could not copy', description: link, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-green-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-green-800"><CheckCircle2 className="h-4 w-4" /> Invitations emailed</p>
          <p className="text-2xl font-bold text-green-900">{sent.length}</p>
        </div>
        <div className="rounded-lg border bg-amber-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-amber-800"><MailWarning className="h-4 w-4" /> Still to send by hand</p>
          <p className="text-2xl font-bold text-amber-900">{needing.length}</p>
        </div>
      </div>

      {(linked > 0 || created > 0) && (
        <p className="text-xs text-muted-foreground">
          Central Database:
          {linked > 0 && <> {linked} {linked === 1 ? 'family' : 'families'} linked to an existing file</>}
          {linked > 0 && created > 0 && ' ·'}
          {created > 0 && <> {created} new {created === 1 ? 'file' : 'files'} opened</>}
        </p>
      )}

      {needing.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Each of these families has their own link waiting. Send it by text, print it, or try again later.
          </p>
          <div className="rounded-lg border divide-y max-h-64 overflow-y-auto">
            {needing.map((row, index) => (
              <div key={`${row.guardian_email}-${index}`} className="px-3 py-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.guardian_name || 'Unnamed family'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {COPY_LABEL[row.status] || row.status}
                      {row.guardian_email ? ` · ${row.guardian_email}` : row.guardian_phone ? ` · ${row.guardian_phone}` : ''}
                    </p>
                  </div>
                  {row.link && (
                    <Button size="sm" variant="ghost" onClick={() => copy(row.link)}>
                      <Copy className="h-3.5 w-3.5" /> Copy link
                    </Button>
                  )}
                </div>
                {row.message && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> {row.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => downloadLinks(results)} disabled={!results.some(r => r.link)}>
          <Download className="h-4 w-4" /> Download links
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}