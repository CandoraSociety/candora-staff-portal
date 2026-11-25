import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Looks up the families on a Kids Gift Shop invitation list in the Central
// Database. A list often carries only a phone number or only an email address —
// sometimes no name at all — so each row is matched on whichever of the three it
// has, and the details the Central Database already holds are offered back for
// staff to confirm before they are used.

const digits = (value) => String(value || '').replace(/\D/g, '');
const phoneKey = (value) => {
  const all = digits(value);
  return all.length >= 10 ? all.slice(-10) : '';
};
const normalizeName = (value) =>
  String(value || '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
const fullName = (client) => `${client.first_name || ''} ${client.last_name || ''}`.trim();

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const families = Array.isArray(body.families) ? body.families : [];
    if (!families.length) return Response.json({ matches: [] });

    // The Central Database is small enough to read in full, so a phone number
    // written any way at all still finds the same family.
    const clients = (await base44.entities.RCClient.list()) || [];

    const byEmail = new Map();
    const byPhone = new Map();
    const byName = new Map();
    clients.forEach((client) => {
      const email = String(client.email || '').toLowerCase().trim();
      if (email && !byEmail.has(email)) byEmail.set(email, client);
      const phone = phoneKey(client.phone);
      if (phone && !byPhone.has(phone)) byPhone.set(phone, client);
      const name = normalizeName(fullName(client));
      if (name && !byName.has(name)) byName.set(name, client);
    });

    const matches = [];
    families.forEach((family, index) => {
      const email = String(family?.guardian_email || '').toLowerCase().trim();
      const phone = phoneKey(family?.guardian_phone);
      const name = normalizeName(family?.guardian_name);

      let client = null;
      const matchedOn = [];
      if (email && byEmail.has(email)) { client = byEmail.get(email); matchedOn.push('email'); }
      else if (phone && byPhone.has(phone)) { client = byPhone.get(phone); matchedOn.push('phone'); }
      else if (name && byName.has(name)) { client = byName.get(name); matchedOn.push('name'); }
      if (!client) return;

      // Only the details the list is missing are offered — nothing already on
      // the list is ever replaced from the Central Database.
      const fill = {};
      const known = fullName(client);
      if (!String(family?.guardian_name || '').trim() && known) fill.guardian_name = known;
      if (!String(family?.guardian_email || '').trim() && client.email) fill.guardian_email = String(client.email).trim();
      if (!String(family?.guardian_phone || '').trim() && client.phone) fill.guardian_phone = String(client.phone).trim();
      if (!Object.keys(fill).length) return;

      matches.push({
        index,
        client_id: client.id,
        name: known,
        email: client.email || '',
        phone: client.phone || '',
        matched_on: matchedOn,
        fill,
      });
    });

    return Response.json({ matches });
  } catch (error) {
    console.log('findGiftShopCentralFamilies failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}