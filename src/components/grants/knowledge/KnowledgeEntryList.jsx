import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, BookOpen } from 'lucide-react';
import { ENTRY_TYPES, TYPE_LABELS } from '@/lib/grantKnowledgeConstants';
import KnowledgeEntryCard from './KnowledgeEntryCard';

export default function KnowledgeEntryList({
  entries, isLoading, search, onSearchChange, typeFilter, onTypeFilterChange,
  funderFilter, onFunderFilterChange, funders, onEdit, onDelete,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-heading text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Stored Knowledge
          <span className="text-xs font-normal text-muted-foreground">({entries.length})</span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search knowledge..."
              className="h-8 w-52 pl-8 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => onTypeFilterChange(e.target.value)}
            className="h-8 text-sm rounded-md border border-input bg-background px-2"
          >
            <option value="">All types</option>
            {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={funderFilter}
            onChange={e => onFunderFilterChange(e.target.value)}
            className="h-8 text-sm rounded-md border border-input bg-background px-2"
          >
            <option value="">All funders</option>
            {funders.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-fit">
        <button
          onClick={() => onTypeFilterChange('')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${typeFilter === '' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          All ({entries.length})
        </button>
        {ENTRY_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => onTypeFilterChange(typeFilter === t.value ? '' : t.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${typeFilter === t.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {TYPE_LABELS[t.value]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card py-12 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium">Nothing stored yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add notes, paste AI conversations, or import any document — notes, screenshots, reports, grant docs — the portal will remember them all.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <KnowledgeEntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}