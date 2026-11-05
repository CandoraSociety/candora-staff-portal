import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { FOOD_UNITS, unitByValue, money } from '@/lib/foodUnits';
import { Loader2, FileSpreadsheet, Send, CheckCircle2 } from 'lucide-react';
import { abToday } from '@/lib/abTime';

const BLANK = {
  period_start: '',
  period_end: abToday(),
  gross_sales: '',
  discounts: '',
  refunds: '',
  tax: '',
  tips: '',
  transaction_count: '',
};

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    period_start: { type: 'string', description: 'First date the report covers, as YYYY-MM-DD' },
    period_end: { type: 'string', description: 'Last date the report covers, as YYYY-MM-DD' },
    gross_sales: { type: 'number', description: 'Gross sales before discounts and refunds, excluding tax' },
    discounts: { type: 'number' },
    refunds: { type: 'number' },
    tax: { type: 'number', description: 'Total tax collected' },
    tips: { type: 'number' },
    transaction_count: { type: 'number', description: 'Number of transactions in the period' },
    payment_methods: {
      type: 'array',
      description: 'Tender totals if the report breaks them out',
      items: {
        type: 'object',
        properties: {
          method: { type: 'string' },
          amount: { type: 'number' },
        },
      },
    },
  },
};

const toNumber = (value) => {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toField = (value) => (value === undefined || value === null ? '' : String(value));

// Files a Square sales report for one food operation. The report records the
// revenue in Food Services and is forwarded to the Finance portal on save.
export default function SquareReportImportDialog({ open, onOpenChange, defaultUnit = 'cafe_candeur', onSaved }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);

  const [unit, setUnit] = useState(defaultUnit);
  const [fields, setFields] = useState(BLANK);
  const [file, setFile] = useState(null);
  const [fileUri, setFileUri] = useState('');
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [notes, setNotes] = useState('');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (event) => setFields(prev => ({ ...prev, [key]: event.target.value }));

  const gross = toNumber(fields.gross_sales);
  const net = gross - toNumber(fields.discounts) - toNumber(fields.refunds);

  const reset = () => {
    setFields(BLANK);
    setFile(null);
    setFileUri('');
    setPaymentBreakdown([]);
    setNotes('');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setError('');
    setReading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: picked });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 900 });
      setFileUri(file_uri);
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed_url,
        json_schema: EXTRACT_SCHEMA,
      });
      const output = result?.output || {};
      if (result?.status === 'success' && Object.keys(output).length) {
        setFields(prev => ({
          period_start: toField(output.period_start) || prev.period_start,
          period_end: toField(output.period_end) || prev.period_end,
          gross_sales: toField(output.gross_sales),
          discounts: toField(output.discounts),
          refunds: toField(output.refunds),
          tax: toField(output.tax),
          tips: toField(output.tips),
          transaction_count: toField(output.transaction_count),
        }));
        setPaymentBreakdown(Array.isArray(output.payment_methods) ? output.payment_methods.filter(p => p?.method) : []);
        toast({ title: 'Report read', description: 'Check the figures below, then record the report.' });
      } else {
        setError('We could not read the totals from that file. The file is attached — type the figures in below.');
      }
    } catch {
      setError('That file could not be read. Type the totals in below, then record the report.');
    } finally {
      setReading(false);
    }
  };

  const handleSave = async () => {
    if (!fields.period_end) {
      setError('Add the last day the report covers.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await base44.entities.FoodSalesReport.create({
        unit,
        unit_label: unitByValue(unit).label,
        period_start: fields.period_start || fields.period_end,
        period_end: fields.period_end,
        gross_sales: gross,
        discounts: toNumber(fields.discounts),
        refunds: toNumber(fields.refunds),
        net_sales: net,
        tax: toNumber(fields.tax),
        tips: toNumber(fields.tips),
        transaction_count: toNumber(fields.transaction_count),
        payment_breakdown: paymentBreakdown,
        report_file_uri: fileUri,
        report_file_name: file?.name || '',
        source: file ? 'square' : 'manual',
        notes,
        imported_by_name: user?.full_name || '',
        forwarded_to_finance: true,
        forwarded_at: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ['food-sales-reports'] });
      toast({
        title: 'Report recorded',
        description: `${unitByValue(unit).label} revenue filed and forwarded to the Finance portal.`,
      });
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch {
      setError('The report could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import a Square report</DialogTitle>
          <DialogDescription>
            Upload the report Square gives you for the period — the figures are read from it and you can correct them before saving.
            Saving records the revenue in Food Services and forwards the same report to the Finance portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Operation</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOOD_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Report file (Square CSV or PDF)</Label>
              <div className="flex gap-2">
                <Input ref={fileRef} type="file" accept=".csv,.pdf,.xlsx,.xls,.png,.jpg,.jpeg" onChange={handleFile} disabled={reading} />
              </div>
              {reading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Reading the report…
                </div>
              )}
              {file && !reading && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <FileSpreadsheet className="w-3 h-3" /> {file.name}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>Period start</Label>
              <Input type="date" value={fields.period_start} onChange={set('period_start')} />
            </div>
            <div>
              <Label>Period end</Label>
              <Input type="date" value={fields.period_end} onChange={set('period_end')} />
            </div>
            <div>
              <Label>Gross sales</Label>
              <Input inputMode="decimal" value={fields.gross_sales} onChange={set('gross_sales')} placeholder="0.00" />
            </div>
            <div>
              <Label>Discounts</Label>
              <Input inputMode="decimal" value={fields.discounts} onChange={set('discounts')} placeholder="0.00" />
            </div>
            <div>
              <Label>Refunds</Label>
              <Input inputMode="decimal" value={fields.refunds} onChange={set('refunds')} placeholder="0.00" />
            </div>
            <div>
              <Label>Tax collected</Label>
              <Input inputMode="decimal" value={fields.tax} onChange={set('tax')} placeholder="0.00" />
            </div>
            <div>
              <Label>Tips</Label>
              <Input inputMode="decimal" value={fields.tips} onChange={set('tips')} placeholder="0.00" />
            </div>
            <div>
              <Label>Transactions</Label>
              <Input inputMode="numeric" value={fields.transaction_count} onChange={set('transaction_count')} placeholder="0" />
            </div>
          </div>

          {paymentBreakdown.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {paymentBreakdown.map(p => (
                <Badge key={p.method} variant="secondary" className="text-xs">
                  {p.method}: {money(p.amount)}
                </Badge>
              ))}
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Revenue this report records </span>
              <span className="font-bold">{money(net)}</span>
              <span className="text-xs text-muted-foreground block">Gross sales less discounts and refunds, before tax.</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 gap-1"><CheckCircle2 className="w-3 h-3" /> Forwards to Finance</Badge>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything Finance should know about this period" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || reading}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Record &amp; send to Finance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}