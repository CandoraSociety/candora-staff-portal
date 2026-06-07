import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAccessLevel } from '@/lib/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, Plus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AccessDenied from '@/components/shared/AccessDenied';

export default function NexusLegalCases() {
  const { isHRAdmin } = useAccessLevel();
  const { data: cases = [] } = useQuery({ queryKey: ['legal-cases'], queryFn: () => base44.entities.LegalCase.list('-created_date', 200) });

  if (!isHRAdmin) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <PageHeader title="Legal Cases" actions={<Button size="sm" disabled><Plus className="w-4 h-4 mr-1" />New Case</Button>} />

      {cases.length === 0 ? (
        <EmptyState icon={Scale} title="No legal cases" description="Legal cases will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Title</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium hidden md:table-cell">Priority</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cases.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{c.title}</td>
                    <td className="p-4">{c.case_type?.replace(/_/g, ' ')}</td>
                    <td className="p-4 hidden md:table-cell"><StatusBadge status={c.priority} /></td>
                    <td className="p-4"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}