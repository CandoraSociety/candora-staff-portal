import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Check, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50' },
  gathered: { label: 'Gathered', color: 'text-green-600 bg-green-50' },
  not_applicable: { label: 'N/A', color: 'text-gray-500 bg-gray-100' },
};

export default function InfoToGatherPanel({ reportId, sections }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    if (reportId) loadItems();
  }, [reportId]);

  const loadItems = async () => {
    setLoading(true);
    const data = await base44.entities.AGRInfoToGather.filter({ report_id: reportId }, 'sort_order');
    setItems(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    const created = await base44.entities.AGRInfoToGather.create({
      report_id: reportId,
      title: '',
      details: '',
      source: '',
      target_section_id: null,
      status: 'pending',
      sort_order: items.length,
    });
    setItems(prev => [...prev, created]);
  };

  const handleUpdate = async (id, patch) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    await base44.entities.AGRInfoToGather.update(id, patch);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    setSaving(prev => ({ ...prev, [id]: false }));
  };

  const handleDelete = async (id) => {
    await base44.entities.AGRInfoToGather.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-base">Information to Gather ({items.length})</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Track what you need before writing — won't appear in the document</p>
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" />Add Item</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 border rounded-xl bg-white">
          <p className="text-sm text-muted-foreground">No items yet. Add items to track the information you need to gather.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg bg-white p-4 space-y-3">
              <div className="flex items-start gap-3">
                <GripVertical className="w-4 h-4 text-slate-300 mt-2 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={item.status}
                      onValueChange={v => handleUpdate(item.id, { status: v })}
                    >
                      <SelectTrigger className={`w-[110px] h-7 text-xs border-0 ${STATUS_OPTIONS[item.status]?.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_OPTIONS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {saving[item.id] && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">What's Needed</Label>
                    <Input
                      value={item.title}
                      onChange={e => handleUpdate(item.id, { title: e.target.value })}
                      placeholder="e.g. Q3 volunteer hours data"
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Details</Label>
                    <Input
                      value={item.details || ''}
                      onChange={e => handleUpdate(item.id, { details: e.target.value })}
                      placeholder="Additional context or specifics"
                      className="text-sm mt-1"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Where to Get It</Label>
                      <Input
                        value={item.source || ''}
                        onChange={e => handleUpdate(item.id, { source: e.target.value })}
                        placeholder="e.g. Sarah from HR, or database export"
                        className="text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Target Section</Label>
                      <Select
                        value={item.target_section_id || ''}
                        onValueChange={v => handleUpdate(item.id, { target_section_id: v || null })}
                      >
                        <SelectTrigger className="text-sm mt-1 h-9">
                          <SelectValue placeholder="Select section…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>None</SelectItem>
                          {sections.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.title || 'Untitled'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}