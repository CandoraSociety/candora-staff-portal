import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Scheduled Executive Director briefing generator. Called only by the four
// "ED Briefing" scheduled workflows (morning / midday / end-of-day / Sunday
// week-ahead). Pulls the same 360° picture the ED Assistant chat uses, has
// the AI write a briefing, and posts it to the ED's main Dashboard as a
// notification (kind: ed_briefing).

// ABT = fixed UTC-6 all year (see shared/abTimeZone.ts)
const ABT_OFFSET_MS = 6 * 60 * 60 * 1000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TYPE_BRIEFS = {
  morning:
    'Write a MORNING BRIEFING (about 200 words):\n' +
    '1) "Top priorities today" - the 3 to 5 things to focus on, one-line reason each\n' +
    '2) "Due and deadlines" - anything due today, due tomorrow, or overdue\n' +
    '3) "Risks and decisions" - items that need a decision or attention today\n' +
    '4) One closing line on cash position',
  midday:
    'Write a very short MIDDAY CHECK-IN (max 100 words): anything slipping or overdue, what to knock out in the next few hours, and one practical nudge.',
  eod:
    'Write an END-OF-DAY WRAP-UP (about 180 words):\n' +
    '1) "Close out today" - anything that must be finished before logging off\n' +
    '2) "Moves to tomorrow" - the short list\n' +
    '3) One thing to flag for tomorrow morning',
  weekly:
    'Write a WEEK-AHEAD PREP briefing (about 300 words):\n' +
    '1) "The week at a glance" - day-by-day: deadlines, meetings/events, grant or funder dates\n' +
    '2) "Big rocks" - the 3 to 4 things that must get scheduled\n' +
    '3) "Watch-outs" - risks, expiring items, low cash points\n' +
    'It is Sunday evening: set him up to start Monday already organized.',
};

