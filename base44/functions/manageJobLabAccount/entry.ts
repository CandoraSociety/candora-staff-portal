import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Staff-side Job Lab account management, called from the Pathways client profile.
// Job Lab participant data is admin-read only, so everything here runs on the
// service role after confirming the caller is a signed-in staff member.

const pageOf = (page) => (Array.isArray(page) ? page : page?.items || []);

const clean = (participant) => {
  if (!participant) return null;
  const { password_hash, session_token, ...rest } = participant;
  return rest;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const clientId = String(body.clientId || '').trim();
    if (!clientId) return Response.json({ error: 'clientId is required' }, { status: 400 });

    const getClient = () =>
      db.entities.Client.get(clientId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));

    // A Job Lab participant is linked to the client through pathways_client_id.
    // An account created before the link existed is picked up by the client's email.
    const findParticipant = async () => {
      const linked = pageOf(await db.entities.Participant.filter({ pathways_client_id: clientId, is_guest: false }));
      if (linked.length) return linked[0];

      const client = await getClient();
      const email = String(client?.email || '').trim().toLowerCase();
      if (!email) return null;

      const byEmail = pageOf(await db.entities.Participant.filter({ email, is_guest: false }));
      if (!byEmail.length) return null;

      const participant = await db.entities.Participant.update(byEmail[0].id, { pathways_client_id: clientId });
      return participant;
    };

    if (action === 'getAccount') {
      const participant = await findParticipant();
      return Response.json({ account: clean(participant) });
    }

    if (action === 'getActivity') {
      const participant = await findParticipant();
      if (!participant) {
        return Response.json({ account: null, visits: [], applications: [], resumes: [], paths: [] });
      }
      const [visits, applications, resumes, paths] = await Promise.all([
        db.entities.VisitLog.filter({ participant_id: participant.id }, { sort: '-visit_date', limit: 100 }).then(pageOf),
        db.entities.JobApplication.filter({ participant_id: participant.id }, { sort: '-created_date', limit: 100 }).then(pageOf),
        db.entities.Resume.filter({ participant_id: participant.id }, { sort: '-created_date', limit: 50 }).then(pageOf),
        db.entities.CareerPath.filter({ participant_id: participant.id }, { sort: '-created_date', limit: 50 }).then(pageOf),
      ]);
      return Response.json({ account: clean(participant), visits, applications, resumes, paths });
    }

    if (action === 'createAccount') {
      if (await findParticipant()) {
        return Response.json({ error: 'This client already has a Job Lab account.' }, { status: 409 });
      }
      const client = await getClient();
      if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

      const password = String(body.password || '');
      if (password.length < 4) return Response.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });

      const name = String(body.name || `${client.first_name || ''} ${client.last_name || ''}`).trim();
      const email = String(body.email || client.email || '').trim().toLowerCase();
      if (!name) return Response.json({ error: 'Enter the name the client will sign in with.' }, { status: 400 });
      if (!email) return Response.json({ error: 'Add an email address for the client first.' }, { status: 400 });

      const taken = pageOf(await db.entities.Participant.filter({ email, is_guest: false }));
      if (taken.length) {
        return Response.json({ error: 'Another Job Lab account already uses this email address.' }, { status: 409 });
      }

      const phone = String(client.phone || '').trim();
      const participant = await db.entities.Participant.create({
        name,
        email,
        phone,
        password_hash: password,
        session_token: '',
        is_guest: false,
        total_visits: 0,
        education: [],
        experience: [],
        skills: [],
        interests: [],
        career_goals: client.career_objectives || '',
        pathways_client_id: clientId,
      });

      // Keep the client's contact details current if the account supplied a phone.
      if (!client.phone && phone) {
        await db.entities.Client.update(clientId, { phone }).catch(() => {});
      }

      return Response.json({ account: clean(participant) });
    }

    if (action === 'resetPassword') {
      const participant = await findParticipant();
      if (!participant) return Response.json({ error: 'No Job Lab account on this client yet.' }, { status: 404 });

      const password = String(body.password || '');
      if (password.length < 4) return Response.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });

      const updated = await db.entities.Participant.update(participant.id, {
        password_hash: password,
        session_token: '',
      });
      return Response.json({ account: clean(updated) });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}