import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public: cohort info shown at the top of the EmpowerU application form
// (opened from a cohort's public registration link). No auth — anyone with
// the link sees only the cohort details below, never the portal.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cohort_id } = await req.json().catch(() => ({}));
    if (!cohort_id) return Response.json({ error: 'Missing cohort id' }, { status: 400 });

    const cohort = await base44.asServiceRole.entities.EmpowerUCohort.get(cohort_id).catch(() => null);
    if (!cohort || !cohort.id) return Response.json({ error: 'not_found' }, { status: 404 });

    return Response.json({
      cohort: {
        id: cohort.id,
        name: cohort.name,
        start_date: cohort.start_date || null,
        end_date: cohort.end_date || null,
        delivery_mode: cohort.delivery_mode || null,
        location: cohort.location || null,
        registration_open: !!cohort.registration_open,
        registration_deadline: cohort.registration_deadline || null,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});