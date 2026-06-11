import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, Check } from 'lucide-react';

export default function GenerateDocModal({ sections, project, onClose }) {
  const [selected, setSelected] = useState(sections.map(s => s.id));
  const [generating, setGenerating] = useState(false);

  const toggleSection = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExport = async () => {
    setGenerating(true);
    const chosen = sections.filter(s => selected.includes(s.id));
    let text = `${project.title}\n${'='.repeat(project.title.length)}\n\n`;
    chosen.forEach(s => {
      text += `${s.section_title}\n${'-'.repeat(s.section_title.length)}\n`;
      text += (s.content || '[No content yet]') + '\n\n';
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_proposal.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Export Proposal Document</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select sections to include in the export:</p>
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
            {sections.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggleSection(s.id)}
                  className="rounded"
                />
                <span className="text-sm">{s.section_title}</span>
                {s.content && <span className="text-xs text-muted-foreground ml-auto">{s.content.trim().split(/\s+/).length} words</span>}
              </label>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">{selected.length} sections selected</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleExport} disabled={generating || selected.length === 0} className="gap-1.5">
                <FileDown className="h-4 w-4" />{generating ? 'Exporting…' : 'Export .txt'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}