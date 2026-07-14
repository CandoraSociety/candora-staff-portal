import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, Plus, Users, Target, Layers } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import CareerPlanForm from '@/components/career/CareerPlanForm';
import SuccessionMatrix from '@/components/career/SuccessionMatrix';

const readinessColors = {
  ready_now: 'bg-green-100 text-green-800',
  ready_1_year: 'bg-blue-100 text-blue-800',
  ready_2_years: 'bg-yellow-100 text-yellow-800',
  developing: 'bg-orange-100 text-orange-800',
  not_applicable: 'bg-slate-100 text-slate-600',
};

export default function NexusCareerPlans() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: plans = [] } = useQuery({ queryKey: ['career-plans'], queryFn: () => base44.entities.CareerPlan.list('-created_date', 200) });
  const { data: employees = [] } = useQuery({ queryKey: ['employees-career'], queryFn: () => base44.entities.Employee.filter({ status: 'active' }, 'first_name', 200) });

  const createPlan = useMutation({
    mutationFn: (data) => base44.entities.CareerPlan.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['career-plans'] }); setShowForm(false); },
  });
  const updatePlan = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CareerPlan.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['career-plans'] }); setSelected(null); },
  });

  const active = plans.filter(p => p.status === 'active');
  const readyNow = plans.filter(p => p.readiness === 'ready_now');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career & Succession"
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" />New Plan</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Plans', value: active.length, icon: Layers, color: 'text-blue-500' },
          { label: 'Ready Now', value: readyNow.length, icon: Users, color: 'text-green-500' },
          { label: 'Total Plans', value: plans.length, icon: Target, color: 'text-purple-500' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div><p className="text-xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="plans">
        <TabsList><TabsTrigger value="plans">Development Plans</TabsTrigger><TabsTrigger value="matrix">Succession Matrix</TabsTrigger></TabsList>
        <TabsContent value="plans" className="mt-4">
          {plans.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No career plans" description="Create development plans for your employees." />
          ) : (
            <div className="space-y-3">
              {plans.map(plan => (
                <Card key={plan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(plan)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{plan.employee_name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.current_position}</p>
                        {plan.target_position && <p className="text-sm text-muted-foreground">→ Target: {plan.target_position}</p>}
                      </div>
                      {plan.readiness && <Badge className={`${readinessColors[plan.readiness]} border-0 text-xs`}>{plan.readiness.replace(/_/g, ' ')}</Badge>}
                    </div>
                    {plan.development_goals && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{plan.development_goals}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="matrix" className="mt-4">
          <SuccessionMatrix plans={plans} />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>New Career Development Plan</DialogTitle></DialogHeader>
          <CareerPlanForm employees={employees} onSubmit={createPlan.mutate} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Career Plan — {selected?.employee_name}</DialogTitle></DialogHeader>
          {selected && <CareerPlanForm employees={employees} initial={selected} onSubmit={d => updatePlan.mutate({ id: selected.id, data: d })} onCancel={() => setSelected(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}