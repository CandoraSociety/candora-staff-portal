import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Entity automation: fires when a PurchaseRequest is updated. If it's an
// exposure_course that was just approved with payment details and not yet
// linked to a FinancialRecord, create that FinancialRecord, link it back to
// the request, and sync the cumulative month total to the CRT Invoice Tracker
// columns CF (DEA clients) / CG (WD clients).
//
// This makes the billing automation fire on the actual database state change,
// so it works reliably even if the determination dialog's frontend bundle is
// stale at approval time. Idempotent — skips when the request isn't an approved
// exposure course, payment details are missing, or a FinancialRecord is already
// linked (so re-triggers from our own linking update are harmless).

export default async function(req: Request): Promise<Response> {
  try {
    let payload: any = {};
    try { payload = await req.json(); } catch {}
    const data = payload?.data;
    const entityId = payload?.event?.entity_id;

    if (!data || data.request_type !== 'exposure_course' || data.status !== 'approved') {
      return Response.json({ status: 'skipped', reason: 'not an approved exposure course' });
    }
    if (data.linked_financial_record_id) {
      return Response.json({ status: 'skipped', reason: 'already linked', linked_financial_record_id: data.linked_financial_record_id });
    }
    if (!data.purchase_date || data.amount_without_tax == null || data.tax == null) {
      return Response.json({ status: 'skipped', reason: 'missing payment details' });
    }

    const base44 = createClientFromRequest(req);
    const amt = Number(data.amount_without_tax) || 0;
    const tx = Number(data.tax) || 0;
    const tot = Number(data.total) || (amt + tx);
    const billingMonth = String(data.purchase_date).slice(0, 7);
    const courseLabel = data.course_type === 'Other' && data.course_type_other ? data.course_type_other : (data.course_type || 'Exposure Course');

    const fr = await base44.entities.FinancialRecord.create({
      client_id: data.client_id,
      client_name: data.client_name,
      assigned_worker: data.assigned_worker || data.requested_by,
      record_type: 'exposure_course',
      course_type: data.course_type,
      course_type_other: data.course_type_other,
      course_link: data.course_link,
      course_identifier: data.course_identifier,
      description: data.description || courseLabel,
      amount: amt,
      tax: tx,
      total: tot,
      date: data.purchase_date,
      vendor: data.vendor,
      billing_month: billingMonth,
      receipt_urls: data.receipt_url ? [data.receipt_url] : [],
      completion_status: 'completed',
      notes: data.purchase_notes || '',
    });

    await base44.entities.PurchaseRequest.update(entityId, { linked_financial_record_id: fr.id });

    let syncResult: any = null;
    try {
      const r = await base44.functions.invoke('syncExposureCoursesToInvoiceTracker', { billing_month: billingMonth });
      syncResult = r?.data || null;
    } catch (e: any) { syncResult = { error: e?.message || String(e) }; }

    return Response.json({ status: 'success', financial_record_id: fr.id, billing_month: billingMonth, sync: syncResult });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}