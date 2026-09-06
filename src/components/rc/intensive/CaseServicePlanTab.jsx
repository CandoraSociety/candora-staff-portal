import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Individualized service plan — developed collaboratively with the caregiver
// (not worker-only). Directly editable; autosaves with the case draft.
export default function CaseServicePlanTab({ plan = {}, onChange }) {
  const set = (k, v) => onChange({ [k]: v });

  const T = ({ k, label, rows = 3 }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={rows} value={plan[k] || ''} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Individualized Service Plan</CardTitle>
        <CardDescription className="text-xs">Developed collaboratively with the caregiver — priorities, planned supports, referrals, frequency and review dates.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Plan developed on</Label>
            <Input type="date" value={plan.developed_date || ''} onChange={(e) => set('developed_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Next formal review</Label>
            <Input type="date" value={plan.target_review_date || ''} onChange={(e) => set('target_review_date', e.target.value)} />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Checkbox id="with-participant" checked={!!plan.developed_with_participant} onCheckedChange={(v) => set('developed_with_participant', !!v)} />
            <Label htmlFor="with-participant" className="text-xs font-normal">This plan was developed collaboratively with the caregiver</Label>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <T k="priorities" label="Participant / family priorities" />
          <T k="strengths" label="Identified strengths & protective factors" />
          <T k="needs_barriers" label="Primary needs / barriers being addressed" />
          <T k="interventions" label="Planned interventions / supports & intended outcomes" />
          <T k="internal_supports" label="Internal Candora supports" />
          <T k="external_referrals" label="External services / referrals" />
          <T k="responsible_person" label="Responsible person / provider for each action" />
          <T k="frequency_intensity" label="Anticipated frequency / intensity of support" />
          <T k="risks_monitoring" label="Risks requiring monitoring" />
          <T k="contingency_actions" label="Contingency / safety actions" />
          <div className="sm:col-span-2"><T k="notes" label="Notes" /></div>
        </div>
      </CardContent>
    </Card>
  );
}