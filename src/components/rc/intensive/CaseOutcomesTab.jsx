import React from 'react';
import CaseRecordSection from './CaseRecordSection';
import { OUTCOME_CATEGORY_OPTIONS, OUTCOME_STAGE_OPTIONS, today } from './caseConstants';

const OUTCOME_FIELDS = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'stage', label: 'Measurement point', type: 'select', options: OUTCOME_STAGE_OPTIONS },
  { key: 'category', label: 'Outcome category', type: 'select', options: OUTCOME_CATEGORY_OPTIONS, full: true },
  { key: 'description', label: 'What was observed / measured', type: 'textarea', required: true },
  { key: 'recorded_by_name', label: 'Recorded by', type: 'text' },
];

// Outcome measurement — baseline, review and closure, so progress can be
// demonstrated over time (individual goals and overall case).
export default function CaseOutcomesTab({ outcomes = [], onAdd, onUpdate, onDelete, meName }) {
  return (
    <div className="space-y-4">
      <CaseRecordSection
        title="Outcome Measurements"
        description="Record outcomes at baseline, review and closure — goal achievement, caregiver capacity, family stability, risk reduction, service connection, and participant-defined outcomes."
        fields={OUTCOME_FIELDS}
        records={outcomes}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        defaults={{ date: today(), recorded_by_name: meName || '' }}
        titleOf={(r) => `${r.date || '—'} — ${OUTCOME_STAGE_OPTIONS.find(s => s.value === r.stage)?.label || ''} ${(OUTCOME_CATEGORY_OPTIONS.find(c => c.value === r.category)?.label || '')}`}
      />
    </div>
  );
}