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

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReading(true);
    setError('');
    setText('');
    try {
      const parsed = await readInviteFile(file);
      setFileName(file.name);
      onRowsChange(parsed);
      if (!parsed.length) {
        setError('No families could be read. The list needs a name and an email or phone number for each family.');
      }
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
    onRowsChange(rowsFromText(value));
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
          </p>
          <div className="rounded-lg border divide-y text-xs max-h-40 overflow-y-auto">
            {rows.slice(0, 25).map((row, index) => (
              <div key={`${row.guardian_email}-${index}`} className="grid grid-cols-[1.2fr_1.4fr_1fr_auto] gap-2 px-3 py-2">
                <span className="truncate font-medium">{row.guardian_name}</span>
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