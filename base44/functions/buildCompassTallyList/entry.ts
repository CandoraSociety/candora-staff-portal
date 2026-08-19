import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Rebuilds the "Compass to-do" list for a given Invoice Tracker billing month:
// every Pathways client who triggered a tally in the CRT Invoice Tracker that
// month (exposure courses, paid work exposure, employment supports, workshop
// attendance, service navigation, 90-day follow-up, WD placement completion,
// employment start). The list is reconciled into CompassTallyVerification
// records (keyed by client + billing month) so staff can mark each client's
// Compass info as double-checked. Existing verification status is preserved
// across rebuilds; clients no longer triggering a tally this month are pruned.

function currentMonthEdmonton() {
  const s = new Date().toLocaleString('en-US', { timeZone: 'America/Edmonton', month: '2-digit', year: 'numeric' });
  const [mon, yr] = s.split('/');
  return `${yr}-${mon}`;
}

function inMonth(dateStr, bm) {
  return !!dateStr && String(dateStr).slice(0, 7) === bm;
}

const FIN_LABEL = {
  exposure_course: 'Exposure Course',
  paid_external_placement: 'Paid Work Exposure',
  employment_supports: 'Employment Supports',
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    try { await base44.auth.me(); } catch { /* allow service-role invocation */ }

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const billingMonth = payload?.billingMonth || currentMonthEdmonton();

    // Load all clients once (modest dataset) for name/assignment/compass info
    // and for the client date-field tallies.
    const clients = (await base44.asServiceRole.entities.Client.list('-created_date', 2000)) || [];
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const cName = (c) => (c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '');
    const cInfo = (id) => {
      const c = clientMap.get(id);
      return c
        ? { name: cName(c), assigned_worker: c.assigned_worker || '', assigned_worker_name: c.assigned_worker_name || '', compass_hsid: c.compass_hsid || '', compass_verified: !!c.compass_verified }
        : null;
    };

    const map = new Map<string, any>();
    const ensure = (id, fallbackName, info) => {
      if (!id) return null;
      let e = map.get(id);
      if (!e) {
        const i = info || cInfo(id) || {};
        e = {
          client_id: id,
          client_name: fallbackName || i.name || 'Unknown',
          assigned_worker: i.assigned_worker || '',
          assigned_worker_name: i.assigned_worker_name || '',
          compass_hsid: i.compass_hsid || '',
          compass_verified: !!i.compass_verified,
          tallies: new Set<string>(),
        };
        map.set(id, e);
      }
      return e;
    };

    // 1. FinancialRecord (billing_month) — exposure courses, paid work
    //    exposure, employment supports (direct-cost columns CF/CG/CI/CJ).
    try {
      const recs = (await base44.asServiceRole.entities.FinancialRecord.filter({ billing_month: billingMonth }, '-created_date', 2000)) || [];
      for (const r of recs) {
        const label = FIN_LABEL[r.record_type] || 'Employment Supports';
        const info = cInfo(r.client_id) || { name: r.client_name, assigned_worker: r.assigned_worker || '', assigned_worker_name: '', compass_hsid: '', compass_verified: false };
        ensure(r.client_id, r.client_name || info.name, info)?.tallies.add(label);
      }
    } catch { /* ignore */ }

    // 2. WorkExposureHoursSubmission (billing_month) — paid work exposure (CJ).
    try {
      const subs = (await base44.asServiceRole.entities.WorkExposureHoursSubmission.filter({ billing_month: billingMonth }, '-created_date', 2000)) || [];
      for (const s of subs) {
        const info = cInfo(s.client_id) || { name: s.client_name, assigned_worker: '', assigned_worker_name: s.assigned_worker_name || '', compass_hsid: '', compass_verified: false };
        ensure(s.client_id, s.client_name || info.name, info)?.tallies.add('Paid Work Exposure');
      }
    } catch { /* ignore */ }

    // 3. WorkshopSignup attended (session_date in month) — workshop
    //    deliverable (DEA/WD completion counts).
    try {
      const signups = (await base44.asServiceRole.entities.WorkshopSignup.filter({ status: 'attended' }, '-session_date', 2000)) || [];
      for (const su of signups) {
        if (!inMonth(su.session_date, billingMonth) || !su.client_id) continue;
        ensure(su.client_id, su.attendee_name, cInfo(su.client_id))?.tallies.add('Workshop Attendance');
      }
    } catch { /* ignore */ }

    // 4. Client date-field tallies.
    for (const c of clients) {
      if (inMonth(c.service_navigation_date, billingMonth)) ensure(c.id, cName(c), cInfo(c.id))?.tallies.add('Service Navigation Fee');
      if (inMonth(c.followup_90day_date, billingMonth)) ensure(c.id, cName(c), cInfo(c.id))?.tallies.add('90-Day Follow-Up');
      if (inMonth(c.eda_completion_date, billingMonth)) ensure(c.id, cName(c), cInfo(c.id))?.tallies.add('WD Placement Completion');
      if (inMonth(c.employment_start_date, billingMonth)) ensure(c.id, cName(c), cInfo(c.id))?.tallies.add('Employment Start');
    }

    const list = [...map.values()].map((e) => ({ ...e, tallies: [...e.tallies] }));
    list.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));

    // Reconcile into CompassTallyVerification records (preserve verified state).
    let existing: any[] = [];
    try { existing = (await base44.asServiceRole.entities.CompassTallyVerification.filter({ billing_month: billingMonth })) || []; } catch { /* none */ }
    const byClient = new Map(existing.map((r) => [r.client_id, r]));
    const seen = new Set<string>();
    for (const e of list) {
      seen.add(e.client_id);
      const ex = byClient.get(e.client_id);
      if (ex) {
        await base44.asServiceRole.entities.CompassTallyVerification.update(ex.id, {
          client_name: e.client_name,
          assigned_worker: e.assigned_worker,
          assigned_worker_name: e.assigned_worker_name,
          compass_hsid: e.compass_hsid,
          compass_verified: e.compass_verified,
          tallies: e.tallies,
        });
      } else {
        const created = await base44.asServiceRole.entities.CompassTallyVerification.create({
          client_id: e.client_id,
          client_name: e.client_name,
          billing_month: billingMonth,
          tallies: e.tallies,
          assigned_worker: e.assigned_worker,
          assigned_worker_name: e.assigned_worker_name,
          compass_hsid: e.compass_hsid,
          compass_verified: e.compass_verified,
          status: 'pending',
        });
        byClient.set(e.client_id, created);
      }
    }
    // Prune records for clients who no longer trigger a tally this month.
    for (const r of existing) {
      if (!seen.has(r.client_id)) {
        try { await base44.asServiceRole.entities.CompassTallyVerification.delete(r.id); } catch { /* ignore */ }
      }
    }

    const result = list.map((e) => {
      const v = byClient.get(e.client_id);
      return {
        ...e,
        verification_id: v?.id,
        status: v?.status || 'pending',
        verified_by: v?.verified_by || '',
        verified_by_name: v?.verified_by_name || '',
        verified_date: v?.verified_date || '',
        notes: v?.notes || '',
      };
    });

    return Response.json({ status: 'success', billingMonth, count: result.length, items: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}