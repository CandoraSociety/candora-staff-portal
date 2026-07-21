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
import Invoices from '@/components/billing/Invoices';
import SupportingDocuments from '@/components/billing/SupportingDocuments';
import PayablesTab from '@/components/billing/PayablesTab';

export default function PathwaysBilling() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("packages");
  
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
    queryFn: () => base44.entities.Client.list(),
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
    const packageNumber = `PKG-${packageData.billing_month.replace('-', '')}`;
    
    createPackageMutation.mutate({
      ...packageData,
      package_number: packageNumber,
      prepared_by: currentUser.email,
      prepared_by_name: currentUser.full_name,
      prepared_date: today,
      status: 'draft',
      crt_included: packageData.crt_included ?? true,
      supporting_documents: [],
      paid_placements: [],
      auto_populated_items: [],
    });
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="packages">Invoice Packages</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="crt">CRT</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
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
          <Invoices
            invoices={invoices}
            configs={configs}
            clients={clients}
            financialRecords={financialRecords}
          />
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