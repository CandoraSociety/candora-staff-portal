import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// A staff decision on a volunteer application. Nothing is ever approved by the
// website, so this is the only place an application changes status — and the
// applicant is told each time it does.
const clean = (value, max = 500) => String(value || '').trim().slice(0, max);

const DECISION_COPY = {
  in_review: {
    line: 'Your application is being read by our volunteer team.',
    next: 'We are looking at your application now and will be in touch shortly.',
  },
  approved: {
    line: 'Welcome aboard — your application has been approved.',
    next: 'Our volunteer coordinator will email you with the next steps, including any checks we arrange for you.',
  },
  declined: {
    line: 'Thank you for offering your time.',
    next: 'We are not able to take on new volunteers for this role right now. We would be glad to hear from you again.',
  },
  waitlisted: {
    line: 'Your application has been kept for a future opening.',
    next: 'We have held your application and will contact you when a place opens up.',
  },
};

export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const decision = clean(body.decision, 30);
    const copy = DECISION_COPY[decision];
    if (!copy) return Response.json({ error: 'Unknown decision' }, { status: 400 });

    const application = await svc.entities.VolunteerApplication
      .get(clean(body.id, 100))
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!application) return Response.json({ error: 'Application not found' }, { status: 404 });

    const reason = clean(body.reason, 500);
    await svc.entities.VolunteerApplication.update(application.id, {
      status: decision,
      ...(reason ? { decline_reason: reason } : {}),
      decided_by: user.full_name || user.email || '',
      decided_at: new Date().toISOString(),
    });

    try {
      await svc.integrations.Core.SendEmail({
        to: application.email,
        template_name: 'VolunteerApplicationDecision',
        category: 'transactional',
        variables: {
          first_name: String(application.full_name || '').split(/\s+/)[0] || 'there',
          full_name: application.full_name || '',
          role_title: application.role_title || '',
          status_line: copy.line,
          next_step: reason || copy.next,
          cta_url: 'https://candora360.ca/get-involved',
          cta_label: 'Get Involved',
        },
      });
    } catch (error) {
      console.log('volunteer decision email failed', error?.message || error);
    }

    const fresh = await svc.entities.VolunteerApplication.get(application.id);
    return Response.json({ application: fresh });
  } catch (error) {
    console.log('volunteerApplicationAdmin failed:', error?.message || error);
    return Response.json({ error: 'The decision could not be saved.' }, { status: 500 });
  }
}