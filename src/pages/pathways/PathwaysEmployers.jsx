import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Briefcase, Plus } from 'lucide-react';

export default function PathwaysEmployers() {
  const queryClient = useQueryClient();
  
  const { data: employers = [] } = useQuery({
    queryKey: ['pathways-employers'],
    queryFn: () => base44.entities.Employer.list('-created_date', 100),
  });
  
  const createEmployerMutation = useMutation({
    mutationFn: async (data) => await base44.entities.Employer.create(data),
    onSuccess: () => {
      toast.success('Employer added');
      queryClient.invalidateQueries({ queryKey: ['pathways-employers'] });
    },
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Employer Engagement</h1>
        <p className="text-sm text-slate-600">Manage employer relationships and job opportunities</p>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Add Employer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Company Name *</Label><Input id="ename" required /></div>
            <div><Label>Contact Name</Label><Input id="econtact" /></div>
            <div><Label>Contact Email</Label><Input id="eemail" type="email" /></div>
            <div><Label>Contact Phone</Label><Input id="ephone" /></div>
            <div className="col-span-2"><Label>Address</Label><Input id="eaddress" /></div>
            <div><Label>Industry</Label><Input id="eindustry" /></div>
          </div>
          <div><Label>Notes</Label><Textarea id="enotes" rows={3} /></div>
          <Button onClick={() => {
            const name = document.getElementById('ename').value;
            if (!name) { toast.error('Name required'); return; }
            createEmployerMutation.mutate({
              name,
              contact_name: document.getElementById('econtact').value,
              contact_email: document.getElementById('eemail').value,
              contact_phone: document.getElementById('ephone').value,
              address: document.getElementById('eaddress').value,
              industry: document.getElementById('eindustry').value,
              notes: document.getElementById('enotes').value,
            });
          }}><Plus className="h-4 w-4 mr-2" />Add Employer</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Employers ({employers.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employers.map(emp => (
              <div key={emp.id} className="p-3 border rounded-lg">
                <p className="font-medium">{emp.name}</p>
                <p className="text-sm text-slate-600">{emp.contact_name} • {emp.contact_email} • {emp.contact_phone}</p>
                {emp.industry && <Badge variant="outline" className="mt-1">{emp.industry}</Badge>}
              </div>
            ))}
            {employers.length === 0 && <p className="text-center text-slate-500 py-8">No employers</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}