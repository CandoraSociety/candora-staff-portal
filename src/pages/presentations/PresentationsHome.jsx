import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Presentation, ExternalLink, Pencil, Trash2, FileText } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/components/presentations/presentationConstants';
import { useToast } from '@/components/ui/use-toast';

export default function PresentationsHome() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: presentations = [], isLoading } = useQuery({
    queryKey: ['presentations'],
    queryFn: () => base44.entities.Presentation.list('-updated_date'),
  });

  const filtered = filter === 'all' ? presentations : presentations.filter(p => p.category === filter);

  const handleDelete = async (id) => {
    if (!confirm('Delete this presentation? This cannot be undone.')) return;
    try {
      await base44.entities.Presentation.delete(id);
      queryClient.invalidateQueries(['presentations']);
      toast({ title: 'Presentation deleted' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const stats = {
    total: presentations.length,
    drafts: presentations.filter(p => p.status === 'draft').length,
    completed: presentations.filter(p => p.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presentations</h1>
          <p className="text-sm text-muted-foreground">Create and export PowerPoint presentations</p>
        </div>
        <Link to="/presentations/editor/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Presentation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Presentations</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.drafts}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Exported</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          All
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Presentation className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-lg font-medium text-foreground">No presentations yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first presentation to get started</p>
          <Link to="/presentations/editor/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Presentation
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: (CATEGORY_COLORS[p.category] || '#6b7280') + '22', color: CATEGORY_COLORS[p.category] || '#6b7280' }}
                  >
                    {CATEGORY_LABELS[p.category] || 'General'}
                  </Badge>
                  {p.status === 'completed' ? (
                    <Badge variant="default" className="text-xs bg-green-600">Exported</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Draft</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{(p.slides || []).length} slides</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{p.title}</h3>
              {p.description && <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{p.description}</p>}
              <div className="flex items-center gap-2 mt-3">
                <Link to={`/presentations/editor/${p.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                </Link>
                {p.sharepoint_file_url && (
                  <a href={p.sharepoint_file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}