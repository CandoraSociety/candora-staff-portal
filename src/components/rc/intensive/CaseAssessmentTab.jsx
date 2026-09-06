import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ASSESSMENT_GROUPS, CONCERN_LEVEL_OPTIONS, CONCERN_LEVEL_COLORS, uid, today } from './caseConstants';

// Comprehensive family assessment — progressive disclosure by section, level-rated
// concern domains, and a preserved history of assessments (never overwritten).
export default function CaseAssessmentTab({ assessments = [], onChange, meName }) {
  const [viewId, setViewId] = useState(null);
  const [openGroups, setOpenGroups] = useState(() => ({ [ASSESSMENT_GROUPS[0].label]: true }));

  const latest = assessments[assessments.length - 1] || null;
  const current = viewId ? assessments.find(a => a.id === viewId) : latest;
  const editable = !!current && current === latest && current.status !== 'final';

  const updateCurrent = (patch) => {
    if (!current) return;
    onChange(assessments.map(a => a.id === current.id ? { ...a, ...patch } : a));
  };

  const setDomain = (key, patch) => {
    updateCurrent({ domains: { ...(current.domains || {}), [key]: { ...(current.domains?.[key] || {}), ...patch } } });
  };

  const startNew = () => {
    const rec = { id: uid(), date: today(), status: 'draft', completed_by_name: meName || '', domains: {} };
    onChange([...assessments, rec]);
    setViewId(null);
  };

  const finalize = () => updateCurrent({ status: 'final', date: today() });

  const toggleGroup = (label) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  if (!current) {
    return (
      <Card><CardContent className="p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">No comprehensive assessment recorded yet.</p>
        <Button onClick={startNew}><Plus className="h-4 w-4" /> Start Comprehensive Assessment</Button>
      </CardContent></Card>
    );
  }

  const domains = current.domains || {};

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {assessments.length > 1 && (
            <Select value={current.id} onValueChange={setViewId}>
              <SelectTrigger className="w-64 h-8 text-xs"><History className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>
                {[...assessments].reverse().map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.date || '—'} — {a.status === 'final' ? 'Final' : 'Draft'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="text-xs text-muted-foreground">
            {current.date || '—'} • {current.status === 'final' ? 'Finalized' : 'Draft'}{current.completed_by_name ? ` • ${current.completed_by_name}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editable && <Button size="sm" variant="outline" onClick={startNew}>New Assessment (reassessment)</Button>}
          {editable && <Button size="sm" onClick={finalize}><CheckCircle2 className="h-4 w-4" /> Finalize</Button>}
        </div>
      </CardContent></Card>

      {ASSESSMENT_GROUPS.map(group => (
        <Collapsible key={group.label} open={!!openGroups[group.label]} onOpenChange={() => toggleGroup(group.label)}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-muted/40">
                <p className="text-sm font-semibold text-foreground">{group.label}</p>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openGroups[group.label] ? '' : '-rotate-90'}`} />
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {(group.fields || []).map(f => {
                  const val = domains[f.key]?.value || '';
                  if (!editable) return val ? (
                    <div key={f.key}>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{f.label}</p>
                      <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{val}</p>
                    </div>
                  ) : null;
                  if (f.type === 'select') {
                    return (
                      <div key={f.key} className="space-y-1.5 max-w-xs">
                        <Label className="text-xs">{f.label}</Label>
                        <Select value={domains[f.key]?.value || 'none'} onValueChange={(v) => setDomain(f.key, { value: v === 'none' ? '' : v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {(f.options || []).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  if (f.type === 'text') {
                    return (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-xs">{f.label}</Label>
                        <Input value={val} onChange={(e) => setDomain(f.key, { value: e.target.value })} />
                      </div>
                    );
                  }
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs">{f.label}</Label>
                      <Textarea rows={3} value={val} onChange={(e) => setDomain(f.key, { value: e.target.value })} />
                    </div>
                  );
                })}
                {(group.domains || []).map(d => {
                  const entry = domains[d.key] || {};
                  const level = entry.level || 'not_assessed';
                  const color = CONCERN_LEVEL_COLORS[level] || '#94a3b8';
                  if (!editable) {
                    if (level === 'not_assessed' && !entry.notes) return null;
                    return (
                      <div key={d.key} className="p-2.5 rounded-md border border-border/50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-foreground">{d.label}</p>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: color + '22', color }}>{CONCERN_LEVEL_OPTIONS.find(o => o.value === level)?.label}</span>
                        </div>
                        {entry.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{entry.notes}</p>}
                      </div>
                    );
                  }
                  return (
                    <div key={d.key} className="p-2.5 rounded-md border border-border/50 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-xs">{d.label}</Label>
                        <Select value={level} onValueChange={(v) => setDomain(d.key, { level: v })}>
                          <SelectTrigger className="h-7 w-52 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONCERN_LEVEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea rows={2} value={entry.notes || ''} onChange={(e) => setDomain(d.key, { notes: e.target.value })} placeholder="Narrative explanation (professional judgement)..." />
                    </div>
                  );
                })}
                {editable && (group.label === 'Worker Summary') && (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox id="duty" checked={false} disabled className="opacity-40" />
                    <Label htmlFor="duty" className="text-[11px] text-muted-foreground font-normal">
                      Immediate safety actions, consultations and duty-to-report follow-ups are recorded in the stage tools, risk factors and history log.
                    </Label>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}