import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Download, FileText, FileSpreadsheet, Briefcase, Baby, Paperclip,
  Loader2, Package, ExternalLink,
} from 'lucide-react';
import {
  monthLabelFromBillingMonth,
  findCrtFileForMonth,
  buildChildmindingPdfBlob,
  buildWorkExposurePdfBlob,
  buildInvoicePdfFromNode,
  downloadBlob,
  downloadUrl,
  extFromUrl,
} from './packageContentsHelpers';
import InvoiceDocument from './InvoiceDocument';
import CategoryUpload from './CategoryUpload';
import { useOrgSettings } from '@/lib/useOrgSettings';

const UPLOAD_FOLDERS = {
  crt: 'CRT',
  invoice: 'Invoice',
  childminding: 'Childminding',
  work_exposure: 'WorkExposure',
  supporting: 'SupportingDocs',
};
const sanitizeFileName = (s) =>
  String(s || 'file').replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');

const sanitize = (s) => String(s || '').replace(/[^a-z0-9_-]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

export default function PackageContents({ pkg, onViewInvoice }) {
  const billingMonth = pkg.billing_month;
  const monthLabel = monthLabelFromBillingMonth(billingMonth);
  const [zipping, setZipping] = useState(false);
  const { invoiceLogoUrl, primaryColor, secondaryColor } = useOrgSettings();
  const brand = { logoUrl: invoiceLogoUrl, navy: secondaryColor, gold: primaryColor };

  const queryClient = useQueryClient();
  const [manualUploads, setManualUploads] = useState(pkg.manual_uploads || []);
  const [currentUser, setCurrentUser] = useState(null);
  // Lock removal of manual uploads once the package has been submitted/approved/paid.
  const locked = pkg.status === 'submitted' || pkg.status === 'approved' || pkg.status === 'paid';

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const persistUploads = async (next) => {
    setManualUploads(next);
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { manual_uploads: next });
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
    } catch {
      toast.error('Could not save the uploaded file to the package.');
    }
  };
  const handleUpload = async ({ category, file_url, file_name }) => {
    const entry = {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      category,
      file_url,
      file_name,
      uploaded_date: format(new Date(), 'yyyy-MM-dd'),
      uploaded_by_name: currentUser?.full_name || '',
    };
    await persistUploads([...manualUploads, entry]);
    toast.success('Backup document attached.');
  };
  const handleRemoveUpload = (u) => persistUploads(manualUploads.filter((x) => x.id !== u.id));

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
    select: (recs) => (recs || []).filter((r) => r.billing_month === billingMonth && r.invoiced !== true && (Number(r.total || r.amount) || 0) > 0),
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

  // Invoice data for the month — finalized snapshot from the linked Invoice
  // record, otherwise a live read from the CRT tracker. Mirrors PackageInvoiceTab
  // so the ZIP bundles the same invoice shown on the Invoice tab.
  const start = pkg.billing_month;
  const end = pkg.billing_month_end && pkg.billing_month_end !== pkg.billing_month
    ? pkg.billing_month_end
    : null;
  const dataMonth = end || start;

  const { data: linkedInvoice } = useQuery({
    queryKey: ['linked-invoice', pkg.invoice_id],
    queryFn: () => base44.entities.Invoice.get(pkg.invoice_id),
    enabled: !!pkg.invoice_id,
    staleTime: 0,
  });
  const useSnapshot = linkedInvoice && linkedInvoice.status === 'finalized';
  const { data: liveInvoice } = useQuery({
    queryKey: ['package-invoice-data', pkg.id, dataMonth],
    queryFn: async () => (await base44.functions.invoke('getMonthlyInvoiceData', { billingMonth: dataMonth })).data,
    enabled: !useSnapshot,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  const invoiceData = useSnapshot
    ? {
        invoiceNumber: linkedInvoice.invoice_number ? Number(linkedInvoice.invoice_number) : null,
        billingMonth: linkedInvoice.billing_month,
        header: linkedInvoice.header_info || [],
        lineItems: linkedInvoice.line_items || [],
        subtotalDeliverables: linkedInvoice.subtotal_deliverables || 0,
        subtotalDirectCosts: linkedInvoice.subtotal_direct_costs || 0,
        total: linkedInvoice.total_amount || 0,
      }
    : liveInvoice && liveInvoice.status === 'success'
      ? liveInvoice
      : null;

  const invoiceWrapRef = useRef(null);

  const handleChildmindingPdf = async () => {
    if (!cmRecords.length) {
      toast.info(`No childminding sessions for ${monthLabel}`);
      return;
    }
    const blob = await buildChildmindingPdfBlob(cmRecords, billingMonth, brand);
    downloadBlob(blob, `Childminding_${billingMonth}.pdf`);
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

      // Invoice — render the on-screen InvoiceDocument to a PDF so the archive
      // contains the real invoice, not a placeholder README.
      if (invoiceData && invoiceWrapRef.current) {
        const node = invoiceWrapRef.current.querySelector('.invoice-document');
        if (node) {
          try {
            const invoiceBlob = await buildInvoicePdfFromNode(node);
            zip.file(`Invoice_${billingMonth}.pdf`, invoiceBlob);
            bundled++;
          } catch {
            toast.error('Could not render the invoice PDF — it will be skipped from the ZIP.');
          }
        }
      }

      if (cmRecords.length) {
        zip.file(`Childminding_${billingMonth}.pdf`, await buildChildmindingPdfBlob(cmRecords, billingMonth, brand));
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

      // Manually uploaded backup documents — best-effort fetch, filed under the
      // matching category folder so they land alongside the auto-gathered docs.
      const uploaded = await Promise.all(
        manualUploads.map(async (u) => {
          try {
            const res = await fetch(u.file_url);
            if (!res.ok) return null;
            const folder = UPLOAD_FOLDERS[u.category] || 'ManualUploads';
            return { name: `${folder}/${sanitizeFileName(u.file_name)}`, blob: await res.blob() };
          } catch {
            return null;
          }
        })
      );
      uploaded.filter(Boolean).forEach((f) => {
        zip.file(f.name, f.blob);
        bundled++;
      });

      zip.file(
        'README.txt',
        `Invoice Package ${pkg.package_number} — ${monthLabel}\n` +
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
              <tr className="bg-slate-50/50">
                <td colSpan={3} className="py-2 px-3">
                  <CategoryUpload category="crt" uploads={manualUploads} onUpload={handleUpload} onRemove={handleRemoveUpload} locked={locked} />
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
                  {pkg.invoice_id ? (
                    <Button variant="outline" size="sm" onClick={onViewInvoice}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> View / Print PDF
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500">Generate in the Invoices tab</span>
                  )}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td colSpan={3} className="py-2 px-3">
                  <CategoryUpload category="invoice" uploads={manualUploads} onUpload={handleUpload} onRemove={handleRemoveUpload} locked={locked} />
                </td>
              </tr>

              {/* Childminding */}
              <tr className="border-b">
                <td className="py-2 px-3 flex items-center gap-2">
                  <Baby className="h-4 w-4 text-pink-600" />
                  Childminding Sheet — {monthLabel}
                </td>
                <td className="py-2 px-3">
                  <Badge variant="outline">{cmRecords.length} participants</Badge>
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
              <tr className="bg-slate-50/50">
                <td colSpan={3} className="py-2 px-3">
                  <CategoryUpload category="childminding" uploads={manualUploads} onUpload={handleUpload} onRemove={handleRemoveUpload} locked={locked} />
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
              <tr className="bg-slate-50/50">
                <td colSpan={3} className="py-2 px-3">
                  <CategoryUpload category="work_exposure" uploads={manualUploads} onUpload={handleUpload} onRemove={handleRemoveUpload} locked={locked} />
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
              <tr className="bg-slate-50/50">
                <td colSpan={3} className="py-2 px-3">
                  <CategoryUpload category="supporting" uploads={manualUploads} onUpload={handleUpload} onRemove={handleRemoveUpload} locked={locked} />
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

        {/* Off-screen render of the invoice so the ZIP can capture a real PDF. */}
        {invoiceData && (
          <div ref={invoiceWrapRef} aria-hidden style={{ position: 'absolute', left: '-10000px', top: 0, width: 850 }}>
            <InvoiceDocument
              data={invoiceData}
              status={useSnapshot ? 'Finalized' : (pkg.status === 'approved' ? 'Approved' : 'Draft')}
              adjustmentNotes={pkg.adjustment_notes || []}
              billingMonthEnd={end}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}