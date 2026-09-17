import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Upload, Loader2, Eye, Trash2, Download, X, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';
import CCStatementLineItems from '@/components/finance/CCStatementLineItems';

const fmtMonth = m => { try { return format(parseISO(m + '-01'), 'MMMM yyyy'); } catch { return m; } };

// Candora MasterCard monthly statements — upload the card statement for a
// month, view it inline, attach receipts to its line items, then mark the
// statement complete (completed statements file away under their year).
export default function CCStatementsPanel() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [month, setMonth] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [completing, setCompleting] = useState(null); // statement pending "complete anyway?" confirmation
  const [openYears, setOpenYears] = useState({});

  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['cc-statements'],
    queryFn: () => base44.entities.CCStatement.list('-statement_month', 500),
  });

  // All line items across statements — receipt coverage per statement
  const { data: allLines = [] } = useQuery({
    queryKey: ['cc-statement-lines-all'],
    queryFn: () => base44.entities.CCStatementLineItem.list('-created_date', 1000),
  });

  const lineStats = useMemo(() => {
    const map = {};
    for (const l of allLines) {
      const st = (map[l.statement_id] = map[l.statement_id] || { total: 0, withReceipt: 0 });
      st.total += 1;
      if (l.receipt_url) st.withReceipt += 1;
    }
    return map;
  }, [allLines]);

  const active = statements.filter(s => s.status !== 'completed');

  const completedByYear = useMemo(() => {
    const years = {};
    for (const s of statements) {
      if (s.status !== 'completed') continue;
      const y = (s.statement_month || '').slice(0, 4) || 'Undated';
      (years[y] = years[y] || []).push(s);
    }
    return Object.keys(years).sort().reverse().map(y => ({ year: y, items: years[y] }));
  }, [statements]);

  const deleteStatement = useMutation({
    mutationFn: async s => {
      await base44.entities.CCStatementLineItem.deleteMany({ statement_id: s.id });
      return base44.entities.CCStatement.delete(s.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-statements'] });
      qc.invalidateQueries({ queryKey: ['cc-statement-lines'] });
      qc.invalidateQueries({ queryKey: ['cc-statement-lines-all'] });
      setConfirmId(null);
    },
  });

  const markComplete = useMutation({
    mutationFn: s => base44.entities.CCStatement.update(s.id, {
      status: 'completed',
      completed_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-statements'] });
      setCompleting(null);
      toast({ title: 'Statement marked complete', description: 'It has been moved to the Completed section below.' });
    },
  });

  const tryComplete = s => {
    const st = lineStats[s.id];
    if (!st || st.withReceipt < st.total) setCompleting(s); // receipts missing — confirm first
    else markComplete.mutate(s);
  };

  const openUpload = () => {
    setMonth('');
    setFile(null);
    setError('');
    setUploadOpen(true);
  };

  const upload = async () => {
    setError('');
    if (!month) { setError('Pick the statement month.'); return; }
    if (!file) { setError('Choose the statement file (PDF or image).'); return; }
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.CCStatement.create({
        label: fmtMonth(month),
        statement_month: month,
        file_url,
        file_name: file.name,
        uploaded_by_name: displayName(user),
        uploaded_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'active',
      });
      qc.invalidateQueries({ queryKey: ['cc-statements'] });
      setUploadOpen(false);
      setFile(null);
    } catch (err) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const completingStats = completing ? lineStats[completing.id] : null;

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <CreditCard className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Monthly Card Statements</h3>
        <p className="text-xs text-muted-foreground hidden md:block">Upload the Candora MasterCard statement for each month, attach its receipts, then mark it complete.</p>
        <Button size="sm" className="h-8 gap-1.5 ml-auto" onClick={openUpload}>
          <Upload className="w-4 h-4" /> Upload Statement
        </Button>
      </div>

      {viewing && (
        <div className="border-b bg-muted/20">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{viewing.label || fmtMonth(viewing.statement_month)} — Statement</span>
            <a href={viewing.file_url} target="_blank" rel="noopener" download={viewing.file_name || undefined} className="ml-auto">
              <Button size="sm" variant="ghost" className="h-7 px-2 gap-1.5"><Download className="w-4 h-4" /> Download</Button>
            </a>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setViewing(null)} title="Close viewer">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <iframe
            src={viewing.file_url}
            title="Card statement"
            className="w-full h-[55vh] bg-white"
          />
          <CCStatementLineItems statement={viewing} />
        </div>
      )}

      {isLoading ? (
        <div className="px-4 py-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading statements…</div>
      ) : active.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">No active statements — press “Upload Statement” to add one, or find finished ones in Completed below.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Month</th>
                <th className="text-left px-4 py-2 font-semibold">File</th>
                <th className="text-left px-4 py-2 font-semibold">Uploaded</th>
                <th className="text-center px-4 py-2 font-semibold">Receipts</th>
                <th className="text-center px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {active.map(s => {
                const st = lineStats[s.id] || { total: 0, withReceipt: 0 };
                return (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{s.label || fmtMonth(s.statement_month)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[240px] truncate">{s.file_name || '—'}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {s.uploaded_by_name || '—'}{s.uploaded_date ? ` · ${format(parseISO(s.uploaded_date), 'MMM d, yyyy')}` : ''}
                  </td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <span className={(st.total > 0 && st.withReceipt === st.total) ? 'text-success font-medium' : 'text-muted-foreground'}>
                      {st.withReceipt}/{st.total}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 gap-1.5" onClick={() => setViewing(s)} title="View statement">
                        <Eye className="w-4 h-4" /> View
                      </Button>
                      <a href={s.file_url} target="_blank" rel="noopener" download={s.file_name || undefined}>
                        <Button size="sm" variant="ghost" className="h-7 px-2" title="Download">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2 gap-1.5 text-success"
                        title="Mark this statement complete once its receipts are in"
                        onClick={() => tryComplete(s)}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        title={confirmId === s.id ? 'Click again to confirm delete' : 'Delete statement'}
                        onClick={() => (confirmId === s.id ? deleteStatement.mutate(s) : setConfirmId(s.id))}
                      >
                        <Trash2 className={`w-4 h-4 ${confirmId === s.id ? 'text-red-600' : ''}`} />
                        {confirmId === s.id && <span className="text-xs text-red-600">Confirm</span>}
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {completedByYear.length > 0 && (
        <div className="border-t">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <h3 className="font-semibold text-sm">Completed</h3>
            <p className="text-xs text-muted-foreground hidden md:block">Statements finished with their receipts, filed by year.</p>
          </div>
          {completedByYear.map(({ year, items }) => {
            const open = openYears[year] ?? true;
            return (
              <div key={year}>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 border-b hover:bg-muted/30 text-left"
                  onClick={() => setOpenYears(o => ({ ...o, [year]: !open }))}
                >
                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="text-sm font-medium">{year}</span>
                  <span className="text-xs text-muted-foreground">({items.length} statement{items.length === 1 ? '' : 's'})</span>
                </button>
                {open && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y">
                        {items.map(s => {
                          const st = lineStats[s.id] || { total: 0, withReceipt: 0 };
                          return (
                          <tr key={s.id} className="hover:bg-muted/30">
                            <td className="px-4 py-2 font-medium whitespace-nowrap w-[180px]">{s.label || fmtMonth(s.statement_month)}</td>
                            <td className="px-4 py-2 text-xs text-muted-foreground max-w-[260px] truncate">{s.file_name || '—'}</td>
                            <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              Completed {s.completed_date ? format(parseISO(s.completed_date), 'MMM d, yyyy') : '—'}
                            </td>
                            <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap text-center">
                              {st.withReceipt}/{st.total} receipts
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="inline-flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2 gap-1.5" onClick={() => setViewing(s)} title="View statement">
                                  <Eye className="w-4 h-4" /> View
                                </Button>
                                <a href={s.file_url} target="_blank" rel="noopener" download={s.file_name || undefined}>
                                  <Button size="sm" variant="ghost" className="h-7 px-2" title="Download">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </a>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Monthly Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Statement Month *</Label>
              <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Statement File * (PDF or image)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('cc-statement-file')?.click()}>
                  <Upload className="w-4 h-4" /> Choose File
                </Button>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{file ? file.name : 'No file chosen'}</span>
              </div>
              <input
                id="cc-statement-file"
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={saving}>Cancel</Button></DialogClose>
            <Button onClick={upload} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {saving ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completing} onOpenChange={o => { if (!o) setCompleting(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" />Mark Statement Complete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {!completingStats || completingStats.total === 0
              ? 'This statement has no line items with receipts attached. Mark it complete anyway?'
              : `${completingStats.total - completingStats.withReceipt} of ${completingStats.total} line item(s) on “${completing?.label || fmtMonth(completing?.statement_month || '')}” are still missing receipts. Mark it complete anyway?`}
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button className="gap-2" disabled={markComplete.isPending} onClick={() => markComplete.mutate(completing)}>
              {markComplete.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  );
}