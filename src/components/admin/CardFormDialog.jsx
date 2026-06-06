import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CARD_CATEGORIES, ROLES } from '@/lib/constants';

const emptyCard = {
  name: '', description: '', icon: '', category: 'operations',
  url: '', is_external: false, is_enabled: true, sort_order: 0,
  allowed_roles: [], color: '#2a9d8f',
};

export default function CardFormDialog({ open, onOpenChange, editingCard }) {
  const [form, setForm] = useState(emptyCard);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editingCard) {
      setForm({ ...emptyCard, ...editingCard });
    } else {
      setForm(emptyCard);
    }
  }, [editingCard, open]);

  const mutation = useMutation({
    mutationFn: (data) => editingCard
      ? base44.entities.PortalCard.update(editingCard.id, data)
      : base44.entities.PortalCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalCards'] });
      toast.success(editingCard ? 'Card updated' : 'Card created');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const toggleRole = (role) => {
    const roles = form.allowed_roles || [];
    setForm({
      ...form,
      allowed_roles: roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{editingCard ? 'Edit Card' : 'Add Portal Card'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARD_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Accent Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color || '#2a9d8f'}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0" />
                <Input value={form.color || ''} onChange={e => setForm({ ...form, color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>URL</Label>
              <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={form.is_external} onCheckedChange={v => setForm({ ...form, is_external: v })} />
              <Label className="cursor-pointer">Opens externally</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role Access (empty = all roles)</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(form.allowed_roles || []).includes(role.value)}
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
              {mutation.isPending ? 'Saving...' : (editingCard ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}