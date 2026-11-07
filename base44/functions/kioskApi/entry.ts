import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Customer-facing kiosk endpoint. Public: the tablet has no staff sign-in, so a
// station id + access code is what proves which counter this screen belongs to.
// Nothing else is exposed — only that station's open prompt and its own answers.

const code = (value) => String(value ?? '').trim();

async function stationFor(base44, stationId, accessCode) {
  if (!stationId || !accessCode) return null;
  try {
    const station = await base44.asServiceRole.entities.KioskStation.get(stationId);
    if (!station || station.is_active === false) return null;
    if (code(station.access_code).toLowerCase() !== code(accessCode).toLowerCase()) return null;
    return station;
  } catch {
    return null;
  }
}

async function brand(base44) {
  const fallback = { name: 'Candora', logo_url: '', primary_color: '#f5be19', secondary_color: '#0f1f6b' };
  try {
    const rows = await base44.asServiceRole.entities.OrgSettings.filter({}, '-created_date', 1);
    const settings = rows?.[0];
    if (!settings) return fallback;
    return {
      name: settings.org_name || fallback.name,
      logo_url: settings.logo_url || '',
      primary_color: settings.primary_color || fallback.primary_color,
      secondary_color: settings.secondary_color || fallback.secondary_color,
    };
  } catch {
    return fallback;
  }
}

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'pair') {
      if (!code(body.access_code)) {
        return Response.json({ error: 'Enter the code shown in the reception portal.' }, { status: 400 });
      }
      const matches = await base44.asServiceRole.entities.KioskStation.filter({ is_active: true }, '-created_date', 200);
      const station = (matches || []).find((row) => code(row.access_code).toLowerCase() === code(body.access_code).toLowerCase());
      if (!station) {
        return Response.json({ error: 'That code is not recognised. Check the code in the reception portal.' }, { status: 404 });
      }
      await base44.asServiceRole.entities.KioskStation.update(station.id, { last_seen: new Date().toISOString() });
      return Response.json({
        station: { id: station.id, name: station.name, access_code: station.access_code },
        brand: await brand(base44),
      });
    }

    // The front-desk tablet is a permanent fixture: it opens straight onto the
    // welcome screen and picks up its station on its own. A ?code= in its home
    // screen shortcut pins it to one station when more than one exists.
    if (action === 'station') {
      const rows = await base44.asServiceRole.entities.KioskStation.filter({ is_active: true }, '-created_date', 200);
      const active = rows || [];
      const wanted = code(body.access_code).toLowerCase();
      const match = wanted
        ? active.find((row) => code(row.access_code).toLowerCase() === wanted)
        : (active.length === 1 ? active[0] : null);
      if (!match) {
        return Response.json(
          { error: active.length ? 'More than one tablet is set up at the front desk.' : 'No front desk tablet is set up yet.' },
          { status: 404 },
        );
      }
      await base44.asServiceRole.entities.KioskStation.update(match.id, { last_seen: new Date().toISOString() });
      return Response.json({
        station: { id: match.id, name: match.name, access_code: match.access_code },
        brand: await brand(base44),
      });
    }

    const station = await stationFor(base44, body.station_id, body.access_code);
    if (!station) {
      return Response.json({ error: 'This tablet is no longer connected. Ask reception for a new code.' }, { status: 401 });
    }

    if (action === 'poll') {
      // Check in roughly once a minute so the reception portal can show a
      // connected indicator without a write on every poll.
      const lastSeen = station.last_seen ? new Date(station.last_seen).getTime() : 0;
      if (Date.now() - lastSeen > 55000) {
        await base44.asServiceRole.entities.KioskStation.update(station.id, { last_seen: new Date().toISOString() });
      }

      const open = await base44.asServiceRole.entities.KioskPrompt.filter(
        { station_id: station.id, status: { $in: ['sent', 'opened'] } },
        '-created_date',
        1,
      );
      let prompt = open?.[0] || null;
      if (prompt && prompt.status === 'sent') {
        prompt = await base44.asServiceRole.entities.KioskPrompt.update(prompt.id, {
          status: 'opened',
          viewed_at: new Date().toISOString(),
        });
      }
      return Response.json({ prompt, brand: await brand(base44) });
    }

    if (action === 'respond' || action === 'close') {
      const promptId = body.prompt_id;
      if (!promptId) return Response.json({ error: 'Missing prompt.' }, { status: 400 });
      let prompt;
      try {
        prompt = await base44.asServiceRole.entities.KioskPrompt.get(promptId);
      } catch {
        prompt = null;
      }
      if (!prompt || prompt.station_id !== station.id) {
        return Response.json({ error: 'That prompt is no longer available.' }, { status: 404 });
      }

      if (action === 'close') {
        const updated = await base44.asServiceRole.entities.KioskPrompt.update(promptId, { status: 'dismissed' });
        return Response.json({ prompt: updated });
      }

      const response = body.response || {};
      const update = {
        status: 'submitted',
        responded_at: new Date().toISOString(),
        response_name: code(response.name) || null,
        response_email: code(response.email) || null,
        response_phone: code(response.phone) || null,
        response_notes: code(response.notes) || null,
      };
      const amount = num(response.amount);
      if (amount !== null) update.response_amount = amount;
      const total = num(response.total);
      if (total !== null) update.response_total = total;
      if (Array.isArray(response.items)) {
        update.response_items = response.items
          .filter((item) => item && item.name)
          .map((item) => ({ name: String(item.name), price: num(item.price) || 0, quantity: num(item.quantity) || 1 }));
      }

      const updated = await base44.asServiceRole.entities.KioskPrompt.update(promptId, update);
      return Response.json({ prompt: updated });
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}