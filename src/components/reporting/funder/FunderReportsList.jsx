import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarRange, Trash2, FileText, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { reportKindLabel, contentTypeLabel } from '@/lib/funderReportingConstants';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  submitted: 'bg-purple-100 text-purple-700',
};

export default function FunderReportsList({ funderKey }) {
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['funder-reports', funderKey],
    queryFn: () => base44.entities.FunderReport.filter({ funder: funderKey }),
  });

  const handleDelete = async (id) => {
    await base44.entities.FunderReport.delete(id);
    queryClient.invalidateQueries({ queryKey: ['funder-reports', funderKey] });
  };

  if (isLoading) return <div className="text-center py-6 text-muted-foreground text-sm">Loading reports...</div>;

  if (reports.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No reports created yet. Use "Create New Report" to set up a reporting period.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="grid gap-2">
      {reports.map(r => (
        <Card key={r.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="flex items-start gap-4 py-3">
            <div className="p-2 rounded-lg bg-accent/5 text-accent shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{r.title}</p>
                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{reportKindLabel(r.report_kind)}</span>
                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{contentTypeLabel(r.content_type)}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] || STATUS_STYLES.draft}`}>
                  {(r.status || 'draft').replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                {r.period_label && <span>{r.period_label}</span>}
                {(r.period_start || r.period_end) && (
                  <span className="flex items-center gap-1">
                    <CalendarRange className="w-3 h-3" />
                    {r.period_start ? format(new Date(r.period_start), 'MMM d, yy') : '—'} – {r.period_end ? format(new Date(r.period_end), 'MMM d, yy') : '—'}
                  </span>
                )}
              </div>
              {(r.linked_file_names || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(r.linked_file_names || []).map((n, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                      <FileText className="w-3 h-3" />{n}
                    </span>
                  ))}
                </div>
              )}
              {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.notes}</p>}
            </div>
            <Button variant="ghost" size="icon" title="Delete" className="text-red-500 hover:text-red-700 shrink-0" onClick={() => handleDelete(r.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}