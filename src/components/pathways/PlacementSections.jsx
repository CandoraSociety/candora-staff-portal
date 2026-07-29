import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import CollapsibleSection from './CollapsibleSection';

const PLACEMENT_TYPE_LABELS = {
  cleaning_arc: "Cleaning (ARC)",
  food_services_onsite: "Food Services (Onsite)",
  food_services_offsite: "Food Services (Offsite)",
  reception: "Reception",
  childcare: "Childcare",
};

const PLACEMENT_SUBSECTIONS = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'incomplete_cancelled', label: 'Incomplete/Cancelled' },
  { key: 'not_started', label: 'Not Started' },
];

const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yy"); } catch { return "—"; }
};

function classifyInternalTraining(it) {
  const s = it.status;
  if (s === 'completed') return 'completed';
  if (s === 'active') return 'active';
  if (s === 'withdrawn' || s === 'cancelled') return 'incomplete_cancelled';
  return 'not_started';
}

function classifyWorkExposure(we) {
  const s = we.status;
  if (s === 'completed') return 'completed';
  if (s === 'in_progress') return 'active';
  if (s === 'cancelled') return 'incomplete_cancelled';
  return 'not_started';
}

function classifyClientInternal(c) {
  if (c.placement_end_date && new Date(c.placement_end_date) < new Date()) return 'completed';
  if (c.placement_start_date) return 'active';
  return 'not_started';
}

function classifyClientExposure(c) {
  if (c.program_status === 'complete') return 'completed';
  if (c.job_start_date) return 'active';
  return 'not_started';
}

