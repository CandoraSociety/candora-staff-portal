import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Use service role so permissions created by admins are visible to the user they apply to.
    const permissions = await base44.asServiceRole.entities.AccessPermission.filter({
      scope_type: 'individual',
      scope_value: user.email,
      is_active: true,
    });

    return Response.json({ permissions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});