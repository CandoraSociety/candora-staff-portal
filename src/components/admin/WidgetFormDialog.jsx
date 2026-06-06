import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ROLES } from '@/lib/constants';

const WIDGET_TYPES = [
  { value: 'welcome', label: 'Welcome Banner' },
  { value: 'quick_links', label: 'Quick Links' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'stats_counter', label: 'Stats Counter' },
  { value: 'calendar_preview', label: 'Calendar Preview' },
  { value: 'recent_activity', label: 'Recent Activity' },
  { value: 'team_directory', label: 'Team Directory' },
  { value: 'custom_html', label: 'Custom HTML' },
];

const emptyWidget = {
  name: '', widget_type: 'welcome', description: '',
  is_enabled: true, default_for_roles: [], size: 'medium',
};

export default function WidgetFormDialog({ open, onOpenChange, editingWidget }) {
  const [form, setForm] = useState(emptyWidget);
  const queryClient = useQueryClient();

  useEffect(() => {
    setForm(editingWidget ? { ...emptyWidget, ...editingWidget } : emptyWidget);
  }, [editingWidget, open]);

  const mutation = useMutation({
    mutationFn: (data) => editingWidget
      ? base44.entities.DashboardWidget.update(editingWidget.id, data)
      : base44.entities.DashboardWidget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardWidgets'] });
      toast.success(editingWidget ? 'Widget updated' : 'Widget created');
      onOpenChange(false);
    },
  });

  const toggleRole = (role) => {
    const roles = form.default_for_roles || [];
    setForm({
      ...form,
      default_for_roles: roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{editingWidget ? 'Edit Widget' : 'Add Widget'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.widget_type} onValueChange={v => setForm({ ...form, widget_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={form.size || 'medium'} onValueChange={v => setForm({ ...form, size: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Default for roles (empty = all)</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(form.default_for_roles || []).includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  {role.label}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (editingWidget ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}