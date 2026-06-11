import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check } from 'lucide-react';

const SUGGESTED_SECTIONS = [
  { section_title: 'Executive Summary', section_key: 'executive_summary', word_limit: 500 },
  { section_title: 'Organization Background', section_key: 'org_background', word_limit: 500 },
  { section_title: 'Needs Statement / Problem Statement', section_key: 'needs_statement', word_limit: 750 },
  { section_title: 'Project Description', section_key: 'project_description', word_limit: 1000 },
  { section_title: 'Goals & Objectives', section_key: 'goals_objectives', word_limit: 500 },
  { section_title: 'Target Population', section_key: 'target_population', word_limit: 300 },
  { section_title: 'Activities & Methodology', section_key: 'activities', word_limit: 750 },
  { section_title: 'Expected Outcomes & Evaluation', section_key: 'outcomes_evaluation', word_limit: 500 },
  { section_title: 'Budget Narrative', section_key: 'budget_narrative', word_limit: 500 },
  { section_title: 'Staffing & Capacity', section_key: 'staffing', word_limit: 400 },
  { section_title: 'Partnerships & Collaboration', section_key: 'partnerships', word_limit: 400 },
  { section_title: 'Sustainability Plan', section_key: 'sustainability', word_limit: 400 },
  { section_title: 'Equity & Inclusion', section_key: 'equity_inclusion', word_limit: 400 },
  { section_title: 'Community Impact', section_key: 'community_impact', word_limit: 500 },
  { section_title: 'Letters of Support', section_key: 'letters_support', word_limit: null },
  { section_title: 'Appendices', section_key: 'appendices', word_limit: null },
];

export default function SectionPickerModal({ existingKeys, onAdd, onClose }) {
  const [customTitle, setCustomTitle] = useState('');
  const [customWordLimit, setCustomWordLimit] = useState('');

  const available = SUGGESTED_SECTIONS.filter(s => !existingKeys.includes(s.section_key));

  const handleAddCustom = () => {
    if (!customTitle.trim()) return;
    onAdd({
      section_title: customTitle.trim(),
      section_key: customTitle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      word_limit: customWordLimit ? parseInt(customWordLimit) : null,
    });
    setCustomTitle('');
    setCustomWordLimit('');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Proposal Section</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {available.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">All suggested sections added.</p>}
          {available.map(s => (
            <button
              key={s.section_key}
              onClick={() => onAdd(s)}
              className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-muted transition-colors group"
            >
              <div>
                <p className="text-sm font-medium">{s.section_title}</p>
                {s.word_limit && <p className="text-xs text-muted-foreground">{s.word_limit} word limit</p>}
              </div>
              <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Section</p>
          <div className="flex gap-2">
            <Input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Section title" className="flex-1" />
            <Input value={customWordLimit} onChange={e => setCustomWordLimit(e.target.value)} placeholder="Word limit" className="w-28" type="number" />
            <Button onClick={handleAddCustom} disabled={!customTitle.trim()} className="gap-1"><Plus className="h-4 w-4" />Add</Button>
          </div>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>Close</Button></div>
      </DialogContent>
    </Dialog>
  );
}