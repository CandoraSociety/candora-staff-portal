import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, FileText } from 'lucide-react';
import { REPORT_KINDS, CONTENT_TYPES, DOC_TYPES, docTypeLabel } from '@/lib/funderReportingConstants';

const EMPTY = {
  period_label: '', period_start: '', period_end: '',
  report_kind: 'quarterly', content_type: 'narrative', notes: '',
};

export default function CreateReportDialog({ open, onOpenChange, funderKey, funderLabel }) {
  const queryClient = useQueryClient();
  const { data: existingFiles = [] } = useQuery({
    queryKey: ['funder-reporting-files', funderKey],
    queryFn: () => base44.entities.FunderReportingFile.filter({ funder: funderKey }),
    enabled: open,
  });

  const [form, setForm] = useState(EMPTY);
  const [selectedIds, setSelectedIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setSelectedIds([]);
      setNewFiles([]);
      setError('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [open]);

  const toggleSelected = (id) =>
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setNewFiles(nf => [...nf, ...picked.map(file => ({ file, doc_type: 'template' }))]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const linkedIds = [...selectedIds];
      const linkedNames = existingFiles.filter(f => selectedIds.includes(f.id)).map(f => f.file_name);

      for (const nf of newFiles) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: nf.file });
        const rec = await base44.entities.FunderReportingFile.create({
          funder: funderKey,
          file_name: nf.file.name,
          file_url,
          doc_type: nf.doc_type,
          reporting_period: form.period_label,
        });
        linkedIds.push(rec.id);
        linkedNames.push(nf.file.name);
      }

      const kindLabel = REPORT_KINDS.find(k => k.value === form.report_kind)?.label || 'Report';
      const title = `${funderLabel} ${kindLabel} Report${form.period_label ? ` — ${form.period_label}` : ''}`;

      await base44.entities.FunderReport.create({
        funder: funderKey,
        title,
        report_kind: form.report_kind,
        content_type: form.content_type,
        period_label: form.period_label,
        period_start: form.period_start,
        period_end: form.period_end,
        linked_file_ids: linkedIds,
        linked_file_names: linkedNames,
        notes: form.notes,
      });

      queryClient.invalidateQueries({ queryKey: ['funder-reports', funderKey] });
      queryClient.invalidateQueries({ queryKey: ['funder-reporting-files', funderKey] });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create report');
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report — {funderLabel}</DialogTitle>
          <DialogDescription>Set the reporting period, report type, and attach the template, guidelines or other documents.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Reporting period label</Label>
              <Input value={form.period_label} onChange={e => setForm(f => ({ ...f, period_label: e.target.value }))} placeholder="e.g. 2026 Q2, 2025-26 Annual" />
            </div>
            <div className="space-y-1.5">
              <Label>Period start</Label>
              <Input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Period end</Label>
              <Input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Type of report</Label>
              <Select value={form.report_kind} onValueChange={v => setForm(f => ({ ...f, report_kind: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Report content</Label>
              <Select value={form.content_type} onValueChange={v => setForm(f => ({ ...f, content_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reporting template, guidelines & documents</Label>
            <input ref={fileRef} type="file" multiple onChange={pickFiles} className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80" />
            {newFiles.length > 0 && (
              <div className="grid gap-2">
                {newFiles.map((nf, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border p-2">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-sm truncate flex-1">{nf.file.name}</p>
                    <Select value={nf.doc_type} onValueChange={v => setNewFiles(list => list.map((x, i) => i === idx ? { ...x, doc_type: v } : x))}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setNewFiles(list => list.filter((_, i) => i !== idx))}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {existingFiles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Or select from existing {funderLabel} documents:</p>
                <div className="grid gap-1.5 max-h-40 overflow-y-auto rounded-lg border p-2">
                  {existingFiles.map(f => (
                    <label key={f.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedIds.includes(f.id)} onCheckedChange={() => toggleSelected(f.id)} />
                      <span className="truncate flex-1">{f.file_name}</span>
                      <span className="text-xs text-muted-foreground">{docTypeLabel(f.doc_type)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="gap-2">
            <Upload className="w-4 h-4" />{busy ? 'Creating...' : 'Create Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}