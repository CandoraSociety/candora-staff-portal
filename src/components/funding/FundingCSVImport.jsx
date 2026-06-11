import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';

const SAMPLE_CSV = `source_name,stream_name,stream_type,typical_amount_min,typical_amount_max,application_cycle,typical_deadline_month,eligibility_notes,application_url
"IRCC","Settlement Program","project",200000,500000,"annual",3,"Must serve newcomers","https://ircc.canada.ca"
"Government of Alberta","CFEP","project",5000,75000,"rolling",,"Community orgs eligible","https://alberta.ca/cfep"`;

export default function FundingCSVImport({ onClose }) {
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [results, setResults] = useState([]);
  const [importing, setImporting] = useState(false);

  const { data: sources = [] } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: () => base44.entities.FundingSource.list('name'),
  });

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    return lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else { current += char; }
      }
      values.push(current.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const rows = parseCSV(text);
    const log = [];

    for (const row of rows) {
      const sourceName = row.source_name?.trim();
      const streamName = row.stream_name?.trim();
      if (!sourceName || !streamName) { log.push({ row: streamName || sourceName, status: 'skipped', reason: 'Missing source or stream name' }); continue; }

      const source = sources.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
      if (!source) { log.push({ row: streamName, status: 'error', reason: `Source "${sourceName}" not found — add it first` }); continue; }

      try {
        await base44.entities.FundingStream.create({
          funding_source_id: source.id,
          funding_source_name: source.name,
          name: streamName,
          stream_type: row.stream_type || 'project',
          typical_amount_min: row.typical_amount_min ? Number(row.typical_amount_min) : undefined,
          typical_amount_max: row.typical_amount_max ? Number(row.typical_amount_max) : undefined,
          application_cycle: row.application_cycle || 'unknown',
          typical_deadline_month: row.typical_deadline_month ? Number(row.typical_deadline_month) : undefined,
          eligibility_notes: row.eligibility_notes || '',
          application_url: row.application_url || '',
          is_active: true,
        });
        log.push({ row: streamName, status: 'success', reason: `Added to ${source.name}` });
      } catch (err) {
        log.push({ row: streamName, status: 'error', reason: err.message });
      }
    }

    queryClient.invalidateQueries(['fundingStreams']);
    setResults(log);
    setImporting(false);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'funding_import_sample.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Import Funding Streams from CSV</h3>
        <Button variant="ghost" size="sm" onClick={downloadSample} className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />Sample CSV
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Sources referenced in the CSV must already exist in the database. The importer will match by name (case-insensitive).
      </p>
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Click to select a CSV file</p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {importing && <p className="text-sm text-muted-foreground text-center">Importing…</p>}

      {results.length > 0 && (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${r.status === 'success' ? 'bg-green-50' : r.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
              {r.status === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
              <span><strong>{r.row}</strong> — {r.reason}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}