import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Plus, Trash2, Edit3, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreateReportDialog from '@/components/reporting/CreateReportDialog';
import UploadAnalyzerDialog from '@/components/reporting/UploadAnalyzerDialog';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  in_review: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
};

export default function ReportingAGR() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['agr-reports'],
    queryFn: () => base44.entities.AGRReport.list('-updated_date'),
  });

  const handleDelete = async (id) => {
    await base44.entities.AGRReport.delete(id);
    queryClient.invalidateQueries({ queryKey: ['agr-reports'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-accent">Annual General Report</h1>
          <p className="text-muted-foreground text-sm mt-1">Build and manage your AGM reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowUpload(true)} className="gap-2">
            <Upload className="w-4 h-4" />Analyze Previous
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />New Report
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">No annual reports yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create a new Annual General Report or analyze a previous year's report to extract its structure.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setShowUpload(true)} className="gap-2">
              <Upload className="w-4 h-4" />Analyze Previous AGR
            </Button>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />New Report
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(report => (
            <div key={report.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
              <Link to={`/reporting/agr/${report.id}/edit`} className="block">
                {report.cover_image ? (
                  <img src={report.cover_image} alt={report.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-accent/30" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-accent group-hover:text-primary transition-colors">{report.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Fiscal Year {report.year}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status] || 'bg-slate-100'}`}>
                      {report.status?.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/reporting/agr/${report.id}/preview`} onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" title="Preview"><Eye className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); e.preventDefault(); handleDelete(report.id); }} title="Delete" className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <CreateReportDialog open={showCreate} onClose={() => setShowCreate(false)} />
      <UploadAnalyzerDialog open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}