import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Executes an interactive action on an ED briefing item (checklist tick,
// decision button, assistant offer). Only the briefing's own recipient can act,
// and every write goes to the real record the item points at. The item is then
// marked done on the notification so the Dashboard card reflects it.

const ABT_OFFSET_MS = 6 * 60 * 60 * 1000; // ABT = fixed UTC-6 all year

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { notification_id, item_id, action } = body;
    const note = (body.note || '').trim();
    if (!notification_id || !item_id || !action) {
      return Response.json({ error: 'notification_id, item_id and action are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    const notif = await svc.entities.DashboardNotification.get(notification_id).catch(() => null);
    if (!notif) return Response.json({ error: 'Briefing not found' }, { status: 404 });
    if ((notif.recipient_email || '').toLowerCase() !== (user.email || '').toLowerCase()) {
      return Response.json({ error: 'This briefing is not yours' }, { status: 403 });
    }

    const items = notif.items || [];
    const item = items.find(i => i.id === item_id);
    if (!item) return Response.json({ error: 'Briefing item not found' }, { status: 404 });
    if (item.status === 'done') return Response.json({ ok: true, item });

    const abtNow = new Date(Date.now() - ABT_OFFSET_MS);
    const todayStr = abtNow.toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const myName = user.full_name || user.email;

    let result = '';
    let doneText = 'Done';

    // ── Checklist: complete the underlying record ──
    if (item.kind === 'checklist' && action === 'complete_ed_task') {
      const t = await svc.entities.EDTask.get(item.entity_id);
      await svc.entities.EDTask.update(item.entity_id, { status: 'completed' });
      doneText = `Task completed${t?.title ? `: ${t.title}` : ''}`;

    } else if (item.kind === 'checklist' && action === 'complete_todo') {
      const rec = await svc.entities.PersonalOrganizer.get(item.entity_id);
      const tasks = (rec.tasks || []).map((t, i) =>
        i === (item.task_index ?? -1) ? { ...t, done: true, done_at: nowIso } : t
      );
      await svc.entities.PersonalOrganizer.update(item.entity_id, { tasks });
      doneText = 'To-do cleared';

    // ── Decisions ──
    } else if (action === 'acknowledge_purchase') {
      await svc.entities.PurchaseRequest.update(item.entity_id, {
        received_by: user.email,
        received_by_name: myName,
        received_date: todayStr,
        ...(note ? { notes: note } : {}),
      });
      doneText = 'Acknowledged — the requester can see you are handling it';

    } else if (action === 'reject_purchase') {
      await svc.entities.PurchaseRequest.update(item.entity_id, {
        status: 'rejected',
        rejection_reason: note || `Rejected from briefing by ${myName}`,
        reviewed_by: user.email,
        reviewed_by_name: myName,
        reviewed_date: todayStr,
        determination_date: todayStr,
      });
      doneText = 'Request rejected — requester notified';

    } else if (action === 'reschedule_task') {
      const t = await svc.entities.EDTask.get(item.entity_id);
      const base = Date.parse(String(t.due_date || todayStr).slice(0, 10) + 'T00:00:00Z');
      const newDue = new Date((Number.isNaN(base) ? Date.now() : base) + 7 * 86400000)
        .toISOString().slice(0, 10);
      await svc.entities.EDTask.update(item.entity_id, { due_date: newDue });
      doneText = `Moved to ${newDue}`;

    } else if (action === 'deprioritize_task') {
      await svc.entities.EDTask.update(item.entity_id, { priority: 'medium' });
      doneText = 'Priority lowered to medium';

    // ── Offers the assistant completes itself ──
    } else if (action === 'run_offer' && item.offer_type === 'create_task') {
      const p = item.payload || {};
      const created = await svc.entities.EDTask.create({
        title: p.title || 'Untitled task',
        description: p.description || '',
        due_date: p.due_date || undefined,
        priority: p.priority || 'high',
        status: 'not_started',
        category: 'Reports & Grants',
      });
      doneText = 'Task added to your task list';
      result = `"${created?.title || p.title}" is on your task list, due ${p.due_date || 'whenever you set it'}.`;

    } else if (action === 'run_offer' && item.offer_type === 'metrics_summary') {
      const snap = item.payload?.snapshot || {};
      const prompt =
        'You are the executive assistant to the Executive Director of Candora, a non-profit in Edmonton.\n' +
        'Turn this organization snapshot into a 30-second metrics read: 3 to 5 plain-text bullets, the few numbers that matter most, and one insight or flag. No markdown symbols, no emoji.\n\n' +
        `DATA:\n${JSON.stringify(snap)}`;
      const r = await svc.integrations.Core.InvokeLLM({ prompt });
      const summary = typeof r === 'string' ? r : String(r?.response || r?.text || '');
      if (!summary.trim()) return Response.json({ error: 'The summary came back empty — try again' }, { status: 500 });
      doneText = 'Snapshot compiled';
      result = summary.trim();

    } else {
      return Response.json({ error: 'Unknown action for this item' }, { status: 400 });
    }

    // ── Mark the item done on the briefing itself ──
    const updatedItems = items.map(i =>
      i.id === item.id
        ? { ...i, status: 'done', result: result || i.result, action_taken: action, action_at: nowIso }
        : i
    );
    await svc.entities.DashboardNotification.update(notification_id, { items: updatedItems });

    return Response.json({ ok: true, done_text: doneText, item: { ...item, status: 'done', result, action_taken: action, action_at: nowIso } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}