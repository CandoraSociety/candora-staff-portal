import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Save, X, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import SupportingDocuments from './SupportingDocuments';

export default function InvoicePackageDetail({ pkg, configs, onBack }) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(pkg.notes || '');
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const handleSaveNotes = async () => {
    try {
      await base44.entities.InvoicePackage.update(pkg.id, { notes });
      toast.success('Notes updated');
      setIsEditingNotes(false);
    } catch (error) {
      toast.error('Failed to update notes');
    }
  };

  const config = configs.find(c => c.id === pkg.config_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{pkg.package_number}</h2>
          <p className="text-sm text-slate-600">
            {format(new Date(pkg.billing_month + '-01'), 'MMMM yyyy')} Billing Package
          </p>
        </div>
        <Badge
          variant={pkg.status === 'approved' ? 'outline' : 'default'}
          className="ml-auto"
        >
          {pkg.status.replace('_', ' ')}
        </Badge>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="placements">Paid Placements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Prepared by:</span>
                  <span className="font-medium">{pkg.prepared_by_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prepared date:</span>
                  <span className="font-medium">{format(new Date(pkg.prepared_date), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CRT included:</span>
                  <span className="font-medium">{pkg.crt_included ? 'Yes' : 'No'}</span>
                </div>
                {config && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Configuration:</span>
                    <span className="font-medium">{config.config_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Notes</CardTitle>
                  {!isEditingNotes && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingNotes(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNotes}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNotes(pkg.notes || '');
                          setIsEditingNotes(false);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    {pkg.notes || <span className="italic text-slate-400">No notes added</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Auto-Populated Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Populated Items</CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.auto_populated_items?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-3">Category</th>
                        <th className="text-left py-2 px-3">Client</th>
                        <th className="text-left py-2 px-3">Description</th>
                        <th className="text-right py-2 px-3">Amount</th>
                        <th className="text-center py-2 px-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pkg.auto_populated_items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-3 capitalize">
                            {item.category?.replace('_', ' ')}
                          </td>
                          <td className="py-2 px-3 font-medium">{item.client_name}</td>
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="text-right py-2 px-3 font-bold">
                            ${item.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="text-center py-2 px-3">
                            {item.receipt_uploaded ? (
                              <Badge variant="outline" className="text-green-600">
                                ✓ Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600">
                                Required
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No auto-populated items for this month
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.invoice_id ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    Invoice has been generated for this package
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Invoice ID: <span className="font-mono font-medium">{pkg.invoice_id}</span>
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    No invoice generated yet
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 mb-4">
                    Generate an invoice for this billing package
                  </p>
                  <Button>
                    Generate Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Paid External Placements</CardTitle>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Placement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pkg.paid_placements?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2 px-3">Client</th>
                        <th className="text-left py-2 px-3">Employer</th>
                        <th className="text-left py-2 px-3">Dates</th>
                        <th className="text-right py-2 px-3">Wage</th>
                        <th className="text-right py-2 px-3">Hours</th>
                        <th className="text-right py-2 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pkg.paid_placements.map((placement, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{placement.client_name}</td>
                          <td className="py-2 px-3">{placement.employer_name}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {placement.start_date} to {placement.end_date}
                          </td>
                          <td className="text-right py-2 px-3">
                            ${placement.wage?.toFixed(2) || '0.00'}/hr
                          </td>
                          <td className="text-right py-2 px-3">{placement.hours}</td>
                          <td className="text-right py-2 px-3 font-bold">
                            ${placement.total?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  No paid placements added
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <SupportingDocuments billingMonth={pkg.billing_month} />
        </TabsContent>
      </Tabs>
    </div>
  );
}