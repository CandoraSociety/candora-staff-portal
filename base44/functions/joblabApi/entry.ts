import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Job Lab API — every Job Lab read/write goes through here so anonymous kiosk
// visitors never touch the staff app's data, and staff-portal users never see
// participant rows (the entities themselves are admin-read only).
//
// A participant is identified by their record id plus a random session token
// issued at sign-in, stored on the record and held by the browser tab.

const clean = (p) => {
  if (!p) return null;
  const { password_hash, session_token, ...rest } = p;
  return rest;
};

const newToken = () => crypto.randomUUID();

const onsiteOrOffsite = (value) => (value === 'onsite' ? 'onsite' : 'offsite');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    if (!action) return Response.json({ error: 'Missing action' }, { status: 400 });

    const now = new Date().toISOString();

    const logVisit = (participant) =>
      db.entities.VisitLog.create({
        participant_id: participant.id,
        participant_name: participant.name || 'Guest',
        participant_email: participant.email || '',
        is_guest: !!participant.is_guest,
        visit_date: now,
        location_type: onsiteOrOffsite(body.locationType),
      });

    // Every Job Lab sign-in also files the visitor as a casual client in the
    // Pathways CM portal, and keeps their visit stats on a stat row the
    // Pathways reports read. These clients are never pushed to the Central
    // Database — nobody has checked them for duplicates yet.
    const syncCasualClient = async (participant) => {
      const stamp = new Date().toISOString();
      const email = String(participant.email || '').trim().toLowerCase();
      const phone = String(participant.phone || '').trim();
      const site = onsiteOrOffsite(body.locationType);
      const parts = String(participant.name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = parts[0] || 'Job Lab';
      const lastName = parts.slice(1).join(' ') || 'Visitor';
      const registered = !participant.is_guest;

      let stat = null;
      if (participant.pathways_client_id) {
        const rows = await db.entities.JobLabClientStat.filter({ client_id: participant.pathways_client_id });
        stat = rows[0] || null;
      }
      if (!stat && email) {
        const rows = await db.entities.JobLabClientStat.filter({ email });
        stat = rows[0] || null;
      }
      if (!stat && !email && participant.name) {
        const rows = await db.entities.JobLabClientStat.filter({ full_name: participant.name, has_account: false });
        stat = rows[0] || null;
      }

      let clientId = stat?.client_id || '';
      if (!stat) {
        // Accounts set up from a Pathways client profile carry that client's id —
        // their visits belong to the existing file, never a new casual client.
        clientId = participant.pathways_client_id || '';
        if (!clientId) {
          const client = await db.entities.Client.create({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            service_type: 'casual',
            status: 'active',
            intake_date: stamp.slice(0, 10),
            intake_notes: registered
              ? 'Casual client created automatically from a Job Lab registration.'
              : 'Casual client created automatically from a Job Lab guest session — no registered Job Lab account.',
          });
          clientId = client.id;
        }
        stat = await db.entities.JobLabClientStat.create({
          participant_id: participant.id,
          client_id: clientId,
          full_name: participant.name || 'Guest',
          email,
          phone,
          has_account: registered,
          total_visits: 1,
          onsite_visits: site === 'onsite' ? 1 : 0,
          offsite_visits: site === 'offsite' ? 1 : 0,
          first_visit: stamp,
          last_visit: stamp,
        });
      } else {
        stat = await db.entities.JobLabClientStat.update(stat.id, {
          last_visit: stamp,
          total_visits: (stat.total_visits || 0) + 1,
          onsite_visits: (stat.onsite_visits || 0) + (site === 'onsite' ? 1 : 0),
          offsite_visits: (stat.offsite_visits || 0) + (site === 'offsite' ? 1 : 0),
          has_account: stat.has_account || registered,
          participant_id: registered ? participant.id : stat.participant_id,
          full_name: participant.name || stat.full_name,
          email: email || stat.email,
          phone: phone || stat.phone,
        });
        clientId = stat.client_id;
      }

      if (clientId && participant.pathways_client_id !== clientId) {
        await db.entities.Participant.update(participant.id, { pathways_client_id: clientId });
      }
      return clientId;
    };

    const recordArrival = async (participant) => {
      await logVisit(participant);
      await syncCasualClient(participant).catch((error) =>
        console.warn('Casual client sync failed:', error.message)
      );
    };

    // ---------- entry actions (no session yet) ----------
    if (action === 'register') {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!name || !email) return Response.json({ error: 'Please enter your name and email.' }, { status: 400 });
      if (password.length < 4) return Response.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });

      const existing = await db.entities.Participant.filter({ email, is_guest: false });
      if (existing.length) return Response.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });

      const token = newToken();
      const participant = await db.entities.Participant.create({
        name,
        email,
        phone: String(body.phone || '').trim(),
        password_hash: password,
        session_token: token,
        is_guest: false,
        total_visits: 1,
        last_visit: now,
        education: [],
        experience: [],
        skills: [],
        interests: [],
      });
      await recordArrival(participant);
      return Response.json({ participant: clean(participant), token });
    }

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email) return Response.json({ error: 'Please enter your email.' }, { status: 400 });

      const rows = await db.entities.Participant.filter({ email, is_guest: false });
      if (!rows.length) return Response.json({ error: 'No account found with that email. Please register first.' }, { status: 404 });
      const found = rows[0];
      if (found.password_hash !== password) return Response.json({ error: 'Incorrect password.' }, { status: 401 });

      const token = newToken();
      const participant = await db.entities.Participant.update(found.id, {
        session_token: token,
        total_visits: (found.total_visits || 1) + 1,
        last_visit: now,
      });
      await recordArrival(participant);
      return Response.json({ participant: clean(participant), token });
    }

    if (action === 'guest') {
      const name = String(body.name || '').trim() || 'Guest';
      const token = newToken();
      const participant = await db.entities.Participant.create({
        name,
        email: String(body.email || '').trim().toLowerCase(),
        phone: String(body.phone || '').trim(),
        session_token: token,
        is_guest: true,
        total_visits: 1,
        last_visit: now,
        education: [],
        experience: [],
        skills: [],
        interests: [],
      });
      await recordArrival(participant);
      return Response.json({ participant: clean(participant), token });
    }

    // ---------- everything below needs the participant's session ----------
    if (!body.participantId || !body.token) {
      return Response.json({ error: 'Please sign in again.' }, { status: 401 });
    }
    const me = await db.entities.Participant.get(body.participantId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!me || me.session_token !== body.token) {
      return Response.json({ error: 'Your session has ended. Please sign in again.' }, { status: 401 });
    }

    switch (action) {
      case 'getProfile':
        return Response.json({ participant: clean(me) });

      case 'saveProfile': {
        const allowed = ['name', 'phone', 'education', 'experience', 'skills', 'interests', 'career_goals'];
        const patch = {};
        allowed.forEach((key) => {
          if (body.profile && key in body.profile) patch[key] = body.profile[key];
        });
        const updated = await db.entities.Participant.update(me.id, patch);
        return Response.json({ participant: clean(updated) });
      }

      case 'listApplications': {
        const items = await db.entities.JobApplication.filter(
          { participant_id: me.id },
          { sort: '-created_date', limit: 200 }
        ).then((page) => (Array.isArray(page) ? page : page.items || []));
        return Response.json({ items });
      }

      case 'createApplication': {
        const created = await db.entities.JobApplication.create({ ...(body.data || {}), participant_id: me.id });
        return Response.json({ item: created });
      }

      case 'updateApplication': {
        const existing = await db.entities.JobApplication.get(body.id).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        );
        if (!existing || existing.participant_id !== me.id) return Response.json({ error: 'Not found' }, { status: 404 });
        const updated = await db.entities.JobApplication.update(body.id, body.data || {});
        return Response.json({ item: updated });
      }

      case 'deleteApplication': {
        const existing = await db.entities.JobApplication.get(body.id).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        );
        if (!existing || existing.participant_id !== me.id) return Response.json({ error: 'Not found' }, { status: 404 });
        await db.entities.JobApplication.delete(body.id);
        return Response.json({ ok: true });
      }

      case 'listResumes': {
        const items = await db.entities.Resume.filter(
          { participant_id: me.id },
          { sort: '-created_date', limit: 100 }
        ).then((page) => (Array.isArray(page) ? page : page.items || []));
        return Response.json({ items });
      }

      case 'createResume': {
        // Seeded once, at creation, from the participant's profile.
        const experience = (me.experience || []).map((e) => ({
          company: e.company || '',
          title: e.title || '',
          start_date: e.start_date || '',
          end_date: e.end_date || '',
          current: !!e.current,
          bullets: [e.description || ''],
        }));
        const education = (me.education || []).map((e) => ({
          institution: e.institution || '',
          degree: e.degree || '',
          field: e.field || '',
          start_year: e.start_year || '',
          end_year: e.end_year || '',
          achievements: '',
        }));
        const created = await db.entities.Resume.create({
          participant_id: me.id,
          title: body.title || 'My Resume',
          template: body.template || 'professional',
          objective: '',
          summary: '',
          experience,
          education,
          skills: me.skills || [],
          certifications: [],
          volunteer: [],
          references_available: true,
        });
        return Response.json({ item: created });
      }

      case 'updateResume': {
        const existing = await db.entities.Resume.get(body.id).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        );
        if (!existing || existing.participant_id !== me.id) return Response.json({ error: 'Not found' }, { status: 404 });
        const updated = await db.entities.Resume.update(body.id, body.data || {});
        return Response.json({ item: updated });
      }

      case 'deleteResume': {
        const existing = await db.entities.Resume.get(body.id).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        );
        if (!existing || existing.participant_id !== me.id) return Response.json({ error: 'Not found' }, { status: 404 });
        await db.entities.Resume.delete(body.id);
        return Response.json({ ok: true });
      }

      case 'listPaths': {
        const items = await db.entities.CareerPath.filter(
          { participant_id: me.id },
          { sort: '-created_date', limit: 100 }
        ).then((page) => (Array.isArray(page) ? page : page.items || []));
        return Response.json({ items });
      }

      case 'createPath': {
        const created = await db.entities.CareerPath.create({ ...(body.data || {}), participant_id: me.id });
        return Response.json({ item: created });
      }

      case 'updatePath': {
        const existing = await db.entities.CareerPath.get(body.id).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        );
        if (!existing || existing.participant_id !== me.id) return Response.json({ error: 'Not found' }, { status: 404 });
        const updated = await db.entities.CareerPath.update(body.id, body.data || {});
        return Response.json({ item: updated });
      }

      case 'deletePath': {
        const existing = await db.entities.CareerPath.get(body.id).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        );
        if (!existing || existing.participant_id !== me.id) return Response.json({ error: 'Not found' }, { status: 404 });
        await db.entities.CareerPath.delete(body.id);
        return Response.json({ ok: true });
      }

      case 'aiJobs': {
        const query = String(body.query || '').trim() || 'entry level jobs';
        const location = String(body.location || '').trim() || 'Alberta';
        const skills = (me.skills || []).slice(0, 12).join(', ');
        const latestRole = (me.experience || [])[0]?.title || '';
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Generate 8 realistic job listings for the search "${query}" in ${location}, Canada. Model them on postings that genuinely appear on Canadian job boards (Job Bank, Indeed, LinkedIn), with variety in employers, company size and seniority. Vary salary formats (hourly or annual, in CAD).

Candidate context — most recent role: ${latestRole || 'not provided'}. Skills: ${skills || 'not provided'}.

For each listing give a title, company, location, salary, type (Full-time / Part-time / Contract / Casual / Temporary), a two to three sentence description of the duties and requirements, a posted line such as "Posted 3 days ago", and a match_score from 0 to 100 for how well it fits the candidate's skills.`,
          response_json_schema: {
            type: 'object',
            properties: {
              jobs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    company: { type: 'string' },
                    location: { type: 'string' },
                    salary: { type: 'string' },
                    type: { type: 'string' },
                    description: { type: 'string' },
                    posted: { type: 'string' },
                    match_score: { type: 'number' },
                  },
                },
              },
            },
          },
        });
        return Response.json({ jobs: result?.jobs || [] });
      }

      case 'aiSummary': {
        const context = JSON.stringify({
          skills: me.skills || [],
          experience: me.experience || [],
          education: me.education || [],
        });
        const text = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Write a professional resume summary (2-3 sentences) for someone with this background: ${context}. Return only the summary text, no preamble or quotation marks.`,
        });
        return Response.json({ text: String(text || '').trim().replace(/^"|"$/g, '') });
      }

      case 'aiObjective': {
        const latestTitle = (me.experience || [])[0]?.title || 'their field';
        const text = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Write a professional objective statement (1-2 sentences) for someone targeting roles related to: ${latestTitle}. Return only the statement, no preamble or quotation marks.`,
        });
        return Response.json({ text: String(text || '').trim().replace(/^"|"$/g, '') });
      }

      case 'aiPath': {
        const currentRole = String(body.currentRole || '').trim() || 'entry-level';
        const targetRole = String(body.targetRole || '').trim();
        const years = Number(body.years) || 3;
        if (!targetRole) return Response.json({ error: 'Please enter a target role.' }, { status: 400 });
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Create a detailed, realistic career path from "${currentRole}" to "${targetRole}" over ${years} years in Alberta, Canada. The person's current skills: ${(me.skills || []).join(', ') || 'not provided'}. Their education: ${JSON.stringify(me.education || [])}.

Give 4 to 6 milestones in chronological order. Each milestone needs a title, a description of what to do and how, a target_date written as month and year (for example "June 2027"), and a list of specific skills needed for it. Also give the overall required_skills for the target role and a short required_education line.`,
          response_json_schema: {
            type: 'object',
            properties: {
              milestones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    target_date: { type: 'string' },
                    skills_needed: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              required_skills: { type: 'array', items: { type: 'string' } },
              required_education: { type: 'string' },
            },
          },
        });
        return Response.json({
          milestones: (result?.milestones || []).map((m) => ({ ...m, status: 'not_started' })),
          required_skills: result?.required_skills || [],
          required_education: result?.required_education || '',
        });
      }

      case 'localJobs': {
        const rows = await db.entities.JobLabJob.filter(
          { is_active: true },
          { sort: '-created_date', limit: 100 }
        ).then((page) => (Array.isArray(page) ? page : page.items || []));
        const today = new Date().toISOString().slice(0, 10);
        return Response.json({
          items: rows.filter((job) => !job.closing_date || job.closing_date >= today),
        });
      }

      case 'emailResume': {
        const to = String(body.to || me.email || '').trim();
        if (!to) return Response.json({ error: 'There is no email address on your profile.' }, { status: 400 });
        const sent = await base44.asServiceRole.integrations.Core.SendEmail({
          to,
          subject: body.title || 'My Resume',
          body: body.html || '',
          category: 'transactional',
        });
        return Response.json({ sent });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}