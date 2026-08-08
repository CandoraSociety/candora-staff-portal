import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import FinancePayablesSection from '@/components/finance/FinancePayablesSection';
import PackageContents from '@/components/billing/PackageContents';
import { format } from 'date-fns';

export default function FinancePathways() {
  const [tab, setTab] = useState('we');
  const [expandedPkg, setExpandedPkg] = useState(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['invoice-packages'],
    queryFn: () => base44.entities.InvoicePackage.list('-prepared_date', 50),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Briefcase className="h-6 w-6 text-primary" /> Pathways</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Payables originating from the Pathways portal — marking a record paid here also marks it paid in Pathways Billing.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="we" className="text-xs">Work Exposure Payments</TabsTrigger>
          <TabsTrigger value="supports" className="text-xs">Employment Supports</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs">Exposure Courses</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="we" className="mt-4">
          <FinancePayablesSection recordType="paid_external_placement" />
        </TabsContent>
        <TabsContent value="supports" className="mt-4">
          <FinancePayablesSection recordType="employment_supports" />
        </TabsContent>
        <TabsContent value="courses" className="mt-4">
          <FinancePayablesSection recordType="exposure_course" />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Monthly Invoice Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Click a package to view and download all of its documents (CRT workbook, invoice, childminding sheet, work exposure payments, and supporting documents). Files are stored on SharePoint automatically.
              </p>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : packages.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  No invoice packages yet. Packages created in Pathways Billing will appear here automatically.
                </div>
              ) : (
                <div className="space-y-2">
                  {packages.map(p => {
                    const isOpen = expandedPkg === p.id;
                    return (
                      <div key={p.id} className="rounded-lg border overflow-hidden">
                        <button
                          onClick={() => setExpandedPkg(isOpen ? null : p.id)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <span className="font-medium text-sm">{p.package_number || '—'}</span>
                            <Badge variant="outline" className="text-xs">{p.billing_month || '—'}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{p.prepared_by_name || p.prepared_by || '—'}</span>
                            <Badge variant="outline">{p.status}</Badge>
                            {p.crt_included ? <Badge className="text-xs bg-green-100 text-green-800">CRT</Badge> : <Badge className="text-xs bg-slate-100 text-slate-600">No CRT</Badge>}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t p-4 bg-card">
                            <PackageContents pkg={p} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}