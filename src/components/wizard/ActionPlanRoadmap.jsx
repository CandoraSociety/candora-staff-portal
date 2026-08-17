import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCheck, X, Clock, Circle, Map, CalendarCheck } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import RoadmapItemPanel from './RoadmapItemPanel';
import WorkshopRoadmapPanel from './WorkshopRoadmapPanel';
import BITReviewCheckinPanel from './BITReviewCheckinPanel';
import RoadmapProgressNotes from './RoadmapProgressNotes';
import ProgramStatusPanel from './ProgramStatusPanel';
import UpdateProgramStatusMenu from './UpdateProgramStatusMenu';
import ServiceStartDateEditor from './ServiceStartDateEditor';
import { base44 } from '@/api/base44Client';
import { createCompassTask, scratchCompassTasks, withCrtComments, taskEdaStarted, taskEdaCompleted, taskEdaCancelled, taskBarrierResolved } from '@/lib/compassTasks';
import { WORKSHOP_CATEGORY_KEYS } from '@/lib/workshopSchedule';
import CrtAdditionalComments from './CrtAdditionalComments';

// ─── Item labels ──────────────────────────────────────────────────────────────
const ITEM_LABELS = {
  job_search_workshop: 'Job Search Workshop',
  resume_writing_workshop: 'Resume Writing Workshop',
  interview_skills_workshop: 'Interview Skills Workshop',
  workplace_readiness_workshop: 'Workplace Readiness Workshop',
  financial_literacy_workshop: 'Financial Literacy Workshop',
  digital_literacy_workshop: 'Digital Literacy Workshop',
  empoweru: 'EmpowerU',
  ell_classes: 'ELL Classes',
  skills_assessment: 'Skills Assessment',
  internal_placement: 'Internal Placement',
  exposure_course: 'Exposure Course',
  paid_external_placement: 'Paid External Placement',
  employment_supports: 'Employment Supports',
  job_applications: 'Job Applications',
  networking: 'Networking',
  other: 'Other',
};

const PLACEMENT_TYPE_LABELS = {
  cleaning_arc: 'Cleaning ARC',
  food_services_onsite: 'Food Services (Onsite)',
  food_services_offsite: 'Food Services (Offsite)',
  reception: 'Reception/Admin',
  childcare: 'Childcare',
  program_support: 'Program Support',
  security: 'Security',
};

