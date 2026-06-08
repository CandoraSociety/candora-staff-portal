import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

export default function PathwaysBilling() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Monthly Billing Submissions</h1>
        <p className="text-sm text-slate-600">Manage invoice packages and financial records</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Invoice Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">Generate and manage monthly invoice packages</p>
            <Button size="sm" variant="outline">View Packages</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Financial Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">Track exposure courses and employment supports</p>
            <Button size="sm" variant="outline">Manage Records</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>CRT Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">Client and financial reporting for billing</p>
            <Button size="sm" variant="outline">Generate CRT</Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>Billing Overview</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-600">Invoice package generator and billing management will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}