import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LayoutDashboard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ManageWidgets() {
  const { access } = useOutletContext();
  const queryClient = useQueryClient();

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['dashboardWidgets'],
    queryFn: () => base44.entities.DashboardWidget.list('-sort_order', 50),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DashboardWidget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success('Widget updated');
    },
  });

  if (!access.isAdmin) return <p className="text-muted-foreground">Access denied</p>;

  const sorted = [...widgets].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          Manage Dashboard Widgets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control which widgets staff can see and enable in their "Add Functions" section.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="grid gap-3">
          {sorted.map(widget => (
            <Card key={widget.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (widget.color || '#6366f1') + '22' }}>
                    <LayoutDashboard className="w-4 h-4" style={{ color: widget.color || '#6366f1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{widget.name}</p>
                      {widget.coming_soon && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Coming Soon</Badge>
                      )}
                      {!widget.is_enabled && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{widget.description}</p>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Required Role</Label>
                      <Select
                        value={widget.required_role || 'any'}
                        onValueChange={(val) => updateMutation.mutate({ id: widget.id, data: { required_role: val } })}
                      >
                        <SelectTrigger className="h-8 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any user</SelectItem>
                          <SelectItem value="admin">Admin only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Show in Add Functions</Label>
                      <Switch
                        checked={!!widget.show_in_add_functions}
                        disabled={!!widget.locked_to_dashboard}
                        onCheckedChange={(val) => updateMutation.mutate({ id: widget.id, data: { show_in_add_functions: val } })}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Label className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Lock to All
                      </Label>
                      <Switch
                        checked={!!widget.locked_to_dashboard}
                        onCheckedChange={(val) => updateMutation.mutate({ id: widget.id, data: { locked_to_dashboard: val, show_in_add_functions: val ? false : widget.show_in_add_functions } })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}