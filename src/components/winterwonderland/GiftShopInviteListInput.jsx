import React, { useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { readInviteFile, rowsFromText } from '@/lib/inviteListParse';

// The list itself: upload a spreadsheet or paste it in. Both feed the same set
// of families, so staff can use whichever they have to hand.
export default function GiftShopInviteListInput({ rows, onRowsChange }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [report, setReport] = useState(null);

  // A family can arrive with only a phone number or an email address, so its
  // name can be typed in here when the Central Database has none either.
  const setName = (index, value) => {
    onRowsChange(rows.map((row, at) => (at === index ? { ...row, guardian_name: value } : row)));
  };

  const apply = (parsed, name) => {
    onRowsChange(parsed.rows);
    setReport({ fileName: name, readCount: parsed.readCount, merged: parsed.merged, dropped: parsed.dropped });
    if (!parsed.rows.length) {
      setError('No families could be read. The list needs a name and an email or phone number for each family.');
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReading(true);
    setError('');
    setText('');
    setReport(null);
    try {
      const parsed = await readInviteFile(file);
      setFileName(file.name);
      apply(parsed, file.name);
    } catch (err) {
      setFileName('');
      onRowsChange([]);
      setError(err.message || 'That file could not be read.');
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleText = (value) => {
    setText(value);
    setError('');
    setFileName('');
    apply(rowsFromText(value), '');
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
        className="rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
      >
        {reading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the list…
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium mt-2">{fileName || 'Upload a family list'}</p>
            <p className="text-xs text-muted-foreground mt-1">CSV or Excel (.xlsx). Columns: guardian name, email, phone, number of children.</p>
          </>
        )}
        <Input ref={fileRef} type="file" accept=".csv,.xlsx,text/csv" className="hidden" onChange={handleFile} />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Or paste the list, one family per line.</p>
        <Textarea
          rows={4}
          value={text}
          onChange={e => handleText(e.target.value)}
          placeholder={'Jane Doe, jane@example.com, 780-555-1234, 2\nJohn Smith, , 780-555-9876, 1'}
          className="font-mono text-xs"
        />
      </div>

      {error ? (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {error}
        </p>
      ) : rows.length > 0 ? (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {rows.length} {rows.length === 1 ? 'family' : 'families'} ready
            {report?.readCount > rows.length && (
              <span className="text-muted-foreground font-normal">from {report.readCount} rows</span>
            )}
          </p>

          {report?.dropped?.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-900">
                {report.dropped.length} {report.dropped.length === 1 ? 'row was' : 'rows were'} left out — fix these in the file and upload it again
              </p>
              <div className="max-h-32 overflow-y-auto divide-y divide-amber-200">
                {report.dropped.map((row, index) => (
                  <div key={index} className="py-1.5">
                    <p className="text-xs font-medium text-amber-900 truncate">{row.text || 'Empty row'}</p>
                    <p className="text-xs text-amber-800/80">{row.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report?.merged > 0 && (
            <p className="text-xs text-muted-foreground">
              {report.merged} {report.merged === 1 ? 'row was' : 'rows were'} read as part of the family above them — the same
              household, or a row with no name or contact of its own.
            </p>
          )}

          {rows.some(row => !row.guardian_name) && (
            <p className="text-xs text-amber-800">
              {rows.filter(row => !row.guardian_name).length} of these families have no name yet — the Central Database
              can fill it in, or type it in below.
            </p>
          )}

          <div className="rounded-lg border divide-y text-xs max-h-40 overflow-y-auto">
            {rows.slice(0, 25).map((row, index) => (
              <div key={`${row.guardian_email}-${index}`} className="grid grid-cols-[1.2fr_1.4fr_1fr_auto] gap-2 px-3 py-2 items-center">
                {row.guardian_name ? (
                  <span className="truncate font-medium">{row.guardian_name}</span>
                ) : (
                  <Input
                    value=""
                    onChange={e => setName(index, e.target.value)}
                    placeholder="Add a name"
                    className="h-7 text-xs"
                  />
                )}
                <span className="truncate text-muted-foreground">{row.guardian_email || 'no email'}</span>
                <span className="truncate text-muted-foreground">{row.guardian_phone || 'no phone'}</span>
                <span className="text-muted-foreground">{row.children_allowed}</span>
              </div>
            ))}
          </div>
          {rows.length > 25 && (
            <p className="text-xs text-muted-foreground">Showing the first 25 of {rows.length}.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}