import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Upload, Loader2, Eye, Trash2, Download, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCurrentUser } from '@/lib/useAuth';
import { displayName } from '@/lib/userDisplayName';

const fmtMonth = m => { try { return format(parseISO(m + '-01'), 'MMMM yyyy'); } catch { return m; } };

// Candora MasterCard monthly statements — upload the card statement for a
// month and view it in the floating window without leaving the tab.
export default function CCStatementsPanel() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['cc-statements'],
    queryFn: () => base44.entities.CCStatement.list('-statement_month', 100),
  });

  const deleteStatement = useMutation({
    mutationFn: s => base44.entities.CCStatement.delete(s.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cc-statements'] });
      setConfirmId(null);
    },
  });

  const openUpload = () => {
    setMonth(format(new Date(), 'yyyy-MM'));
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

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <CreditCard className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Monthly Card Statements</h3>
        <p className="text-xs text-muted-foreground hidden md:block">Upload the Candora MasterCard statement for each month — view it right here without leaving the tab.</p>
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
            className="w-full h-[70vh] bg-white"
          />
        </div>
      )}

      {isLoading ? (
        <div className="px-4 py-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading statements…</div>
      ) : statements.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted-foreground">No statements uploaded yet — press “Upload Statement” to add the first monthly statement.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/20">
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Month</th>
                <th className="text-left px-4 py-2 font-semibold">File</th>
                <th className="text-left px-4 py-2 font-semibold">Uploaded</th>
                <th className="text-center px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {statements.map(s => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{s.label || fmtMonth(s.statement_month)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[260px] truncate">{s.file_name || '—'}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {s.uploaded_by_name || '—'}{s.uploaded_date ? ` · ${format(parseISO(s.uploaded_date), 'MMM d, yyyy')}` : ''}
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
              ))}
            </tbody>
          </table>
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

    </Card>
  );
}