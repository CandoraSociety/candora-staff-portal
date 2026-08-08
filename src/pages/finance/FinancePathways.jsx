import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, FileText, Calendar } from 'lucide-react';
import FinancePayablesSection from '@/components/finance/FinancePayablesSection';
import { format } from 'date-fns';

export default function FinancePathways() {
  const [tab, setTab] = useState('we');

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
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : packages.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  No invoice packages yet. Packages created in Pathways Billing will appear here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Package #</th>
                        <th className="text-left px-3 py-2 font-semibold">Billing Month</th>
                        <th className="text-left px-3 py-2 font-semibold">Prepared By</th>
                        <th className="text-left px-3 py-2 font-semibold">Prepared</th>
                        <th className="text-center px-3 py-2 font-semibold">Status</th>
                        <th className="text-center px-3 py-2 font-semibold">CRT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {packages.map(p => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{p.package_number || '—'}</td>
                          <td className="px-3 py-2">{p.billing_month || '—'}</td>
                          <td className="px-3 py-2">{p.prepared_by_name || p.prepared_by || '—'}</td>
                          <td className="px-3 py-2">{p.prepared_date ? format(new Date(p.prepared_date), 'MMM d, yy') : '—'}</td>
                          <td className="px-3 py-2 text-center"><Badge variant="outline">{p.status}</Badge></td>
                          <td className="px-3 py-2 text-center">{p.crt_included ? <Badge className="text-xs bg-green-100 text-green-800">Yes</Badge> : <Badge className="text-xs bg-slate-100 text-slate-600">No</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Supporting documents uploaded in Pathways Billing are saved to the Finance SharePoint folder automatically.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}