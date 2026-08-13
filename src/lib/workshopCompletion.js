import { base44 } from '@/api/base44Client';
import { todayISO, WORKSHOP_CATEGORY_KEYS } from './workshopSchedule';

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

    const rms = client.roadmap_item_status || {};
    if (rms[cat]?.status === 'completed') { updated++; continue; }

    const newRms = { ...rms, [cat]: { ...(rms[cat] || {}), status: 'completed', completed_date: todayISO() } };
    const notes = [...(client.roadmap_progress_notes || [])];
    notes.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: todayISO(),
      event_type: 'completed',
      item_label: workshop.title,
      item_key: cat,
      note: `Marked complete after attending "${workshop.title}" (session ${s.session_date}).`,
      logged_by: me?.email || '',
      logged_by_name: me?.full_name || '',
      compass_entered: false,
    });

    try {
      await base44.asServiceRole.entities.Client.update(client.id, {
        roadmap_item_status: newRms,
        roadmap_progress_notes: notes,
      });
      updated++;
    } catch (_) { /* skip clients we can't update */ }
  }
  return { updated };
}