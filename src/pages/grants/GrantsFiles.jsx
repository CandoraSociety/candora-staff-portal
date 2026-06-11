import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FileText, FolderOpen, ClipboardList, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const FILTERS = [
  { key: 'all', label: 'All Files', icon: FolderOpen },
  { key: 'agreements', label: 'Agreements & Org Docs', icon: FileText },
  { key: 'reports', label: 'Submitted Reports', icon: ClipboardList },
];

const AGREEMENT_TYPES = ['proposal', 'contract', 'amendment', 'correspondence', 'other', 'supporting'];

const DOC_TYPE_LABELS = {
  proposal: 'Proposal', budget: 'Budget', report: 'Report', correspondence: 'Correspondence',
  supporting: 'Supporting', contract: 'Contract', amendment: 'Amendment', other: 'Other',
};

const DOC_TYPE_COLORS = {
  proposal: 'bg-amber-100 text-amber-700',
  budget: 'bg-green-100 text-green-700',
  report: 'bg-blue-100 text-blue-700',
  contract: 'bg-purple-100 text-purple-700',
  correspondence: 'bg-slate-100 text-slate-700',
  supporting: 'bg-gray-100 text-gray-700',
  amendment: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function GrantsFiles() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: projectDocs = [] } = useQuery({
    queryKey: ['project-documents'],
    queryFn: () => base44.entities.ProjectDocument.list('-created_date', 300),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 200),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-created_date', 200),
  });

  const projectMap = useMemo(() => {
    const m = {};
    projects.forEach(p => { m[p.id] = p; });
    return m;
  }, [projects]);

  // Combine project docs + reports with file_url
  const allFiles = useMemo(() => {
    const files = [];

    projectDocs.forEach(doc => {
      files.push({
        id: `pd-${doc.id}`,
        name: doc.name,
        file_url: doc.file_url,
        doc_type: doc.document_type || 'other',
        source: 'project_doc',
        project_id: doc.project_id,
        project_title: projectMap[doc.project_id]?.title || '—',
        date: doc.created_date,
        uploaded_by_name: doc.uploaded_by_name,
        notes: doc.notes,
        is_final: doc.is_final,
      });
    });

    reports.filter(r => r.file_url).forEach(r => {
      files.push({
        id: `rpt-${r.id}`,
        name: r.title,
        file_url: r.file_url,
        doc_type: 'report',
        source: 'report',
        project_id: r.project_id,
        project_title: projectMap[r.project_id]?.title || '—',
        date: r.submitted_date || r.created_date,
        uploaded_by_name: r.assigned_to_name,
        notes: r.notes,
        is_final: r.status === 'submitted' || r.status === 'accepted',
      });
    });

    return files.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [projectDocs, reports, projectMap]);

  const filtered = useMemo(() => {
    let list = allFiles;

    if (filter === 'agreements') {
      list = list.filter(f => AGREEMENT_TYPES.includes(f.doc_type));
    } else if (filter === 'reports') {
      list = list.filter(f => f.doc_type === 'report');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name?.toLowerCase().includes(q) ||
        f.project_title?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allFiles, filter, search]);

  const counts = useMemo(() => ({
    all: allFiles.length,
    agreements: allFiles.filter(f => AGREEMENT_TYPES.includes(f.doc_type)).length,
    reports: allFiles.filter(f => f.doc_type === 'report').length,
  }), [allFiles]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Files</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All project documents and submitted reports</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl border p-4 text-left transition-colors ${filter === key ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${filter === key ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold font-display ${filter === key ? 'text-primary' : 'text-foreground'}`}>{counts[key]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by file name or project…"
          className="pl-9"
        />
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No files found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(file => (
            <Card key={file.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.is_final && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Final</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DOC_TYPE_COLORS[file.doc_type] || 'bg-gray-100 text-gray-700'}`}>
                      {DOC_TYPE_LABELS[file.doc_type] || file.doc_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{file.project_title}</span>
                    {file.date && (
                      <span className="text-xs text-muted-foreground">{format(parseISO(file.date), 'MMM d, yyyy')}</span>
                    )}
                    {file.uploaded_by_name && (
                      <span className="text-xs text-muted-foreground">by {file.uploaded_by_name}</span>
                    )}
                  </div>
                </div>
                {file.file_url && file.file_url !== 'auto-filed' && (
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}