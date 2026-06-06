import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AnnouncementFormDialog from '@/components/admin/AnnouncementFormDialog';

const priorityColors = {
  urgent: 'bg-destructive/10 text-destructive',
  high: 'bg-accent/10 text-accent-foreground',
  normal: 'bg-primary/10 text-primary',
  low: 'bg-muted text-muted-foreground',
};

export default function Announcements() {
  const { access } = useOutletContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.list('-created_date'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Announcement.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement deleted');
    },
  });

  if (!access.isAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff announcements</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      <div className="grid gap-3">
        {announcements.map(ann => (
          <Card key={ann.id} className={`shadow-sm ${!ann.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${priorityColors[ann.priority] || priorityColors.normal}`}>
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{ann.title}</p>
                <p className="text-xs text-muted-foreground truncate">{ann.content}</p>
              </div>
              <Badge className={`text-[10px] ${priorityColors[ann.priority] || priorityColors.normal}`}>
                {ann.priority || 'normal'}
              </Badge>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => toggleMutation.mutate({ id: ann.id, is_active: !ann.is_active })}>
                  {ann.is_active
                    ? <ToggleRight className="w-4 h-4 text-primary" />
                    : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                  }
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => { setEditing(ann); setDialogOpen(true); }}>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => deleteMutation.mutate(ann.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No announcements yet</div>
        )}
      </div>

      <AnnouncementFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  );
}