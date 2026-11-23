import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  familyRowsForCode,
  familyView,
  sendRegistrationConfirmation,
} from '../../shared/giftShopCheckin.ts';

// The check-in desk, in three moves:
//   confirm — staff finishing a registration taken at the desk stamp the
//             family's six-digit code and email their confirmation.
//   lookup  — a family's phone, opened from the desk QR code, reads back what
//             they registered for once they type their code.
//   submit  — they type their own name; it is written to the registrations (so
//             it is the name on the parent or guardian tag) and to the desk
//             session, which is what makes the desk computer print the tag.
// The desk QR code carries a long random session token, so the six-digit code
// is only ever useful at the desk it belongs to.
const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 12;

const cleanCode = (value) => String(value || '').replace(/\D/g, '').slice(0, 6);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const service = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'lookup');

    if (action === 'confirm') {
      const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const ids = Array.isArray(body.registration_ids) ? body.registration_ids.filter(Boolean) : [];
      if (!ids.length) return Response.json({ error: 'registration_ids is required' }, { status: 400 });

      const rows = await base44.entities.ProgramRegistration.filter({ id: { $in: ids } });
      const result = await sendRegistrationConfirmation(base44, rows || []);
      return Response.json(result);
    }

    const sessionToken = String(body.session_token || '').trim();
    if (!sessionToken) {
      return Response.json({ error: 'Open this page from the QR code at the check-in desk.' }, { status: 400 });
    }

    const sessions = await service.entities.GiftShopDeskSession.filter({ token: sessionToken });
    const session = (sessions || [])[0];
    if (!session || session.status !== 'active') {
      return Response.json({ error: 'This check-in desk is not open. Please ask a volunteer for help.' }, { status: 410 });
    }

    const code = cleanCode(body.code);
    if (code.length !== 6) {
      return Response.json({ error: 'Enter the six-digit code from your confirmation email.' }, { status: 400 });
    }

    // A short code is only safe while it cannot be guessed through: repeated
    // misses on one desk are locked out for a few minutes.
    const lastFailure = session.last_failed_at ? new Date(session.last_failed_at).getTime() : 0;
    const recentFailures = Date.now() - lastFailure < FAILURE_WINDOW_MS ? Number(session.failed_lookups) || 0 : 0;
    if (recentFailures >= MAX_FAILURES) {
      return Response.json({ error: 'Too many tries at this desk. Please ask a volunteer for help.' }, { status: 429 });
    }

    const rows = await familyRowsForCode(service, code);
    if (!rows.length) {
      await service.entities.GiftShopDeskSession.update(session.id, {
        failed_lookups: recentFailures + 1,
        last_failed_at: new Date().toISOString(),
      });
      return Response.json(
        { error: 'We could not find a registration with that code. Check the code in your confirmation email and try again.' },
        { status: 404 },
      );
    }

    if (action === 'submit') {
      const name = String(body.guardian_name || '').trim();
      if (!name) {
        return Response.json({ error: 'Enter your name as you would like it on your name tag.' }, { status: 400 });
      }

      await service.entities.ProgramRegistration.bulkUpdate(
        rows.map(row => ({ id: row.id, parent_guardian_name: name })),
      );

      await service.entities.GiftShopDeskSession.update(session.id, {
        arrival_guardian_name: name,
        arrival_code: code,
        arrival_registration_ids: rows.map(row => row.id),
        arrival_at: new Date().toISOString(),
        printed_at: null,
        failed_lookups: 0,
        last_failed_at: null,
      });

      return Response.json({
        ok: true,
        family: familyView(rows.map(row => ({ ...row, parent_guardian_name: name }))),
      });
    }

    return Response.json({ ok: true, family: familyView(rows) });
  } catch (error) {
    console.log('giftShopCheckin failed:', error.message);
    return Response.json({ error: 'Something went wrong. Please ask a volunteer for help.' }, { status: 500 });
  }
}