import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Check } from 'lucide-react';

export default function SetReminderPopover({ projectId }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('deadline');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    await base44.entities.Reminder.create({
      project_id: projectId,
      title: title.trim(),
      remind_at: `${date}T${time}:00`,
      reminder_type: type,
      status: 'pending',
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); setTitle(''); setDate(''); }, 1000);
    setSaving(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Bell className="h-3.5 w-3.5" />Set Reminder
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <p className="font-semibold text-sm mb-3">New Reminder</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Submit final report" className="mt-1 h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full h-8 rounded-md border border-input bg-transparent px-2 text-sm">
              <option value="deadline">Deadline</option>
              <option value="follow_up">Follow Up</option>
              <option value="report_due">Report Due</option>
              <option value="meeting">Meeting</option>
              <option value="renewal">Renewal</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !date} className="w-full h-8 text-sm gap-1.5">
            {saved ? <><Check className="h-3.5 w-3.5" />Saved!</> : saving ? 'Saving…' : <><Bell className="h-3.5 w-3.5" />Create Reminder</>}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}