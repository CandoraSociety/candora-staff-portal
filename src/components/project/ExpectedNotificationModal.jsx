import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ExpectedNotificationModal({ project, onClose }) {
  const [date, setDate] = useState(project.expected_notification_date || '');
  const [notes, setNotes] = useState(project.expected_notification_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Project.update(project.id, {
      expected_notification_date: date || null,
      expected_notification_notes: notes || null,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Expected Notification Date</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Expected Decision Date</Label>
            <Input type="text" value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. March 2026 or 2026-03-15" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Can be a date or free text</p>
          </div>
          <div>
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about notification timing..."
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}