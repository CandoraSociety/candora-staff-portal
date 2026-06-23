import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Lightbulb, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS = {
  'Task': '✓',
  'Project': '◆',
  'Program': '▸',
  'Note': '✎',
  'Priority': '★',
  'Strategic Objective': '◎',
  'KPI': '📊',
  'Grant / Fundraising': '$',
};

const CATEGORY_COLORS = {
  'Task': 'bg-blue-50 text-blue-700 border-blue-200',
  'Project': 'bg-violet-50 text-violet-700 border-violet-200',
  'Program': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Note': 'bg-amber-50 text-amber-700 border-amber-200',
  'Priority': 'bg-rose-50 text-rose-700 border-rose-200',
  'Strategic Objective': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'KPI': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Grant / Fundraising': 'bg-green-50 text-green-700 border-green-200',
};

export default function ActivitySuggestionsPanel({ onAddSuggestion, compact = false }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['user-activity-suggestions'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUserActivitySuggestions', {});
      return res.data;
    },
    staleTime: 60000,
  });

  const suggestions = data?.suggestions || [];

  const categories = useMemo(() => {
    const counts = {};
    suggestions.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [suggestions]);

  const filtered = useMemo(() => {
    let result = suggestions;
    if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [suggestions, search, activeCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground ml-2">Loading your activity...</span>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No suggestions yet. As you create notes, tasks, projects, and priorities, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your activity..."
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-input rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category filters */}
      {!compact && categories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "text-[10px] px-2 py-1 rounded-full border transition",
              activeCategory === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            )}
          >
            All ({suggestions.length})
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full border transition",
                activeCategory === cat
                  ? CATEGORY_COLORS[cat] || 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40'
              )}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Suggestion list */}
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No matches found.</p>
        ) : (
          filtered.map(s => (
            <div
              key={s.id}
              className="group flex items-start gap-2 p-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border font-medium shrink-0", CATEGORY_COLORS[s.category] || 'bg-muted text-muted-foreground border-border')}>
                    {s.category}
                  </span>
                  {s.priority && s.priority !== 'medium' && (
                    <span className={cn(
                      "text-[9px] px-1 py-0.5 rounded font-medium",
                      s.priority === 'high' || s.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      {s.priority}
                    </span>
                  )}
                  {s.status && (
                    <span className="text-[9px] text-muted-foreground">{s.status.replace(/_/g, ' ')}</span>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground leading-snug">{s.title}</p>
                {s.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                )}
              </div>
              <button
                onClick={() => onAddSuggestion(s)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition opacity-0 group-hover:opacity-100"
                title="Add to agenda"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center pt-1">
        {filtered.length} of {suggestions.length} suggestions · scoped to your account only
      </p>
    </div>
  );
}