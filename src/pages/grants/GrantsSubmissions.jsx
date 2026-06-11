import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, ExternalLink, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function GrantsSubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-submitted'],
    queryFn: async () => {
      const all = await base44.entities.Project.list('-created_date');
      return all.filter(p => ['submitted', 'awarded', 'declined', 'reporting'].includes(p.status));
    },
  });

  const { data: submissionDocs = [] } = useQuery({
    queryKey: ['submissionDocs-all', projects.map(p => p.id).join(',')],
    queryFn: async () => {
      const allDocs = [];
      for (const proj of projects) {
        const docs = await base44.entities.SubmissionDocument.filter({ project_id: proj.id });
        allDocs.push(...docs);
      }
      return allDocs;
    },
    enabled: projects.length > 0,
  });

  const years = useMemo(() => {
    const uniqueYears = new Set(projects.map(p => new Date(p.created_date).getFullYear()));
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [projects]);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const projectYear = new Date(p.created_date).getFullYear();
      const projectMonth = new Date(p.created_date).getMonth();
      if (searchTerm && !p.title?.toLowerCase().includes(searchTerm.toLowerCase()) && !p.funding_source_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedYear && projectYear !== parseInt(selectedYear)) return false;
      if (selectedMonth && projectMonth !== parseInt(selectedMonth)) return false;
      return true;
    });
  }, [projects, searchTerm, selectedYear, selectedMonth, selectedCategory]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-accent">Submissions Archive</h1>
        <p className="text-muted-foreground mt-1">Browse all submitted and awarded proposals</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by project name or funder..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Years</SelectItem>
            {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Months</SelectItem>
            {months.map((month, idx) => <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
          <p className="text-sm">No submissions found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: 'pending',  label: 'Pending Decision', statuses: ['submitted'],           badgeClass: 'bg-accent/10 text-accent' },
            { key: 'awarded',  label: 'Awarded',           statuses: ['awarded', 'reporting'], badgeClass: 'bg-green-100 text-green-700' },
            { key: 'rejected', label: 'Rejected',          statuses: ['declined'],            badgeClass: 'bg-destructive/10 text-destructive' },
          ].map(group => {
            const groupProjects = filteredProjects.filter(p => group.statuses.includes(p.status));
            if (groupProjects.length === 0) return null;
            return (
              <div key={group.key}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-semibold text-base">{group.label}</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${group.badgeClass}`}>{groupProjects.length}</span>
                </div>
                <div className="grid gap-4">
                  {groupProjects.map(project => {
                    const projectDocs = submissionDocs.filter(d => d.project_id === project.id);
                    return (
                      <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base">{project.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {project.funding_source_name && <span className="text-sm text-muted-foreground">{project.funding_source_name}</span>}
                                {project.project_type && <Badge variant="outline" className="text-xs capitalize">{project.project_type.replace(/_/g, ' ')}</Badge>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-muted-foreground">{format(new Date(project.created_date), 'MMM d, yyyy')}</p>
                              {project.amount_awarded && (
                                <p className="font-semibold text-green-700 mt-1">${project.amount_awarded.toLocaleString()}</p>
                              )}
                              {!project.amount_awarded && project.amount_requested && (
                                <p className="text-sm text-muted-foreground mt-1">${project.amount_requested.toLocaleString()} requested</p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {projectDocs.length > 0 && (
                          <CardContent>
                            <p className="text-xs font-medium text-muted-foreground mb-2">{projectDocs.length} Document{projectDocs.length !== 1 ? 's' : ''}</p>
                            <div className="grid gap-1.5">
                              {projectDocs.slice(0, 3).map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate text-xs">{doc.name}</span>
                                  </div>
                                  {doc.file_url && (
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                        <ExternalLink className="w-3 h-3" />
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              ))}
                              {projectDocs.length > 3 && <p className="text-xs text-muted-foreground pl-2">+{projectDocs.length - 3} more</p>}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}