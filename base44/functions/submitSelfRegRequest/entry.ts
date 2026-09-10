import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { matchSettings, restrictionActive, applySelfRegAction, todayStr } from '../../shared/selfReg.ts';

// Public (QR-code) endpoint — no auth. Records a registration REQUEST.
// When the program does not require registrar approval, the registration is
// created immediately (auto-approved).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const data = await req.json().catch(() => ({}));
    const {
      area, program_id, program_name,
      session_id, session_name, session_date,
      first_name, last_name, phone, email,
      parent_guardian_name, parent_guardian_phone, parent_guardian_email,
      learner_id, notes,
    } = data || {};

    if (!area || (!first_name || !last_name)) {
      return Response.json({ error: 'First and last name are required' }, { status: 400 });
    }

    const settings = await svc.entities.SelfRegProgram.list();
    const setting = matchSettings(settings, area, program_id || null, program_name);
    if (!setting || !setting.enabled) {
      return Response.json({ error: 'This program is not open for self-registration right now' }, { status: 400 });
    }

    // ELL active-learner restriction: the requester must have selected their
    // name from the active-learner roster.
    if (area === 'ell' && restrictionActive(setting) && !learner_id) {
      return Response.json({ error: 'Registration for this course is currently limited to active learners — your name was not found on the active list' }, { status: 403 });
    }

    const record = {
      area,
      program_id: program_id || null,
      program_name: program_name || '',
      session_id: session_id || null,
      session_name: session_name || null,
      session_date: session_date || null,
      first_name, last_name,
      phone: phone || null,
      email: email || null,
      parent_guardian_name: parent_guardian_name || null,
      parent_guardian_phone: parent_guardian_phone || null,
      parent_guardian_email: parent_guardian_email || null,
      learner_id: learner_id || null,
      notes: notes || null,
      status: 'pending',
    };
    const created = await svc.entities.SelfRegRequest.create(record);

    const requireApproval = setting.require_approval !== false;
    if (!requireApproval) {
      await applySelfRegAction(svc, { ...record, id: created.id }, 'approve');
      await svc.entities.SelfRegRequest.update(created.id, {
        status: 'approved',
        auto_approved: true,
        reviewed_by_name: 'Auto-approved (no registrar approval required)',
        reviewed_date: todayStr(),
      });
      return Response.json({ status: 'approved', auto: true });
    }

    return Response.json({ status: 'pending' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}