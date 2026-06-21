import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const INTEGRATION_TOKEN = Deno.env.get('INTEGRATION_TOKEN');
    if (!INTEGRATION_TOKEN || token !== INTEGRATION_TOKEN) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { command, payload = {} } = body;
    if (!command) return Response.json({ error: 'Missing command' }, { status: 400 });
    const base44 = createClientFromRequest(req);
    switch (command) {
      case 'ping': return Response.json({ ok: true, message: 'Candora Board app is alive', timestamp: new Date().toISOString() });
      case 'get_status': {
        const meetings = await base44.asServiceRole.entities.Meeting.list();
        const members = await base44.asServiceRole.entities.BoardMember.list();
        return Response.json({ ok: true, app: 'CandoraBoard', timestamp: new Date().toISOString(), stats: { total_meetings: meetings.length, upcoming_meetings: meetings.filter(m => m.status === 'upcoming').length, total_members: members.length, active_members: members.filter(m => m.status === 'active').length } });
      }
      case 'update_branding': {
        const { primary_color, secondary_color, background_color, logo_url } = payload;
        return Response.json({ ok: true, message: 'Branding update received', payload });
      }
      case 'update_app_name': {
        const { app_name } = payload;
        if (!app_name) return Response.json({ error: 'Missing app_name in payload' }, { status: 400 });
        return Response.json({ ok: true, message: 'App name updated', app_name });
      }
      default: return Response.json({ error: `Unknown command: ${command}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});