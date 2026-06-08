import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, Plus, FileText } from 'lucide-react';
import moment from 'moment';

export default function PathwaysBilling() {
  const queryClient = useQueryClient();
  
  const { data: invoices = [] } = useQuery({
    queryKey: ['pathways-invoices'],
    queryFn: () => base44.entities.Invoice.list('-billing_month', 50),
  });
  
  const { data: configs = [] } = useQuery({
    queryKey: ['pathways-invoice-configs'],
    queryFn: () => base44.entities.InvoiceConfig.filter({ is_active: true }),
  });
  
  const createInvoiceMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Invoice.create(data),
    onSuccess: () => {
      toast.success('Invoice created');
      queryClient.invalidateQueries({ queryKey: ['pathways-invoices'] });
    },
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Monthly Billing</h1>
        <p className="text-sm text-slate-600">Manage invoice packages and submissions</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Active Config</CardTitle></CardHeader>
          <CardContent>
            {configs[0] ? (
              <div>
                <p className="font-medium">{configs[0].config_name}</p>
                <p className="text-sm text-slate-600">Base: ${configs[0].base_monthly_amount}</p>
                <p className="text-xs text-slate-500">Contract: {moment(configs[0].contract_start_date).format('MMM YYYY')} - {moment(configs[0].contract_end_date).format('MMM YYYY')}</p>
              </div>
            ) : (
              <p className="text-slate-500">No active config</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{invoices.length}</p>
            <p className="text-sm text-slate-600">Total submissions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>This Month</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{invoices.filter(i => moment(i.billing_month).format('YYYY-MM') === moment().format('YYYY-MM')).length}</p>
            <p className="text-sm text-slate-600">Invoices created</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Create Invoice Package</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Billing Month</Label><Input type="month" defaultValue={moment().format('YYYY-MM')} /></div>
            <div><Label>Configuration</Label><select className="w-full border rounded-md p-2"><option>{configs[0]?.config_name || 'No config'}</option></select></div>
          </div>
          <Button onClick={() => createInvoiceMutation.mutate({ billing_month: moment().format('YYYY-MM'), config_id: configs[0]?.id, status: 'draft', generated_by: 'admin' })}>
            <Plus className="h-4 w-4 mr-2" />Create Invoice
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Invoice History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{moment(inv.billing_month).format('MMMM YYYY')}</p>
                  <p className="text-sm text-slate-600">Total: ${inv.total_amount?.toFixed(2) || '0.00'}</p>
                </div>
                <Badge>{inv.status}</Badge>
              </div>
            ))}
            {invoices.length === 0 && <p className="text-center text-slate-500 py-8">No invoices</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}