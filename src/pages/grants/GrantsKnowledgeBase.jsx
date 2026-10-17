import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import KnowledgeAskPanel from '@/components/grants/knowledge/KnowledgeAskPanel';
import KnowledgeEntryList from '@/components/grants/knowledge/KnowledgeEntryList';
import KnowledgeEntryDialog from '@/components/grants/knowledge/KnowledgeEntryDialog';
import KnowledgeDocImport from '@/components/grants/knowledge/KnowledgeDocImport';

export default function GrantsKnowledgeBase() {
  const qc = useQueryClient();
  const [entryDialog, setEntryDialog] = useState(null); // null closed · {} new · {…} prefilled · {id} edit
  const [docImportOpen, setDocImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [funderFilter, setFunderFilter] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: page, isLoading } = useQuery({
    queryKey: ['grantKnowledge', debouncedSearch, typeFilter, funderFilter],
    queryFn: async () => {
      const query = {};
      if (typeFilter) query.entry_type = typeFilter;
      if (funderFilter) query.related_funder = funderFilter;
      if (debouncedSearch.trim()) {
        const rx = { $regex: debouncedSearch.trim(), $options: 'i' };
        query.$or = [{ title: rx }, { content: rx }, { related_funder: rx }, { tags: rx }];
      }
      return base44.entities.GrantKnowledgeEntry.filter(query, { sort: '-created_date', limit: 200 });
    },
  });
  const entries = page?.items || [];

  const { data: funders = [] } = useQuery({
    queryKey: ['grantKnowledgeFunders'],
    queryFn: async () => {
      const p = await base44.entities.GrantKnowledgeEntry.filter({}, { distinct: 'related_funder' });
      return (p.items || []).filter(Boolean);
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['grantKnowledge'] });
    qc.invalidateQueries({ queryKey: ['grantKnowledgeFunders'] });
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.GrantKnowledgeEntry.delete(id);
      toast.success('Knowledge entry deleted');
      refresh();
    } catch (e) {
      toast.error('Failed to delete the entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The portal's memory for all things grants — dump notes, old documents and AI conversations here, then ask questions and draw from everything later.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDocImportOpen(true)} className="gap-1">
            <FileUp className="w-4 h-4" /> Import Document
          </Button>
          <Button onClick={() => setEntryDialog({})} className="gap-1">
            <Plus className="w-4 h-4" /> Add Knowledge
          </Button>
        </div>
      </div>

      <KnowledgeAskPanel funders={funders} />

      <KnowledgeEntryList
        entries={entries}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        funderFilter={funderFilter}
        onFunderFilterChange={setFunderFilter}
        funders={funders}
        onEdit={(entry) => setEntryDialog(entry)}
        onDelete={handleDelete}
      />

      <KnowledgeEntryDialog
        open={!!entryDialog}
        initial={entryDialog}
        funders={funders}
        onClose={() => setEntryDialog(null)}
        onSaved={refresh}
      />

      <KnowledgeDocImport
        open={docImportOpen}
        onClose={() => setDocImportOpen(false)}
        onExtracted={(prefilled) => {
          setDocImportOpen(false);
          setEntryDialog(prefilled);
        }}
      />
    </div>
  );
}