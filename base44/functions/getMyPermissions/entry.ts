import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Use service role so permissions created by admins are visible to the user they apply to.
    if (!base44.asServiceRole) {
      console.error('getMyPermissions: asServiceRole is not available on the client');
      return Response.json({ permissions: [] });
    }

    let permissions = [];
    try {
      permissions = await base44.asServiceRole.entities.AccessPermission.filter({
        scope_type: 'individual',
        scope_value: user.email,
        is_active: true,
      });
    } catch (innerError) {
      console.error('getMyPermissions: service role query failed for', user.email, '-', innerError.message);
    }

    return Response.json({ permissions });
  } catch (error) {
    console.error('getMyPermissions error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});