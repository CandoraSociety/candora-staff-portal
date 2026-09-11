import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { DOC_TYPES } from '@/lib/funderReportingConstants';

const EMPTY = { file: null, file_name: '', doc_type: 'template', reporting_period: '', notes: '' };

export default function FunderFileUpload({ funderKey }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm(s => ({ ...s, file: f, file_name: s.file_name || f.name }));
  };

  const submit = async () => {
    if (!form.file || busy) return;
    setBusy(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: form.file });
      await base44.entities.FunderReportingFile.create({
        funder: funderKey,
        file_name: form.file_name || form.file.name,
        file_url,
        doc_type: form.doc_type,
        reporting_period: form.reporting_period,
        notes: form.notes,
      });
      setForm(EMPTY);
      if (fileRef.current) fileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['funder-reporting-files', funderKey] });
    } catch (err) {
      setError(err.message || 'Upload failed');
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Upload a document</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>File *</Label>
            <input ref={fileRef} type="file" onChange={pick} className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80" />
          </div>
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={form.file_name} onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))} placeholder="Defaults to file name" />
          </div>
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Select value={form.doc_type} onValueChange={v => setForm(f => ({ ...f, doc_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reporting period</Label>
            <Input value={form.reporting_period} onChange={e => setForm(f => ({ ...f, reporting_period: e.target.value }))} placeholder="e.g. 2026 Q2, 2025-26 Annual" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes about this document..." />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={submit} disabled={!form.file || busy} className="gap-2">
          <Upload className="w-4 h-4" />{busy ? 'Uploading...' : 'Upload'}
        </Button>
      </CardContent>
    </Card>
  );
}