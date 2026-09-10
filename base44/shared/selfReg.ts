// Shared server-side logic for the public self-registration (QR) flow.
// Used by getSelfRegCatalog, submitSelfRegRequest and applySelfRegRequest.
// The client passed in exposes .entities (service role for public functions,
// the app-user client for registrar actions).

export const SELF_REG_AREA_LABELS = {
  community: 'Community Programs',
  empoweru: 'EmpowerU',
  phac: 'PHAC Programs (0-6)',
  ell: 'ELL (English Language Learning)',
  digilit: 'Digital Literacy',
  frn: 'FRN Targeted Programs',
};

export const todayStr = () => new Date().toISOString().split('T')[0];

// Settings are matched by area + program ID, falling back to the program name
// for name-only programs (FRN groups, area-wide Digital Literacy).
export function matchSettings(settings, area, programId, programName) {
  return (settings || []).find(s => s.area === area && (
    (programId && s.program_id === programId) ||
    (!programId && s.program_name === programName)
  )) || null;
}

// The ELL active-learners-only restriction applies until its expiry date.
export function restrictionActive(setting) {
  return !!setting && !!setting.active_learners_only &&
    (!setting.active_learners_expiry || setting.active_learners_expiry >= todayStr());
}

// Upcoming (base-date) sessions for a program, sorted by date.
export function upcomingSessions(sessions, area, programId, programName) {
  const today = todayStr();
  const list = (sessions || []).filter(s => s.status !== 'cancelled' && s.session_date && s.session_date >= today);
  const map = (s, name) => ({
    id: s.id,
    name: name,
    date: s.session_date,
    time: [s.start_time, s.end_time].filter(Boolean).join('–'),
  });
  let out = [];
  if (area === 'community') out = list.filter(s => s.program_id === programId).map(s => map(s, s.title || s.program_name));
  else if (area === 'phac') out = list.filter(s => s.program_id === programId).map(s => map(s, s.program_name || 'Session'));
  else if (area === 'digilit') out = list.map(s => map(s, s.title || 'Session'));
  else if (area === 'frn') out = list.filter(s => s.program_name === programName).map(s => map(s, s.program_name || 'Session'));
  return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12);
}

