import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, Phone, Mail, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ParticipantFormDialog from '@/components/phac/ParticipantFormDialog';

function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return months;
}

function formatAge(months) {
  if (months == null) return '';
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years}yr` : `${years}yr ${rem}mo`;
}

export default function PHACParticipants() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['phac-participants'],
    queryFn: () => base44.entities.PHACParticipant.list(),
  });

  const filtered = participants.filter(p => {
    const childName = `${p.child_first_name} ${p.child_last_name}`.toLowerCase();
    const parentName = (p.parent_guardian_name || '').toLowerCase();
    const q = search.toLowerCase();
    return childName.includes(q) || parentName.includes(q);
  });

  const handleEdit = (participant) => { setEditing(participant); setDialogOpen(true); };
  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleSaved = () => { queryClient.invalidateQueries({ queryKey: ['phac-participants'] }); setDialogOpen(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Families</h1>
          <p className="text-muted-foreground text-sm mt-1">Registered families and children</p>
        </div>
        <Button onClick={handleAdd}><Plus className="h-4 w-4" /> Add Family</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by child or parent name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {search ? 'No families found.' : 'No families registered yet. Click "Add Family" to get started.'}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => {
            const ageMonths = calculateAge(p.child_date_of_birth);
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                        <Baby className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{p.child_first_name} {p.child_last_name}</p>
                        {ageMonths != null && (
                          <p className="text-xs text-muted-foreground">{formatAge(ageMonths)} old</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {p.parent_guardian_name && (
                    <p className="text-xs text-muted-foreground mb-1">Parent: {p.parent_guardian_name}</p>
                  )}
                  <div className="space-y-1">
                    {p.parent_guardian_phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {p.parent_guardian_phone}</p>
                    )}
                    {p.parent_guardian_email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {p.parent_guardian_email}</p>
                    )}
                  </div>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50 line-clamp-2">{p.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ParticipantFormDialog open={dialogOpen} onOpenChange={setDialogOpen} participant={editing} onSaved={handleSaved} />
    </div>
  );
}