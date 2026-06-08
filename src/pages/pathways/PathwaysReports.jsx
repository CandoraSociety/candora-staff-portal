import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function PathwaysReports() {
  const queryClient = useQueryClient();
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });
  
  const { data: reports = [] } = useQuery({
    queryKey: ['pathways-staff-reports'],
    queryFn: () => base44.entities.StaffMonthlyReport.list('-report_month', 50),
  });
  
  const submitReportMutation = useMutation({
    mutationFn: async (data) => base44.entities.StaffMonthlyReport.create(data),
    onSuccess: () => {
      toast.success('Report submitted');
      queryClient.invalidateQueries({ queryKey: ['pathways-staff-reports'] });
    },
  });
  
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    new_this_month: clients.filter(c => moment(c.created_date).isSame(moment(), 'month')).length,
    outcomes: clients.filter(c => c.program_status === 'complete').length,
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
        <p className="text-sm text-slate-600">Program outcomes and staff reporting</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-600">Total Clients</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-600">Active</p><p className="text-2xl font-bold">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-600">New This Month</p><p className="text-2xl font-bold">{stats.new_this_month}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-600">Completed</p><p className="text-2xl font-bold">{stats.outcomes}</p></CardContent></Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Submit Monthly Report</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            submitReportMutation.mutate({
              report_month: fd.get('report_month'),
              submitted_by: fd.get('submitted_by'),
              trends: fd.get('trends'),
              marketing_activities: fd.get('marketing_activities'),
              success_stories: fd.get('success_stories'),
              employer_engagements: fd.get('employer_engagements'),
              challenges: fd.get('challenges'),
              goals_next_month: fd.get('goals_next_month'),
              additional_notes: fd.get('additional_notes'),
            });
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Report Month</Label><Input name="report_month" type="month" required /></div>
              <div><Label>Submitted By (Email)</Label><Input name="submitted_by" type="email" required /></div>
            </div>
            <div><Label>Trends & Observations</Label><Textarea name="trends" rows={3} /></div>
            <div><Label>Marketing Activities</Label><Textarea name="marketing_activities" rows={2} /></div>
            <div><Label>Success Stories</Label><Textarea name="success_stories" rows={3} /></div>
            <div><Label>Employer Engagements</Label><Textarea name="employer_engagements" rows={2} /></div>
            <div><Label>Challenges</Label><Textarea name="challenges" rows={2} /></div>
            <div><Label>Goals for Next Month</Label><Textarea name="goals_next_month" rows={2} /></div>
            <div><Label>Additional Notes</Label><Textarea name="additional_notes" rows={2} /></div>
            <Button type="submit" className="bg-[#1a237e]"><Plus className="h-4 w-4 mr-2" />Submit Report</Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Submitted Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Month: {moment(report.report_month).format('MMMM YYYY')}</p>
                    <p className="text-sm text-slate-600">Submitted by: {report.submitted_by_name || report.submitted_by}</p>
                  </div>
                  <Badge>{report.status}</Badge>
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-center text-slate-500 py-8">No reports submitted</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}