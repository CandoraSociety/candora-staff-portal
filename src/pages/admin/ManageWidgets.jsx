import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import WidgetFormDialog from '@/components/admin/WidgetFormDialog';

export default function ManageWidgets() {
  const { access } = useOutletContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const queryClient = useQueryClient();

  const { data: widgets = [] } = useQuery({
    queryKey: ['dashboardWidgets'],
    queryFn: () => base44.entities.DashboardWidget.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_enabled }) => base44.entities.DashboardWidget.update(id, { is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('Widget updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DashboardWidget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('Widget deleted');
    },
  });

  if (!access.isAdmin) return <p className="text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            Manage Dashboard Widgets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Control which widgets are available on the dashboard</p>
        </div>
        <Button onClick={() => { setEditingWidget(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Widget
        </Button>
      </div>

      <div className="grid gap-3">
        {widgets.map(widget => (
          <Card key={widget.id} className={`shadow-sm ${!widget.is_enabled ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{widget.name}</p>
                <p className="text-xs text-muted-foreground">{widget.widget_type} • {widget.size || 'medium'}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => toggleMutation.mutate({ id: widget.id, is_enabled: !widget.is_enabled })}>
                  {widget.is_enabled
                    ? <ToggleRight className="w-4 h-4 text-primary" />
                    : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                  }
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => { setEditingWidget(widget); setDialogOpen(true); }}>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => deleteMutation.mutate(widget.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {widgets.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No widgets yet. Click "Add Widget" to create one.</p>
          </div>
        )}
      </div>

      <WidgetFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingWidget={editingWidget} />
    </div>
  );
}