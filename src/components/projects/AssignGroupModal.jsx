import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

export default function AssignGroupModal({ project, groups, onClose }) {
  const [groupId, setGroupId] = useState(project.group_id || '');
  const [tags, setTags] = useState(project.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addTag = (val) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const handleSave = async () => {
    setSaving(true);
    const g = groups.find(x => x.id === groupId);
    await base44.entities.Project.update(project.id, {
      group_id: groupId || null,
      group_name: g?.name || null,
      tags,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Group &amp; Tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Group</Label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">— No group —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {t}
                  <button type="button" onClick={() => removeTag(t)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
                placeholder="Type tag + Enter"
                className="flex-1"
              />
              <Button type="button" size="icon" variant="outline" onClick={() => addTag(tagInput)}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}