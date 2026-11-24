import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Opens an interview preparation guide from its share link. The long random
// token in the link is the only key, so the spokesperson does not need an app
// account. Only published guides are returned.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json().catch(() => ({}));
    if (!token || !String(token).trim()) {
      return Response.json({ error: 'A guide link is required.' }, { status: 400 });
    }

    const { items: guides } = await base44.asServiceRole.entities.InterviewGuide.filter(
      { token: String(token).trim() },
      { limit: 1 }
    );
    const guide = guides[0];
    if (!guide || guide.status !== 'published') {
      return Response.json({ error: 'This guide is not available.' }, { status: 404 });
    }

    const { items: questions } = await base44.asServiceRole.entities.InterviewGuideQuestion.filter(
      { guide_id: guide.id },
      { sort: 'display_order', limit: 100 }
    );

    return Response.json({
      guide: {
        ...guide,
        created_by_id: undefined,
        created_by_name: undefined,
        assigned_to_email: undefined,
      },
      questions,
    });
  } catch (error) {
    console.error('getPublicInterviewGuide failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}