// Active ELL learners — same definition as the Active Learners roster:
// learners enrolled in a currently running course, or (when no course is
// running) those who took the most recently run course.
export function activeEllLearners(learners, classes) {
  const today = todayStr();
  const courses = (classes || []).filter(c => c.status !== 'cancelled');
  const running = courses.filter(c => c.status === 'active' && (!c.end_date || c.end_date >= today));
  const runningIds = new Set(running.map(c => c.id));
  let list;
  if (running.length) {
    list = (learners || []).filter(l => ['enrolled', 'active'].includes(l.enrollment_status) && runningIds.has(l.assigned_class_id));
  } else {
    const recent = [...courses].filter(c => c.end_date).sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
    list = recent
      ? (learners || []).filter(l => ['enrolled', 'active', 'completed'].includes(l.enrollment_status) && l.assigned_class_id === recent.id)
      : [];
  }
  return list
    .map(l => ({ id: l.id, name: `${l.first_name} ${l.last_name}`.trim(), first_name: l.first_name, last_name: l.last_name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Build the public catalog of programs with self-registration enabled.
export async function buildSelfRegCatalog(base44) {
  const settings = (await base44.entities.SelfRegProgram.list()).filter(s => s.enabled);
  if (!settings.length) return { programs: [] };

  const [communityPrograms, cohorts, phacPrograms, ellClasses, communitySessions, phacSessions, digilitSessions, frnSessions, ellLearners] = await Promise.all([
    base44.entities.CommunityProgram.list(),
    base44.entities.EmpowerUCohort.list(),
    base44.entities.PHACProgram.list(),
    base44.entities.ELLClass.list(),
    base44.entities.CommunitySession.list('-session_date', 500),
    base44.entities.PHACSession.list('-session_date', 500),
    base44.entities.DigiLitSession.list('-session_date', 500),
    base44.entities.FRNSession.list('-session_date', 500),
    base44.entities.ELLLearner.list('-created_date', 1000),
  ]);

  const programs = [];
  for (const s of settings) {
    const base = {
      area: s.area,
      area_label: SELF_REG_AREA_LABELS[s.area] || s.area,
      program_id: s.program_id || null,
      program_name: s.program_name || 'Program',
      description: '',
      schedule: '',
      sessions: [],
      require_approval: s.require_approval !== false,
      active_learners_only: false,
      active_learners_expiry: null,
      active_learners: null,
    };
    let entry = null;
    if (s.area === 'community') {
      const p = communityPrograms.find(x => x.id === s.program_id && x.status === 'active');
      if (p) entry = { ...base, program_name: p.name, description: p.description || '', schedule: [p.schedule_description, p.location].filter(Boolean).join(' · '), sessions: upcomingSessions(communitySessions, 'community', p.id, p.name) };
    } else if (s.area === 'empoweru') {
      const c = cohorts.find(x => x.id === s.program_id && x.registration_open && !['completed', 'cancelled'].includes(x.status));
      if (c) entry = { ...base, program_name: c.name, description: c.delivery_mode === 'virtual' ? 'Virtual program' : (c.location || c.delivery_mode || ''), schedule: [c.start_date, c.end_date].filter(Boolean).join(' – ') };
    } else if (s.area === 'phac') {
      const p = phacPrograms.find(x => x.id === s.program_id && x.status === 'active');
      if (p) entry = { ...base, program_name: p.name, description: p.description || '', schedule: [p.location, p.facilitator].filter(Boolean).join(' · '), sessions: upcomingSessions(phacSessions, 'phac', p.id, p.name) };
    } else if (s.area === 'ell') {
      const c = ellClasses.find(x => x.id === s.program_id && x.status !== 'cancelled' && !x.course_id);
      if (c) {
        const restricted = restrictionActive(s);
        entry = {
          ...base,
          program_name: c.name,
          description: c.description || '',
          schedule: (c.schedule_days || []).length ? `${(c.schedule_days || []).join(', ')} ${(c.start_time || '')}${c.start_time && c.end_time ? '–' : ''}${c.end_time || ''}`.trim() : '',
          active_learners_only: restricted,
          active_learners_expiry: s.active_learners_expiry || null,
          active_learners: restricted ? activeEllLearners(ellLearners, ellClasses) : null,
        };
      }
    } else if (s.area === 'digilit') {
      entry = { ...base, program_name: 'Digital Literacy', description: 'Digital literacy sessions — computer, smartphone and online skills.', sessions: upcomingSessions(digilitSessions, 'digilit', null, 'Digital Literacy') };
    } else if (s.area === 'frn') {
      entry = { ...base, program_name: s.program_name, description: 'Family Resource Network targeted group.', sessions: upcomingSessions(frnSessions, 'frn', null, s.program_name) };
    }
    if (entry) programs.push(entry);
  }
  return { programs };
}

// Apply the registrar's decision — creates the registration in the SAME
// records each program's portal uses (mirrors the Central Registration
// registration dialog), or nothing for a rejection.
export async function applySelfRegAction(base44, request, action, reviewerName) {
  if (action === 'reject') return { status: 'rejected' };

  const waitlisted = action === 'waitlist';
  const today = todayStr();
  const name = `${request.first_name} ${request.last_name}`.trim();
  const sessionNote = request.session_name
    ? `Session: ${request.session_name}${request.session_date ? ` (${request.session_date})` : ''}`
    : '';
  const notes = [sessionNote, request.notes].filter(Boolean).join('\n');

  if (request.area === 'community') {
    const participant = await base44.entities.CommunityParticipant.create({
      first_name: request.first_name, last_name: request.last_name, phone: request.phone, email: request.email, notes,
    });
    await base44.entities.CommunityRegistration.create({
      participant_id: participant.id, participant_name: name,
      program_id: request.program_id, program_name: request.program_name,
      registration_date: today, status: waitlisted ? 'waitlisted' : 'registered', notes,
    });
  } else if (request.area === 'empoweru') {
    const regs = await base44.entities.EmpowerURegistration.filter({ cohort_id: request.program_id });
    const wlCount = (regs || []).filter(r => r.status === 'waitlisted').length;
    const participant = await base44.entities.EmpowerUParticipant.create({
      first_name: request.first_name, last_name: request.last_name, phone: request.phone, email: request.email, notes,
    });
    await base44.entities.EmpowerURegistration.create({
      participant_id: participant.id, participant_name: name,
      cohort_id: request.program_id, cohort_name: request.program_name,
      registration_date: today, status: waitlisted ? 'waitlisted' : 'registered',
      ...(waitlisted ? { waitlist_position: wlCount + 1 } : {}),
      intake_notes: notes,
    });
  } else if (request.area === 'phac') {
    await base44.entities.PHACParticipant.create({
      child_first_name: request.first_name, child_last_name: request.last_name,
      parent_guardian_name: request.parent_guardian_name, parent_guardian_phone: request.parent_guardian_phone, parent_guardian_email: request.parent_guardian_email,
      status: waitlisted ? 'waitlisted' : 'registered',
      notes: [request.program_name ? `Registered for: ${request.program_name}` : '', notes].filter(Boolean).join('\n'),
    });
  } else if (request.area === 'ell') {
    if (request.learner_id) {
      // Existing active learner — approve enrolls them into the requested course,
      // waitlist keeps them on the course waitlist.
      const update = waitlisted
        ? { enrollment_status: 'waitlisted', waitlist_date: today, interested_course_id: request.program_id, interested_course_name: request.program_name }
        : { enrollment_status: 'enrolled', assigned_class_id: request.program_id, assigned_class_name: request.program_name, interested_course_id: request.program_id, interested_course_name: request.program_name };
      await base44.entities.ELLLearner.update(request.learner_id, update);
    } else {
      await base44.entities.ELLLearner.create({
        first_name: request.first_name, last_name: request.last_name, phone: request.phone, email: request.email,
        intake_date: today, enrollment_status: waitlisted ? 'waitlisted' : 'prospective',
        waitlist_date: waitlisted ? today : null,
        interested_course_id: request.program_id || null,
        interested_course_name: request.program_name || null,
        notes: [request.program_name ? `Registered for: ${request.program_name}` : '', notes].filter(Boolean).join('\n'),
      });
    }
  } else if (request.area === 'digilit') {
    await base44.entities.DigiLitParticipant.create({
      first_name: request.first_name, last_name: request.last_name, phone: request.phone, email: request.email,
      registration_date: today, status: waitlisted ? 'waitlisted' : 'registered', notes,
    });
  } else if (request.area === 'frn') {
    await base44.entities.FRNParticipant.create({
      first_name: request.first_name, last_name: request.last_name, phone: request.phone, email: request.email,
      notes: [request.program_name ? `Registered for: ${request.program_name}` : '', notes].filter(Boolean).join('\n'),
    });
    await base44.entities.ProgramRegistration.create({
      participant_first_name: request.first_name, participant_last_name: request.last_name, participant_name: name,
      participant_phone: request.phone, participant_email: request.email,
      program_portal: 'frn', program_name: request.program_name || 'FRN Program',
      registration_date: today, status: waitlisted ? 'waitlisted' : 'approved', notes,
    });
  }
  return { status: waitlisted ? 'waitlisted' : 'approved' };
}