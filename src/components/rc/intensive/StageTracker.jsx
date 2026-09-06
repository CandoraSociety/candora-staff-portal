import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAGE_STATUS_OPTIONS, STAGE_STATUS_COLORS } from './caseConstants';

export default function StageTracker({ stages = [], currentStage, onChange }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {stages.map((s, i) => {
        const color = STAGE_STATUS_COLORS[s.status] || '#94a3b8';
        const isCurrent = s.key === currentStage;
        return (
          <div key={s.key} className="p-3 rounded-lg border" style={{ borderColor: color + '66', backgroundColor: isCurrent ? color + '10' : undefined }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: color }}>{i + 1}</span>
                <p className="text-sm font-medium text-foreground truncate">{s.label}</p>
              </div>
              {isCurrent && <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: color + '22', color }}>Current</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={s.status || 'not_started'} onValueChange={(v) => onChange(i, { status: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGE_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start</Label>
                <Input type="date" className="h-8 text-xs" value={s.start_date || ''} onChange={(e) => onChange(i, { start_date: e.target.value || null })} />
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <Label className="text-xs">Completed</Label>
              <Input type="date" className="h-8 text-xs" value={s.completed_date || ''} onChange={(e) => onChange(i, { completed_date: e.target.value || null })} />
            </div>
            <div className="space-y-1 mt-2">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} className="text-xs" value={s.notes || ''} onChange={(e) => onChange(i, { notes: e.target.value })} placeholder="Stage notes..." />
            </div>
          </div>
        );
      })}
    </div>
  );
}