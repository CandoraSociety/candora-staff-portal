import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CaseRecordSection from './CaseRecordSection';
import { CLOSURE_REASON_OPTIONS, TRANSITION_INDICATORS, today } from './caseConstants';

const FOLLOWUP_FIELDS = [
  { key: 'date', label: 'Follow-up date', type: 'date', required: true },
  { key: 'connected_to_services', label: 'Still connected to planned services/supports?', type: 'select', options: [
    { value: 'yes', label: 'Yes' }, { value: 'partially', label: 'Partially' }, { value: 'no', label: 'No' },
  ] },
  { key: 'referrals_accessed', label: 'Were referrals successfully accessed?', type: 'textarea' },
  { key: 'progress_sustained', label: 'Has progress been sustained?', type: 'textarea' },
  { key: 'new_barriers', label: 'New or recurring barriers / risks', type: 'textarea' },
  { key: 'navigation_needed', label: 'Additional navigation / warm referral needed', type: 'checkbox' },
  { key: 'reassessment_needed', label: 'Circumstances suggest reassessment for additional services', type: 'checkbox' },
  { key: 'participant_feedback', label: 'Participant feedback on the service and transition', type: 'textarea', full: true },
  { key: 'next_steps', label: 'Next steps', type: 'textarea', full: true },
  { key: 'completed_by_name', label: 'Completed by', type: 'text' },
];

// Transition readiness, closure documentation, transition plan and post-service follow-ups.
// Closure of intensive case management does not end the participant's relationship with Candora.
export default function CaseTransitionTab({ transition = {}, followups = [], onTransitionChange, onAddFollowup, onUpdateFollowup, onDeleteFollowup, meName }) {
  const set = (k, v) => onTransitionChange({ [k]: v });
  const indicators = transition.readiness_indicators || [];
  const toggleIndicator = (label) => set('readiness_indicators', indicators.includes(label) ? indicators.filter(l => l !== label) : [...indicators, label]);

  const T = ({ k, label }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={2} value={transition[k] || ''} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Readiness for Transition ({indicators.length} of {TRANSITION_INDICATORS.length} indicators)</CardTitle>
          <CardDescription className="text-xs">Structured readiness review — a case is not closed simply because a period has elapsed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {TRANSITION_INDICATORS.map(label => (
            <div key={label} className="flex items-center gap-2">
              <Checkbox checked={indicators.includes(label)} onCheckedChange={() => toggleIndicator(label)} id={`ind-${label}`} />
              <Label htmlFor={`ind-${label}`} className="text-xs font-normal">{label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Closure</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Primary closure reason</Label>
              <Select value={transition.closure_reason || 'none'} onValueChange={(v) => set('closure_reason', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {CLOSURE_REASON_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Closure date</Label>
              <Input type="date" value={transition.closure_date || ''} onChange={(e) => set('closure_date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Documented rationale for closure <span className="text-destructive">*</span></Label>
            <Textarea rows={3} value={transition.closure_rationale || ''} onChange={(e) => set('closure_rationale', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Supervisor review — name</Label>
              <Input value={transition.supervisor_review_name || ''} onChange={(e) => set('supervisor_review_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Supervisor review date</Label>
              <Input type="date" value={transition.supervisor_review_date || ''} onChange={(e) => set('supervisor_review_date', e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox id="sup-approved" checked={!!transition.supervisor_approved} onCheckedChange={(v) => set('supervisor_approved', !!v)} />
              <Label htmlFor="sup-approved" className="text-xs font-normal flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Supervisor approved</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transition Plan</CardTitle>
          <CardDescription className="text-xs">Completed before closure. The participant may continue with other Candora programs, Resource Worker supports, volunteering or the Candora community.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <T k="goals_achieved_summary" label="Goals achieved & progress made" />
          <T k="remaining_needs" label="Remaining needs or goals" />
          <T k="ongoing_services" label="Ongoing supports / services" />
          <T k="warm_referrals" label="Warm referrals & connections completed" />
          <T k="natural_supports" label="Natural / community supports available" />
          <T k="continued_candora_services" label="Other Candora programs the participant may continue" />
          <T k="caregiver_strategies" label="Strategies the caregiver will continue using" />
          <T k="warning_signs" label="Warning signs — when to seek additional assistance" />
          <T k="reconnection_info" label="How / where to reconnect with Candora or the FRN" />
          <T k="followup_plan" label="Planned post-service follow-up" />
        </CardContent>
      </Card>

      <CaseRecordSection
        title="Post-Service Follow-Ups"
        description="e.g. 30 and 90 days after closure — document sustained connection, progress, barriers and reassessment needs."
        fields={FOLLOWUP_FIELDS}
        records={followups}
        onAdd={onAddFollowup}
        onUpdate={onUpdateFollowup}
        onDelete={onDeleteFollowup}
        defaults={{ date: today(), completed_by_name: meName || '' }}
        titleOf={(r) => `Follow-up — ${r.date || '—'}`}
      />
    </div>
  );
}