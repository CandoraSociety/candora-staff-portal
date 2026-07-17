import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    // Basic validation
    if (!data.first_name?.trim() || !data.last_name?.trim()) {
      return Response.json({ error: 'First and last name are required' }, { status: 400 });
    }

    // Honeypot field — reject bots
    if (data.website) {
      return Response.json({ success: true });
    }

    const today = new Date().toISOString().split('T')[0];

    const client = await base44.asServiceRole.entities.Client.create({
      first_name: data.first_name?.trim(),
      last_name: data.last_name?.trim(),
      date_of_birth: data.date_of_birth || null,
      sex: (data.sex && data.sex !== 'prefer_not') ? data.sex : null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim().toLowerCase() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state || 'AB',
      zip: data.zip?.trim() || null,
      residency_status: data.residency_status || null,
      clb_level: data.clb_level || null,
      employment_status: data.employment_status || null,
      career_objectives: data.career_objectives?.trim() || null,
      employment_history: data.employment_history || null,
      education_history: data.education_history || null,
      barrier_description: data.barrier_description?.trim() || null,
      intake_notes: data.additional_notes?.trim() || null,
      status: 'new',
      referral_source: 'self',
      self_registered: true,
      intake_date: today,
    });

    return Response.json({ success: true, clientId: client.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});