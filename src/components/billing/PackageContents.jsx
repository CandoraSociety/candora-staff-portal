import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Download, FileText, FileSpreadsheet, Briefcase, Baby, Paperclip,
  Loader2, Package, ExternalLink,
} from 'lucide-react';
import {
  monthLabelFromBillingMonth,
  findCrtFileForMonth,
  buildChildmindingPdfBlob,
  buildWorkExposurePdfBlob,
  downloadBlob,
  downloadUrl,
  extFromUrl,
} from './packageContentsHelpers';

const sanitize = (s) => String(s || '').replace(/[^a-z0-9_-]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

export default function PackageContents({ pkg }) {
  const billingMonth = pkg.billing_month;
  const monthLabel = monthLabelFromBillingMonth(billingMonth);
  const [zipping, setZipping] = useState(false);

  // CRT workbook status (shared query key with CRT tab)
  const { data: crtStatus } = useQuery({
    queryKey: ['crt-workbook-status'],
    queryFn: async () => (await base44.functions.invoke('getCrtWorkbookStatus', {})).data,
  });
  const crtFile = useMemo(
    () => findCrtFileForMonth(crtStatus?.allFiles, billingMonth),
    [crtStatus, billingMonth]
  );

  // Childminding records for the month (Pathways only)
  const { data: cmRecords = [] } = useQuery({
    queryKey: ['childminding-records'],
    queryFn: () => base44.entities.ChildmindingRecord.list('-date', 2000),
    select: (recs) =>
      (recs || []).filter(
        (r) => r.program === 'pathways' && r.date && r.date.startsWith(billingMonth)
      ),
  });

  // Work exposure placement payables for the month
  const { data: weRecords = [] } = useQuery({
    queryKey: ['we-placements', billingMonth],
    queryFn: () => base44.entities.FinancialRecord.filter({ record_type: 'paid_external_placement' }),
    select: (recs) => (recs || []).filter((r) => r.billing_month === billingMonth),
  });

  // Supporting documents: financial records for the month with uploaded receipts / completion docs
  const { data: supportRecords = [] } = useQuery({
    queryKey: ['support-records', billingMonth],
    queryFn: () => base44.entities.FinancialRecord.list('-date', 500),
    select: (recs) =>
      (recs || []).filter(
        (r) =>
          r.billing_month === billingMonth &&
          ((r.receipt_urls && r.receipt_urls.length) ||
            (r.completion_record_urls && r.completion_record_urls.length))
      ),
  });

  const supportingFiles = useMemo(() => {
    const files = [];
    supportRecords.forEach((r) => {
      (r.receipt_urls || []).forEach((u) =>
        files.push({ url: u, label: `${r.client_name || 'Client'} — Receipt` })
      );
      (r.completion_record_urls || []).forEach((u) =>
        files.push({ url: u, label: `${r.client_name || 'Client'} — Completion` })
      );
    });
    return files;
  }, [supportRecords]);

  const handleChildmindingPdf = () => {
    if (!cmRecords.length) {
      toast.info(`No childminding sessions for ${monthLabel}`);
      return;
    }
    downloadBlob(buildChildmindingPdfBlob(cmRecords, billingMonth), `Childminding_${billingMonth}.pdf`);
  };

  const handleWorkExposureCsv = () => {
    if (!weRecords.length) {
      toast.info(`No work exposure placements for ${monthLabel}`);
      return;
    }
    downloadBlob(buildWorkExposurePdfBlob(weRecords, billingMonth), `Work_Exposure_Payments_${billingMonth}.pdf`);
  };

  const handleDownloadAll = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      let bundled = 0;

      if (cmRecords.length) {
        zip.file(`Childminding_${billingMonth}.pdf`, buildChildmindingPdfBlob(cmRecords, billingMonth));
        bundled++;
      }
      if (weRecords.length) {
        zip.file(`Work_Exposure_Payments_${billingMonth}.pdf`, buildWorkExposurePdfBlob(weRecords, billingMonth));
        bundled++;
      }

      // Supporting docs — best-effort fetch (CORS may block some hosts)
      const fetched = await Promise.all(
        supportingFiles.map(async (f, i) => {
          try {
            const res = await fetch(f.url);
            if (!res.ok) return null;
            return { name: `SupportingDocs/${String(i + 1).padStart(2, '0')}_${sanitize(f.label)}.${extFromUrl(f.url)}`, blob: await res.blob() };
          } catch {
            return null;
          }
        })
      );
      fetched.filter(Boolean).forEach((f) => {
        zip.file(f.name, f.blob);
        bundled++;
      });

      // CRT workbook — best-effort; SharePoint may block cross-origin fetch, so fall back to a link file
      if (crtFile?.webUrl) {
        try {
          const res = await fetch(crtFile.webUrl);
          if (res.ok) {
            zip.file(crtFile.name, await res.blob());
            bundled++;
          } else {
            zip.file('CRT_download_link.txt', `Open or download the CRT workbook for ${monthLabel}:\n${crtFile.webUrl}`);
          }
        } catch {
          zip.file('CRT_download_link.txt', `Open or download the CRT workbook for ${monthLabel}:\n${crtFile.webUrl}`);
        }
      }

      zip.file(
        'README.txt',
        `Invoice Package ${pkg.package_number} — ${monthLabel}\n` +
          `Invoice: to be generated in the Invoices tab.\n` +
          `${bundled} document(s) bundled.`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${pkg.package_number}_${billingMonth}.zip`);
      toast.success(`Package bundle downloaded (${bundled} documents)`);
    } catch (err) {
      toast.error('Could not build bundle: ' + (err?.message || 'error'));
    } finally {
      setZipping(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5" />
              Package Contents
            </CardTitle>
            <CardDescription className="text-xs">
              Auto-gathered for {monthLabel}. Click an item to download, or bundle everything below.
            </CardDescription>
          </div>
          <Button onClick={handleDownloadAll} disabled={zipping} size="sm">
            {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {zipping ? 'Building…' : 'Download All (ZIP)'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left py-2 px-3">Document</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-right py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* CRT */}
              <tr className="border-b">
                <td className="py-2 px-3 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  CRT Workbook — {monthLabel}
                </td>
                <td className="py-2 px-3">
                  {crtFile ? (
                    <Badge variant="outline" className="text-green-600">{crtFile.name}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600">Not found for this month</Badge>
                  )}
                </td>
                <td className="text-right py-2 px-3">
                  {crtFile?.webUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={crtFile.webUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Download
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">Create it in the CRT tab</span>
                  )}
                </td>
              </tr>

              {/* Invoice */}
              <tr className="border-b">
                <td className="py-2 px-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  Invoice — {monthLabel}
                </td>
                <td className="py-2 px-3">
                  {pkg.invoice_id ? (
                    <Badge variant="outline" className="text-green-600">Generated</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">Pending</Badge>
                  )}
                </td>
                <td className="text-right py-2 px-3">
                  <span className="text-xs text-slate-500">Generate in the Invoices tab</span>
                </td>
              </tr>

              {/* Childminding */}
              <tr className="border-b">
                <td className="py-2 px-3 flex items-center gap-2">
                  <Baby className="h-4 w-4 text-pink-600" />
                  Childminding Sheet — {monthLabel}
                </td>
                <td className="py-2 px-3">
                  <Badge variant="outline">{cmRecords.length} sessions</Badge>
                </td>
                <td className="text-right py-2 px-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChildmindingPdf}
                    disabled={!cmRecords.length}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                </td>
              </tr>

              {/* Work Exposure */}
              <tr className="border-b">
                <td className="py-2 px-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  Work Exposure Payments — {monthLabel}
                </td>
                <td className="py-2 px-3">
                  <Badge variant="outline">{weRecords.length} placements</Badge>
                </td>
                <td className="text-right py-2 px-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWorkExposureCsv}
                    disabled={!weRecords.length}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                </td>
              </tr>

              {/* Supporting Documents */}
              <tr>
                <td className="py-2 px-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-slate-600" />
                  Supporting Documents — {monthLabel}
                </td>
                <td className="py-2 px-3">
                  <Badge variant="outline">{supportingFiles.length} files</Badge>
                </td>
                <td className="text-right py-2 px-3">
                  {supportingFiles.length ? (
                    <span className="text-xs text-slate-500">Listed below · in ZIP</span>
                  ) : (
                    <span className="text-xs text-slate-400">None for this month</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Supporting files list */}
        {supportingFiles.length > 0 && (
          <div className="mt-3 border-t pt-3 space-y-1">
            {supportingFiles.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:underline py-1"
              >
                <ExternalLink className="h-3 w-3" />
                {String(i + 1).padStart(2, '0')}. {f.label}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}