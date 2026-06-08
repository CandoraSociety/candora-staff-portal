import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { volunteerId, temporaryPassword } = await req.json();
    
    if (!volunteerId || !temporaryPassword) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hash the password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(temporaryPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update volunteer record
    await base44.entities.Volunteer.update(volunteerId, {
      password_hash: passwordHash,
      must_change_password: true,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});