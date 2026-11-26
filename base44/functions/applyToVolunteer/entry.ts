import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// A volunteer application from the website. It is stored as submitted and nothing
// else: nobody is ever approved automatically, and the applicant and the role's
// coordinator are each emailed that it arrived.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (value, max = 2000) => String(value || '').trim().slice(0, max);

export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));

    const roleId = clean(body.role_id, 100);
    const fullName = clean(body.full_name, 160);
    const email = clean(body.email, 200).toLowerCase();
    const consent = body.consent === true;

    if (!roleId) return Response.json({ error: 'Choose a volunteer role.' }, { status: 400 });
    if (fullName.length < 2) return Response.json({ error: 'Please give your full name.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return Response.json({ error: 'Please give a valid email address.' }, { status: 400 });
    if (!consent) {
      return Response.json({ error: 'Please agree to your details being used for this application.' }, { status: 400 });
    }

    const role = await svc.entities.VolunteerRole
      .get(roleId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!role || role.is_open === false) {
      return Response.json({ error: 'That volunteer role is not open right now.' }, { status: 404 });
    }

    const existing = (await svc.entities.VolunteerApplication.filter(
      { role: role.id, email },
      { limit: 1 }
    )).items?.[0];
    if (existing) {
      return Response.json({ status: existing.status, role_title: role.title || '' });
    }

    const record = await svc.entities.VolunteerApplication.create({
      role: role.id,
      role_title: role.title || '',
      full_name: fullName,
      email,
      phone: clean(body.phone, 40),
      availability: clean(body.availability, 500),
      skills: clean(body.skills, 2000),
      experience: clean(body.experience, 2000),
      references: clean(body.references, 2000),
      consent,
      status: 'submitted',
      source: 'website',
    });

    const variables = {
      first_name: fullName.split(/\s+/)[0] || 'there',
      full_name: fullName,
      role_title: role.title || '',
      commitment_line: role.commitment || '',
      place_line: role.location_name || 'Candora Society of Edmonton',
      next_step: 'A staff member will read your application and be in touch. Nothing is confirmed until you hear from us.',
      cta_url: 'https://candora360.ca/get-involved',
      cta_label: 'Back to Get Involved',
    };

    try {
      await svc.integrations.Core.SendEmail({
        to: email,
        template_name: 'VolunteerApplicationReceived',
        category: 'transactional',
        variables,
      });
    } catch (error) {
      console.log('volunteer receipt email failed', error?.message || error);
    }

    if (role.coordinator_email) {
      try {
        await svc.integrations.Core.SendEmail({
          to: role.coordinator_email,
          template_name: 'VolunteerApplicationAlert',
          category: 'transactional',
          variables: {
            ...variables,
            applicant_name: fullName,
            applicant_email: email,
            applicant_phone: record.phone || 'not given',
            availability_line: record.availability || 'not given',
            skills_line: record.skills || 'not given',
            experience_line: record.experience || 'not given',
            references_line: record.references || 'not given',
            coordinator_name: role.coordinator_name || 'there',
          },
        });
      } catch (error) {
        console.log('volunteer coordinator email failed', error?.message || error);
      }
    }

    return Response.json({ status: 'submitted', role_title: role.title || '' });
  } catch (error) {
    console.log('applyToVolunteer failed:', error?.message || error);
    return Response.json({ error: 'The application could not be sent. Please try again.' }, { status: 500 });
  }
}