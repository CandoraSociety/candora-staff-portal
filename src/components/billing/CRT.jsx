import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle, CheckCircle2, Download, ExternalLink, FileSpreadsheet,
  Loader2, RefreshCw, CalendarPlus, Clock, Users, Wrench, Lock, Unlock
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import CreateMonthDialog from './CreateMonthDialog';
import CrtBillingHeader from './CrtBillingHeader';

export default function CRT({ clients = [] }) {
  const [syncing, setSyncing] = useState(false);
  const [creatingMonth, setCreatingMonth] = useState(false);
  const [repairing, setRepairing] = useState(false);
  // Which file is shown in the live preview. null = the active workbook.
  // This is a VIEW-ONLY toggle — it never changes which workbook is active
  // for sync or roll-forward.
  const [viewFileId, setViewFileId] = useState(null);

  // Fetch CRT workbook status
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['crt-workbook-status'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCrtWorkbookStatus', {});
      return res.data;
    },
  });

  // When the user selects a month to view, also align that workbook's
  // Narrative Report sheet to its own month (so the preview shows the
  // correct reporting-period dates + that month's narrative, not the
  // active month's). Closed (frozen) months are skipped by the function.
  const [narrativeSyncing, setNarrativeSyncing] = useState(false);
  useEffect(() => {
    if (!viewFileId) return;
    const file = status?.allFiles?.find(f => f.id === viewFileId);
    if (!file?.name) return;
    let cancelled = false;
    setNarrativeSyncing(true);
    base44.functions.invoke('syncNarrativeReportToMonth', { workbookName: file.name })
      .then(() => { if (!cancelled) refetch(); })
      .catch(() => { /* non-fatal — preview still loads */ })
      .finally(() => { if (!cancelled) setNarrativeSyncing(false); });
    return () => { cancelled = true; };
  }, [viewFileId]);

  // Embed URL for a user-selected (non-active) file. When viewFileId is null
  // the active workbook's embed (from status) is used directly. The query is
  // gated on the narrative sync finishing so the iframe never renders a
  // pre-sync (stale) snapshot of the Narrative Report sheet.
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['crt-file-preview', viewFileId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getCrtFilePreview', { fileId: viewFileId });
      return res.data;
    },
    enabled: !!viewFileId && !narrativeSyncing,
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('syncCrtWorkbook', {});
      const data = res.data;
      if (data.status === 'success') {
        const synced = (data.files || []).filter(f => f.status === 'synced');
        const skipped = (data.files || []).filter(f => f.status === 'skipped_closed');
        const errs = (data.files || []).filter(f => f.status === 'error');
        toast.success(
          `Synced ${synced.length} open workbook(s)` +
          (skipped.length ? ` · ${skipped.length} closed skipped` : '') +
          (errs.length ? ` · ${errs.length} error(s)` : '')
        );
        refetch();
      } else if (data.status === 'no_workbook') {
        toast.error('No CRT workbook found. Upload one to the _DEPT_Pathways SharePoint folder first.');
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch (err) {
      toast.error('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateMonth = async () => {
    setCreatingMonth(true);
    try {
      const res = await base44.functions.invoke('ensureCurrentMonthCrt', {});
      const data = res.data;
      if (data.status === 'success') {
        toast.success(data.message);
        refetch();
      } else if (data.status === 'already_exists') {
        toast.info(data.message);
      } else if (data.status === 'copy_pending') {
        toast.info(data.message);
        setTimeout(() => refetch(), 10000);
      } else {
        toast.error(data.error || "Could not create this month's workbook");
      }
    } catch (err) {
      toast.error('Create failed: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingMonth(false);
    }
  };

  const handleRepair = async () => {
    setRepairing(true);
    try {
      const res = await base44.functions.invoke('repairCrtDateRanges', {});
      const data = res.data;
      if (data.status === 'success') {
        toast.success(data.message);
        refetch();
      } else if (data.status === 'partial') {
        toast.info(data.message);
        refetch();
      } else {
        toast.error(data.error || 'Repair failed');
      }
    } catch (err) {
      toast.error('Repair failed: ' + (err.message || 'Unknown error'));
    } finally {
      setRepairing(false);
    }
  };

  const handleToggleStatus = async (file) => {
    const newStatus = file.crtStatus === 'closed' ? 'open' : 'closed';
    try {
      const res = await base44.functions.invoke('setCrtWorkbookStatus', {
        file_name: file.name,
        drive_item_id: file.id,
        status: newStatus,
      });
      const data = res.data;
      if (data.status === 'success') {
        toast.success(data.message);
        refetch();
      } else {
        toast.error(data.error || 'Could not update status');
      }
    } catch (err) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (status?.status === 'no_workbook') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-10">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No CRT Workbook Found</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
              No CRT Excel workbook was found in the <code className="bg-slate-100 px-1.5 py-0.5 rounded">_DEPT_Pathways</code> SharePoint folder.
              Upload your master template (or a previous month's workbook named <code className="bg-slate-100 px-1.5 py-0.5 rounded">CRT_Month_Year.xlsx</code>) to that folder to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const wb = status?.activeWorkbook;
  const activeEmbedUrl = wb?.embedUrl;
  const viewedFile = viewFileId ? status?.allFiles?.find(f => f.id === viewFileId) : wb;
  const effectiveEmbedUrl = viewFileId ? (previewData?.embedUrl || null) : activeEmbedUrl;
  const showPreviewLoading = !!viewFileId && (previewLoading || narrativeSyncing);
  const isViewingNonActive = !!viewFileId && viewFileId !== wb?.id;
  // "Archived" = truly frozen (Mark Complete was clicked). A prior month that's
  // still open is NOT archived — it continues to sync with the portal.
  const isViewingArchive = isViewingNonActive && viewedFile?.crtStatus === 'closed';

  return (
    <div className="space-y-4">
      {/* Status + Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                {wb?.name || 'CRT Workbook'}
                {wb?.crtStatus === 'closed' && (
                  <Badge className="text-xs bg-slate-500 hover:bg-slate-500 text-white">Complete</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Common Reporting Tool — auto-synced from Pathways portal data
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={handleSync} disabled={syncing} size="sm">
                {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {syncing ? 'Syncing...' : 'Re-sync from Portal'}
              </Button>
              <Button onClick={handleCreateMonth} disabled={creatingMonth} variant="outline" size="sm">
                {creatingMonth ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarPlus className="h-4 w-4 mr-2" />}
                {creatingMonth ? 'Creating...' : 'Create This Month Now'}
              </Button>
              <CreateMonthDialog onCreated={refetch} />
              <Button onClick={handleRepair} disabled={repairing} variant="outline" size="sm">
                {repairing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wrench className="h-4 w-4 mr-2" />}
                {repairing ? 'Repairing...' : 'Repair Date Ranges'}
              </Button>
              {wb?.webUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={wb.webUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Excel
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Submission Range</p>
                <p className="text-sm font-medium">
                  {status?.submissionRange?.start && status?.submissionRange?.end
                    ? `${moment(status.submissionRange.start).format('MMM D')} – ${moment(status.submissionRange.end).format('MMM D, YYYY')}`
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Clients in Workbook</p>
                <p className="text-sm font-medium">{status?.clientCount ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Last Modified</p>
                <p className="text-sm font-medium">
                  {wb?.lastModifiedDateTime
                    ? moment(wb.lastModifiedDateTime).fromNow()
                    : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-medium text-green-600">Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <FileSpreadsheet className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Outcomes Report Range</p>
                <p className="text-sm font-medium">
                  {status?.outcomesRange?.start && status?.outcomesRange?.end
                    ? `${moment(status.outcomesRange.start).format('MMM D')} – ${moment(status.outcomesRange.end).format('MMM D, YYYY')}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Summary Header — counts for the month being viewed */}
      <CrtBillingHeader clients={clients} viewedFileName={viewedFile?.name} />

      {/* Embedded Workbook View */}
      {showPreviewLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-[80vh] min-h-[700px]">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          </CardContent>
        </Card>
      ) : effectiveEmbedUrl ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  {viewedFile?.name || 'CRT Workbook'}
                </CardTitle>
                {isViewingNonActive && (
                  <CardDescription className={`mt-1 ${isViewingArchive ? 'text-slate-500' : 'text-blue-600'}`}>
                    {isViewingArchive
                      ? 'Viewing a completed (archived) month — frozen, no longer syncing.'
                      : 'Viewing a prior month — still open and syncing with the portal.'}
                  </CardDescription>
                )}
                {narrativeSyncing && (
                  <CardDescription className="mt-1 text-slate-500 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Aligning Narrative Report to this month…
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isViewingNonActive && (
                  <Button onClick={() => setViewFileId(null)} variant="outline" size="sm">
                    Show Active Workbook
                  </Button>
                )}
                {viewedFile?.webUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a href={viewedFile.webUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Excel
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-slate-200 h-[80vh] min-h-[700px]">
              <iframe
                src={effectiveEmbedUrl}
                className="w-full h-full"
                frameBorder="0"
                title="CRT Workbook"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-slate-400" />
              <p className="text-sm text-slate-600 mb-3">
                Live preview unavailable. Click "Open in Excel" to view the full workbook.
              </p>
              {viewedFile?.webUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={viewedFile.webUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Workbook
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All CRT Files — click to preview (view-only; doesn't change active) */}
      {status?.allFiles && status.allFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All CRT Files</CardTitle>
            <CardDescription className="text-xs">
              Click a file to preview it above. This doesn't change the active workbook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {status.allFiles.map((file) => {
                const isActive = file.id === wb?.id;
                const isViewing = file.id === (viewFileId || wb?.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => setViewFileId(isActive ? null : file.id)}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                      isViewing ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {file.lastModifiedDateTime ? moment(file.lastModifiedDateTime).format('MMM D, YYYY [at] h:mm A') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isViewing && <Badge className="text-xs bg-amber-500 hover:bg-amber-500 text-white">Viewing</Badge>}
                      {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                      {file.crtStatus === 'closed' && (
                        <Badge className="text-xs bg-slate-500 hover:bg-slate-500 text-white">Complete</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(file); }}
                        title={file.crtStatus === 'closed' ? 'Reopen (sync again)' : 'Mark complete (freeze)'}
                      >
                        {file.crtStatus === 'closed' ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </Button>
                      <Button asChild variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <a href={file.webUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}