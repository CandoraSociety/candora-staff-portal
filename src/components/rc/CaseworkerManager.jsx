import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Manages the caseworker list — staff users added here get their personal
// Worker Dashboard in the Central Database portal.
export default function CaseworkerManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pick, setPick] = useState('');

  const { data: caseworkers = [] } = useQuery({ queryKey: ['rc-caseworkers'], queryFn: () => base44.entities.RCCaseworker.list() });
  const { data: users = [], error: usersError } = useQuery({
    queryKey: ['rc-staff-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const available = (users || []).filter(u => !caseworkers.some(c => c.staff_email === u.email));

  const handleAdd = async () => {
    const u = (users || []).find(x => x.id === pick);
    if (!u) return;
    try {
      await base44.entities.RCCaseworker.create({ staff_email: u.email, display_name: u.full_name || u.email, active: true });
      setPick('');
      queryClient.invalidateQueries({ queryKey: ['rc-caseworkers'] });
      toast({ title: 'Caseworker added', description: u.full_name || u.email });
    } catch (err) {
      toast({ title: 'Error adding caseworker', description: err.message, variant: 'destructive' });
    }
  };

  const handleRemove = async (cw) => {
    try {
      await base44.entities.RCCaseworker.delete(cw.id);
      queryClient.invalidateQueries({ queryKey: ['rc-caseworkers'] });
      toast({ title: 'Caseworker removed', description: cw.display_name || cw.staff_email });
    } catch (err) {
      toast({ title: 'Error removing caseworker', description: err.message, variant: 'destructive' });
    }
  };

  const toggleIntensive = (cw, checked) => {
    base44.entities.RCCaseworker.update(cw.id, { intensive_access: checked })
      .then(() => queryClient.invalidateQueries({ queryKey: ['rc-caseworkers'] }))
      .catch(err => toast({ title: 'Error updating permission', description: err.message, variant: 'destructive' }));
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground" /> Caseworkers</p>
        {caseworkers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No caseworkers yet — add staff users below so visits can be routed to their personal dashboards.</p>
        ) : (
          <div className="space-y-1.5">
            {caseworkers.map(cw => (
              <div key={cw.id} className="flex items-center justify-between p-2 rounded-md border border-border/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{cw.display_name || cw.staff_email}</p>
                  <p className="text-xs text-muted-foreground">{cw.staff_email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <Switch checked={!!cw.intensive_access} onCheckedChange={(v) => toggleIntensive(cw, v)} />
                    Intensive casework
                  </label>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemove(cw)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 pt-1 border-t border-border/50">
          <div className="space-y-1.5 flex-1">
            <Label>Add from staff users</Label>
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger><SelectValue placeholder={usersError ? 'Staff list unavailable' : 'Select a staff user...'} /></SelectTrigger>
              <SelectContent>
                {available.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email} ({u.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!pick}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </CardContent>
    </Card>
  );
}