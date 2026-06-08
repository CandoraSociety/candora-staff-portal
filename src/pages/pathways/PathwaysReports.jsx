import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, Users } from 'lucide-react';

export default function PathwaysReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-600">Generate program outcomes and data reports</p>
      </div>
      
      <Tabs defaultValue="outcomes">
        <TabsList>
          <TabsTrigger value="outcomes">
            <BarChart3 className="h-4 w-4 mr-2" />
            Outcomes
          </TabsTrigger>
          <TabsTrigger value="data">
            <FileText className="h-4 w-4 mr-2" />
            Data Reports
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            Staff Monthly
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="outcomes">
          <Card>
            <CardHeader><CardTitle>Program Outcomes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-600">Outcome metrics and KPIs will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader><CardTitle>Data Reports</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-600">Customizable data reports with filters will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="staff">
          <Card>
            <CardHeader><CardTitle>Staff Monthly Reports</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-600">Staff narrative report submissions will be managed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}