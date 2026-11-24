import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendAnnualDonationReceipts } from '../../shared/donorThankYou.ts';

const FALLBACK_APP_URL = 'https://candora-360.base44.app';

// Issues one consolidated tax receipt to every supporter who gave monthly during
// the year, and emails it with the receipt attached. The Annual Donation Tax
// Receipts workflow calls it on January 2; it can also be run by staff with a
// year, to re-issue for an earlier year if anything was missed.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const appUrl = req.headers.get('X-Base44-App-Url') || FALLBACK_APP_URL;

    const result = await sendAnnualDonationReceipts(base44, {
      year: body?.year,
      appUrl,
    });

    return Response.json(result);
  } catch (error) {
    console.log('sendAnnualDonationReceipts failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}