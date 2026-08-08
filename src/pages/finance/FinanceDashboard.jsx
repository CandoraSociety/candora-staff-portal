import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Briefcase, UtensilsCrossed, DollarSign, Clock, FolderOpen, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function FinanceDashboard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'executive_director';

  const { data: financialRecords = [] } = useQuery({
    queryKey: ['financial-records'],
    queryFn: () => base44.entities.FinancialRecord.list('-date', 200),
  });
  const { data: hoursSubs = [] } = useQuery({
    queryKey: ['work-exposure-hours-submissions-all'],
    queryFn: () => base44.entities.WorkExposureHoursSubmission.list('-submitted_date', 100),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: () => base44.entities.Employee.filter({ status: 'active' }),
  });

  const outstandingPayables = financialRecords.filter(r => !r.reimbursed).reduce((s, r) => s + (r.total || 0), 0);
  const pendingWeHours = hoursSubs.filter(s => s.status === 'submitted').length;
  const paidThisMonth = financialRecords
    .filter(r => r.reimbursed && r.reimbursement_date && r.reimbursement_date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((s, r) => s + (r.total || 0), 0);

  const [syncing, setSyncing] = useState(false);
  const ensureFinanceFolder = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('syncPortalFolders', {});
      if (res?.data?.errors?.length) toast.error('Some folders failed to sync');
      else toast.success('Finance folder ensured on SharePoint');
      queryClient.invalidateQueries({ queryKey: ['finance-folder'] });
    } catch (e) { toast.error('Sync failed: ' + (e.message || '')); }
    finally { setSyncing(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" /> Finance Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Centralized financial hub — payroll, Pathways payables &amp; invoices, and food-services revenue.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Outstanding Payables</div>
            <div className="text-2xl font-bold text-amber-700">${outstandingPayables.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{financialRecords.filter(r => !r.reimbursed).length} unpaid records</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Pending WE Hours</div>
            <div className="text-2xl font-bold text-blue-700">{pendingWeHours}</div>
            <div className="text-xs text-muted-foreground">employer submissions awaiting review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Paid This Month</div>
            <div className="text-2xl font-bold text-green-700">${paidThisMonth.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">reimbursements in {format(new Date(), 'MMM yyyy')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3" /> Active Staff</div>
            <div className="text-2xl font-bold text-foreground">{employees.length}</div>
            <div className="text-xs text-muted-foreground">on payroll</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/finance/payroll">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <Wallet className="w-7 h-7 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Payroll</h3>
              <p className="text-xs text-muted-foreground mt-1">Timesheet submissions, vacation, sick time, benefits, staff listing &amp; wage adjustments.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/finance/pathways">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <Briefcase className="w-7 h-7 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Pathways</h3>
              <p className="text-xs text-muted-foreground mt-1">Work Exposure payments, employment supports, exposure courses &amp; monthly invoices.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/finance/food">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <UtensilsCrossed className="w-7 h-7 text-primary mb-2" />
              <h3 className="font-semibold text-foreground">Candora Food Services</h3>
              <p className="text-xs text-muted-foreground mt-1">Revenue &amp; expenses for Café Candeur, Auntie Bev's &amp; Catering.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Finance Documents (SharePoint)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Funder budgets, program budgets, invoices, payment requests and payroll/timesheet submissions are stored in the <strong>Finance</strong> folder on the Candora SharePoint site. Supporting documents uploaded in the Pathways portal are saved here automatically.
          </p>
          {isAdmin ? (
            <Button variant="outline" size="sm" onClick={ensureFinanceFolder} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Ensure Finance folder on SharePoint'}
            </Button>
          ) : (
            <Badge variant="outline">Ask an admin to sync the SharePoint folder</Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}