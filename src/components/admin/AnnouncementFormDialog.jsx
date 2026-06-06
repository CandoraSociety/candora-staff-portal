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

const empty = {
  title: '', content: '', priority: 'normal', is_active: true, expires_at: '', target_roles: [],
};

export default function AnnouncementFormDialog({ open, onOpenChange, editing }) {
  const [form, setForm] = useState(empty);
  const queryClient = useQueryClient();

  useEffect(() => {
    setForm(editing ? { ...empty, ...editing } : empty);
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Announcement.update(editing.id, data)
      : base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success(editing ? 'Updated' : 'Created');
      onOpenChange(false);
    },
  });

  const toggleRole = (role) => {
    const roles = form.target_roles || [];
    setForm({
      ...form,
      target_roles: roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expires</Label>
              <Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Target roles (empty = all staff)</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(form.target_roles || []).includes(role.value)}
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
              {mutation.isPending ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}