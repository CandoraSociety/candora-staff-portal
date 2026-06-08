import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, TrendingUp, Users, BarChart3 } from 'lucide-react';
import moment from 'moment';

const WORKERS = [
  { email: 'priscilla@candorasociety.com', name: 'Priscilla' },
  { email: 'lola@candorasociety.com', name: 'Lola' },
  { email: 'john@candorasociety.com', name: 'John' },
  { email: 'Dawn.williston@candorasociety.com', name: 'Dawn' },
  { email: 'olena@candorasociety.com', name: 'Olena' },
];

export default function PathwaysReports() {
  const [activeTab, setActiveTab] = useState('outcomes');
  const queryClient = useQueryClient();
  
  const { data: clients = [] } = useQuery({
    queryKey: ['pathways-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
  });
  
  const { data: reports = [] } = useQuery({
    queryKey: ['pathways-staff-reports'],
    queryFn: () => base44.entities.StaffMonthlyReport.list('-report_month', 50),
  });
  
  const createReportMutation = useMutation({
    mutationFn: async (data) => await base44.entities.StaffMonthlyReport.create(data),
    onSuccess: () => {
      toast.success('Report submitted');
      queryClient.invalidateQueries({ queryKey: ['pathways-staff-reports'] });
    },
  });
  
  const outcomes = {
    dea_starters: clients.filter(c => c.service_type === 'casual' && c.status === 'active').length,
    pathways_starters: clients.filter(c => c.service_type === 'pathways' && c.status === 'active').length,
    dea_completers: clients.filter(c => c.service_type === 'casual' && c.program_status === 'complete').length,
    pathways_completers: clients.filter(c => c.service_type === 'pathways' && c.program_status === 'complete').length,
    employment_outcomes: clients.filter(c => ['E-RF', 'E-UF', 'E-PT'].includes(c.employment_status)).length,
    _90day_outcomes: clients.filter(c => ['E-RF', 'E-UF', 'E-PT'].includes(c.followup_90day_status)).length,
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-600">Outcomes, data analysis, and staff monthly reports</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="data">Data Reports</TabsTrigger>
          <TabsTrigger value="staff">Staff Monthly</TabsTrigger>
        </TabsList>
        
        <TabsContent value="outcomes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OutcomeCard title="DEA Starters" value={outcomes.dea_starters} icon={Users} />
            <OutcomeCard title="Pathways Starters" value={outcomes.pathways_starters} icon={Users} />
            <OutcomeCard title="DEA Completers" value={outcomes.dea_completers} icon={FileText} />
            <OutcomeCard title="Pathways Completers" value={outcomes.pathways_completers} icon={FileText} />
            <OutcomeCard title="Employment Outcomes" value={outcomes.employment_outcomes} icon={TrendingUp} />
            <OutcomeCard title="90-Day Outcomes" value={outcomes._90day_outcomes} icon={TrendingUp} />
          </div>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader><CardTitle>Data Reports</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Service Type</Label><Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pathways">Pathways</SelectItem><SelectItem value="casual">DEA</SelectItem><SelectItem value="direct_to_employment">Direct to Employment</SelectItem></SelectContent></Select></div>
                <div><Label>Status</Label><Select><SelectTrigger><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
              </div>
              <Button>Export to CSV</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="staff">
          <Card>
            <CardHeader><CardTitle>Submit Monthly Report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Report Month</Label><Input type="month" id="rmonth" defaultValue={moment().format('YYYY-MM')} /></div>
              </div>
              <div><Label>Trends</Label><Textarea id="rtrends" rows={3} /></div>
              <div><Label>Marketing Activities</Label><Textarea id="rmarketing" rows={3} /></div>
              <div><Label>Success Stories</Label><Textarea id="rsuccess" rows={3} /></div>
              <div><Label>Employer Engagements</Label><Textarea id="remployer" rows={3} /></div>
              <div><Label>Challenges</Label><Textarea id="rchallenges" rows={3} /></div>
              <div><Label>Goals Next Month</Label><Textarea id="rgoals" rows={3} /></div>
              <Button onClick={() => {
                createReportMutation.mutate({
                  report_month: document.getElementById('rmonth').value,
                  submitted_by: 'current_user@candorasociety.com',
                  submitted_by_name: 'Current User',
                  submitted_date: moment().format('YYYY-MM-DD'),
                  status: 'draft',
                  trends: document.getElementById('rtrends').value,
                  marketing_activities: document.getElementById('rmarketing').value,
                  success_stories: document.getElementById('rsuccess').value,
                  employer_engagements: document.getElementById('remployer').value,
                  challenges: document.getElementById('rchallenges').value,
                  goals_next_month: document.getElementById('rgoals').value,
                });
              }}>Submit Report</Button>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader><CardTitle>Submitted Reports</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map(r => (
                  <div key={r.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{moment(r.report_month).format('MMMM YYYY')}</p>
                    <p className="text-sm text-slate-600">Submitted: {r.submitted_by_name} on {moment(r.submitted_date).format('MMM D, YYYY')}</p>
                    <Badge className="mt-1">{r.status}</Badge>
                  </div>
                ))}
                {reports.length === 0 && <p className="text-center text-slate-500 py-8">No reports</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OutcomeCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg"><Icon className="h-6 w-6 text-primary" /></div>
          <div><p className="text-sm text-slate-600">{title}</p><p className="text-2xl font-bold">{value}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}