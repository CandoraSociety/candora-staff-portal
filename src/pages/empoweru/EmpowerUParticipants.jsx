import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Phone, Mail, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import ParticipantFormCore from '@/components/empoweru/ParticipantFormCore';

export default function EmpowerUParticipants() {
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading } = useQuery({ queryKey: ['empoweru-participants'], queryFn: () => base44.entities.EmpowerUParticipant.list() });

  const filtered = participants.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) || (p.email || '').toLowerCase().includes(search.toLowerCase()));

  const openEdit = (p) => { setEditForm({ ...p }); setEditOpen(true); };
  const update = (f, v) => setEditForm(prev => ({ ...prev, [f]: v }));

  const handleSaveEdit = async () => {
    try { await base44.entities.EmpowerUParticipant.update(editForm.id, editForm); queryClient.invalidateQueries({ queryKey: ['empoweru-participants'] }); setEditOpen(false); toast({ title: 'Participant updated' }); }
    catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Participants</h1><p className="text-muted-foreground text-sm mt-1">All EmpowerU participants across cohorts</p></div>
        <Link to="/empoweru/intake"><Button><UserPlus className="h-4 w-4" /> New Intake</Button></Link>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{participants.length === 0 ? 'No participants yet.' : 'No matches.'}</CardContent></Card> :
      (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link to={`/empoweru/participants/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><span className="text-primary font-semibold text-sm">{p.first_name?.[0]}{p.last_name?.[0]}</span></div>
                    <div className="min-w-0"><p className="font-medium text-sm text-foreground hover:text-primary truncate">{p.first_name} {p.last_name}</p></div>
                  </Link>
                  <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditOpen(false)}>
          <div className="bg-card rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Edit Participant</h2>
            <ParticipantFormCore form={editForm || {}} update={update} />
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSaveEdit}>Save</Button></div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}