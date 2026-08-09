import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Briefcase, UtensilsCrossed, DollarSign } from 'lucide-react';

export default function FinanceDashboard() {
  const { data: financialRecords = [] } = useQuery({
    queryKey: ['financial-records'],
    queryFn: () => base44.entities.FinancialRecord.list('-date', 200),
  });
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: () => base44.entities.Employee.filter({ status: 'active' }),
  });

  const outstandingPayables = financialRecords
    .filter(r => !r.reimbursed && r.record_type !== 'employment_supports' && r.record_type !== 'exposure_course')
    .reduce((s, r) => s + (r.total || 0), 0);
  const unpaidCount = financialRecords.filter(r => !r.reimbursed && r.record_type !== 'employment_supports' && r.record_type !== 'exposure_course').length;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Outstanding Payables</div>
            <div className="text-2xl font-bold text-amber-700">${outstandingPayables.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{unpaidCount} unpaid records</div>
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

    </div>
  );
}