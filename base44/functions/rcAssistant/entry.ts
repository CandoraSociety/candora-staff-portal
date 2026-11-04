import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// AI chat over the Candora Central Database. Reads the live client records for
// the portal asking the question, picks out the clients the question is about,
// and answers only from that data.

const STOP = new Set([
  'the', 'a', 'an', 'of', 'for', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'were',
  'who', 'what', 'which', 'how', 'many', 'much', 'my', 'me', 'i', 'we', 'our', 'do', 'does', 'did',
  'with', 'that', 'this', 'these', 'those', 'their', 'they', 'them', 'has', 'have', 'had', 'from',
  'about', 'list', 'show', 'tell', 'give', 'any', 'all', 'client', 'clients', 'please', 'can', 'you',
  'need', 'needs', 'get', 'there', 'was', 'were', 'been', 'not', 'no', 'yes', 'if', 'so', 'up',
]);

const norm = (v) => String(v ?? '').toLowerCase();
const fullName = (c) => `${c.first_name || ''} ${c.last_name || ''}`.replace(/\s+/g, ' ').trim();
const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
const daysSince = (v) => {
  if (!v) return null;
  const ms = Date.now() - new Date(v).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.round(ms / 86400000));
};

function tokens(question) {
  return Array.from(new Set(
    norm(question)
      .replace(/[^a-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  ));
}

function scoreClient(client, words) {
  const hay = {
    name: norm(`${fullName(client)} ${client.email || ''} ${client.phone || ''}`),
    case: norm([client.case_status, client.service_category, client.assigned_worker, client.reason_for_accessing,
      client.identified_needs, client.presenting_needs, client.notes, client.city, client.preferred_language,
      client.dependants_detail].filter(Boolean).join(' ')),
    rest: norm(JSON.stringify(client.program_participations || '')),
  };
  let score = 0;
  for (const w of words) {
    if (hay.name.includes(w)) score += 5;
    if (hay.case.includes(w)) score += 3;
    if (hay.rest.includes(w)) score += 1;
  }
  return score;
}

const visitLabel = (v) => {
  const kind = v.visit_type === 'grab_and_go' ? 'grab-and-go'
    : v.visit_type === 'drop_in_casework' ? 'drop-in casework'
    : v.visit_type === 'scheduled' ? 'scheduled visit' : 'visit';
  const bits = [dateOnly(v.visit_date), kind];
  if (v.resource_type) bits.push(String(v.resource_type).replace(/_/g, ' '));
  if (v.status) bits.push(v.status);
  return bits.filter(Boolean).join(' · ');
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').trim();
    if (!question) return Response.json({ error: 'question is required' }, { status: 400 });
    if (question.length > 1200) return Response.json({ error: 'question is too long' }, { status: 400 });

    const portal = body.portal === 'rworker' ? 'rworker' : 'rc';
    const focusClientId = body.focus_client_id ? String(body.focus_client_id) : null;
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    const [clientsRes, visitsRes, notesRes, apptsRes, referralsRes, intensiveRes] = await Promise.allSettled([
      base44.entities.RCClient.filter({ case_status: { $ne: 'closed' } }, { limit: 400 }),
      base44.entities.RCClientVisit.filter({}, { sort: '-visit_date', limit: 200 }),
      base44.entities.RCClientNote.filter({}, { sort: '-created_date', limit: 80 }),
      base44.entities.RCAppointment.filter({}, { sort: 'appointment_date', limit: 120 }),
      base44.entities.RCReferral.filter({}, { sort: '-created_date', limit: 80 }),
      base44.entities.IntensiveCase.filter({}, { limit: 120 }),
    ]);
    const unwrap = (r) => (r.status === 'fulfilled' ? (r.value?.items || []) : []);

    let clients = unwrap(clientsRes);
    const visits = unwrap(visitsRes);
    const notes = unwrap(notesRes);
    const appts = unwrap(apptsRes);
    const referrals = unwrap(referralsRes);
    const intensive = unwrap(intensiveRes);

    const me = norm(user.full_name);
    const myEmail = norm(user.email).split('@')[0];
    const myParts = me.split(/\s+/).filter((w) => w.length > 2);
    const myLast = myParts[myParts.length - 1] || '';
    const isMine = (worker) => {
      const w = norm(worker);
      if (!w) return false;
      if (me && (w.includes(me) || me.includes(w))) return true;
      if (myEmail && w.includes(myEmail)) return true;
      if (myLast && w.includes(myLast)) return true;
      return myParts.some((p) => w.includes(p));
    };

    let scopedToMe = false;
    if (portal === 'rworker') {
      const myClients = clients.filter((c) => isMine(c.assigned_worker));
      // Resource workers sometimes have nothing assigned yet — rather than
      // leaving them with an empty assistant, widen to the shared database and
      // say so in the answer.
      if (myClients.length > 0) {
        clients = myClients;
        scopedToMe = true;
      }
    }

    const allowedIds = new Set(clients.map((c) => c.id));
    const mine = (records) => records.filter((r) => allowedIds.has(r.client_id));

    const myVisits = mine(visits);
    const myNotes = mine(notes);
    const myAppts = mine(appts);
    const myReferrals = mine(referrals);
    const myIntensive = intensive.filter((c) => allowedIds.has(c.client_id));

    const today = new Date().toISOString().slice(0, 10);
    const lastVisitByClient = new Map();
    for (const v of myVisits) {
      if (!v.client_id) continue;
      const d = dateOnly(v.visit_date);
      if (!d) continue;
      const current = lastVisitByClient.get(v.client_id);
      if (!current || d > current) lastVisitByClient.set(v.client_id, d);
    }

    const words = tokens(question);
    const focusClient = focusClientId ? clients.find((c) => c.id === focusClientId) || null : null;

    const scored = clients
      .map((c) => ({ client: c, score: scoreClient(c, words) }))
      .sort((a, b) => b.score - a.score);

    // Detail is pulled for anything that looks relevant; only real name/case
    // matches are offered back as "open the file" links.
    let matched = scored.filter((s) => s.score > 0).slice(0, 5).map((s) => s.client);
    if (focusClient && !matched.some((c) => c.id === focusClient.id)) matched = [focusClient, ...matched].slice(0, 5);
    const related = scored.filter((s) => s.score >= 5).slice(0, 4).map((s) => s.client);

    const roster = clients.slice(0, 220).map((c) => {
      const last = lastVisitByClient.get(c.id) || '';
      const bits = [fullName(c) || 'Unnamed client', c.case_status || 'unknown status',
        c.assigned_worker ? `worker: ${c.assigned_worker}` : 'unassigned',
        `${c.visit_count || 0} visits`];
      if (c.service_category) bits.push(String(c.service_category).replace(/_/g, ' '));
      if (last) bits.push(`last visit ${last} (${daysSince(last)} days ago)`);
      return `- ${bits.join(' | ')}`;
    }).join('\n');

    const detailBlocks = matched.map((c) => {
      const id = c.id;
      const deep = focusClient?.id === id;
      const safety = myNotes.filter((n) => n.client_id === id && n.is_safety_alert).slice(0, 3)
        .map((n) => `    · ${dateOnly(n.created_date)} ${String(n.note).slice(0, 240)}`);
      const clientVisits = myVisits.filter((v) => v.client_id === id).slice(0, deep ? 12 : 6)
        .map((v) => `    · ${visitLabel(v)}${v.visit_notes ? ` — ${String(v.visit_notes).slice(0, 220)}` : ''}`);
      const clientNotes = myNotes.filter((n) => n.client_id === id).slice(0, deep ? 8 : 4)
        .map((n) => `    · ${dateOnly(n.created_date)}${n.is_safety_alert ? ' SAFETY ALERT' : ''}: ${String(n.note).slice(0, 260)}`);
      const clientAppts = myAppts.filter((a) => a.client_id === id).slice(0, 5)
        .map((a) => `    · ${String(a.appointment_date || '').slice(0, 16).replace('T', ' ')} — ${a.status || 'scheduled'}${a.purpose ? ` — ${a.purpose}` : ''}`);
      const clientReferrals = myReferrals.filter((r) => r.client_id === id).slice(0, 4)
        .map((r) => `    · ${dateOnly(r.referral_date || r.created_date)} — ${r.service_program || r.organization || 'referral'}${r.direction ? ` (${String(r.direction).replace(/_/g, ' ')})` : ''} — ${r.status || ''}`);
      const intensiveCase = myIntensive.find((i) => i.client_id === id);
      const head = [
        `Full name: ${fullName(c) || 'unknown'}`,
        `Case status: ${c.case_status || 'unknown'}`,
        `Assigned worker: ${c.assigned_worker || 'unassigned'}`,
        c.phone ? `Phone: ${c.phone}` : '',
        c.email ? `Email: ${c.email}` : '',
        c.date_of_birth ? `Date of birth: ${dateOnly(c.date_of_birth)}` : '',
        c.address || c.city ? `Address: ${[c.address, c.city, c.postal_code].filter(Boolean).join(', ')}` : '',
        c.preferred_language ? `Preferred language: ${c.preferred_language}${c.english_proficiency ? ` (English: ${String(c.english_proficiency).replace(/_/g, ' ')})` : ''}` : '',
        c.emergency_contact_name || c.emergency_contact_phone ? `Emergency contact: ${[c.emergency_contact_name, c.emergency_contact_phone].filter(Boolean).join(' · ')}` : '',
        c.dependants_count ? `Dependants: ${c.dependants_count}${c.dependants_detail ? ` — ${String(c.dependants_detail).slice(0, 160)}` : ''}` : '',
        c.intake_date ? `Intake date: ${dateOnly(c.intake_date)}` : '',
        c.service_category ? `Service category: ${String(c.service_category).replace(/_/g, ' ')}` : '',
        c.referral_source ? `Referral source: ${String(c.referral_source).replace(/_/g, ' ')}` : '',
        c.reason_for_accessing ? `Reason for accessing: ${String(c.reason_for_accessing).replace(/_/g, ' ')}` : '',
        c.presenting_needs ? `Presenting needs: ${String(c.presenting_needs).slice(0, 300)}` : '',
        c.identified_needs ? `Identified needs: ${c.identified_needs}` : '',
        Array.isArray(c.funder_categories) && c.funder_categories.length ? `Funder categories: ${c.funder_categories.map((f) => String(f).replace(/_/g, ' ')).join(', ')}` : '',
        [c.indigenous_first_nations ? 'First Nations' : '', c.newcomer ? 'newcomer' : '', c.senior ? 'senior' : '', c.youth_under_25 ? 'youth under 25' : ''].filter(Boolean).length ? `Client flags: ${[c.indigenous_first_nations ? 'First Nations' : '', c.newcomer ? 'newcomer' : '', c.senior ? 'senior' : '', c.youth_under_25 ? 'youth under 25' : ''].filter(Boolean).join(', ')}` : '',
        Array.isArray(c.program_participations) && c.program_participations.length ? `Program participations: ${c.program_participations.map((p) => [p.program_name, p.status].filter(Boolean).join(' — ')).filter(Boolean).slice(0, 6).join('; ')}` : '',
        c.notes ? `Case notes: ${String(c.notes).slice(0, 400)}` : '',
        `Total visits logged: ${c.visit_count || 0}`,
        lastVisitByClient.get(id) ? `Last visit: ${lastVisitByClient.get(id)}` : '',
        intensiveCase ? `Intensive case management: active, complexity ${intensiveCase.complexity_level || 'n/a'}, next contact ${dateOnly(intensiveCase.next_contact_due) || 'not set'}` : '',
      ].filter(Boolean).join('\n  ');

      return [
        `CLIENT: ${fullName(c) || 'unknown'}`,
        `  ${head}`,
        safety.length ? `  SAFETY ALERTS (always surface these):\n${safety.join('\n')}` : '',
        clientVisits.length ? `  Recent visits:\n${clientVisits.join('\n')}` : '  Recent visits: none on file',
        clientNotes.length ? `  Client notes:\n${clientNotes.join('\n')}` : '',
        clientAppts.length ? `  Appointments:\n${clientAppts.join('\n')}` : '',
        clientReferrals.length ? `  Referrals:\n${clientReferrals.join('\n')}` : '',
      ].filter(Boolean).join('\n');
    }).join('\n\n');

    const stats = [
      `Scope: ${scopedToMe ? `only the clients assigned to ${user.full_name}` : portal === 'rworker' ? `no files are assigned to ${user.full_name} yet, so the whole Central Database is shown; say this plainly if the question assumes a personal caseload` : 'the whole Central Database'}`,
      `Open client records in scope: ${clients.length}`,
      `Client records in scope by status: ${['intake', 'active', 'monitoring', 'waitlisted'].map((s) => `${s} ${clients.filter((c) => c.case_status === s).length}`).join(', ')}`,
      `Visits on file (recent sample): ${myVisits.length}`,
      `Upcoming or recent appointments in scope: ${myAppts.length}`,
      `Client notes in scope: ${myNotes.length}`,
      `Referrals in scope: ${myReferrals.length}`,
      `Today: ${today}`,
    ].join('\n');

    const historyLines = history
      .filter((m) => m && m.content)
      .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'Staff'}: ${String(m.content).slice(0, 700)}`)
      .join('\n');

    const prompt = `You are the Candora Central Database assistant. You answer staff questions about clients and case data for a non-profit resource centre in Alberta.

STRICT RULES
- Answer ONLY from the DATA below. Never invent a client, date, phone number, or detail.
- If the data does not contain the answer, say plainly what is missing and suggest what to search instead.
- Speak to staff as a knowledgeable colleague: plain language, no preamble, no restating the question.
- When listing clients, always include their case status and assigned worker, and how long since their last visit when relevant.
- Refer to clients by full name. Summarise what answers the question; offer to go deeper rather than dumping a whole record unprompted.
- Never mention the words "data provided", "context", "dataset" or "database dump". Say "on file" instead.
- Safety alerts must always be surfaced if a matched client has one, at the top of the answer, in bold.
- Do not give medical, legal or clinical advice; describe what is on file.

RESPONSE FORMAT — pick the shape an experienced casework analyst would use for this particular request. The question decides the format, not habit.
- One fact ("how many clients", "who is X's worker", "when was the last visit") -> a single direct sentence. Add at most one short supporting line. No headings, no bullets, no table.
- Comparing or listing several clients or records -> a compact markdown table, at most 5 columns, very short cell text (names, statuses, dates, worker). Put the most useful column first and sort the table usefully (oldest last visit first, newest referral first, and so on). Add one line under the table only if something needs saying. Never build a table for a single row, and never put long notes inside cells.
- Loose grouping that is not really tabular (themes, needs, next steps, reasons) -> short bullets, each starting with a bold lead-in, e.g. "- **Housing:** waiting on a landlord reply".
- Detailed look at one client ("tell me about X", "full profile", "everything on file", "case summary") -> a short sectioned summary with bold labels, in this order where the data exists: **At a glance** (one line: status, worker, intake, last contact), **Contact**, **Household and flags**, **Needs and reason for accessing**, **Recent activity** (dated bullet timeline, newest first, as "2026-10-14 — visited the food bank"), **Appointments**, **Referrals**, **Next step**. Omit any section with nothing on file, and keep each to a couple of lines.
- Sequence of events, history, "what has happened with X" -> dated bullet timeline, newest first, "2026-10-14 — what happened". No table.
- Steps or follow-up actions -> a numbered list, imperative and specific ("Call to confirm the appointment", not "follow up").
- A yes/no or judgement question -> the verdict in one sentence, then two or three reasons as bullets.
- A distribution or trend (clients by status, visits per month, caseload by worker) -> a compact table with a bar column drawn from block characters, scaled to the largest value, e.g. "| Active | 42 | ███████████ |", or a plain bullet list when there are fewer than four categories. Never invent numbers to fill a chart.
- Markdown only: headings, bold, bullets, numbered lists and tables. Never HTML, charts, images or code blocks. Never escape characters.
- Put a BLANK LINE between every block — between a heading and its text, between bullets and paragraphs, and before and after a table. This is what makes the answer readable in the chat panel rather than one long run-on line. Bullets and table rows each stay on their own line.

LENGTH: answer first, in the fewest words that fully answer it. Short request, short answer. A request for detail, a full profile or a report may run longer, but with no filler and no repeating of the question.
TABLES: keep them narrow enough to read in a small chat panel — short headers, no wrapped paragraphs, and cap at about 10 rows unless staff asked for every client in scope.

${historyLines ? `CONVERSATION SO FAR\n${historyLines}\n` : ''}
ORGANISATION COUNTS
${stats}

WHOLE ROSTER IN SCOPE (name | status | worker | visits | last visit)
${roster || '- no open client records'}

${detailBlocks ? `DETAIL FOR THE CLIENTS THIS QUESTION IS ABOUT\n${detailBlocks}` : ''}

STAFF QUESTION
${question}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: { answer: { type: 'string' } },
        required: ['answer'],
      },
    });

    const answer = typeof result === 'string' ? result : (result?.answer || 'I could not find an answer in the client records.');

    return Response.json({
      answer,
      related: related.map((c) => ({ id: c.id, name: fullName(c) || 'Unnamed client', status: c.case_status || '' })),
      scope: portal,
      in_scope_count: clients.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}