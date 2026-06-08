import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const RECORD_TYPES = [
  { value: 'exposure_course', label: 'Exposure Course' },
  { value: 'paid_external_placement', label: 'Paid External Placement' },
  { value: 'employment_supports', label: 'Employment Supports' },
];

const COURSE_TYPES = [
  'First Aid', 'Food Safety', 'WHMIS', 'Customer Service', 'Computer Skills', 'Language Training', 'Other'
];

export default function PathwaysFinancials() {
  const queryClient = useQueryClient();
  
  const { data: records = [] } = useQuery({
    queryKey: ['pathways-financials'],
    queryFn: () => base44.entities.FinancialRecord.list('-date', 500),
  });
  
  const createRecordMutation = useMutation({
    mutationFn: async (data) => base44.entities.FinancialRecord.create(data),
    onSuccess: () => {
      toast.success('Financial record created');
      queryClient.invalidateQueries({ queryKey: ['pathways-financials'] });
    },
  });
  
  const deleteRecordMutation = useMutation({
    mutationFn: async (id) => base44.entities.FinancialRecord.delete(id),
    onSuccess: () => {
      toast.success('Record deleted');
      queryClient.invalidateQueries({ queryKey: ['pathways-financials'] });
    },
  });
  
  const totalAmount = records.reduce((sum, r) => sum + (r.total || 0), 0);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Records</h1>
          <p className="text-sm text-slate-600">Track expenses and supports</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Total Records</p>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Add Financial Record</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            createRecordMutation.mutate({
              client_id: fd.get('client_id'),
              client_name: fd.get('client_name'),
              record_type: fd.get('record_type'),
              course_type: fd.get('course_type'),
              description: fd.get('description'),
              amount: parseFloat(fd.get('amount')),
              tax: parseFloat(fd.get('tax') || 0),
              total: parseFloat(fd.get('total')),
              date: fd.get('date'),
              vendor: fd.get('vendor'),
              notes: fd.get('notes'),
            });
          }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Client ID</Label><Input name="client_id" required /></div>
            <div><Label>Client Name</Label><Input name="client_name" required /></div>
            <div><Label>Record Type *</Label><Select name="record_type" required><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{RECORD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Course Type</Label><Select name="course_type"><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{COURSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="md:col-span-2"><Label>Description</Label><Input name="description" /></div>
            <div><Label>Amount ($)</Label><Input name="amount" type="number" step="0.01" required /></div>
            <div><Label>Tax ($)</Label><Input name="tax" type="number" step="0.01" /></div>
            <div><Label>Total ($)</Label><Input name="total" type="number" step="0.01" required /></div>
            <div><Label>Date</Label><Input name="date" type="date" required /></div>
            <div><Label>Vendor</Label><Input name="vendor" /></div>
            <div className="md:col-span-3"><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
            <div className="md:col-span-3"><Button type="submit" className="bg-[#1a237e]"><Plus className="h-4 w-4 mr-2" />Add Record</Button></div>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Records ({records.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {records.map((record) => (
              <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{record.client_name}</p>
                  <p className="text-sm text-slate-600">{record.record_type?.replace(/_/g, ' ')} • {record.date}</p>
                  {record.description && <p className="text-xs text-slate-500">{record.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold">${record.total?.toFixed(2)}</p>
                  <Button size="sm" variant="ghost" onClick={() => deleteRecordMutation.mutate(record.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
            {records.length === 0 && <p className="text-center text-slate-500 py-8">No financial records</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}