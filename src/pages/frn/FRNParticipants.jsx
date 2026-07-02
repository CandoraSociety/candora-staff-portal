import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ParticipantFormDialog from '@/components/frn/ParticipantFormDialog';

export default function FRNParticipants() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['frn-participants'],
    queryFn: () => base44.entities.FRNParticipant.list(),
  });

  const filtered = participants.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (p.email || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = (participant) => { setEditing(participant); setDialogOpen(true); };
  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleSaved = () => { queryClient.invalidateQueries({ queryKey: ['frn-participants'] }); setDialogOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Participants</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage FRN program participants</p>
        </div>
        <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add Participant</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search participants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {search ? 'No participants found.' : 'No participants yet. Click "Add Participant" to get started.'}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">{p.first_name?.[0]}{p.last_name?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{p.first_name} {p.last_name}</p>
                      {p.date_of_birth && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(p.date_of_birth).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {p.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {p.phone}</p>}
                  {p.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {p.email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ParticipantFormDialog open={dialogOpen} onOpenChange={setDialogOpen} participant={editing} onSaved={handleSaved} />
    </div>
  );
}