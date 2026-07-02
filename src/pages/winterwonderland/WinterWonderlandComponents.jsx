import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Mail, MapPin } from 'lucide-react';
import ComponentDialog from '@/components/winterwonderland/ComponentDialog';
import { COMPONENT_TYPE_OPTIONS, COMPONENT_STATUS_OPTIONS } from '@/lib/winterFestivalConstants';
import { useToast } from '@/components/ui/use-toast';

function StatusPill({ status, options }) {
  const opt = options.find(o => o.value === status);
  if (!opt) return null;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: opt.color + '20', color: opt.color }}>{opt.label}</span>;
}

export default function WinterWonderlandComponents() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: festivals } = useQuery({ queryKey: ['winterFestivals'], queryFn: () => base44.entities.WinterFestival.list() });
  const activeFestival = festivals?.filter(f => f.status === 'planning' || f.status === 'active').sort((a, b) => b.year - a.year)[0] || festivals?.[0];

  const { data: components, isLoading } = useQuery({
    queryKey: ['festivalComponents', activeFestival?.id],
    queryFn: () => base44.entities.FestivalComponent.filter({ festival_id: activeFestival.id }),
    enabled: !!activeFestival,
  });

  const filtered = components?.filter(c => typeFilter === 'all' || c.component_type === typeFilter) || [];

  const handleSave = async (data) => {
    try {
      if (editing) {
        await base44.entities.FestivalComponent.update(editing.id, data);
      } else {
        await base44.entities.FestivalComponent.create({ ...data, festival_id: activeFestival.id, festival_year: activeFestival.year });
      }
      qc.invalidateQueries({ queryKey: ['festivalComponents'] });
      toast({ title: editing ? 'Component updated' : 'Component created' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this component?')) return;
    try {
      await base44.entities.FestivalComponent.delete(id);
      qc.invalidateQueries({ queryKey: ['festivalComponents'] });
      toast({ title: 'Component deleted' });
    } catch (e) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  if (!activeFestival) return <Card><CardContent className="pt-6"><p className="text-muted-foreground text-sm">Create a festival first from the Dashboard.</p></CardContent></Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-display font-bold">Festival Components</h1><p className="text-sm text-muted-foreground">{activeFestival.theme || `Winter Wonderland ${activeFestival.year}`}</p></div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{COMPONENT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.icon} {o.label}</SelectItem>)}</SelectContent></Select>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> New Component</Button>
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : filtered.length === 0 ? (
        <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">No components yet. Click "New Component" to add one (Kids Gift Shop, Santa's Village, etc.).</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(comp => {
            const typeOpt = COMPONENT_TYPE_OPTIONS.find(t => t.value === comp.component_type);
            return (
              <Card key={comp.id} className="flex flex-col">
                <CardHeader><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-2xl">{typeOpt?.icon || '❄️'}</span><CardTitle className="text-base">{comp.name}</CardTitle></div><StatusPill status={comp.status} options={COMPONENT_STATUS_OPTIONS} /></div></CardHeader>
                <CardContent className="flex-1 space-y-1.5">
                  <p className="text-sm text-muted-foreground">{comp.description || 'No description'}</p>
                  {comp.lead_name && <p className="text-xs text-muted-foreground flex items-center gap-1">👤 {comp.lead_name}</p>}
                  {comp.lead_email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {comp.lead_email}</p>}
                  {comp.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {comp.location}</p>}
                  {comp.schedule_description && <p className="text-xs text-muted-foreground">🕐 {comp.schedule_description}</p>}
                  <div className="flex gap-2 pt-2"><Button variant="outline" size="sm" onClick={() => { setEditing(comp); setDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button><Button variant="outline" size="sm" onClick={() => handleDelete(comp.id)}><Trash2 className="h-3 w-3" /></Button></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {dialogOpen && <ComponentDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={handleSave} component={editing} />}
    </div>
  );
}