function dueLabel(dateStr, todayStr) {
  if (!dateStr) return '';
  const d = String(dateStr).slice(0, 10);
  const a = Date.parse(d + 'T00:00:00Z');
  const b = Date.parse(todayStr + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b)) return '';
  const days = Math.round((a - b) / 86400000);
  if (days < 0) return ' (OVERDUE)';
  if (days === 0) return ' (today)';
  if (days === 1) return ' (tomorrow)';
  return days <= 14 ? ` (in ${days}d)` : ` (${d.slice(5)})`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const type = TYPE_BRIEFS[body.briefing_type] ? body.briefing_type : 'morning';

    const svc = base44.asServiceRole;

    // Recipient: the active Executive Director
    const edEmployees = await svc.entities.Employee.filter({ org_tier: 'executive_director', status: 'active' });
    const ed = (edEmployees || [])[0];
    if (!ed || !ed.email) {
      return Response.json({ error: 'No active Executive Director (org_tier executive_director) found in staff records' }, { status: 404 });
    }

    // Alberta (ABT) clock
    const abtNow = new Date(Date.now() - ABT_OFFSET_MS);
    const todayStr = abtNow.toISOString().slice(0, 10);
    const weekday = WEEKDAYS[abtNow.getUTCDay()];
    const isWednesday = abtNow.getUTCDay() === 3;
    const isFriday = abtNow.getUTCDay() === 5;
    const dateLong = abtNow.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    const dateShort = abtNow.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

    // ── Gather the ED's 360° picture (batched) ──
    const [g1, g2, g3] = await Promise.all([
      Promise.allSettled([
        svc.entities.EDTask.list('-created_date', 200),
        svc.entities.EDProject.list('-created_date', 100),
        svc.entities.EDObjective.list('-created_date', 100),
        svc.entities.EDNote.list('-updated_date', 50),
        svc.entities.EDBudget.list('-created_date', 20),
        svc.entities.Report.list('-created_date', 200),
      ]),
      Promise.allSettled([
        svc.entities.PersonalOrganizer.filter({ user_email: ed.email }),
        svc.entities.Event.list('-created_date', 200),
        svc.entities.Program.list('-created_date', 200),
        svc.entities.Invoice.list('-created_date', 200),
        svc.entities.Announcement.list('-created_date', 50),
        svc.entities.CompassTask.list('-created_date', 300),
      ]),
      Promise.allSettled([
        svc.entities.CashFlowProjection.filter({ kind: 'current' }),
        svc.entities.Volunteer.list('-created_date', 300),
        svc.entities.Employee.list('-created_date', 300),
        svc.entities.Client.list('-created_date', 500),
      ]),
    ]);
    const got = (results, i, fb = []) => (results[i].status === 'fulfilled' ? (results[i].value ?? fb) : fb);
    const tasks = got(g1, 0);
    const edProjects = got(g1, 1);
    const objectives = got(g1, 2);
    const notes = got(g1, 3);
    const budgets = got(g1, 4);
    const grantReports = got(g1, 5);
    const organizerRows = got(g2, 0);
    const events = got(g2, 1);
    const programs = got(g2, 2);
    const invoices = got(g2, 3);
    const announcements = got(g2, 4);
    const compassTasks = got(g2, 5);
    const cashRows = got(g3, 0);
    const volunteers = got(g3, 1);
    const employees = got(g3, 2);
    const clients = got(g3, 3);

    // ── Condense ──
    const openTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    const urgent = openTasks.filter(t => t.priority === 'critical' || t.priority === 'high');
    const activeProjects = edProjects.filter(p => p.status === 'active' || p.status === 'planning');
    const activeObjectives = objectives.filter(o => o.status === 'active' || o.status === 'at_risk');
    const organizer = (organizerRows || [])[0] || null;
    const focusToday = organizer?.focus_today || '';
    const priorities = organizer?.priorities || [];
    const personalTodos = (organizer?.tasks || []).filter(t => !t.done);
    const weeklyPlan = (organizer?.weekly_plan || []).filter(i => !i.done);
    const reportsDue = grantReports.filter(r => r.status !== 'submitted' && r.status !== 'accepted' && r.due_date);
    const upcomingEvents = events.filter(e => e.start_date && String(e.start_date).slice(0, 10) >= todayStr).slice(0, 6);
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'draft').slice(0, 5);
    const activeAnnouncements = announcements.filter(a => a.is_active).slice(0, 3);
    const overdueCompass = compassTasks.filter(t => t.status !== 'completed' && t.due_date && String(t.due_date).slice(0, 10) < todayStr);
    const cashFlow = (cashRows || [])[0] || null;
    const activeEmployees = employees.filter(e => e.status === 'active');
    const activeVolunteers = volunteers.filter(v => v.status === 'active');
    const activeClients = clients.filter(c => c.status === 'active' || c.status === 'employed');
    const activePrograms = programs.filter(p => p.status === 'active').slice(0, 5);

    const firstName = (ed.first_name || 'Graham').split(' ')[0];

    const dataBlock = [
      `=== ED TASKS (${openTasks.length} open, ${urgent.length} urgent) ===`,
      urgent.slice(0, 8).map(t => `- [${(t.priority || 'high').toUpperCase()}] ${t.title}${dueLabel(t.due_date, todayStr)}`).join('\n') || 'None urgent.',
      openTasks.filter(t => t.priority !== 'critical' && t.priority !== 'high').slice(0, 6)
        .map(t => `- ${t.title}${dueLabel(t.due_date, todayStr)}`).join('\n') || '',
      '',
      `=== ED PROJECTS (${activeProjects.length} active) ===`,
      activeProjects.slice(0, 8).map(p => `- ${p.name} (${p.progress_percent || 0}%, risk: ${p.risk_level || 'low'})${p.end_date ? ` due ${String(p.end_date).slice(0, 10)}` : ''}`).join('\n') || 'None.',
      '',
      `=== STRATEGIC OBJECTIVES (${activeObjectives.length} active) ===`,
      activeObjectives.slice(0, 6).map(o => `- ${o.title} (${o.progress_percent || 0}%, ${o.status})`).join('\n') || 'None.',
      '',
      `=== GRANT REPORTS DUE (${reportsDue.length}) ===`,
      reportsDue.slice(0, 5).map(r => `- ${r.title}${dueLabel(r.due_date, todayStr)} [${r.status}]`).join('\n') || 'None due.',
      '',
      '=== PERSONAL ===',
      focusToday ? `Focus today: ${focusToday}` : 'Focus today: not set.',
      priorities.slice(0, 6).map(p => `- Priority: ${p.title}${dueLabel(p.due_date, todayStr)}`).join('\n') || 'No priorities set.',
      personalTodos.slice(0, 8).map(t => `- To-do: ${t.text}`).join('\n') || 'No open to-dos.',
      weeklyPlan.slice(0, 6).map(i => `- Week plan: ${i.text}${i.scheduled_date ? ` (${String(i.scheduled_date).slice(0, 10)})` : ''}`).join('\n') || '',
      '',
      `=== OVERDUE COMPASS TASKS (${overdueCompass.length}) ===`,
      overdueCompass.slice(0, 5).map(t => `- ${t.title}${dueLabel(t.due_date, todayStr)}`).join('\n') || 'None overdue.',
      '',
      '=== UPCOMING EVENTS ===',
      upcomingEvents.map(e => `- ${(e.name || e.title || 'Event')}${dueLabel(e.start_date, todayStr)}`).join('\n') || 'None scheduled.',
      '',
      '=== INVOICES PENDING ===',
      pendingInvoices.map(i => `- ${i.title || i.invoice_number || 'Invoice'} [${i.status}]`).join('\n') || 'None pending.',
      '',
      '=== CASH FLOW (official projection) ===',
      cashFlow
        ? `Opening balance $${(cashFlow.opening_balance || 0).toLocaleString()} as of ${cashFlow.opening_date || '?'}, projection ends ${cashFlow.end_date || '?'}. Assumptions: ${(cashFlow.assumptions || []).map(a => a.name).filter(Boolean).join(', ') || 'none'}.`
        : 'No current projection set up.',
      '',
      '=== ORGANIZATION SNAPSHOT ===',
      `${activeEmployees.length} active staff, ${activeVolunteers.length} active volunteers, ${activeClients.length} active Pathways clients.`,
      `Active programs: ${activePrograms.map(p => p.name || p.title).join(', ') || 'none'}.`,
      `Active announcements: ${activeAnnouncements.map(a => a.title).join('; ') || 'none'}.`,
      '',
      '=== RECENT ED NOTES ===',
      notes.slice(0, 5).map(n => `- "${n.title}"${n.content ? ': ' + String(n.content).slice(0, 80) : ''}`).join('\n') || 'None.',
    ].join('\n');

    let instruction = TYPE_BRIEFS[type];
    if (type === 'morning' && isWednesday) {
      instruction += '\nAlso include a "Midweek check-in" section: how the week is pacing - what is on track and what is behind.';
    }
    if (type === 'eod' && isFriday) {
      instruction += '\nAlso include an "End-of-week review" section: go through this week\'s tasks and deadlines - the wins, what slipped, and exactly what rolls to next week.';
    }

    const prompt =
      `You are the executive assistant to ${firstName}, Executive Director of Candora, a non-profit organization in Edmonton.\n` +
      `Today is ${dateLong} (${weekday}).\n\n` +
      `${instruction}\n\n` +
      'Rules:\n' +
      '- Use ONLY the data below. Do not invent facts, numbers, dates or people.\n' +
      '- If a section has nothing in it, skip it silently.\n' +
      `- Address him by first name (${firstName}). Warm, professional, direct - like a top-tier EA who knows their boss and does not need hand-holding.\n` +
      '- PLAIN TEXT only: "-" bullets, no markdown symbols, no asterisks, no emoji.\n\n' +
      `=== DATA ===\n${dataBlock}`;

    const result = await svc.integrations.Core.InvokeLLM({ prompt });
    const briefing = typeof result === 'string' ? result : String(result?.response || result?.text || '');
    if (!briefing.trim()) {
      return Response.json({ error: 'The briefing came back empty' }, { status: 500 });
    }

    let title = `${TYPE_TITLES[type]} — ${dateShort}`;
    if (type === 'morning' && isWednesday) title = `Morning Briefing + Midweek Check-In — ${dateShort}`;
    if (type === 'eod' && isFriday) title = `End-of-Day + End-of-Week Review — ${dateShort}`;

    await svc.entities.DashboardNotification.create({
      recipient_email: ed.email,
      recipient_name: `${ed.first_name || ''} ${ed.last_name || ''}`.trim(),
      kind: 'ed_briefing',
      title,
      message: briefing.trim(),
      link: '/ed',
    });

    return Response.json({ ok: true, briefing_type: type, recipient: ed.email, title });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

const TYPE_TITLES = {
  morning: 'Morning Briefing',
  midday: 'Midday Check-In',
  eod: 'End-of-Day Wrap-Up',
  weekly: 'Week-Ahead Prep',
};