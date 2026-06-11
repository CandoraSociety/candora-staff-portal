import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Upload, ExternalLink, Trash2, Loader2 } from 'lucide-react';

const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
const PERIODS = ['Full Year', 'Q1', 'Q2', 'Q3', 'Q4', 'Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec', 'H1', 'H2', 'Other'];
const DOC_TYPES = ['submitted_report','template','guideline','approval','correspondence','other'];

export default function HubDocUploader({ hub }) {
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [docMeta, setDocMeta] = useState({ year: new Date().getFullYear().toString(), period: 'Full Year', document_type: 'submitted_report' });

  const { data: docs = [], refetch } = useQuery({
    queryKey: ['funder-docs', hub.id],
    queryFn: () => base44.entities.FunderReportingDoc.filter({ hub_id: hub.id }),
  });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.FunderReportingDoc.create({
      hub_id: hub.id,
      name: file.name,
      file_url,
      file_type: file.type,
      document_type: docMeta.document_type,
      reporting_period: `${docMeta.year} ${docMeta.period}`,
      version: '1.0',
    });
    refetch();
    queryClient.invalidateQueries(['funder-docs']);
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    await base44.entities.FunderReportingDoc.delete(id);
    refetch();
    queryClient.invalidateQueries(['funder-docs']);
  };

  // Group by reporting_period
  const byPeriod = {};
  docs.forEach(d => {
    const key = d.reporting_period || 'Unspecified';
    if (!byPeriod[key]) byPeriod[key] = [];
    byPeriod[key].push(d);
  });

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border">
        <select value={docMeta.year} onChange={e => setDocMeta(m => ({ ...m, year: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={docMeta.period} onChange={e => setDocMeta(m => ({ ...m, period: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
          {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={docMeta.document_type} onChange={e => setDocMeta(m => ({ ...m, document_type: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : 'Upload File'}
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      </div>

      {/* Docs grouped by period */}
      {Object.keys(byPeriod).length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No documents uploaded yet</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(byPeriod).sort((a, b) => b[0].localeCompare(a[0])).map(([period, periodDocs]) => (
            <div key={period}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{period}</p>
              <div className="space-y-1.5">
                {periodDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs truncate">{doc.name}</span>
                      <span className="text-xs text-muted-foreground capitalize flex-shrink-0">{doc.document_type?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </a>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}