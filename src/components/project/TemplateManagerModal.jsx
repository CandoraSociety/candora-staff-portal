import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Save, Plus } from 'lucide-react';

export default function TemplateManagerModal({ project, sections, onApply, onClose }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: templates = [], refetch } = useQuery({
    queryKey: ['proposalTemplates'],
    queryFn: () => base44.entities.ProposalTemplate.list('name'),
  });

  const handleSaveCurrent = async () => {
    if (!newName.trim() || sections.length === 0) return;
    setSaving(true);
    await base44.entities.ProposalTemplate.create({
      name: newName.trim(),
      sections: sections.map(s => ({
        section_title: s.section_title,
        section_key: s.section_key,
        word_limit: s.word_limit,
        is_required: s.is_required,
        instructions: s.instructions,
        sort_order: s.sort_order,
      })),
      is_active: true,
    });
    setNewName('');
    refetch();
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;
    await base44.entities.ProposalTemplate.delete(id);
    refetch();
  };

  const handleApply = (template) => {
    if (!confirm(`Apply template "${template.name}"? This will add ${(template.sections || []).length} new sections.`)) return;
    onApply(template.sections || []);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Proposal Templates</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {templates.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No templates saved yet.</p>}
          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{(t.sections || []).length} sections</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleApply(t)}>Apply</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {sections.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Save Current Structure as Template</Label>
            <div className="flex gap-2">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Template name" className="flex-1" />
              <Button onClick={handleSaveCurrent} disabled={saving || !newName.trim()} className="gap-1">
                <Save className="h-4 w-4" />Save
              </Button>
            </div>
          </div>
        )}
        <div className="flex justify-end pt-2"><Button variant="outline" onClick={onClose}>Close</Button></div>
      </DialogContent>
    </Dialog>
  );
}