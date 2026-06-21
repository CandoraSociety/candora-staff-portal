import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const INTEGRATION_TOKEN = Deno.env.get('INTEGRATION_TOKEN');
    if (token !== INTEGRATION_TOKEN) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { integration_id, integration_name, code } = body;
    console.log(`Received integration from Beacon: ${integration_name}`);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});