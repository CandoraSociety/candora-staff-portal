import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Plus, Settings, FileSpreadsheet, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePackages from '@/components/billing/InvoicePackages';
import CRT from '@/components/billing/CRT';
import MonthlyInvoices from '@/components/billing/MonthlyInvoices';
import SupportingDocuments from '@/components/billing/SupportingDocuments';
import PayablesTab from '@/components/billing/PayablesTab';
import ManualReimbursementEntry from '@/components/billing/ManualReimbursementEntry';
import ManualDeliverablesEntry from '@/components/billing/ManualDeliverablesEntry';
import { currentBillingMonth } from '@/components/billing/billingMonth';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { generateAndStorePackagePdfs } from '@/components/billing/packagePdfGeneration';

export default function PathwaysBilling() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("packages");
  const { invoiceLogoUrl, primaryColor, secondaryColor } = useOrgSettings();
  const brand = { logoUrl: invoiceLogoUrl, navy: secondaryColor, gold: primaryColor };
  // Current billing month in the org's timezone. Used as a `key` on the
  // Invoices tab so it fully remounts (fresh state) when the billing month
  // advances — a kept-alive Invoices instance from a prior month can never
  // keep showing that prior month's row.
  const currentMonth = currentBillingMonth();
  
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['invoice-packages'],
    queryFn: () => base44.entities.InvoicePackage.list('-prepared_date', 50),
  });
  
  const { data: configs = [] } = useQuery({
    queryKey: ['invoice-configs'],
    queryFn: () => base44.entities.InvoiceConfig.filter({ is_active: true }),
  });
  
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-billing_month', 50),
  });
  
  const { data: financialRecords = [] } = useQuery({
    queryKey: ['financial-records'],
    queryFn: () => base44.entities.FinancialRecord.list('-date', 200),
  });
  
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-billing'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data) => await base44.entities.InvoicePackage.create(data),
    onSuccess: () => {
      toast.success('Invoice package created');
      queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
    },
  });

  const handleCreatePackage = async (packageData) => {
    const currentUser = await base44.auth.me();
    const today = format(new Date(), 'yyyy-MM-dd');
    const end = packageData.billing_month_end && packageData.billing_month_end !== packageData.billing_month
      ? packageData.billing_month_end
      : null;
    const packageNumber = end
      ? `PKG-${packageData.billing_month.replace('-', '')}_${end.replace('-', '')}`
      : `PKG-${packageData.billing_month.replace('-', '')}`;

    // Auto-link the Invoice record for this month/range from the Invoices tab
    // so the package's Invoice tab pulls that invoice (frozen snapshot once
    // closed off, live data while still open).
    const matchingInvoice = invoices.find((inv) =>
      end
        ? inv.billing_month === packageData.billing_month && inv.billing_month_end === end
        : inv.billing_month === packageData.billing_month && (!inv.billing_month_end || inv.billing_month_end === inv.billing_month)
    );

    let createdPkg;
    try {
      createdPkg = await createPackageMutation.mutateAsync({
        ...packageData,
        billing_month_end: end,
        package_number: packageNumber,
        prepared_by: currentUser.email,
        prepared_by_name: currentUser.full_name,
        prepared_date: today,
        status: 'draft',
        crt_included: packageData.crt_included ?? true,
        invoice_id: matchingInvoice?.id || null,
        supporting_documents: [],
        paid_placements: [],
        auto_populated_items: [],
      });
    } catch (err) {
      toast.error('Could not create the invoice package: ' + (err?.message || 'error'));
      return;
    }

    // Produce the month's branded list PDFs (Work Exposure list + combined
    // Employment Supports/Exposure Courses list) and attach them to the
    // package. Best-effort — a failure here does not block the package.
    try {
      const month = packageData.billing_month;
      const [weAll, allFin] = await Promise.all([
        base44.entities.FinancialRecord.filter({ record_type: 'paid_external_placement' }),
        base44.entities.FinancialRecord.list('-date', 500),
      ]);
      const weRecords = (weAll || []).filter(
        (r) => r.billing_month === month && r.invoiced !== true && (Number(r.total || r.amount) || 0) > 0
      );
      const reimbRecords = (allFin || []).filter(
        (r) =>
          r.billing_month === month &&
          (r.record_type === 'employment_supports' || r.record_type === 'exposure_course')
      );
      if (weRecords.length || reimbRecords.length) {
        await generateAndStorePackagePdfs(createdPkg, { weRecords, reimbRecords, brand });
        queryClient.invalidateQueries({ queryKey: ['invoice-packages'] });
      }
    } catch (err) {
      console.error('Package PDF generation failed', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Monthly Billing Submissions
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage monthly invoice packages, CRT reports, and supporting documents
          </p>
        </div>
        <Button onClick={() => setActiveTab("packages")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice Package
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="packages">Invoice Packages</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="crt">CRT</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="manual-entry">Manual Entry</TabsTrigger>
          <TabsTrigger value="supporting-docs">Supporting Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <InvoicePackages
            packages={packages}
            configs={configs}
            invoices={invoices}
            onCreatePackage={handleCreatePackage}
            isLoading={packagesLoading}
          />
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <PayablesTab
            financialRecords={financialRecords}
            clients={clients}
          />
        </TabsContent>

        <TabsContent value="crt" className="space-y-4">
          <CRT
            clients={clients}
            financialRecords={financialRecords}
          />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <MonthlyInvoices key={currentMonth} />
        </TabsContent>

        <TabsContent value="manual-entry" className="space-y-4">
          <ManualReimbursementEntry />
          <ManualDeliverablesEntry />
        </TabsContent>

        <TabsContent value="supporting-docs" className="space-y-4">
          <SupportingDocuments
            financialRecords={financialRecords}
            clients={clients}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}