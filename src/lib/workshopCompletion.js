import { base44 } from '@/api/base44Client';
import { todayISO, WORKSHOP_CATEGORY_KEYS, WORKSHOP_CATEGORIES } from './workshopSchedule';
import { createCompassTask, withCrtComments, taskEdaCompleted } from './compassTasks';

/**
 * When a workshop is marked 'completed', every client signup marked 'attended'
 * for that workshop should have the matching action-plan item auto-completed in
 * their roadmap (status, completed_date, and a progress-note / timeline entry).
 * Call this after marking a workshop completed, and after marking a signup
 * 'attended' (it no-ops if the workshop isn't completed yet, or has no category).
 */
export async function syncWorkshopCompletionToRoadmap(workshopId) {
  let workshop;
  try { workshop = await base44.entities.Workshop.get(workshopId); }
  catch { return { updated: 0 }; }
  if (!workshop || workshop.status !== 'completed') return { updated: 0 };

  const cat = workshop.category;
  if (!cat || cat === 'none' || !WORKSHOP_CATEGORY_KEYS.includes(cat)) return { updated: 0 };

  let signups = [];
  try { signups = await base44.entities.WorkshopSignup.filter({ workshop_id: workshopId }); }
  catch { return { updated: 0 }; }

  const attended = signups.filter(s => s.status === 'attended' && s.client_id);
  if (attended.length === 0) return { updated: 0 };

  let me = null;
  try { me = await base44.auth.me(); } catch (_) {}

  let updated = 0;
  for (const s of attended) {
    let client;
    try { client = await base44.asServiceRole.entities.Client.get(s.client_id); }
    catch { continue; }
    const res = await markClientEdaComplete(client, workshop, cat, s.session_date, me);
    if (res === 'updated' || res === 'already') updated++;
  }
  return { updated };
}

/**
 * Shared per-client EDA completion: marks the roadmap item complete, logs a
 * progress-note / timeline entry, and queues the EDA-completed Compass task.
 * Returns 'updated' | 'already' | 'failed'.
 */
async function markClientEdaComplete(client, workshop, cat, sessionDate, me) {
  const rms = client.roadmap_item_status || {};
  if (rms[cat]?.status === 'completed') return 'already';

  const newRms = { ...rms, [cat]: { ...(rms[cat] || {}), status: 'completed', completed_date: todayISO() } };
  const notes = [...(client.roadmap_progress_notes || [])];
  notes.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: todayISO(),
    event_type: 'completed',
    item_label: workshop.title,
    item_key: cat,
    note: `Marked complete after attending "${workshop.title}" (session ${sessionDate}).`,
    logged_by: me?.email || '',
    logged_by_name: me?.full_name || '',
    compass_entered: false,
  });

  let updatedClient;
  try {
    updatedClient = await base44.asServiceRole.entities.Client.update(client.id, {
      roadmap_item_status: newRms,
      roadmap_progress_notes: notes,
    });
  } catch (_) { return 'failed'; }

  // Mirror the timeline "completed" save: queue an EDA-completed Compass task
  // with the CRT Comments (Column S) text attached, so the CRT note is written
  // (the same note that appears when completing the item directly in the timeline).
  try {
    const itemLabel = WORKSHOP_CATEGORIES.find(c => c.value === cat)?.label || workshop.title;
    const taskBase = {
      client_id: client.id,
      client_name: `${client.first_name} ${client.last_name}`,
      compass_hsid: client.compass_hsid || '',
      assigned_worker: client.assigned_worker,
      assigned_worker_name: client.assigned_worker_name,
    };
    await createCompassTask({
      ...taskBase,
      ...withCrtComments(taskEdaCompleted(updatedClient, itemLabel, { completion_date: todayISO() }), updatedClient),
    });
  } catch (_) { /* best-effort — don't block the roadmap update */ }
  return 'updated';
}

/**
 * Per-session attendance completion: after a facilitator clicks "Complete
 * Session", every signup marked 'attended' for that session who is a WD
 * (pathways) or DEA (direct_to_employment) client AND has this workshop's
 * category as one of their assigned EDAs gets that EDA marked complete in their
 * roadmap / progress tab and action plan. Unlike the workshop-level sync, this
 * does not require the whole workshop series to be marked 'completed'.
 */
export async function syncSessionCompletionToRoadmap(workshopId, sessionDate) {
  let workshop;
  try { workshop = await base44.entities.Workshop.get(workshopId); }
  catch { return { updated: 0 }; }

  const cat = workshop?.category;
  if (!cat || cat === 'none' || !WORKSHOP_CATEGORY_KEYS.includes(cat)) return { updated: 0 };

  let signups = [];
  try { signups = await base44.entities.WorkshopSignup.filter({ workshop_id: workshopId }); }
  catch { return { updated: 0 }; }

  const attended = signups.filter(s => s.status === 'attended' && s.client_id && s.session_date === sessionDate);
  if (attended.length === 0) return { updated: 0 };

  let me = null;
  try { me = await base44.auth.me(); } catch (_) {}

  let updated = 0;
  for (const s of attended) {
    let client;
    try { client = await base44.asServiceRole.entities.Client.get(s.client_id); }
    catch { continue; }

    // Only WD (pathways) and DEA (direct_to_employment) clients, and only if
    // this workshop's category is one of their assigned EDAs.
    if (!['pathways', 'direct_to_employment'].includes(client.service_type)) continue;
    const rms = client.roadmap_item_status || {};
    if (!rms[cat]) continue;

    const res = await markClientEdaComplete(client, workshop, cat, s.session_date, me);
    if (res === 'updated' || res === 'already') updated++;
  }
  return { updated };
}