import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public form submission for EmpowerU cohort applications (sent out as a
// per-cohort registration link). Creates an EmpowerUApplication awaiting
// staff approval — no portal access, and no participant profile is built
// until staff approve the application.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    // Honeypot — reject bots
    if (data.website) return Response.json({ success: true });

    if (!data.first_name?.trim() || !data.last_name?.trim()) {
      return Response.json({ error: 'First and last name are required' }, { status: 400 });
    }
    if (!data.consent_agreed) {
      return Response.json({ error: 'The Release of Information agreement must be accepted to submit the application' }, { status: 400 });
    }
    if (!data.cohort_id) return Response.json({ error: 'Missing cohort' }, { status: 400 });

    const cohort = await base44.asServiceRole.entities.EmpowerUCohort.get(data.cohort_id).catch(() => null);
    if (!cohort || !cohort.id) return Response.json({ error: 'This registration link is no longer valid' }, { status: 400 });
    if (!cohort.registration_open) return Response.json({ error: 'Registration for this cohort is currently closed' }, { status: 400 });

    await base44.asServiceRole.entities.EmpowerUApplication.create({
      cohort_id: cohort.id,
      cohort_name: cohort.name || null,
      status: 'pending',
      application_date: data.application_date || new Date().toISOString().split('T')[0],
      consent_agreed: true,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || null,
      marital_status: data.marital_status || null,
      self_identification: data.self_identification || null,
      citizenship: data.citizenship || null,
      arrival_canada: data.arrival_canada?.trim() || null,
      country_of_origin: data.country_of_origin?.trim() || null,
      family_language: data.family_language || null,
      high_school_completed: data.high_school_completed || null,
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      emergency_contact: data.emergency_contact?.trim() || null,
      referral_organization: data.referral_organization?.trim() || null,
      photo_consent: data.photo_consent || null,
      learned_about_candora: data.learned_about_candora || null,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});