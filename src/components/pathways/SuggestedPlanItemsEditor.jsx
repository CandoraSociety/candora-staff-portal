import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { ACTION_PLAN_CATEGORIES, getAvailablePlanItems } from '@/lib/actionPlanItems';

// Service navigator's suggested action plan items, offered to the career
// counsellor who is assigned the file after the assessment.
export default function SuggestedPlanItemsEditor({ client, onSaved }) {
  const [selected, setSelected] = useState(client?.suggested_plan_items || []);
  const [other, setOther] = useState(client?.suggested_plan_other || '');
  const [notes, setNotes] = useState(client?.suggested_plan_notes || '');
  const [saving, setSaving] = useState(false);

  const items = getAvailablePlanItems(client?.service_type);
  const toggle = (key) =>
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        suggested_plan_items: selected,
        suggested_plan_other: selected.includes('other') ? other : '',
        suggested_plan_notes: notes,
      };
      await base44.entities.Client.update(client.id, updates);
      onSaved?.(updates);
      toast.success('Suggested action plan items saved');
    } catch {
      toast.error('Failed to save suggestions');
    }
    setSaving(false);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700">Suggested Action Plan Items</p>
        <p className="text-xs text-slate-500">
          Optional — anything you tick here appears on the career counsellor's file when they start the action plan.
        </p>
      </div>

      <div className="space-y-3">
        {ACTION_PLAN_CATEGORIES.map(cat => {
          const catItems = items.filter(i => i.category === cat);
          if (!catItems.length) return null;
          return (
            <div key={cat}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{cat}</p>
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                {catItems.map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-primary w-4 h-4"
                      checked={selected.includes(item.key)}
                      onChange={() => toggle(item.key)}
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
              {cat === 'Other' && selected.includes('other') && (
                <Input
                  value={other}
                  onChange={e => setOther(e.target.value)}
                  placeholder="Describe the suggested activity..."
                  className="mt-2 text-sm"
                />
              )}
            </div>
          );
        })}
      </div>

      <div>
        <Label className="mb-1 block text-sm font-medium text-slate-700">Notes for the Career Counsellor</Label>
        <Textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Why these items suit the client, sequencing, and anything the counsellor should know..."
        />
      </div>

      <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Suggestions'}
      </Button>
    </div>
  );
}