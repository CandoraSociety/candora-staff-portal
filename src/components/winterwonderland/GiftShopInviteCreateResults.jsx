import React from 'react';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

function downloadLinks(results) {
  const header = 'Guardian,Email,Phone,Status,Link';
  const lines = results
    .filter(row => row.link)
    .map(row => [row.guardian_name || '', row.guardian_email || '', row.guardian_phone || '', row.status || '', row.link]
      .map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'kids-gift-shop-invitation-links.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

// What was added to the list after an uploaded family list — the links are ready
// and waiting; nothing has been sent, so staff can review the list first.
export default function GiftShopInviteCreateResults({ results, onDone }) {
  const created = results.filter(r => r.status === 'created');
  const skipped = results.filter(r => r.status !== 'created');
  const linked = results.filter(r => r.central_db_status === 'linked').length;
  const opened = results.filter(r => r.central_db_status === 'created').length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-green-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-green-800"><CheckCircle2 className="h-4 w-4" /> Links created</p>
          <p className="text-2xl font-bold text-green-900">{created.length}</p>
          <p className="text-xs text-green-800/80">Added to the list — nothing sent yet</p>
        </div>
        <div className="rounded-lg border bg-amber-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-amber-800"><AlertCircle className="h-4 w-4" /> Not added</p>
          <p className="text-2xl font-bold text-amber-900">{skipped.length}</p>
        </div>
      </div>

      {(linked > 0 || opened > 0) && (
        <p className="text-xs text-muted-foreground">
          Central Database:
          {linked > 0 && <> {linked} {linked === 1 ? 'family' : 'families'} linked to an existing file</>}
          {linked > 0 && opened > 0 && ' ·'}
          {opened > 0 && <> {opened} new {opened === 1 ? 'file' : 'files'} opened</>}
        </p>
      )}

      {skipped.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">These rows were left out of the list:</p>
          <div className="rounded-lg border divide-y max-h-64 overflow-y-auto">
            {skipped.map((row, index) => (
              <div key={`${row.guardian_email}-${index}`} className="px-3 py-2 space-y-1">
                <p className="text-sm font-medium truncate">{row.guardian_name || 'Unnamed family'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {row.guardian_email ? ` · ${row.guardian_email}` : row.guardian_phone ? ` · ${row.guardian_phone}` : ''}
                </p>
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

      <p className="text-sm text-muted-foreground">
        Review the list on the Pre-registration tab, then press Send invitations to send them.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => downloadLinks(results)} disabled={!results.some(r => r.link)}>
          <Download className="h-4 w-4" /> Download links
        </Button>
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
}