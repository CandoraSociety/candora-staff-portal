import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileSpreadsheet, Eye, Download, RefreshCw, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import TrackerViewerDialog from '@/components/empoweru/TrackerViewerDialog';

// Funder Reports — access to each cohort's official EmpowerU Excel tracker
// workbook (auto-maintained on SharePoint). The portal remains the normal
// participant-management interface; this area is for viewing and downloading
// the funder-reporting workbook.

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtDate = (d) => {
  if (!d) return null;
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
};
// Official funder date-range format: "Month D, YYYY to Month D, YYYY"
const fmtRange = (s, e) => {
  const a = fmtDate(s), b = fmtDate(e);
  if (a && b) return `${a} to ${b}`;
  return a || b || 'Dates TBD';
};

export default function EmpowerUFunderReports() {
  const { toast } = useToast();
  const [cohorts, setCohorts] = useState([]);
  const [cohortId, setCohortId] = useState('');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const cohort = cohorts.find((c) => c.id === cohortId);

  const loadRecord = useCallback(async (id) => {
    if (!id) { setRecord(null); return; }
    try {
      const page = await base44.entities.EmpowerUCohortWorkbook.filter({ cohort_id: id });
      setRecord((page.items || [])[0] || null);
    } catch { setRecord(null); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.EmpowerUCohort.filter({}, { sort: '-start_date', limit: 100 })
      .then((page) => {
        if (cancelled) return;
        const items = page.items || [];
        setCohorts(items);
        const preferred = items.find((c) => c.status === 'in_progress') || items[0];
        setCohortId(preferred ? preferred.id : '');
        if (preferred) loadRecord(preferred.id);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadRecord]);

  const onSelectCohort = (id) => {
    setCohortId(id);
    setRecord(null);
    loadRecord(id);
  };

  // The official workbook is created automatically in the background for every
  // cohort — if it hasn't appeared yet, keep checking while the page is open.
  useEffect(() => {
    if (!cohortId || record) return;
    const t = setInterval(() => loadRecord(cohortId), 15000);
    return () => clearInterval(t);
  }, [cohortId, record, loadRecord]);

  const retrySync = async () => {
    if (!cohortId) return;
    setBusy(true);
    try {
      await base44.functions.invoke('syncEmpowerUParticipantToTracker', { cohort_id: cohortId });
      toast({ title: 'Sync completed' });
      await loadRecord(cohortId);
    } catch (err) {
      toast({ title: 'Sync failed', description: err?.message, variant: 'destructive' });
      await loadRecord(cohortId);
    } finally { setBusy(false); }
  };

  const downloadWorkbook = async () => {
    if (!cohortId) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('downloadEmpowerUCohortTracker', { cohort_id: cohortId });
      const { file_name, base64: b64, warnings } = res.data || {};
      if (!b64) throw new Error('The workbook could not be read.');
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file_name || 'EmpowerU Tracker.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (warnings && warnings.length) {
        toast({
          title: 'Downloaded — but not fully current',
          description: `Some participant rows failed to sync: ${warnings[0]}`,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Workbook downloaded', description: file_name });
      }
      await loadRecord(cohortId);
    } catch (err) {
      toast({ title: 'Download failed', description: err?.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const hasError = record && (record.status === 'error' || record.last_sync_error);
  const lastSync = record?.last_synced_at ? new Date(record.last_synced_at).toLocaleString() : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-display">Funder Reports</h1>
          <p className="text-sm text-muted-foreground">Official EmpowerU Excel tracker — maintained automatically from the portal.</p>
        </div>
        <div className="w-full sm:w-80">
          <Select value={cohortId || undefined} onValueChange={onSelectCohort}>
            <SelectTrigger><SelectValue placeholder={loading ? 'Loading cohorts…' : 'Select cohort'} /></SelectTrigger>
            <SelectContent>
              {cohorts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && !cohort && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No EmpowerU cohorts exist yet — create a cohort and its official workbook will be generated automatically.</CardContent></Card>
      )}

      {!loading && cohort && !record && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="h-4 w-4" /> {cohort.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Program date range: <span className="font-medium text-foreground">{fmtRange(cohort.start_date, cohort.end_date)}</span></div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              The official Excel workbook is created automatically for every cohort — it will appear here shortly.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && cohort && record && (
        <>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="h-4 w-4" /> {cohort.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Program date range: </span><span className="font-medium">{fmtRange(cohort.start_date, cohort.end_date)}</span></div>
                <div><span className="text-muted-foreground">Official workbook: </span><span className="font-medium break-all">{record.workbook_file_name || '—'}</span></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Status: </span>
                  {hasError
                    ? <span className="inline-flex items-center gap-1 font-medium text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Sync problem</span>
                    : <span className="inline-flex items-center gap-1 font-medium text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Up to date</span>}
                </div>
                <div><span className="text-muted-foreground">Participants in workbook: </span><span className="font-medium">{record.participant_count ?? 0}</span></div>
                <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Last successful sync: </span>
                  <span className="font-medium">{lastSync || 'Never'}</span>
                </div>
              </div>
              {hasError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {record.last_sync_error || 'The workbook could not be synchronized.'}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={() => setViewerOpen(true)} disabled={busy || !record.workbook_file_id}>
                  <Eye className="h-4 w-4" /> View Tracker
                </Button>
                <Button onClick={downloadWorkbook} disabled={busy || !record.workbook_file_id}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download Excel Workbook
                </Button>
                {hasError && (
                  <Button variant="outline" onClick={retrySync} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Retry Sync
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Participant information is managed through the portal and synchronized into this workbook automatically — there is nothing to update by hand here.
          </p>
        </>
      )}

      <TrackerViewerDialog open={viewerOpen} onOpenChange={setViewerOpen} cohortId={cohortId} />
    </div>
  );
}