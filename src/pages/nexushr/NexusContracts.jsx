import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { format } from 'date-fns';

export default function NexusContracts() {
  const { data: contracts = [] } = useQuery({ queryKey: ['contracts'], queryFn: () => base44.entities.Contract.list('-created_date', 200) });

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" actions={<Button size="sm" disabled><Plus className="w-4 h-4 mr-1" />Add Contract</Button>} />

      {contracts.length === 0 ? (
        <EmptyState icon={FileText} title="No contracts" description="Employee contracts will appear here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium hidden md:table-cell">Start</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contracts.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{c.employee_name}</td>
                    <td className="p-4">{c.contract_type?.replace(/_/g, ' ')}</td>
                    <td className="p-4 hidden md:table-cell">{c.start_date && format(new Date(c.start_date), 'MMM d, yyyy')}</td>
                    <td className="p-4"><StatusBadge status={c.status} /></td>
                    <td className="p-4">{c.file_url && <a href={c.file_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-muted-foreground" /></a>}</td>
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