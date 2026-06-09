import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Invoices({ invoices, configs, clients, financialRecords }) {
  const [view, setView] = useState('list');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const activeConfig = configs.find(c => c.is_active);

  const changeMonth = (direction) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(format(date, 'yyyy-MM'));
  };

  const handleGenerateInvoice = () => {
    toast.info('Invoice generation - placeholder');
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setView('detail');
  };

  const invoicesForMonth = invoices.filter(
    inv => inv.billing_month === selectedMonth
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Generator
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {activeConfig?.config_name || 'No contract configured'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Contract Config
          </Button>
          <Button variant="outline" size="sm">
            Reports
          </Button>
        </div>
      </div>

      {/* Budget Tracker Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Contract budget utilization and remaining amounts
          </p>
        </CardContent>
      </Card>

      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Month
        </Button>
        <h3 className="text-lg font-semibold">
          {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
        </h3>
        <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
          Next Month
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
        <div className="ml-4">
          {invoicesForMonth.length > 0 ? (
            <Button onClick={() => handleViewInvoice(invoicesForMonth[0])}>
              View {invoicesForMonth[0].status === 'finalized' ? 'Invoice' : 'Draft'}
            </Button>
          ) : (
            <Button onClick={handleGenerateInvoice} disabled={!activeConfig}>
              Generate Invoice
            </Button>
          )}
        </div>
      </div>

      {/* All Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2 px-3">Invoice #</th>
                    <th className="text-left py-2 px-3">Billing Month</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-right py-2 px-3">Total</th>
                    <th className="text-right py-2 px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-mono">{inv.invoice_number}</td>
                      <td className="py-2 px-3">
                        {format(new Date(inv.billing_month + '-01'), 'MMMM yyyy')}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={inv.status === 'finalized' ? 'outline' : 'default'}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-3 font-bold">
                        ${inv.total_amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="text-right py-2 px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(inv)}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-slate-400" />
              <p>No invoices generated yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}