import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPLEXITY_OPTIONS } from './caseConstants';

// Case-level details — assigned worker, service dates, complexity and
// required-contact/review dates (surfaced in the workflow sidebar).
export default function CaseDetailsCard({ draft, onChange }) {
  const set = (k, v) => onChange({ [k]: v });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Case Details</CardTitle></CardHeader>
      <CardContent className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Assigned Worker</Label>
          <Input value={draft.assigned_worker || ''} onChange={(e) => set('assigned_worker', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Service Start Date</Label>
          <Input type="date" value={draft.service_start_date || ''} onChange={(e) => set('service_start_date', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Case Complexity</Label>
          <Select value={draft.complexity_level || 'none'} onValueChange={(v) => set('complexity_level', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {COMPLEXITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Next Contact Due</Label>
          <Input type="date" value={draft.next_contact_due || ''} onChange={(e) => set('next_contact_due', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Next Review Due</Label>
          <Input type="date" value={draft.next_review_due || ''} onChange={(e) => set('next_review_due', e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}