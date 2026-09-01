import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { mapClientToCrtRow } from '../../shared/crtWorkbook.ts';

// Returns the 25-column CRT Client Data row for a single client, derived from
// the live Client entity (the source of truth) using the same mapping the CRT
// sync uses (mapClientToCrtRow, no month gating = full current data). Used by
// the inline CRT editor when a monthly workbook is archived/missing or has no
// row for the client — so the editor always shows current values to correct.

const KEYS = [
  'participant_name', 'hsid', 'ceis_dea', 'dea_start_date', 'service_element',
  'service_start_date', 'service_outcome', 'service_outcome_date',
  'placement_outcome', 'placement_outcome_date', 'day30_outcome', 'day30_outcome_date',
  'day60_outcome', 'day60_outcome_date', 'day90_outcome', 'day90_outcome_date',
  'day180_outcome', 'day180_outcome_date', 'comments', 'eda_completion_date',
  'work_exposure', 'wage_subsidy', 'employed_ftpt', 'service_nav_support', 'service_nav_billing_month',
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload: any = {};
    try { payload = await req.json(); } catch { /* no body */ }
    const clientId = String(payload.client_id || '').trim();
    if (!clientId) return Response.json({ error: 'client_id required' }, { status: 400 });

    const client = await base44.asServiceRole.entities.Client.get(clientId);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

    const row = mapClientToCrtRow(client, null); // null monthEnd = no month gating
    const obj: Record<string, string> = {};
    KEYS.forEach((k, i) => { obj[k] = row[i] != null ? String(row[i]) : ''; });

    return Response.json({ status: 'success', row: obj });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}