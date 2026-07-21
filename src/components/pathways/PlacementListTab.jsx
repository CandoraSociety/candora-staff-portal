import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

const PLACEMENT_TYPE_LABELS = {
  cleaning_arc: "Cleaning (ARC)",
  food_services_onsite: "Food Services (Onsite)",
  food_services_offsite: "Food Services (Offsite)",
  reception: "Reception",
  childcare: "Childcare",
};

const STATUS_GROUPS = ["pending", "in_progress", "complete"];
const STATUS_LABELS = { pending: "Pending", in_progress: "In Progress", complete: "Complete" };
const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  complete: "bg-green-100 text-green-700 border-green-200",
};

const fmtDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yy"); } catch { return "—"; }
};

function getInternalStatus(c) {
  const today = new Date();
  if (c.placement_end_date && new Date(c.placement_end_date) < today) return "complete";
  if (c.placement_start_date) return "in_progress";
  return "pending";
}

function getExposureStatus(c) {
  if (c.program_status === "complete") return "complete";
  if (c.job_start_date) return "in_progress";
  return "pending";
}

function normalizePlacementStatus(s) {
  if (s === "completed") return "complete";
  return s || "pending";
}

function ClientRow({ client, type, onClick }) {
  const isInternal = type === "internal_training";
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: "hsl(231,64%,28%)" }}>
        {client.first_name} {client.last_name}
      </td>
      {isInternal ? (
        <>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
            {PLACEMENT_TYPE_LABELS[client.internal_placement] || client.internal_placement || "—"}
          </td>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(client.placement_start_date)}</td>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(client.placement_end_date)}</td>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{client.placement_supervisor || "—"}</td>
        </>
      ) : (
        <>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
            {client.exposure_course && client.paid_external_placement
              ? "Exposure Course + Paid External"
              : client.exposure_course
              ? "Exposure Course"
              : "Paid External Placement"}
          </td>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{client.employer_name || "—"}</td>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{client.job_title || "—"}</td>
          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(client.job_start_date)}</td>
        </>
      )}
      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{client.assigned_worker_name || "—"}</td>
    </tr>
  );
}

function PlacementRow({ placement, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer hover:bg-slate-50 transition-colors"
    >
      <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: "hsl(231,64%,28%)" }}>
        {placement.client_name || "—"}
      </td>
      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">Work Exposure Placement</td>
      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{placement.business_name || "—"}</td>
      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{placement.position_type || "—"}</td>
      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{fmtDate(placement.start_date)}</td>
      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{placement.assigned_worker_name || "—"}</td>
    </tr>
  );
}

export default function PlacementListTab({ clients, type }) {
  const navigate = useNavigate();
  const isInternal = type === "internal_training";
  const [placements, setPlacements] = useState([]);
  const [loadingPlacements, setLoadingPlacements] = useState(false);

  useEffect(() => {
    if (isInternal) return;
    setLoadingPlacements(true);
    base44.entities.WorkExposurePlacement.list("-created_date", 500)
      .then(data => setPlacements(data))
      .catch(() => setPlacements([]))
      .finally(() => setLoadingPlacements(false));
  }, [isInternal]);

  // Client-based exposure entries (from boolean flags on Client)
  const clientFiltered = clients.filter(c => {
    if (isInternal) return c.internal_placement && c.internal_placement !== "none";
    return c.exposure_course || c.paid_external_placement;
  });

  // For work exposure: merge client-based entries with WorkExposurePlacement records
  // Match placements to clients for navigation
  const clientIds = new Set(clients.map(c => c.id));
  const standalonePlacements = isInternal
    ? []
    : placements.filter(p => clientIds.has(p.client_id));

  const getStatus = isInternal ? getInternalStatus : getExposureStatus;
  const getClientStatus = (c) => {
    if (isInternal) return getInternalStatus(c);
    return getExposureStatus(c);
  };

  const grouped = STATUS_GROUPS.map(status => ({
    status,
    clientRows: clientFiltered.filter(c => getClientStatus(c) === status),
    placementRows: standalonePlacements.filter(p => normalizePlacementStatus(p.status) === status),
  }));

  const totalCount = clientFiltered.length + standalonePlacements.length;

  if (totalCount === 0 && !loadingPlacements) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-400">
        No clients with {isInternal ? "internal placements" : "work exposure placements"} yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ status, clientRows, placementRows }) => {
        const groupTotal = clientRows.length + placementRows.length;
        if (groupTotal === 0) return null;
        return (
          <div key={status} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-sm text-slate-500">{groupTotal} entr{groupTotal !== 1 ? "ies" : "y"}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Name</th>
                    {isInternal ? (
                      <>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Placement Type</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Start Date</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">End Date</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Supervisor</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Type</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Business</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Position</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Start Date</th>
                      </>
                    )}
                    <th className="text-left px-3 py-2 font-semibold text-slate-500 whitespace-nowrap">Career Counsellor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientRows.map(c => (
                    <ClientRow
                      key={`c-${c.id}`}
                      client={c}
                      type={type}
                      onClick={() => navigate(`/pathways/client/${c.id}`)}
                    />
                  ))}
                  {placementRows.map(p => (
                    <PlacementRow
                      key={`p-${p.id}`}
                      placement={p}
                      onClick={() => p.client_id && navigate(`/pathways/client/${p.client_id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}