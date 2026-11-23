import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendRegistrationConfirmation } from '../../shared/giftShopCheckin.ts';

// Staff finishing a registration taken at the desk: the family's six-digit
// check-in code is stamped on their registrations and emailed to them with
// what they registered for. The family's own check-in runs on the standalone
// page served by giftShopCheckinForm — never inside the portal.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.registration_ids) ? body.registration_ids.filter(Boolean) : [];
    if (!ids.length) return Response.json({ error: 'registration_ids is required' }, { status: 400 });

    const rows = await base44.entities.ProgramRegistration.filter({ id: { $in: ids } });
    const result = await sendRegistrationConfirmation(base44, rows || []);
    return Response.json(result);
  } catch (error) {
    console.log('giftShopCheckin failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}