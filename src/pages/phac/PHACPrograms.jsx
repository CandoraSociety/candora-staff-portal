import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ProgramFormDialog from '@/components/phac/ProgramFormDialog';
import StatusBadge from '@/components/phac/StatusBadge';
import { PROGRAM_STATUS_OPTIONS, WEEKDAY_LABELS, formatAgeRange } from '@/lib/phacConstants';

export default function PHACPrograms() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['phac-programs'],
    queryFn: () => base44.entities.PHACProgram.list(),
  });

  const filtered = programs.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (program) => { setEditing(program); setDialogOpen(true); };
  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleSaved = () => { queryClient.invalidateQueries({ queryKey: ['phac-programs'] }); setDialogOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Programs</h1>
          <p className="text-muted-foreground text-sm mt-1">Drop-in programs for families with children 0–6</p>
        </div>
        <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add Program</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {search ? 'No programs found.' : 'No programs yet. Click "Add Program" to get started.'}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                  <StatusBadge status={p.status} options={PROGRAM_STATUS_OPTIONS} />
                  <span className="px-2 py-0.5 bg-muted rounded-full">{formatAgeRange(p.target_age_min_months, p.target_age_max_months)}</span>
                </div>
                {(p.schedule_days?.length > 0 || p.start_time) && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                    {p.schedule_days?.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {p.schedule_days.map(d => WEEKDAY_LABELS[d]?.slice(0, 3)).join(', ')}
                        {p.start_time ? ` · ${p.start_time}${p.end_time ? `–${p.end_time}` : ''}` : ''}
                      </p>
                    )}
                    {p.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {p.location}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProgramFormDialog open={dialogOpen} onOpenChange={setDialogOpen} program={editing} onSaved={handleSaved} />
    </div>
  );
}