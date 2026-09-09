import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, Plus, Pencil, Phone, Mail, Globe, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ResourceDialog from '@/components/reception/ResourceDialog';
import { RESOURCE_CATEGORY_OPTIONS, RESOURCE_CATEGORY_LABELS, RESOURCE_CATEGORY_COLORS } from '@/lib/receptionConstants';
import { useToast } from '@/components/ui/use-toast';

export default function ReceptionResourceFinder() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [aiCommunity, setAiCommunity] = useState([]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources = [], isLoading } = useQuery({ queryKey: ['directory-resources'], queryFn: () => base44.entities.DirectoryResource.list() });

  const activeResources = resources.filter(r => r.is_active !== false);

  const textFiltered = useMemo(() => {
    return activeResources.filter(r => {
      const matchSearch = !search || (r.name || '').toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase()) || (r.keywords || []).some(k => k.toLowerCase().includes(search.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchCategory && matchType;
    });
  }, [activeResources, search, categoryFilter, typeFilter]);

  const displayList = aiResults ? aiResults.map(id => activeResources.find(r => r.id === id)).filter(Boolean) : textFiltered;

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiSearching(true);
    setAiResults(null);
    setAiCommunity([]);
    setAiReasoning('');
    try {
      const resourceList = activeResources.map(r => ({
        id: r.id, name: r.name, description: r.description, category: r.category,
        type: r.type, keywords: r.keywords, eligibility: r.eligibility_criteria,
        provider: r.provider_organization, cost: r.cost,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a resource navigator for Candora, a community services organization in Edmonton, Alberta, Canada. A receptionist is helping a participant with the following need:\n\n"${aiQuery}"\n\nDo two things:\n\n1. Search the Edmonton Metropolitan Area (Edmonton and surrounding communities like Sherwood Park, St. Albert, Spruce Grove, Leduc, Fort Saskatchewan, Beaumont, Morinville, Stony Plain) for real, currently-available community resources and services that address this need. Prioritize free or low-cost services, non-profits, government programs, 211-listed services and community agencies. For each, include the organization name, what it provides, contact info, address, hours if known, eligibility, and cost.\n\n2. From this list of Candora's own internal/known resources, identify which ones also match:\n${JSON.stringify(resourceList)}\n\nReturn the Edmonton Metro Area community resources (most relevant first, up to 8), the matching internal resource IDs, and a brief explanation of your recommendations.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: "object",
          properties: {
            community_resources: {
              type: "array",
              description: "Real Edmonton Metro Area community resources/services matching the need, ranked by relevance",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Organization/service name" },
                  description: { type: "string", description: "What it provides and why it fits" },
                  category: { type: "string", description: "e.g. Food Security, Housing, Mental Health" },
                  contact_phone: { type: "string", description: "Phone number if known, else empty string" },
                  website: { type: "string", description: "Website URL if known, else empty string" },
                  address: { type: "string", description: "Address if known, else empty string" },
                  hours: { type: "string", description: "Hours of operation if known, else empty string" },
                  eligibility: { type: "string", description: "Eligibility criteria if known, else empty string" },
                  cost: { type: "string", description: "Cost (free, low-cost, etc.) if known, else empty string" }
                },
                required: ["name", "description"]
              }
            },
            internal_matches: { type: "array", items: { type: "string" }, description: "Matching internal resource IDs ranked by relevance" },
            reasoning: { type: "string", description: "Brief explanation of the recommendations" }
          }
        }
      });

      setAiResults(result.internal_matches || []);
      setAiCommunity(result.community_resources || []);
      setAiReasoning(result.reasoning || '');
      if ((!result.internal_matches || result.internal_matches.length === 0) && (!result.community_resources || result.community_resources.length === 0)) {
        toast({ title: 'No matching resources found', description: 'Try rephrasing your query' });
      }
    } catch (err) {
      toast({ title: 'AI search error', description: err.message, variant: 'destructive' });
    } finally {
      setAiSearching(false);
    }
  };

  const clearAiSearch = () => { setAiResults(null); setAiCommunity([]); setAiReasoning(''); setAiQuery(''); };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r) => { setEditing(r); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['directory-resources'] }); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Resource Finder</h1><p className="text-muted-foreground text-sm mt-1">Find internal and external programs &amp; services</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Resource</Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">AI-Powered Search</p>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Describe what the participant needs in plain language — the AI will search Edmonton Metro Area community services and match them to the best resources, including Candora's own.</p>
          <div className="flex gap-2">
            <Input placeholder="e.g. 'A single mother needs help with food and childcare'" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAiSearch(); }} />
            <Button onClick={handleAiSearch} disabled={aiSearching}>{aiSearching ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</> : <><Sparkles className="h-4 w-4" /> Search</>}</Button>
            {aiResults && <Button variant="outline" onClick={clearAiSearch}>Clear</Button>}
          </div>
          {aiReasoning && <p className="text-xs text-muted-foreground mt-2 italic">{aiReasoning}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, description, or keyword..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); clearAiSearch(); }}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All categories" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{RESOURCE_CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); clearAiSearch(); }}><SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All types" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="internal">Internal</SelectItem><SelectItem value="external">External</SelectItem></SelectContent></Select>
      </div>

      {aiSearching && <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching Edmonton Metro Area services...</div>}

      {!aiSearching && aiResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-bold text-foreground">Edmonton Metro Area Resources</h2>
            <span className="text-xs text-muted-foreground">Found via live search</span>
          </div>
          {aiCommunity.length === 0 ? <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No community services found for this query. Try rephrasing it.</CardContent></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiCommunity.map((r, i) => (
                <Card key={i} className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <p className="font-medium text-sm text-foreground">{r.name}</p>
                      {r.category && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{r.category}</span>}
                    </div>
                    {r.description && <p className="text-sm text-muted-foreground mb-2">{r.description}</p>}
                    <div className="space-y-0.5">
                      {r.contact_phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {r.contact_phone}</p>}
                      {r.address && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {r.address}</p>}
                      {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1.5 hover:underline"><Globe className="h-3 w-3" /> {r.website}</a>}
                    </div>
                    {r.hours && <p className="text-xs text-muted-foreground mt-2"><span className="font-medium">Hours:</span> {r.hours}</p>}
                    {r.eligibility && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Eligibility:</span> {r.eligibility}</p>}
                    {r.cost && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Cost:</span> {r.cost}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <h2 className="text-lg font-heading font-bold text-foreground pt-2">Matching Resources in Candora's Directory</h2>
        </div>
      )}

      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       displayList.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{activeResources.length === 0 ? 'No resources yet. Add some to get started.' : aiResults ? 'No directory matches found for this query — see the Edmonton Metro Area results above.' : 'No resources match your filters.'}</CardContent></Card> :
       (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayList.map(r => {
            const cat = RESOURCE_CATEGORY_OPTIONS.find(c => c.value === r.category);
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg">{cat?.icon || '📋'}</span>
                      <div className="min-w-0"><p className="font-medium text-sm text-foreground truncate">{r.name}</p><p className="text-xs text-muted-foreground truncate">{r.provider_organization || (r.type === 'internal' ? 'Candora' : 'External')}</p></div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (RESOURCE_CATEGORY_COLORS[r.category] || '#64748b') + '20', color: RESOURCE_CATEGORY_COLORS[r.category] || '#64748b' }}>{RESOURCE_CATEGORY_LABELS[r.category]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'internal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{r.type === 'internal' ? 'Internal' : 'External'}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{r.description}</p>}
                  <div className="space-y-0.5">
                    {r.contact_phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {r.contact_phone}</p>}
                    {r.contact_email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {r.contact_email}</p>}
                    {r.address && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {r.city ? `${r.address}, ${r.city}` : r.address}</p>}
                    {r.website_url && <a href={r.website_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1.5 hover:underline"><Globe className="h-3 w-3" /> {r.website_url}</a>}
                  </div>
                  {r.eligibility_criteria && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50"><span className="font-medium">Eligibility:</span> {r.eligibility_criteria}</p>}
                  {r.cost && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Cost:</span> {r.cost}</p>}
                  {r.hours && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Hours:</span> {r.hours}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <ResourceDialog open={dialogOpen} onOpenChange={setDialogOpen} resource={editing} onSaved={onSaved} />
    </div>
  );
}