import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Gathers organization-wide activity metrics for the Executive Director's
// monthly board report. Given a month (YYYY-MM), counts real data from every
// program portal: clients served, sessions held, registrations, staff,
// volunteers, reimbursements paid, donations and upcoming events.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin', 'executive_director'].includes(user.role)) {
      return Response.json({ error: 'Forbidden — Executive Director portal only' }, { status: 403 });
    }

    let month = null;
    try {
      const body = await req.json();
      month = body?.month || null;
    } catch {
      month = null;
    }
    const now = new Date();
    const ym = /^\d{4}-\d{2}$/.test(month || '')
      ? month
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = ym.split('-').map(Number);
    const monthStart = `${ym}-01`;
    const nextYm = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    const nextMonthStart = `${nextYm}-01`;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const monthEnd = `${ym}-${String(lastDay).padStart(2, '0')}`;

    // Date fields are stored as YYYY-MM-DD strings, so lexical range filters work.
    const inMonth = (field) => ({ [field]: { $gte: monthStart, $lte: monthEnd } });
    const beforeNextMonth = (field) => ({ [field]: { $gte: monthStart, $lt: nextMonthStart } });
    const createdInMonth = () => beforeNextMonth('created_date');

    const safeFilter = async (entityName, query, sort = '-updated_date', limit = 500) => {
      try { return await base44.entities[entityName].filter(query, sort, limit); } catch { return []; }
    };
    const safeList = async (entityName, sort = '-updated_date', limit = 500) => {
      try { return await base44.entities[entityName].list(sort, limit); } catch { return []; }
    };

    const metrics = {};

    // ── Pathways Employment Program ──────────────────────
    const clients = await safeList('Client', '-created_date', 500);
    const ACTIVE_STATUSES = ['active', 'waitlisted', 'on_leave', 'paused'];
    const closedStatuses = ['complete', 'cancelled', 'incomplete'];
    const inMonthStr = (v) => typeof v === 'string' && v >= monthStart && v <= monthEnd;
    metrics.pathways = {
      new_clients: clients.filter(c => inMonthStr(c.created_date)).length,
      active_clients: clients.filter(c => !closedStatuses.includes(c.program_status) || ACTIVE_STATUSES.includes(c.program_status)).length,
      total_clients_on_file: clients.length,
      action_plans_completed: clients.filter(c => inMonthStr(c.eda_completion_date)).length,
      clients_employed: clients.filter(c => inMonthStr(c.post_completion_employment_date)).length,
      followups_90day_recorded: clients.filter(c => inMonthStr(c.followup_90day_date)).length,
    };

    const workshops = await safeFilter('Workshop', inMonth('date'), '-date', 100);
    metrics.pathways.workshops_held = {
      count: workshops.length,
      titles: workshops.map(w => w.title).slice(0, 10),
    };

    // ── Resource Centre ──────────────────────────────────
    const visits = await safeFilter('RCClientVisit', inMonth('visit_date'), '-visit_date', 500);
    const visitsByType = {};
    visits.forEach(v => { visitsByType[v.visit_type || 'other'] = (visitsByType[v.visit_type || 'other'] || 0) + 1; });
    const newRcClients = await safeFilter('RCClient', createdInMonth(), '-created_date', 500);
    const referrals = await safeFilter('RCReferral', createdInMonth(), '-created_date', 500);
    const serviceLogs = await safeFilter('RCServiceLog', createdInMonth(), '-created_date', 500);
    metrics.resource_centre = {
      client_visits: visits.length,
      visits_by_type: visitsByType,
      visit_hours: Math.round(visits.reduce((s, v) => s + (v.duration_minutes || 0), 0) / 60 * 10) / 10,
      new_clients_registered: newRcClients.length,
      referrals_received: referrals.length,
      services_logged: serviceLogs.length,
    };

    // ── English Language Learning ────────────────────────
    const learners = await safeList('ELLLearner', '-created_date', 500);
    const ellClasses = await safeList('ELLClass', '-created_date', 200);
    metrics.ell = {
      active_learners: learners.filter(l => ['active', 'enrolled'].includes(l.enrollment_status)).length,
      new_learners_this_month: learners.filter(l => inMonthStr(l.intake_date) || inMonthStr(l.created_date)).length,
      waitlisted_learners: learners.filter(l => l.enrollment_status === 'waitlisted').length,
      active_classes: ellClasses.filter(c => c.status === 'active').length,
    };

    // ── Family Programs: FRN & PHAC ──────────────────────
    const frnSessions = await safeFilter('FRNSession', inMonth('session_date'), '-session_date', 200);
    const frnParticipants = await safeFilter('FRNParticipant', createdInMonth(), '-created_date', 500);
    metrics.frn = {
      sessions_held: frnSessions.length,
      sessions_by_program: frnSessions.reduce((acc, s) => { acc[s.program_name || 'Other'] = (acc[s.program_name || 'Other'] || 0) + 1; return acc; }, {}),
      new_participants: frnParticipants.length,
    };

    const phacSessions = await safeFilter('PHACSession', inMonth('session_date'), '-session_date', 200);
    const phacParticipants = await safeFilter('PHACParticipant', createdInMonth(), '-created_date', 500);
    metrics.phac = {
      sessions_held: phacSessions.length,
      total_attendance: phacSessions.reduce((s, x) => s + (x.attendee_count || 0), 0),
      new_participants: phacParticipants.length,
    };

    // ── Other programs ────────────────────────────────────
    const empoweruCohorts = await safeList('EmpowerUCohort', '-created_date', 100);
    const empoweruParticipants = await safeFilter('EmpowerUParticipant', createdInMonth(), '-created_date', 500);
    metrics.empoweru = {
      active_cohorts: empoweruCohorts.filter(c => (c.status || 'active') === 'active').length,
      new_participants: empoweruParticipants.length,
    };

    const digilitSessions = await safeFilter('DigiLitSession', inMonth('session_date'), '-session_date', 200);
    const digilitParticipants = await safeFilter('DigiLitParticipant', createdInMonth(), '-created_date', 500);
    metrics.digital_literacy = {
      sessions_held: digilitSessions.length,
      new_participants: digilitParticipants.length,
    };

    const communitySessions = await safeFilter('CommunitySession', inMonth('session_date'), '-session_date', 200);
    const communityParticipants = await safeFilter('CommunityParticipant', createdInMonth(), '-created_date', 500);
    metrics.community_programs = {
      sessions_held: communitySessions.length,
      new_participants: communityParticipants.length,
    };

    const childmindingSessions = await safeFilter('ChildmindingSession', inMonth('date'), '-date', 200);
    metrics.childminding = { sessions_held: childmindingSessions.length };

    // ── Central Registration ─────────────────────────────
    const registrations = await safeFilter('ProgramRegistration', inMonth('registration_date'), '-registration_date', 500);
    const regsByPortal = {};
    registrations.forEach(r => { regsByPortal[r.program_portal || 'other'] = (regsByPortal[r.program_portal || 'other'] || 0) + 1; });
    metrics.central_registration = {
      total_registrations: registrations.length,
      by_portal: regsByPortal,
    };

    // ── Volunteers ────────────────────────────────────────
    const volunteers = await safeList('Volunteer', '-created_date', 500);
    const timeLogs = await safeFilter('VolunteerTimeLog', inMonth('date'), '-date', 500);
    metrics.volunteers = {
      active_volunteers: volunteers.filter(v => ['active', 'occasional'].includes(v.status)).length,
      new_volunteers: volunteers.filter(v => inMonthStr(v.created_date)).length,
      hours_volunteered_this_month: Math.round(timeLogs.reduce((s, t) => s + (t.total_hours || 0), 0) * 10) / 10,
    };

    // ── People (HR) ───────────────────────────────────────
    const employees = await safeList('Employee', '-created_date', 500);
    metrics.people = {
      active_employees: employees.filter(e => e.status === 'active' && !e.is_deleted).length,
      new_hires: employees.filter(e => inMonthStr(e.hire_date)).length,
    };

    // ── Finance ───────────────────────────────────────────
    const reimbPaid = await safeFilter('StaffReimbursementRequest', inMonth('payment_date'), '-payment_date', 500);
    const ccPaid = await safeFilter('CCReceiptSubmission', inMonth('payment_date'), '-payment_date', 500);
    metrics.finance = {
      reimbursements_paid: {
        count: reimbPaid.length,
        total_amount: Math.round(reimbPaid.reduce((s, r) => s + (r.amount || 0), 0) * 100) / 100,
      },
      mastercard_receipts_processed: {
        count: ccPaid.length,
        total_amount: Math.round(ccPaid.reduce((s, r) => s + (r.amount || 0), 0) * 100) / 100,
      },
    };

    // ── Fundraising ───────────────────────────────────────
    const donations = await safeFilter('Donation', inMonth('donation_date'), '-donation_date', 500);
    metrics.fundraising = {
      donations_received: donations.length,
      total_donated: Math.round(donations.filter(d => d.donation_type !== 'in_kind').reduce((s, d) => s + (d.amount || 0), 0) * 100) / 100,
      in_kind_value: Math.round(donations.filter(d => d.donation_type === 'in_kind').reduce((s, d) => s + (d.in_kind_value || 0), 0) * 100) / 100,
      distinct_donors: new Set(donations.map(d => d.donor_id || d.donor_name)).size,
    };

    // ── Events ────────────────────────────────────────────
    const eventsThisMonth = await safeFilter('Event', beforeNextMonth('start_date'), 'start_date', 100);
    const upcomingEvents = (await safeFilter('Event', { start_date: { $gte: monthEnd } }, 'start_date', 20))
      .filter(e => !['completed', 'cancelled'].includes(e.status))
      .slice(0, 8);
    metrics.events = {
      held_this_month: {
        count: eventsThisMonth.length,
        names: eventsThisMonth.map(e => e.name).slice(0, 8),
      },
      upcoming: upcomingEvents.map(e => ({
        name: e.name,
        start_date: (e.start_date || '').slice(0, 10),
        status: e.status,
      })),
    };

    return Response.json({
      month: ym,
      month_start: monthStart,
      month_end: monthEnd,
      metrics,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});