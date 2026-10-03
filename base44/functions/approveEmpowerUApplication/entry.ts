import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { properUserName } from '../../shared/userName.ts';

// Staff review of EmpowerU applications submitted from the public cohort
// registration link (used from both the EmpowerU portal and the Central
// Registration portal). Approving builds the participant profile, adds them
// to the cohort as a registration, and the existing EmpowerU → Central
// Database sync workflow picks up the new participant automatically.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { application_id, action, review_notes } = await req.json().catch(() => ({}));
    if (!application_id || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const application = await base44.entities.EmpowerUApplication.get(application_id);
    if (!application || application.status !== 'pending') {
      return Response.json({ error: 'Application not found or already reviewed' }, { status: 400 });
    }

    const reviewer = properUserName(user);
    const today = new Date().toISOString().split('T')[0];

    if (action === 'reject') {
      await base44.entities.EmpowerUApplication.update(application_id, {
        status: 'rejected',
        reviewed_by_name: reviewer,
        reviewed_date: today,
        review_notes: review_notes || null,
      });
      return Response.json({ ok: true, status: 'rejected' });
    }

    // Approving a waitlist applicant: their participant profile and cohort
    // registration already exist (linked via application_id) — reuse them
    // instead of creating duplicates.
    const existingRes = await base44.entities.EmpowerURegistration.filter({ application_id: application_id });
    const existingList = Array.isArray(existingRes) ? existingRes : (existingRes.items || []);
    const existingReg = existingList.find(r => r.participant_id) || null;

    if (existingReg) {
      await base44.entities.EmpowerURegistration.update(existingReg.id, {
        status: 'enrolled',
        cp_registration_form: true,
      });
      await base44.entities.EmpowerUApplication.update(application_id, {
        status: 'approved',
        participant_id: existingReg.participant_id,
        reviewed_by_name: reviewer,
        reviewed_date: today,
        review_notes: review_notes || null,
      });
      return Response.json({ ok: true, status: 'approved', participant_id: existingReg.participant_id });
    }

    // Approve: build the participant profile from the application
    const participant = await base44.entities.EmpowerUParticipant.create({
      first_name: application.first_name,
      last_name: application.last_name,
      date_of_birth: application.date_of_birth || null,
      gender: application.gender || null,
      marital_status: application.marital_status || null,
      self_identification: application.self_identification || null,
      citizenship: application.citizenship || null,
      arrival_canada: application.arrival_canada || null,
      country_of_origin: application.country_of_origin || null,
      family_language: application.family_language || null,
      high_school_completed: application.high_school_completed || null,
      phone: application.phone || null,
      email: application.email || null,
      address: application.address || null,
      emergency_contact: application.emergency_contact || null,
      referral_organization: application.referral_organization || null,
      photo_consent: application.photo_consent || null,
      learned_about_candora: application.learned_about_candora || null,
      application_id: application.id,
      referral_source: application.learned_about_candora || null,
    });

    await base44.entities.EmpowerURegistration.create({
      participant_id: participant.id,
      participant_name: `${application.first_name} ${application.last_name}`,
      cohort_id: application.cohort_id,
      cohort_name: application.cohort_name || null,
      registration_date: today,
      status: 'enrolled',
      intake_notes: 'Enrolled via the public application form (approved).',
      // The Registration Form completion checkpoint is automatically satisfied —
      // the participant entered through the cohort registration form.
      cp_registration_form: true,
    });

    await base44.entities.EmpowerUApplication.update(application_id, {
      status: 'approved',
      participant_id: participant.id,
      reviewed_by_name: reviewer,
      reviewed_date: today,
      review_notes: review_notes || null,
    });

    return Response.json({ ok: true, status: 'approved', participant_id: participant.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}