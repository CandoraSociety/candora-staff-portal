import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildSelfRegCatalog } from '../../shared/selfReg.ts';

// Public (QR-code) endpoint — no auth. Returns only the programs that have
// self-registration enabled, with their upcoming sessions and (for restricted
// ELL courses) the active-learner roster. Exposes nothing else.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const catalog = await buildSelfRegCatalog(base44.asServiceRole);
    return Response.json(catalog);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}