// ─── Color coding ─────────────────────────────────────────────────────────────
function getItemColor(key) {
  if (key.startsWith('barrier_')) return '#f59e0b';
  if (key === 'internal_placement' || key === 'paid_external_placement') return '#22c55e';
  if (key.includes('workshop') || key === 'empoweru' || key === 'ell_classes' || key === 'skills_assessment') return '#a855f7';
  return '#64748b';
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  planned:   { label: 'Not Started', ring: '#94a3b8', badge: 'bg-slate-100 text-slate-500' },
  started:   { label: 'In Progress', ring: '#3b82f6', badge: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed',   ring: '#22c55e', badge: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled',   ring: '#ef4444', badge: 'bg-red-100 text-red-700' },
};

// ─── Date utilities ───────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

function fmtDate(d) {
  if (!d) return '';
  try { return format(d, 'MMM d, yyyy'); } catch { return ''; }
}

// ─── Build items ──────────────────────────────────────────────────────────────
function buildItems(client, internalTrainings = [], workExposures = [], workshopSignups = [], workshops = []) {
  const roadmapStatus = client?.roadmap_item_status || {};
  const itemDetails = client?.sdp_item_details || {};
  const selectedItems = (client?.sdp_items || []).filter(k => k !== 'barrier_support' && k !== 'internal_placement' && k !== 'paid_external_placement');

  const workshopsById = {};
  workshops.forEach(w => { workshopsById[w.id] = w; });
  const activeSignups = (workshopSignups || []).filter(s => s.status !== 'cancelled');

  const items = selectedItems.map(key => {
    const item = {
      key,
      label: ITEM_LABELS[key] || key.replace(/_/g, ' '),
      color: getItemColor(key),
      detail: itemDetails[key] || {},
      status: roadmapStatus[key]?.status || 'planned',
      statusData: roadmapStatus[key] || {},
      isBarrier: false,
    };
    if (WORKSHOP_CATEGORY_KEYS.includes(key)) {
      const mySups = activeSignups.filter(s => workshopsById[s.workshop_id]?.category === key);
      if (mySups.length) {
        const attended = mySups.some(s => s.status === 'attended');
        const registered = mySups.some(s => s.status === 'registered');
        if (attended) item.status = 'completed';
        else if (registered && item.status === 'planned') item.status = 'started';
        const dates = mySups.map(s => s.session_date).filter(Boolean).sort();
        if (dates.length) {
          item.statusData = { ...item.statusData, started_date: dates[0], completed_date: attended ? dates[dates.length - 1] : undefined };
          item.detail = { ...item.detail, timeline_start: dates[0], timeline_end: dates[dates.length - 1] };
        }
        item.isWorkshopSignup = true;
        item.workshopSignups = mySups;
        item.workshopCategoryKey = key;
      }
    }
    return item;
  });

  for (let n = 1; n <= 3; n++) {
    if (client?.[`barrier_${n}`]) {
      const tl_start = client[`barrier_${n}_timeline_start`];
      const tl_end   = client[`barrier_${n}_timeline_end`];
      const bStatus = client[`barrier_${n}_status`];
      items.push({
        key: `barrier_${n}`,
        label: `Barrier: ${client[`barrier_${n}`]}`,
        color: '#f59e0b',
        isBarrier: true,
        needsFollowupResolution: !!client?.eda_completion_date && bStatus !== 'resolved',
        detail: {
          status: bStatus,
          action_steps: client[`barrier_${n}_action_steps`],
          notes: client[`barrier_${n}_notes`],
          timeline_start: tl_start,
          timeline_end: tl_end,
        },
        status: roadmapStatus[`barrier_${n}`]?.status || 'planned',
        statusData: {
          ...(roadmapStatus[`barrier_${n}`] || {}),
          timeline_start: tl_start,
          timeline_end: tl_end,
        },
      });
    }
  }

  // Add DEA (Employment Development Activity) items
  (client?.dea_activities || []).forEach(activity => {
    if (!activity.type) return;
    items.push({
      key: `dea_${activity.id}`,
      label: activity.type,
      color: '#a855f7',
      isBarrier: false,
      isDEA: true,
      detail: {
        timeline_end: activity.anticipated_end_date,
        notes: activity.notes,
      },
      status: roadmapStatus[`dea_${activity.id}`]?.status || (activity.completed_date ? 'completed' : 'planned'),
      statusData: {
        ...(roadmapStatus[`dea_${activity.id}`] || {}),
        completed_date: activity.completed_date,
      },
    });
  });

  // Internal training placements — actual records with real dates (read-only on timeline)
  internalTrainings.forEach(t => {
    const status = t.status === 'completed' ? 'completed'
      : t.status === 'active' ? 'started'
      : (t.status === 'withdrawn' || t.status === 'cancelled') ? 'cancelled'
      : 'planned';
    items.push({
      key: `it_${t.id}`,
      label: `Internal: ${PLACEMENT_TYPE_LABELS[t.placement_type] || t.placement_type}`,
      color: '#22c55e',
      isBarrier: false,
      detail: { timeline_start: t.start_date, timeline_end: t.expected_end_date, notes: t.training_goals },
      status,
      statusData: {
        timeline_start: t.start_date,
        timeline_end: t.expected_end_date,
        started_date: t.start_date,
        completed_date: t.actual_end_date,
      },
    });
  });

  // Work exposure placements — actual records with real dates (read-only on timeline)
  workExposures.forEach(w => {
    const status = w.status === 'completed' ? 'completed'
      : w.status === 'in_progress' ? 'started'
      : w.status === 'cancelled' ? 'cancelled'
      : 'planned';
    items.push({
      key: `wep_${w.id}`,
      label: `Work Exposure: ${w.business_name}`,
      color: '#22c55e',
      isBarrier: false,
      detail: { timeline_start: w.start_date, timeline_end: w.anticipated_completion_date, notes: w.notes },
      status,
      statusData: {
        timeline_start: w.start_date,
        timeline_end: w.anticipated_completion_date,
        started_date: w.start_date,
        completed_date: w.status === 'completed' ? w.anticipated_completion_date : undefined,
      },
    });
  });

  // Workshop registrations not tied to an sdp item (DEA clients, or general/no-category workshops)
  const sdpSet = new Set(client?.sdp_items || []);
  activeSignups.forEach(s => {
    const ws = workshopsById[s.workshop_id];
    if (!ws) return;
    if (ws.category && ws.category !== 'none' && sdpSet.has(ws.category)) return; // shown via sdp item
    items.push({
      key: `ws_${s.id}`,
      label: ws.title,
      color: ws.color || '#a855f7',
      isBarrier: false,
      isWorkshopSignup: true,
      workshopSignups: [s],
      fixedWorkshop: ws,
      detail: { timeline_start: s.session_date, timeline_end: s.session_date },
      status: s.status === 'attended' ? 'completed' : s.status === 'no_show' ? 'cancelled' : 'started',
      statusData: { started_date: s.session_date, completed_date: s.status === 'attended' ? s.session_date : undefined },
    });
  });

  return items;
}

// ─── CSS animations ───────────────────────────────────────────────────────────
const ANIM_STYLES = `
@keyframes typeShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes completedPulse {
  0%, 100% { opacity: 0.85; }
  50%       { opacity: 1; }
}
`;

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc, onClientUpdate, barrierOnly }) {
  const [view, setView]             = useState('timeline');
  const [openItem, setOpenItem]     = useState(null);
  const [openBITReview, setOpenBITReview] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [internalTrainings, setInternalTrainings] = useState([]);
  const [workExposures, setWorkExposures] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [workshopSignups, setWorkshopSignups] = useState([]);

  const isDEA = client?.service_type === 'direct_to_employment';

  useEffect(() => {
    if (!client?.id) return;
    base44.entities.InternalTraining.filter({ client_id: client.id }, '-created_date')
      .then(setInternalTrainings).catch(() => {});
    base44.entities.WorkExposurePlacement.filter({ client_id: client.id }, '-created_date')
      .then(setWorkExposures).catch(() => {});
    base44.entities.Workshop.list('-created_date').then(setWorkshops).catch(() => {});
    base44.entities.WorkshopSignup.filter({ client_id: client.id }).then(setWorkshopSignups).catch(() => {});
  }, [client?.id]);

  const items = useMemo(() => buildItems(client, internalTrainings, workExposures, workshopSignups, workshops), [client, internalTrainings, workExposures, workshopSignups, workshops]);
  const reloadWorkshops = async () => {
    try {
      const [ws, su] = await Promise.all([
        base44.entities.Workshop.list('-created_date'),
        base44.entities.WorkshopSignup.filter({ client_id: client.id }),
      ]);
      setWorkshops(ws);
      setWorkshopSignups(su);
    } catch {}
  };

  const nonBarrier = items.filter(i => !i.isBarrier);
  const barriers   = items.filter(i => i.isBarrier);
  const renderNonBarrier = barrierOnly ? [] : nonBarrier;
  const renderItems = barrierOnly ? barriers : items;

  // ── Timeline math ──────────────────────────────────────────────────────────
  const intakeDate      = parseDate(client?.intake_date);
  const serviceStart    = parseDate(client?.service_start_date);
  const completionDate  = parseDate(client?.completion_date);
  const followup90Date  = parseDate(client?.followup_90day_date);

  const leftAnchor = intakeDate || serviceStart || new Date();

  const projectedEnd = serviceStart
    ? new Date(serviceStart.getTime() + (isDEA ? 14 : 112) * 86400000)
    : new Date(leftAnchor.getTime() + (isDEA ? 14 : 112) * 86400000);

  const followup90Calc = completionDate
    ? new Date(completionDate.getTime() + 91 * 86400000)
    : null;

  const allItemDates = items.flatMap(i => [
    parseDate(i.statusData?.timeline_start),
    parseDate(i.statusData?.timeline_end),
    parseDate(i.statusData?.started_date),
    parseDate(i.statusData?.completed_date),
    parseDate(i.detail?.timeline_end),
  ]).filter(Boolean);

  const latestItem = allItemDates.length > 0 ? allItemDates.reduce((a, b) => b > a ? b : a) : null;
  const maxDateRaw = [projectedEnd, latestItem, followup90Date, followup90Calc].filter(Boolean).reduce((a, b) => b > a ? b : a, projectedEnd);
  const maxDate    = new Date(maxDateRaw.getTime() + 28 * 86400000);

  const minMs = leftAnchor.getTime() - 14 * 86400000; // 14 days padding before intake/start
  const maxMs = maxDate.getTime();
  const rangeMs = maxMs - minMs;

  const pct = (d) => {
    if (!d) return null;
    return Math.max(0, Math.min(100, ((d.getTime() - minMs) / rangeMs) * 100));
  };

  const todayPct = pct(new Date());

  // ── Milestones ─────────────────────────────────────────────────────────────
  const milestones = [
    { key: 'intake',        date: intakeDate,      label: 'Intake',     color: '#8b5cf6', forcePct: 0 },
    { key: 'service_start', date: serviceStart,    label: 'Start',      color: '#10b981' },
    { key: 'projected_end', date: projectedEnd,    label: 'Proj.End',   color: '#3b82f6', dashed: true },
    { key: 'completion',    date: completionDate,  label: 'End',        color: '#16a34a' },
    { key: 'followup90',    date: followup90Date || followup90Calc, label: '90d', color: '#a855f7' },
  ].filter(m => m.date);

  // Stagger milestone labels vertically to prevent overlap
  const staggeredMilestones = (() => {
    const sorted = milestones.map(m => ({
      ...m,
      p: m.forcePct !== undefined ? m.forcePct : (pct(m.date) ?? 0),
    })).sort((a, b) => a.p - b.p);
    let prevP = -100;
    let prevRow = -1;
    return sorted.map(m => {
      let row = 0;
      if (Math.abs(m.p - prevP) < 14) {
        row = prevRow === 0 ? 1 : 0;
      }
      prevP = m.p;
      prevRow = row;
      return { ...m, row };
    });
  })();

  // ── Month axis ─────────────────────────────────────────────────────────────
  const months = [];
  const cur = startOfMonth(leftAnchor);
  const endM = endOfMonth(maxDate);
  const monthCur = new Date(cur);
  while (monthCur <= endM) {
    months.push(new Date(monthCur));
    monthCur.setMonth(monthCur.getMonth() + 1);
  }

  // ── BIT review dots ────────────────────────────────────────────────────────
  const bitReviewDates = client?.bit_review_dates || [];
  const bitCheckins    = client?.bit_review_checkins || [];

  // ── Items missing dates ────────────────────────────────────────────────────
  const missingDates = (barrierOnly ? barriers : items).filter(i => {
    const hasDates = i.detail?.timeline_start || i.detail?.timeline_end || i.statusData?.timeline_start || i.statusData?.started_date;
    return !hasDates && i.status !== 'cancelled';
  });

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleSaveItem = async (key, saveData) => {
    setSaving(true);
    try {
      // Entity-backed items: Internal Training placement
      if (key.startsWith('it_')) {
        const itemId = key.substring(3);
        const itUpdate = {
          status: saveData.status === 'completed' ? 'completed'
            : saveData.status === 'started' ? 'active'
            : saveData.status === 'cancelled' ? 'cancelled'
            : 'referred',
        };
        if (saveData.startDate) itUpdate.start_date = saveData.startDate;
        if (saveData.endDate) itUpdate.expected_end_date = saveData.endDate;
        if (saveData.status === 'started' && saveData.startedDate) itUpdate.start_date = saveData.startedDate;
        if (saveData.status === 'completed' && saveData.completedDate) itUpdate.actual_end_date = saveData.completedDate;
        await base44.entities.InternalTraining.update(itemId, itUpdate);
        const refreshedIT = await base44.entities.InternalTraining.filter({ client_id: client.id }, '-created_date');
        setInternalTrainings(refreshedIT);
        setOpenItem(null);
        return;
      }
      // Entity-backed items: Work Exposure Placement
      if (key.startsWith('wep_')) {
        const itemId = key.substring(4);
        const wepUpdate = {
          status: saveData.status === 'completed' ? 'completed'
            : saveData.status === 'started' ? 'in_progress'
            : saveData.status === 'cancelled' ? 'cancelled'
            : 'pending',
        };
        if (saveData.startDate) wepUpdate.start_date = saveData.startDate;
        if (saveData.endDate) wepUpdate.anticipated_completion_date = saveData.endDate;
        if (saveData.status === 'started' && saveData.startedDate) wepUpdate.start_date = saveData.startedDate;
        if (saveData.notes !== undefined && saveData.notes !== '') wepUpdate.notes = saveData.notes;
        await base44.entities.WorkExposurePlacement.update(itemId, wepUpdate);
        const refreshedWEP = await base44.entities.WorkExposurePlacement.filter({ client_id: client.id }, '-created_date');
        setWorkExposures(refreshedWEP);
        setOpenItem(null);
        return;
      }

      const oldStatus = client?.roadmap_item_status?.[key]?.status || 'planned';
      const currentStatus = { ...(client?.roadmap_item_status || {}) };
      currentStatus[key] = {
        ...currentStatus[key],
        status: saveData.status,
        started_date: saveData.startedDate || saveData.started_date,
        completed_date: saveData.completedDate || saveData.completed_date,
        case_manager_notes: saveData.notes,
      };

      const extraFields = {};
      const n = key.match(/^barrier_(\d)$/)?.[1];
      if (n) {
        if (saveData.startDate) extraFields[`barrier_${n}_timeline_start`] = saveData.startDate;
        if (saveData.endDate)   extraFields[`barrier_${n}_timeline_end`]   = saveData.endDate;
        const bStatus = saveData.status === 'completed' ? 'resolved' : saveData.status === 'started' ? 'in_progress' : 'unresolved';
        extraFields[`barrier_${n}_status`] = bStatus;
      } else if (key.startsWith('dea_')) {
        // DEA activity — mirror status/notes back into the dea_activities array
        const deaId = key.substring(4);
        const updatedActivities = (client?.dea_activities || []).map(a =>
          a.id === deaId ? {
            ...a,
            completed_date: saveData.completedDate || a.completed_date,
            anticipated_end_date: saveData.endDate || a.anticipated_end_date,
            notes: (saveData.notes !== undefined && saveData.notes !== '') ? saveData.notes : a.notes,
          } : a
        );
        extraFields.dea_activities = updatedActivities;
      } else {
        const details = { ...(client?.sdp_item_details || {}) };
        details[key] = { ...(details[key] || {}) };
        if (saveData.startDate) details[key].timeline_start = saveData.startDate;
        if (saveData.endDate)   details[key].timeline_end   = saveData.endDate;
        extraFields.sdp_item_details = details;
      }

      // Add progress note
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}
      const progressNotes = [...(client?.roadmap_progress_notes || [])];
      if (saveData.status === 'started' || saveData.status === 'completed') {
        progressNotes.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          event_type: saveData.status,
          item_label: items.find(i => i.key === key)?.label || key,
          item_key: key,
          note: saveData.notes || '',
          logged_by: me?.email || '',
          logged_by_name: me?.full_name || '',
          compass_entered: false,
        });
      }

      const updated = await base44.entities.Client.update(client.id, {
        roadmap_item_status: currentStatus,
        roadmap_progress_notes: progressNotes,
        ...extraFields,
      });

      onClientUpdate?.(updated);
      setOpenItem(null);

      // Create Compass tasks based on status change
      const itemLabel = items.find(i => i.key === key)?.label || key;
      const taskBase = {
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: client.compass_hsid || '',
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
      };

      if (n) {
        // Barrier resolved → mark as complete in Compass with notes
        if (oldStatus !== 'completed' && saveData.status === 'completed') {
          await createCompassTask({ ...taskBase, ...withCrtComments(taskBarrierResolved(updated, itemLabel, saveData.notes), updated) });
        }
      } else {
        // EDA started → enter in Compass comments
        if (oldStatus !== 'started' && saveData.status === 'started') {
          await createCompassTask({ ...taskBase, ...withCrtComments(taskEdaStarted(updated, itemLabel, { start_date: saveData.startedDate }), updated) });
        }
        // EDA completed → mark action item as complete in Compass
        if (oldStatus !== 'completed' && saveData.status === 'completed') {
          await createCompassTask({ ...taskBase, ...withCrtComments(taskEdaCompleted(updated, itemLabel, { completion_date: saveData.completedDate }), updated) });
        }
        // EDA cancelled → update in Compass
        if (oldStatus !== 'cancelled' && saveData.status === 'cancelled') {
          await createCompassTask({ ...taskBase, ...withCrtComments(taskEdaCancelled(updated, itemLabel, saveData.notes), updated) });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBITCheckin = async (idx, checkinData) => {
    setSaving(true);
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}
      const checkins = [...(client?.bit_review_checkins || [])];
      checkins[idx] = {
        ...(checkins[idx] || {}),
        ...checkinData,
        index: idx,
        logged_by: me?.email || '',
        logged_by_name: me?.full_name || '',
        logged_at: new Date().toISOString(),
      };
      const updated = await base44.entities.Client.update(client.id, { bit_review_checkins: checkins });
      onClientUpdate?.(updated);
      setOpenBITReview(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  const hasItems = items.length > 0;
  if (barrierOnly) {
    if (barriers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Map className="w-10 h-10 opacity-30" />
          <p className="text-sm">No barriers have been identified for this client yet.</p>
        </div>
      );
    }
  } else if (!client?.action_plan_submitted || !hasItems) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Map className="w-10 h-10 opacity-30" />
          <p className="text-sm">No action plan submitted yet. Complete Step 3 to generate the roadmap.</p>
        </div>
        {(client?.roadmap_progress_notes || []).length > 0 && (
          <RoadmapProgressNotes
            notes={client.roadmap_progress_notes}
            clientId={client.id}
            onNotesUpdate={async (notes) => {
              const updated = await base44.entities.Client.update(client.id, { roadmap_progress_notes: notes });
              onClientUpdate?.(updated);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{ANIM_STYLES}</style>

      {/* Click-outside backdrop — closes item/BIT panels */}
      {(openItem !== null || openBITReview !== null) && (
        <div className="fixed inset-0 z-30" onClick={() => { setOpenItem(null); setOpenBITReview(null); }} />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
        {!barrierOnly && <ProgramStatusPanel client={client} onClientUpdate={onClientUpdate} />}
      </div>

      {/* Editable program start date — visible in all views */}
      {!barrierOnly && (
        <div className="flex items-center gap-2 text-xs">
          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500">Program Start:</span>
          <ServiceStartDateEditor client={client} onClientUpdate={onClientUpdate} />
          {client?.service_start_date && (
            <span className="text-slate-400 text-[10px]">(click to edit — adjusts anticipated dates)</span>
          )}
        </div>
      )}

      {/* ── TIMELINE VIEW ─────────────────────────────────────────────────── */}
      {view === 'timeline' && (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 700 }}>
              {/* Month axis */}
              <div className="flex ml-40 border-b border-slate-200 mb-1">
                {months.map((m, i) => {
                  const leftP = pct(m) ?? 0;
                  const nextM = new Date(m); nextM.setMonth(nextM.getMonth() + 1);
                  const w = Math.max(0, (pct(nextM) ?? 100) - leftP);
                  return (
                    <div key={i} className="text-[10px] text-slate-400 px-1 shrink-0" style={{ width: `${w}%` }}>
                      {format(m, 'MMM yy')}
                    </div>
                  );
                })}
              </div>

              {/* Milestone label row */}
              <div className="relative ml-40 h-10 mb-1">
                {staggeredMilestones.map(m => (
                  <span
                    key={m.key}
                    className="absolute text-[10px] font-semibold -translate-x-1/2 cursor-default select-none whitespace-nowrap"
                    style={{ left: `${m.p}%`, color: m.color, top: m.row === 0 ? 0 : 15 }}
                    title={fmtDate(m.date)}
                  >
                    ▼ {m.label}
                  </span>
                ))}
              </div>

              {/* Chart area */}
              <div className="relative ml-40">
                {/* Milestone lines */}
                {milestones.map(m => {
                  const p = m.forcePct !== undefined ? m.forcePct : (pct(m.date) ?? 0);
                  return (
                    <div
                      key={m.key}
                      className="absolute top-0 bottom-0 w-px pointer-events-none"
                      style={{
                        left: `${p}%`,
                        borderLeft: m.dashed ? `1px dashed ${m.color}` : `1px solid ${m.color}`,
                        opacity: 0.6,
                      }}
                    />
                  );
                })}

                {/* Today line */}
                {todayPct !== null && todayPct >= 0 && todayPct <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-[2px] z-10 pointer-events-none"
                    style={{ left: `calc(${todayPct}% + 4px)`, backgroundColor: '#fbbf24' }}
                  />
                )}

                {/* Action plan items */}
                {renderNonBarrier.length > 0 && (
                  <div className="text-[9px] font-bold text-slate-500 tracking-widest mb-0.5 -ml-40 pl-1">ACTION PLAN ITEMS</div>
                )}
                {renderNonBarrier.map(item => (
                  <ItemRow key={item.key} item={item} pct={pct} openItem={openItem} setOpenItem={setOpenItem} onSave={handleSaveItem} saving={saving} projectedEndDate={projectedEnd} serviceStartDate={serviceStart} client={client} workshops={workshops} workshopSignups={workshopSignups} reloadWorkshops={reloadWorkshops} onClientUpdate={onClientUpdate} />
                ))}

                {/* Barrier section */}
                {barriers.length > 0 && (
                  <>
                    <div className="h-px bg-amber-300 my-1" />
                    <div className="text-[9px] font-bold text-amber-600 tracking-widest mb-0.5 -ml-40 pl-1">BARRIERS</div>
                    {barriers.map(item => (
                      <ItemRow key={item.key} item={item} pct={pct} openItem={openItem} setOpenItem={setOpenItem} onSave={handleSaveItem} saving={saving} projectedEndDate={projectedEnd} serviceStartDate={serviceStart} client={client} workshops={workshops} workshopSignups={workshopSignups} reloadWorkshops={reloadWorkshops} onClientUpdate={onClientUpdate} />
                    ))}
                  </>
                )}

                {/* BIT reviews row */}
                {bitReviewDates.length > 0 && (
                  <div className="relative h-8 flex items-center mb-1">
                    <div className="absolute -ml-40 w-40 pr-2 text-[11px] text-right font-medium text-rose-600">BIT Reviews</div>
                    <div className="w-full h-6 rounded-md relative" style={{ backgroundColor: '#f8fafc', outline: '1px solid #e2e8f0' }}>
                      {bitReviewDates.map((dateStr, idx) => {
                        const d = parseDate(dateStr);
                        const p = pct(d);
                        if (p === null) return null;
                        const checkin = bitCheckins[idx];
                        const done = checkin?.completed;
                        return (
                          <button
                            key={idx}
                            className="absolute top-0.5 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center text-[9px] font-bold text-white z-10"
                            style={{ left: `${p}%`, backgroundColor: done ? '#4ade80' : '#f87171' }}
                            onClick={() => setOpenBITReview(openBITReview === idx ? null : idx)}
                            title={`BIT Review ${idx + 1} — ${done ? 'Completed' : 'Pending'}`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BIT checkin panel */}
                {openBITReview !== null && (
                  <div className="mb-2 relative z-40">
                    <BITReviewCheckinPanel
                      reviewIndex={openBITReview}
                      scheduledDate={bitReviewDates[openBITReview]}
                      checkin={bitCheckins[openBITReview]}
                      clientId={client.id}
                      onSave={(data) => handleSaveBITCheckin(openBITReview, data)}
                      onCancel={() => setOpenBITReview(null)}
                      saving={saving}
                    />
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 ml-40 mt-3 text-[10px] text-slate-500">
                {[['#f59e0b','Barrier'],['#22c55e','Placement'],['#a855f7','Workshops/Programs'],['#64748b','Other'],['#fbbf24','Today']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Items missing dates */}
          {missingDates.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-amber-800 mb-2">Items need dates:</div>
              <div className="flex flex-wrap gap-2">
                {missingDates.map(item => {
                  const cfg = STATUS_CFG[item.status] || STATUS_CFG.planned;
                  return (
                    <button
                      key={item.key}
                      className="text-xs px-2 py-1 rounded border flex items-center gap-1"
                      style={{ borderColor: cfg.ring, color: cfg.ring }}
                      onClick={() => setOpenItem(openItem === item.key ? null : item.key)}
                    >
                      + Add dates — {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="space-y-2">
          {renderNonBarrier.length > 0 && (
            <div className="text-xs font-bold text-slate-500 tracking-widest mb-1">ACTION PLAN ITEMS</div>
          )}
          {renderNonBarrier.map(item => (
            <ListItem key={item.key} item={item} openItem={openItem} setOpenItem={setOpenItem} onSave={handleSaveItem} saving={saving} projectedEndDate={projectedEnd} serviceStartDate={serviceStart} client={client} workshops={workshops} workshopSignups={workshopSignups} reloadWorkshops={reloadWorkshops} onClientUpdate={onClientUpdate} />
          ))}
          {barriers.length > 0 && (
            <>
              <div className="text-xs font-bold text-amber-600 tracking-widest mt-3 mb-1">BARRIERS</div>
              {barriers.map(item => (
                <ListItem key={item.key} item={item} openItem={openItem} setOpenItem={setOpenItem} onSave={handleSaveItem} saving={saving} projectedEndDate={projectedEnd} serviceStartDate={serviceStart} client={client} workshops={workshops} workshopSignups={workshopSignups} reloadWorkshops={reloadWorkshops} onClientUpdate={onClientUpdate} />
              ))}
            </>
          )}
          {bitReviewDates.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-bold text-rose-600 tracking-widest">BIT REVIEWS</div>
              {bitReviewDates.map((dateStr, idx) => {
                const checkin = bitCheckins[idx];
                const done = checkin?.completed;
                return (
                  <div key={idx}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm flex items-center justify-between ${done ? 'border-green-300 bg-green-50' : 'border-rose-200 bg-rose-50'}`}
                      onClick={() => setOpenBITReview(openBITReview === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarCheck className={`w-4 h-4 ${done ? 'text-green-600' : 'text-rose-500'}`} />
                        <span>BIT Review {idx + 1}</span>
                        <span className="text-xs text-muted-foreground">— scheduled: {dateStr}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${done ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>{done ? 'Completed' : 'Pending'}</span>
                    </button>
                    {openBITReview === idx && (
                      <div className="mt-1 relative z-40">
                        <BITReviewCheckinPanel
                          reviewIndex={idx}
                          scheduledDate={dateStr}
                          checkin={checkin}
                          clientId={client.id}
                          onSave={(data) => handleSaveBITCheckin(idx, data)}
                          onCancel={() => setOpenBITReview(null)}
                          saving={saving}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR VIEW ─────────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div>
          <div className="text-sm font-semibold text-slate-600 mb-2">{format(new Date(), 'MMMM yyyy')}</div>
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="bg-slate-100 text-[10px] font-semibold text-center py-1 text-slate-500">{d}</div>
            ))}
            {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(day => {
              const isToday = isSameDay(day, new Date());
              const dayItems = renderItems.filter(item => {
                const s = parseDate(item.statusData?.started_date);
                const e = parseDate(item.statusData?.completed_date);
                const deadline = parseDate(item.detail?.timeline_end);
                if (s && e) return isWithinInterval(day, { start: s, end: e });
                if (s) return isSameDay(day, s);
                if (deadline) return isSameDay(day, deadline);
                return false;
              });
              const bitDays = bitReviewDates.filter(dr => isSameDay(day, parseDate(dr)));
              return (
                <div key={day.toISOString()} className={`bg-white min-h-[80px] p-1 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="text-[10px] font-semibold mb-0.5 text-slate-600">{format(day, 'd')}</div>
                  {dayItems.slice(0, 3).map(item => {
                    const cfg = STATUS_CFG[item.status] || STATUS_CFG.planned;
                    const needsRes = item.needsFollowupResolution;
                    return (
                      <div key={item.key}>
                        <button
                          onClick={() => setOpenItem(item.key)}
                          className={`text-[9px] px-1 py-px rounded truncate mb-px w-full text-left ${needsRes ? 'animate-pulse' : ''}`}
                          style={{
                            backgroundColor: needsRes ? '#fee2e2' : item.color + '33',
                            borderLeft: `2px solid ${needsRes ? '#dc2626' : cfg.ring}`,
                            color: needsRes ? '#dc2626' : item.color,
                          }}
                        >
                          {item.label}
                        </button>
                        {needsRes && (
                          <div className="text-[8px] text-red-600 leading-tight mb-px">Resolve before 90-day follow-up</div>
                        )}
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && <div className="text-[9px] text-muted-foreground">+{dayItems.length - 3}</div>}
                  {bitDays.map((_, i) => (
                    <div key={i} className="text-[9px] px-1 py-px rounded bg-rose-100 text-rose-700">BIT {bitReviewDates.indexOf(bitDays[i]) + 1}</div>
                  ))}
                </div>
              );
            })}
          </div>

          {openItem && (() => {
            const it = renderItems.find(i => i.key === openItem);
            if (!it) return null;
            return (
              <div className="mt-3 relative z-40">
                {it.isWorkshopSignup ? (
                  <WorkshopRoadmapPanel client={client} item={it} workshops={workshops} signups={workshopSignups} onReload={reloadWorkshops} onClientUpdate={onClientUpdate} onClose={() => setOpenItem(null)} />
                ) : (
                  <RoadmapItemPanel item={it} currentStatus={it.status} onSave={(data) => handleSaveItem(it.key, data)} onCancel={() => setOpenItem(null)} saving={saving} projectedEndDate={projectedEnd} serviceStartDate={serviceStart} />
                )}
              </div>
            );
          })()}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500">
            {[['#f59e0b','Barriers'],['#22c55e','Placement'],['#a855f7','Workshops'],['#64748b','Other']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: c }} />{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Update Program/Activities Status menu */}
      {!barrierOnly && <UpdateProgramStatusMenu client={client} onClientUpdate={onClientUpdate} />}

      {/* Additional CRT Comments (Column S) — sits underneath the status menu */}
      {!barrierOnly && <CrtAdditionalComments client={client} onClientUpdate={onClientUpdate} />}

      {/* Progress notes */}
      <RoadmapProgressNotes
        notes={client?.roadmap_progress_notes || []}
        clientId={client.id}
        onNotesUpdate={async (notes) => {
          const updated = await base44.entities.Client.update(client.id, { roadmap_progress_notes: notes });
          onClientUpdate?.(updated);
        }}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ItemRow({ item, pct, openItem, setOpenItem, onSave, saving, projectedEndDate, serviceStartDate, client, workshops, workshopSignups, reloadWorkshops, onClientUpdate }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.planned;
  const isOpen = openItem === item.key;
  const trackBg = item.isBarrier ? '#fffbeb' : '#f8fafc';

  // Actual progress dates (from statusData — set via RoadmapItemPanel)
  const startD = parseDate(item.statusData?.started_date || item.statusData?.timeline_start);
  const endD   = parseDate(item.statusData?.completed_date || item.statusData?.timeline_end);
  // Deadline date (from detail — set via Action Plan form)
  const deadline  = parseDate(item.detail?.timeline_end);
  const deadlineP = deadline ? (pct(deadline) ?? 0) : null;

  const startP = startD ? (pct(startD) ?? 0) : 0;
  const endP   = endD   ? (pct(endD) ?? 0) : (startD ? Math.min(startP + 10, 100) : 0);
  const barW   = startD ? Math.max(endP - startP, 4) : 0;

  const isCancelled  = item.status === 'cancelled';
  const isStarted    = item.status === 'started';
  const isCompleted  = item.status === 'completed';
  const labelColor   = isCancelled ? '#94a3b8' : item.color;

  return (
    <>
      <div className="relative h-8 flex items-center mb-1 group">
        <div
          className="absolute w-40 pr-2 text-[11px] text-right cursor-pointer"
          style={{
            left: -160,
            textDecoration: isCancelled ? 'line-through' : 'none',
          }}
          onClick={() => setOpenItem(isOpen ? null : item.key)}
          title={item.label}
        >
          <span
            className={`block truncate ${item.needsFollowupResolution ? 'text-red-600 animate-pulse' : ''}`}
            style={{ color: item.needsFollowupResolution ? undefined : labelColor }}
          >
            {item.label}
          </span>
          {item.needsFollowupResolution && (
            <span className="block text-[9px] text-red-600 leading-tight text-right">
              Barrier needs to be resolved before 90 Day follow Up
            </span>
          )}
        </div>
        <div
          className="w-full h-6 rounded-md relative cursor-pointer"
          style={{ backgroundColor: trackBg, outline: `2px solid ${cfg.ring}` }}
          onClick={() => setOpenItem(isOpen ? null : item.key)}
        >
          {/* Deadline marker — dashed line at anticipated completion date */}
          {deadlineP !== null && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-10"
              style={{ left: `${deadlineP}%`, borderLeft: `2px dashed ${item.color}`, opacity: 0.6 }}
            >
              <span
                className="absolute -top-0.5 -translate-x-1/2 text-[9px] leading-none"
                style={{ color: item.color }}
                title={`Deadline: ${fmtDate(deadline)}`}
              >
                ⚑
              </span>
            </div>
          )}
          {/* Bar fill — only shows when item has actually been started */}
          {startD && (
            <div
              className="absolute top-0.5 bottom-0.5 rounded"
              style={{
                left: `${startP}%`,
                width: `${barW}%`,
                backgroundColor: item.color,
                opacity: isCancelled ? 0.5 : 0.85,
                ...(isStarted ? {
                  background: `linear-gradient(90deg, ${item.color}cc 0%, ${item.color}ff 50%, ${item.color}cc 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'typeShimmer 2s linear infinite',
                } : {}),
                ...(isCompleted ? { animation: 'completedPulse 2s ease-in-out infinite' } : {}),
              }}
            >
              {isCompleted && <CheckCheck className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white" />}
              {isCancelled  && <X         className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white" />}
            </div>
          )}
          {/* Status indicator when no progress bar (e.g. barrier marked complete with no start date) */}
          {!startD && (isCompleted || isCancelled) && (
            <div className="absolute inset-0 flex items-center justify-center">
              {isCompleted && <CheckCheck className="w-3.5 h-3.5" style={{ color: cfg.ring }} />}
              {isCancelled && <X className="w-3.5 h-3.5" style={{ color: cfg.ring }} />}
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="mb-2 ml-0 relative z-40">
          {item.isWorkshopSignup ? (
            <WorkshopRoadmapPanel
              client={client}
              item={item}
              workshops={workshops}
              signups={workshopSignups}
              onReload={reloadWorkshops}
              onClientUpdate={onClientUpdate}
              onClose={() => setOpenItem(null)}
            />
          ) : (
            <RoadmapItemPanel
              item={item}
              hideNotes={item.key?.startsWith('it_')}
              currentStatus={item.status}
              onSave={(data) => onSave(item.key, data)}
              onCancel={() => setOpenItem(null)}
              saving={saving}
              projectedEndDate={projectedEndDate}
              serviceStartDate={serviceStartDate}
            />
          )}
        </div>
      )}
    </>
  );
}

function ListItem({ item, openItem, setOpenItem, onSave, saving, projectedEndDate, serviceStartDate, client, workshops, workshopSignups, reloadWorkshops, onClientUpdate }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.planned;
  const isOpen = openItem === item.key;

  const Icon = item.status === 'completed' ? CheckCheck
             : item.status === 'cancelled' ? X
             : item.status === 'started'   ? Clock
             : Circle;

  const startedDate   = item.statusData?.started_date;
  const completedDate = item.statusData?.completed_date;

  return (
    <>
      <button
        className="w-full text-left px-3 py-2.5 rounded-lg border-2 text-sm flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        style={{ borderColor: cfg.ring }}
        onClick={() => setOpenItem(isOpen ? null : item.key)}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.ring }} />
            <span
              className={`truncate font-medium ${item.needsFollowupResolution ? 'text-red-600 animate-pulse' : ''}`}
              style={{ color: item.needsFollowupResolution ? undefined : item.color }}
            >
              {item.label}
            </span>
          </div>
          {item.needsFollowupResolution && (
            <span className="text-[10px] text-red-600 leading-tight pl-6">
              Barrier needs to be resolved before 90 Day follow Up
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {startedDate && !completedDate && <span className="text-xs text-muted-foreground">Started: {startedDate}</span>}
          {completedDate && <span className="text-xs text-muted-foreground">Completed: {completedDate}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
        </div>
      </button>
      {isOpen && (
        <div className="mt-1 relative z-40">
          {item.isWorkshopSignup ? (
            <WorkshopRoadmapPanel
              client={client}
              item={item}
              workshops={workshops}
              signups={workshopSignups}
              onReload={reloadWorkshops}
              onClientUpdate={onClientUpdate}
              onClose={() => setOpenItem(null)}
            />
          ) : (
            <RoadmapItemPanel
              item={item}
              hideNotes={item.key?.startsWith('it_')}
              currentStatus={item.status}
              onSave={(data) => onSave(item.key, data)}
              onCancel={() => setOpenItem(null)}
              saving={saving}
              projectedEndDate={projectedEndDate}
              serviceStartDate={serviceStartDate}
            />
          )}
        </div>
      )}
    </>
  );
}