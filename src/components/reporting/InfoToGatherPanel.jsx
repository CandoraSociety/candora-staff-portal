import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronRight, Check, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = {
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50' },
  gathered: { label: 'Gathered', color: 'text-green-600 bg-green-50' },
  not_applicable: { label: 'N/A', color: 'text-gray-500 bg-gray-100' },
};

export default function InfoToGatherPanel({ reportId, sections }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState({});
  const [editValues, setEditValues] = useState({});

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
      target_section_id: '',
      status: 'pending',
      sort_order: items.length,
    });
    setItems(prev => [...prev, created]);
    setEditValues(prev => ({ ...prev, [created.id]: { title: '', details: '', source: '' } }));
    setExpandedId(created.id);
  };

  const handleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      const item = items.find(i => i.id === id);
      setEditValues(prev => ({
        ...prev,
        [id]: {
          title: item?.title || '',
          details: item?.details || '',
          source: item?.source || '',
          target_section_id: item?.target_section_id || '',
          status: item?.status || 'pending',
        },
      }));
      setExpandedId(id);
    }
  };

  const handleSave = async (id) => {
    const vals = editValues[id];
    if (!vals) return;
    setSaving(prev => ({ ...prev, [id]: true }));
    const patch = {
      title: vals.title,
      details: vals.details,
      source: vals.source,
      target_section_id: vals.target_section_id || '',
      status: vals.status,
    };
    await base44.entities.AGRInfoToGather.update(id, patch);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    setSaving(prev => ({ ...prev, [id]: false }));
    setExpandedId(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.AGRInfoToGather.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const getSectionTitle = (sectionId) => {
    if (!sectionId) return null;
    const s = sections.find(s => s.id === sectionId);
    return s?.title || 'Unknown';
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
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg bg-white overflow-hidden">
              {/* Collapsed row */}
              <button
                onClick={() => handleExpand(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
              >
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_OPTIONS[item.status]?.color}`}>
                  {STATUS_OPTIONS[item.status]?.label}
                </span>
                <span className="flex-1 text-sm font-medium truncate">
                  {item.title || 'Untitled'}
                </span>
                {item.target_section_id && getSectionTitle(item.target_section_id) && (
                  <span className="text-[11px] text-muted-foreground truncate max-w-[140px] hidden sm:block">
                    → {getSectionTitle(item.target_section_id)}
                  </span>
                )}
                {expandedId === item.id ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded edit form */}
              {expandedId === item.id && (
                <div className="px-4 pb-4 pt-1 border-t space-y-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">What's Needed</Label>
                    <Input
                      value={editValues[item.id]?.title ?? ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [item.id]: { ...prev[item.id], title: e.target.value } }))}
                      placeholder="e.g. Q3 volunteer hours data"
                      className="text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Details</Label>
                    <Input
                      value={editValues[item.id]?.details ?? ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [item.id]: { ...prev[item.id], details: e.target.value } }))}
                      placeholder="Additional context or specifics"
                      className="text-sm mt-1"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Where to Get It</Label>
                      <Input
                        value={editValues[item.id]?.source ?? ''}
                        onChange={e => setEditValues(prev => ({ ...prev, [item.id]: { ...prev[item.id], source: e.target.value } }))}
                        placeholder="e.g. Sarah from HR"
                        className="text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Target Section</Label>
                      <Select
                        value={editValues[item.id]?.target_section_id || ''}
                        onValueChange={v => setEditValues(prev => ({ ...prev, [item.id]: { ...prev[item.id], target_section_id: v || '' } }))}
                      >
                        <SelectTrigger className="text-sm mt-1 h-9">
                          <SelectValue placeholder="Select section…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">None</SelectItem>
                          {sections.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.title || 'Untitled'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</Label>
                    <Select
                      value={editValues[item.id]?.status || 'pending'}
                      onValueChange={v => setEditValues(prev => ({ ...prev, [item.id]: { ...prev[item.id], status: v } }))}
                    >
                      <SelectTrigger className={`w-[110px] h-7 text-xs border mt-1 ${STATUS_OPTIONS[editValues[item.id]?.status || 'pending']?.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_OPTIONS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleSave(item.id)}
                      disabled={saving[item.id]}
                      className="gap-1"
                    >
                      {saving[item.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(null)}
                      className="text-muted-foreground"
                    >
                      Cancel
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}