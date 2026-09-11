import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { docTypeLabel } from '@/lib/funderReportingConstants';

const TYPE_STYLES = {
  template: 'bg-blue-100 text-blue-700',
  guideline: 'bg-amber-100 text-amber-700',
  submitted_report: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-700',
};

export default function FunderFilesList({ funderKey }) {
  const queryClient = useQueryClient();
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['funder-reporting-files', funderKey],
    queryFn: () => base44.entities.FunderReportingFile.filter({ funder: funderKey }),
  });

  const handleDelete = async (id) => {
    await base44.entities.FunderReportingFile.delete(id);
    queryClient.invalidateQueries({ queryKey: ['funder-reporting-files', funderKey] });
  };

  if (isLoading) return <div className="text-center py-6 text-muted-foreground text-sm">Loading documents...</div>;

  if (files.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No documents uploaded yet. Upload templates, guidelines or other reporting documents above.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="grid gap-2">
      {files.map(f => (
        <Card key={f.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="flex items-center gap-4 py-3">
            <div className="p-2 rounded-lg bg-accent/5 text-accent shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm truncate">{f.file_name}</p>
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[f.doc_type] || TYPE_STYLES.other}`}>
                  {docTypeLabel(f.doc_type)}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                {f.reporting_period && <span>Period: {f.reporting_period}</span>}
                <span>Added {f.created_date ? format(new Date(f.created_date), 'MMM d, yyyy') : ''}</span>
              </div>
              {f.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{f.notes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" title="Open file" onClick={() => window.open(f.file_url, '_blank')}>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Delete" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(f.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}