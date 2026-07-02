import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Pencil, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/rc/StatusBadge';
import DropInDialog from '@/components/reception/DropInDialog';
import { DROPIN_STATUS_OPTIONS } from '@/lib/receptionConstants';
import { useToast } from '@/components/ui/use-toast';

export default function ReceptionDropIns() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dropIns = [], isLoading } = useQuery({ queryKey: ['reception-dropins'], queryFn: () => base44.entities.DropInVisit.list('-visit_date', 200) });

  const filtered = dropIns.filter(d => (d.visitor_name || '').toLowerCase().includes(search.toLowerCase()) || (d.staff_visited || '').toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (d) => { setEditing(d); setDialogOpen(true); };
  const onSaved = () => { setDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['reception-dropins'] }); };

  const handleCheckOut = async (visit) => {
    try {
      await base44.entities.DropInVisit.update(visit.id, { status: 'checked_out', departure_time: new Date().toTimeString().slice(0, 5) });
      queryClient.invalidateQueries({ queryKey: ['reception-dropins'] });
      toast({ title: `${visit.visitor_name} checked out` });
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-heading font-bold text-foreground">Drop-ins</h1><p className="text-muted-foreground text-sm mt-1">Track walk-in visitors</p></div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New Drop-in</Button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by visitor or staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> :
       filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">{dropIns.length === 0 ? 'No drop-ins recorded.' : 'No drop-ins match your search.'}</CardContent></Card> :
      (
        <div className="space-y-2">
          {filtered.map(d => (
            <Card key={d.id} className="hover:shadow-sm transition-shadow"><CardContent className="p-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm text-foreground truncate">{d.visitor_name}</p><StatusBadge status={d.status} options={DROPIN_STATUS_OPTIONS} /></div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{d.visit_date ? new Date(d.visit_date).toLocaleDateString() : ''}</span>
                  <span>{d.arrival_time}{d.departure_time ? ` → ${d.departure_time}` : ''}</span>
                  {d.staff_visited && <span>Visited: {d.staff_visited}</span>}
                  {d.purpose && <span>{d.purpose}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {d.status === 'checked_in' && <Button size="sm" variant="outline" onClick={() => handleCheckOut(d)}><LogOut className="h-4 w-4" /> Check Out</Button>}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <DropInDialog open={dialogOpen} onOpenChange={setDialogOpen} visit={editing} onSaved={onSaved} />
    </div>
  );
}