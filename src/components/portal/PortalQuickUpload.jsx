import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FolderUp, Loader2 } from 'lucide-react';
import PortalFileUploadDialog from '@/components/portal/PortalFileUploadDialog';
import { portalUploadLabel } from '@/lib/portalQuickUpload';
import { openVaultFile } from '@/lib/vaultFiles';
import useAccessibleFiles from '@/lib/useAccessibleFiles';

// Quick upload strip on a portal's dashboard: files go straight into that
// portal's own SharePoint folder.
export default function PortalQuickUpload({ moduleId }) {
  const portalName = portalUploadLabel(moduleId);
  const [open, setOpen] = useState(false);

  // Only files this user is allowed to see come back, then narrowed to this portal
  const { files, isLoading } = useAccessibleFiles();
  const recent = useMemo(
    () => files.filter((f) => f.portal_key === moduleId).slice(0, 3),
    [files, moduleId],
  );

  if (!portalName) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FolderUp className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Quick upload — {portalName}</p>
            <p className="text-xs text-muted-foreground">
              Files are saved in the {portalName} folder in SharePoint and appear in the File Manager.
            </p>
            {isLoading ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading recent uploads…</p>
            ) : recent.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {recent.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => openVaultFile(file)}
                    className="flex max-w-[220px] items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-foreground hover:bg-muted/70"
                    title={file.description || file.original_name}
                  >
                    <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.display_name || file.original_name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0 gap-2">
          <FolderUp className="h-4 w-4" /> Upload file
        </Button>
      </CardContent>
      <PortalFileUploadDialog open={open} onOpenChange={setOpen} portal={moduleId} portalName={portalName} />
    </Card>
  );
}