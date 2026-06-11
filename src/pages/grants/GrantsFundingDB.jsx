import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Upload, Database, Columns, Bot } from 'lucide-react';
import FundingSourceBlock from '@/components/funding/FundingSourceBlock';
import FundingPipelineKanban from '@/components/funding/FundingPipelineKanban';
import FundingCSVImport from '@/components/funding/FundingCSVImport';
import FundingDatabaseChat from '@/components/funding/FundingDatabaseChat';
import FundingSourceForm from '@/components/funding/FundingSourceForm';

const TYPE_ORDER = ['federal_government','provincial_government','municipal_government','foundation','corporate','individual','other'];
const TYPE_LABELS = {
  federal_government: 'Federal Government',
  provincial_government: 'Provincial Government',
  municipal_government: 'Municipal Government',
  foundation: 'Foundation',
  corporate: 'Corporate',
  individual: 'Individual',
  other: 'Other',
};

export default function GrantsFundingDB() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('database');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRelationship, setFilterRelationship] = useState('');
  const [addingSource, setAddingSource] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: sources = [] } = useQuery({
    queryKey: ['fundingSources'],
    queryFn: () => base44.entities.FundingSource.list('name'),
  });

  const { data: streams = [] } = useQuery({
    queryKey: ['fundingStreams'],
    queryFn: () => base44.entities.FundingStream.list('name'),
  });

  const filteredSources = useMemo(() => {
    return sources.filter(s => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.contact_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType && s.funder_type !== filterType) return false;
      if (filterRelationship && s.relationship_status !== filterRelationship) return false;
      return true;
    });
  }, [sources, search, filterType, filterRelationship]);

  // Group by funder_type in preferred order
  const grouped = useMemo(() => {
    const map = {};
    filteredSources.forEach(s => {
      const key = s.funder_type || 'other';
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [filteredSources]);

  const orderedKeys = TYPE_ORDER.filter(k => grouped[k]?.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Funder Database</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sources.length} funders · {streams.length} streams</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(v => !v)} className="gap-1.5">
            <Upload className="h-4 w-4" />Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddingSource(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />Add Funder
          </Button>
        </div>
      </div>

      {showImport && (
        <div className="border border-border rounded-xl p-4 bg-card">
          <FundingCSVImport onClose={() => setShowImport(false)} />
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="database" className="gap-1.5"><Database className="h-4 w-4" />Database</TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5"><Columns className="h-4 w-4" />Pipeline</TabsTrigger>
          <TabsTrigger value="moneyman" className="gap-1.5"><Bot className="h-4 w-4" />MoneyMan AI</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search funders…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">All Types</option>
              {TYPE_ORDER.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <select value={filterRelationship} onChange={e => setFilterRelationship(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">All Relationships</option>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="lapsed">Lapsed</option>
              <option value="do_not_contact">Do Not Contact</option>
            </select>
          </div>

          {filteredSources.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No funders yet</p>
              <p className="text-sm mt-1">Add your first funder or import from CSV</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orderedKeys.map(typeKey => (
                <div key={typeKey}>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{TYPE_LABELS[typeKey]} ({grouped[typeKey].length})</h2>
                  <div className="space-y-3">
                    {grouped[typeKey].map(source => (
                      <FundingSourceBlock key={source.id} source={source} streams={streams} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <FundingPipelineKanban />
        </TabsContent>

        <TabsContent value="moneyman" className="mt-4">
          <div className="border border-border rounded-xl p-5 bg-card">
            <FundingDatabaseChat />
          </div>
        </TabsContent>
      </Tabs>

      {addingSource && <FundingSourceForm onClose={() => { setAddingSource(false); queryClient.invalidateQueries(['fundingSources']); }} />}
    </div>
  );
}