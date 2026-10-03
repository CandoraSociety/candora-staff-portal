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

    const application = await base44.asServiceRole.entities.EmpowerUApplication.create({
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

    // Personal waitlist link: move the matching waitlist entry off the
    // waitlist the moment the form is submitted — the application becomes
    // pending and the registration is marked as having applied. The waitlist
    // entry is only moved when the submitted (locked) name matches, so a
    // forwarded or tampered link can't pull someone else off the waitlist.
    const submittedName = `${data.first_name.trim()} ${data.last_name.trim()}`.toLowerCase();
    const nameMatches = (r) => (r.participant_name || '').trim().toLowerCase() === submittedName;

    let waitlistReg = null;
    if (data.waitlist_reg_id) {
      const candidate = await base44.asServiceRole.entities.EmpowerURegistration.get(data.waitlist_reg_id).catch(() => null);
      if (candidate && candidate.status === 'waitlisted' && nameMatches(candidate)) waitlistReg = candidate;
    }
    if (!waitlistReg) {
      // Fallback for links without the token (or a mismatched token): match by cohort + name
      const res = await base44.asServiceRole.entities.EmpowerURegistration.filter({ cohort_id: cohort.id, status: 'waitlisted' });
      const list = Array.isArray(res) ? res : (res.items || []);
      waitlistReg = list.find(nameMatches) || null;
    }

    if (waitlistReg) {
      await base44.asServiceRole.entities.EmpowerURegistration.update(waitlistReg.id, {
        status: 'registered',
        application_id: application.id,
        intake_notes: `${waitlistReg.intake_notes ? `${waitlistReg.intake_notes} ` : ''}Moved from waitlist — application submitted via the personal registration link.`,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});