export default function PlacementSections({ clients, type = 'both' }) {
  const navigate = useNavigate();
  const [internalTrainings, setInternalTrainings] = useState([]);
  const [workExposures, setWorkExposures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches = [
      (type === 'internal' || type === 'both')
        ? base44.entities.InternalTraining.list("-created_date", 500).catch(() => [])
        : Promise.resolve([]),
      (type === 'work_exposure' || type === 'both')
        ? base44.entities.WorkExposurePlacement.list("-created_date", 500).catch(() => [])
        : Promise.resolve([]),
    ];
    Promise.all(fetches).then(([itData, weData]) => {
      setInternalTrainings(itData);
      setWorkExposures(weData);
      setLoading(false);
    });
  }, [type]);

  const clientMap = new Map(clients.map(c => [c.id, c]));
  const clientIds = new Set(clients.map(c => c.id));

  // --- Internal Placements ---
  const internalClients = clients.filter(c => c.internal_placement && c.internal_placement !== 'none');
  const internalRecords = internalTrainings.filter(it => clientIds.has(it.client_id));

  const internalEntries = [];
  const internalClientIdsWithRecord = new Set();
  for (const it of internalRecords) {
    internalClientIdsWithRecord.add(it.client_id);
    const client = clientMap.get(it.client_id);
    internalEntries.push({
      id: it.id,
      client_id: it.client_id,
      client_name: it.client_name || (client ? `${client.first_name} ${client.last_name}` : '—'),
      hsid: client?.compass_hsid,
      placement_location: PLACEMENT_TYPE_LABELS[it.placement_type] || it.placement_type || '—',
      start_date: it.start_date,
      anticipated_completion_date: it.expected_end_date,
      actual_completion_date: it.actual_end_date,
      status: classifyInternalTraining(it),
      reason: it.cancellation_reason,
      source_type: 'internal_training',
    });
  }
  for (const c of internalClients) {
    if (internalClientIdsWithRecord.has(c.id)) continue;
    internalEntries.push({
      id: c.id,
      client_id: c.id,
      client_name: `${c.first_name} ${c.last_name}`,
      hsid: c.compass_hsid,
      placement_location: PLACEMENT_TYPE_LABELS[c.internal_placement] || c.internal_placement || '—',
      start_date: c.placement_start_date,
      anticipated_completion_date: c.placement_end_date,
      actual_completion_date: null,
      status: classifyClientInternal(c),
      reason: null,
      source_type: 'client',
    });
  }

  // --- Work Exposure Placements ---
  const exposureClients = clients.filter(c => c.exposure_course || c.paid_external_placement);
  const exposureRecords = workExposures.filter(we => clientIds.has(we.client_id));

  const exposureEntries = [];
  const exposureClientIdsWithRecord = new Set();
  for (const we of exposureRecords) {
    exposureClientIdsWithRecord.add(we.client_id);
    const client = clientMap.get(we.client_id);
    exposureEntries.push({
      id: we.id,
      client_id: we.client_id,
      client_name: we.client_name || (client ? `${client.first_name} ${client.last_name}` : '—'),
      hsid: client?.compass_hsid,
      placement_location: we.business_name || '—',
      start_date: we.start_date,
      anticipated_completion_date: we.anticipated_completion_date,
      actual_completion_date: null,
      status: classifyWorkExposure(we),
      reason: we.cancellation_reason,
      source_type: 'work_exposure',
    });
  }
  for (const c of exposureClients) {
    if (exposureClientIdsWithRecord.has(c.id)) continue;
    exposureEntries.push({
      id: c.id,
      client_id: c.id,
      client_name: `${c.first_name} ${c.last_name}`,
      hsid: c.compass_hsid,
      placement_location: c.employer_name || '—',
      start_date: c.job_start_date,
      anticipated_completion_date: c.placement_end_date,
      actual_completion_date: null,
      status: classifyClientExposure(c),
      reason: null,
      source_type: 'client',
    });
  }

  // Group by subsection
  const groupInternal = {};
  const groupExposure = {};
  for (const sub of PLACEMENT_SUBSECTIONS) {
    groupInternal[sub.key] = [];
    groupExposure[sub.key] = [];
  }
  for (const e of internalEntries) { if (groupInternal[e.status]) groupInternal[e.status].push(e); }
  for (const e of exposureEntries) { if (groupExposure[e.status]) groupExposure[e.status].push(e); }

  const handleReasonSave = async (entry, value) => {
    if (entry.source_type === 'internal_training') {
      await base44.entities.InternalTraining.update(entry.id, { cancellation_reason: value }).catch(() => {});
    } else if (entry.source_type === 'work_exposure') {
      await base44.entities.WorkExposurePlacement.update(entry.id, { cancellation_reason: value }).catch(() => {});
    }
  };

  const renderPlacementTable = (rows, isIncomplete, headerColor = "#2d5a87") => (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200" style={{ background: headerColor }}>
            <tr>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Placement Location</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Start Date</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Anticipated Completion</th>
              <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Actual Completion</th>
              {isIncomplete && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Reason</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr
                key={`${r.source_type}-${r.id}`}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => navigate(`/pathways/client/${r.client_id}`)}
              >
                <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: "hsl(231,64%,28%)" }}>{r.client_name}</td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{r.hsid || "—"}</td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{r.placement_location}</td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(r.start_date)}</td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(r.anticipated_completion_date)}</td>
                <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(r.actual_completion_date)}</td>
                {isIncomplete && (
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      defaultValue={r.reason || ""}
                      placeholder="Enter reason..."
                      onBlur={e => handleReasonSave(r, e.target.value)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={isIncomplete ? 7 : 6} className="text-center py-6 text-slate-400 text-sm">No entries in this section.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-3 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(type === 'internal' || type === 'both') && (
        <CollapsibleSection title="Internal Placements" count={internalEntries.length} accentColor="#5b7fb8" variant="main" defaultOpen={internalEntries.length > 0}>
          <div className="space-y-2">
            {PLACEMENT_SUBSECTIONS.map(sub => (
              <CollapsibleSection key={sub.key} title={sub.label} count={groupInternal[sub.key]?.length || 0} accentColor="#5b7fb8">
                {renderPlacementTable(groupInternal[sub.key] || [], sub.key === 'incomplete_cancelled', "#5b7fb8")}
              </CollapsibleSection>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {(type === 'work_exposure' || type === 'both') && (
        <CollapsibleSection title="Work Exposure Placements" count={exposureEntries.length} accentColor="#d4a017" variant="main" defaultOpen={exposureEntries.length > 0}>
          <div className="space-y-2">
            {PLACEMENT_SUBSECTIONS.map(sub => (
              <CollapsibleSection key={sub.key} title={sub.label} count={groupExposure[sub.key]?.length || 0} accentColor="#d4a017">
                {renderPlacementTable(groupExposure[sub.key] || [], sub.key === 'incomplete_cancelled', "#d4a017")}
              </CollapsibleSection>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}