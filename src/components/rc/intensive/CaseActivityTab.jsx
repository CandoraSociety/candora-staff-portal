import React from 'react';
import CaseRecordSection from './CaseRecordSection';
import { CONTACT_TYPE_OPTIONS, CONTACT_TYPE_LABELS, INTENSITY_CHANGE_OPTIONS, today } from './caseConstants';

const CONTACT_FIELDS = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'contact_type', label: 'Type of contact / activity', type: 'select', options: CONTACT_TYPE_OPTIONS, full: true },
  { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number' },
  { key: 'location', label: 'Location / modality', type: 'text' },
  { key: 'people_involved', label: 'People involved', type: 'text', full: true },
  { key: 'purpose', label: 'Purpose', type: 'textarea', required: true },
  { key: 'actions_taken', label: 'Actions taken', type: 'textarea' },
  { key: 'participant_response', label: 'Participant response / progress', type: 'textarea' },
  { key: 'risk_changes', label: 'Identified changes in risk or circumstances', type: 'textarea' },
  { key: 'referrals_completed', label: 'Referrals / coordination completed', type: 'textarea' },
  { key: 'next_steps', label: 'Next steps', type: 'textarea' },
  { key: 'created_by_name', label: 'Recorded by', type: 'text' },
];

const REVIEW_FIELDS = [
  { key: 'date', label: 'Review date', type: 'date', required: true },
  { key: 'intensity_change', label: 'Support intensity', type: 'select', options: INTENSITY_CHANGE_OPTIONS },
  { key: 'goals_progress', label: 'Progress toward each goal', type: 'textarea', full: true },
  { key: 'circumstances_changes', label: 'Changes in family circumstances', type: 'textarea', full: true },
  { key: 'needs_changes', label: 'New or resolved needs / barriers', type: 'textarea', full: true },
  { key: 'risk_changes', label: 'Changes in risk or protective factors', type: 'textarea', full: true },
  { key: 'referral_effectiveness', label: 'Effectiveness of referrals / interventions', type: 'textarea', full: true },
  { key: 'participant_feedback', label: 'Participant feedback', type: 'textarea', full: true },
  { key: 'plan_revision_needed', label: 'Goals or the service plan need revision', type: 'checkbox' },
  { key: 'transition_considered', label: 'Transition / closure should be considered', type: 'checkbox' },
  { key: 'next_review_date', label: 'Next review due', type: 'date' },
  { key: 'reviewed_by_name', label: 'Reviewed by', type: 'text' },
];

// Ongoing case management: service activity log + formal service-plan reviews.
export default function CaseActivityTab({
  contacts = [], reviews = [],
  onAddContact, onUpdateContact, onDeleteContact,
  onAddReview, onUpdateReview, onDeleteReview,
  meName,
}) {
  return (
    <div className="space-y-4">
      <CaseRecordSection
        title="Service Activity Log"
        description="One-to-one meetings, visits, calls, coaching, navigation, advocacy, coordination, warm referrals, accompaniment, consultations, contact attempts and crisis response."
        fields={CONTACT_FIELDS}
        records={contacts}
        onAdd={onAddContact}
        onUpdate={onUpdateContact}
        onDelete={onDeleteContact}
        defaults={{ date: today(), created_by_name: meName || '' }}
        titleOf={(r) => `${r.date || '—'} — ${CONTACT_TYPE_LABELS[r.contact_type] || r.contact_type || 'Activity'}`}
      />
      <CaseRecordSection
        title="Formal Reviews"
        description="Formally review the service plan with the caregiver at least monthly during active intensive service."
        fields={REVIEW_FIELDS}
        records={reviews}
        onAdd={onAddReview}
        onUpdate={onUpdateReview}
        onDelete={onDeleteReview}
        defaults={{ date: today(), reviewed_by_name: meName || '' }}
        titleOf={(r) => `Review — ${r.date || '—'}`}
      />
    </div>
  );
}