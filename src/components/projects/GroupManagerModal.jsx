import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6b7280'];

export default function GroupManagerModal({ onClose }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const { data: groups = [], refetch } = useQuery({
    queryKey: ['projectGroups'],
    queryFn: () => base44.entities.ProjectGroup.list('name'),
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await base44.entities.ProjectGroup.create({ name: newName.trim(), color: newColor, is_active: true });
    setNewName('');
    setNewColor(COLORS[0]);
    refetch();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this group? Projects in it will become ungrouped.')) return;
    await base44.entities.ProjectGroup.delete(id);
    refetch();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {groups.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No groups yet.</p>}
            {groups.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: g.color || '#6b7280' }} />
                <span className="flex-1 text-sm font-medium">{g.name}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(g.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-semibold">Add New Group</Label>
            <Input placeholder="Group name" value={newName} onChange={e => setNewName(e.target.value)} />
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${newColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving || !newName.trim()} className="w-full gap-2">
              <Plus className="h-4 w-4" />Add Group
            </Button>
          </div>
          <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Done</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}