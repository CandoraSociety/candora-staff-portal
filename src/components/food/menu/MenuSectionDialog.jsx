import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EMPTY = { name: '', description: '', daypart: 'all_day', is_active: true };

export default function MenuSectionDialog({ open, onOpenChange, section, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...(section || {}) });
  }, [open, section]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{section ? 'Edit section' : 'New menu section'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Section name</Label>
            <Input
              value={form.name}
              placeholder="Espresso Bar"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Subtitle (optional)</Label>
            <Input
              value={form.description || ''}
              placeholder="Oat, almond and soy available"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Served</Label>
            <Select value={form.daypart} onValueChange={(v) => setForm({ ...form, daypart: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_day">All day</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Show on the cafe screen
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              disabled={!form.name.trim()}
              onClick={() => onSave({ ...form, name: form.name.trim() })}
            >
              Save section
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}