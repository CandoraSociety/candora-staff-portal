import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { rowsToText, textToRows } from '@/lib/interviewGuides';

// A pipe-separated list, kept as text while typing so the cursor never jumps.
function PipeList({ label, hint, rows, keys, onChange }) {
  const [text, setText] = useState(rowsToText(rows, keys));
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground mb-1">{hint}</p>
      <Textarea
        rows={5}
        value={text}
        onChange={(e) => { setText(e.target.value); onChange(textToRows(e.target.value, keys)); }}
      />
    </div>
  );
}

export default function GuideReferencePanel({ guide, patch }) {
  const blocks = guide.quick_reference || [];

  const updateBlock = (index, changes) => {
    const next = blocks.map((block, i) => (i === index ? { ...block, ...changes } : block));
    patch({ quick_reference: next });
  };

  const removeBlock = (index) => patch({ quick_reference: blocks.filter((_, i) => i !== index) });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Quick-reference blocks</Label>
            <p className="text-xs text-muted-foreground">The scannable summary at the bottom of the guide.</p>
          </div>
          <Button size="sm" variant="outline"
            onClick={() => patch({ quick_reference: [...blocks, { heading: 'New block', items: [] }] })}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add block
          </Button>
        </div>

        {blocks.map((block, index) => (
          <div key={index} className="rounded-xl border p-3 space-y-2">
            <div className="flex gap-2">
              <Input value={block.heading || ''} onChange={(e) => updateBlock(index, { heading: e.target.value })} placeholder="Heading" />
              <Button size="icon" variant="ghost" onClick={() => removeBlock(index)} aria-label="Remove block">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              rows={4}
              value={(block.items || []).join('\n')}
              onChange={(e) => updateBlock(index, { items: e.target.value.split('\n').filter((l) => l.trim()) })}
              placeholder="One line per item"
            />
          </div>
        ))}
      </div>

      <PipeList
        label="Partners and supporters"
        hint="One per line: Partner name | How to acknowledge them"
        rows={guide.partners || []}
        keys={['name', 'note']}
        onChange={(rows) => patch({ partners: rows })}
      />
      <PipeList
        label="Important dates"
        hint="One per line: Date | Event | Location"
        rows={guide.important_dates || []}
        keys={['when', 'event', 'location']}
        onChange={(rows) => patch({ important_dates: rows })}
      />
      <div>
        <Label>Interview reminders</Label>
        <p className="text-xs text-muted-foreground mb-1">One reminder per line.</p>
        <Textarea
          rows={6}
          value={(guide.reminders || []).join('\n')}
          onChange={(e) => patch({ reminders: e.target.value.split('\n').filter((l) => l.trim()) })}
        />
      </div>
      <PipeList
        label="Essential contacts"
        hint="One per line: Label | Value | Link (optional)"
        rows={guide.contacts || []}
        keys={['label', 'value', 'url']}
        onChange={(rows) => patch({ contacts: rows })}
      />
    </div>
  );
}