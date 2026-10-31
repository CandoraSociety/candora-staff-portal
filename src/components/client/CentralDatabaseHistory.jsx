import { AlertTriangle, StickyNote, History } from 'lucide-react';
import { SERVICE_TYPE_LABELS, fmtDate } from '@/lib/centralPreviewLabels';

const REASON_LABELS = {
  housing_concerns: 'Housing Concerns',
  financial_assistance: 'Financial / Income Support',
  mental_health_wellbeing: 'Mental Health & Wellbeing',
  family_parenting_support: 'Family & Parenting Support',
  advocacy_navigation: 'Advocacy & System Navigation',
  documentation_id: 'Documentation / ID',
  employment_income: 'Employment & Income',
  settlement_immigration: 'Settlement & Immigration',
  health_medical: 'Health & Medical',
  crisis_safety: 'Crisis / Safety Concerns',
  other: 'Other',
};

// Notes staff have written on the central file, and the most recent services
// the person received at the Resource Centre.
export default function CentralDatabaseHistory({ notes = [], serviceLogs = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
          <StickyNote className="w-3.5 h-3.5" /> Notes on file ({notes.length})
        </h4>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes on the central file.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className={`rounded-lg border p-2.5 ${n.is_safety_alert ? 'border-red-200 bg-red-50' : 'border-border bg-muted/40'}`}>
                {n.is_safety_alert && (
                  <p className="text-[11px] font-bold text-red-700 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3" /> Safety concern
                  </p>
                )}
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {n.is_safety_alert && n.safety_alert_explanation ? n.safety_alert_explanation : n.note}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {[n.created_by_name, fmtDate(n.created_date)].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
          <History className="w-3.5 h-3.5" /> Recent services ({serviceLogs.length})
        </h4>
        {serviceLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services logged in the central database.</p>
        ) : (
          <ul className="space-y-1.5">
            {serviceLogs.map((s) => (
              <li key={s.id} className="rounded-lg border border-border px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {SERVICE_TYPE_LABELS[s.service_type] || s.service_type || 'Service'}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{fmtDate(s.service_date)}</span>
                </div>
                {s.reason_for_visit && (
                  <p className="text-[11px] text-muted-foreground">
                    {s.reason_for_visit === 'other' ? (s.reason_for_visit_other || 'Other') : (REASON_LABELS[s.reason_for_visit] || s.reason_for_visit)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}