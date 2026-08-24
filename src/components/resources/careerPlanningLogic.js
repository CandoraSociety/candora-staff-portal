// Prompt + schema + client-background derivation for the client-specific
// Career Planning tool in the Pathways Resources tab.

const HIGHEST_EDU = {
  no_formal_education: 'No formal education',
  some_elementary: 'Some elementary',
  elementary_completed: 'Elementary completed',
  some_high_school: 'Some high school',
  high_school_diploma: 'High school diploma',
  ged: 'GED',
  some_college: 'Some college',
  college_diploma: 'College diploma',
  college_certificate: 'College certificate',
  bachelors_degree: "Bachelor's degree",
  masters_degree: "Master's degree",
  doctorate: 'Doctorate',
  trade_certificate: 'Trade certificate',
  apprenticeship: 'Apprenticeship',
  professional_certification: 'Professional certification',
  other: 'Other',
};

const CLB = {
  native_english_french: 'Native English/French',
};
for (let i = 1; i <= 12; i++) CLB[`clb_${i}`] = `CLB ${i}`;

const SDP_LABELS = {
  job_search_workshop: 'Job Search Workshop',
  resume_writing_workshop: 'Resume Writing Workshop',
  interview_skills_workshop: 'Interview Skills Workshop',
  workplace_readiness_workshop: 'Workplace Readiness Workshop',
  financial_literacy_workshop: 'Financial Literacy Workshop',
  digital_literacy_workshop: 'Digital Literacy Workshop',
  empoweru: 'EmpowerU',
  ell_classes: 'ELL Classes',
  skills_assessment: 'Skills Assessment',
  exposure_course: 'Exposure Course',
  employment_supports: 'Employment Supports',
  job_applications: 'Job Applications',
  networking: 'Networking',
  other: 'Other',
};

// Build editable background fields from a Client record. Returns the five
// text fields shown in the form; the counsellor can tweak them before
// generating. Empty strings when nothing is on file.
export function deriveClientBackground(client) {
  if (!client) {
    return { education: '', experience: '', skills: '', training: '', objective: '' };
  }
  const eduParts = [];
  if (client.highest_education) eduParts.push(HIGHEST_EDU[client.highest_education] || client.highest_education);
  if (client.clb_level) eduParts.push(CLB[client.clb_level] || client.clb_level);

  let eduHistory = '';
  if (client.education_history) {
    try {
      const arr = JSON.parse(client.education_history);
      if (Array.isArray(arr)) {
        eduHistory = arr
          .map((e) => [e.institution, e.program || e.degree || e.field, e.year].filter(Boolean).join(' '))
          .filter(Boolean)
          .join('; ');
      } else {
        eduHistory = String(client.education_history);
      }
    } catch {
      eduHistory = String(client.education_history);
    }
  }
  const education = [eduParts.join(', '), eduHistory].filter(Boolean).join('. ');

  const trainingBits = [];
  const roadmap = client.roadmap_item_status || {};
  (client.sdp_items || []).forEach((key) => {
    const st = roadmap[key] || {};
    if (st.status === 'completed') trainingBits.push(SDP_LABELS[key] || key.replace(/_/g, ' '));
  });

  return {
    education: education.trim(),
    experience: client.employment_history || '',
    skills: '',
    training: trainingBits.join(', '),
    objective: client.career_objectives || '',
  };
}

export function buildBackgroundText(b) {
  return [
    b.education && `Education: ${b.education}`,
    b.experience && `Work experience: ${b.experience}`,
    b.skills && `Skills & strengths: ${b.skills}`,
    b.training && `Training/certifications completed: ${b.training}`,
    b.objective && `Career objective: ${b.objective}`,
  ]
    .filter(Boolean)
    .join('\n') || 'No background information provided.';
}

export function buildPrompt(background, jobType, location, hasClient, clientName, hasResume) {
  const bg = buildBackgroundText(background);
  const who = hasClient
    ? `for the client ${clientName}`
    : 'for a client (manual entry — no specific client record attached)';
  const resumeLine = hasResume
    ? `\nThe client's resume is attached as a file. Read it carefully and use it as the authoritative source for their actual education, work history, skills, and certifications. Incorporate details from the resume into the background, the gap analysis, and the action plan (note when a strength or gap comes from the resume).\n`
    : '';
  return `You are a Canadian career counsellor supporting newcomers and job seekers in Alberta, Canada.

Client background:
${bg}
${resumeLine}
Target career / job type: "${jobType}" in ${location}.

Produce a detailed, practical career plan ${who}. The plan must cover ALL of the following:

1. ROLE REQUIREMENTS for the target job:
   - Typical job titles in this field
   - Required education (credentials, certificates, degrees)
   - Required and preferred experience
   - Key skills and competencies
   - Certifications or licenses required in Alberta
   - Typical wage range (hourly and annual) for the Alberta market

2. CAREER PROGRESSION within this field: a path from entry-level to mid-level to senior roles. For each stage give a title, a brief description of responsibilities, and a typical wage where known.

3. GAP ANALYSIS: compare the client's current background (above) to the target role's requirements.
   - List the client's STRENGTHS (where they meet or exceed requirements).
   - List the specific GAPS they need to close (education, experience, skills, certifications, language). For each gap, state what they currently have and what the role requires.

4. ACTION PLAN: an ordered, step-by-step plan to close the gaps so the client qualifies for the target role. For each step, state which gap it addresses and an estimated duration.

5. JOBSITE EXPECTATIONS: what the client should realistically expect day-to-day working in this role in Alberta.
   - Typical work environment and conditions (indoor/outdoor, physical demands, shift patterns, travel)
   - Common safety considerations and orientation/onboarding they will go through
   - Workplace culture and supervisor/teammate dynamics typical for this trade/field
   - First-week and first-month realities (what surprises newcomers, common adjustments)

6. ENTRY-LEVEL EMPLOYERS: a list of real companies and employers in Alberta that frequently hire for entry-level positions in this field. For each, give the company name, a one-line note on the types of entry-level roles they hire for / what they're known for, and the region (e.g. Edmonton, Calgary, province-wide) where they mainly operate. Prioritize well-known, verifiable employers a newcomer could realistically apply to (large employers, franchises, staffing agencies, public-sector employers). Do not invent companies that don't exist.

7. RESUME & COVER LETTER TAILORING: concrete, specific guidance for positioning this client's resume and cover letter toward this role.
   - Which skills, experiences, and accomplishments to HIGHLIGHT at the top of the resume (drawn from their background/resume where possible)
   - Keywords and phrases from this field to include for applicant tracking systems (ATS)
   - How to frame transferable experience (especially for newcomers whose credentials are from outside Canada)
   - What to emphasize in a cover letter for this role (a hook, a value statement, and a specific example to highlight)
   - Any credentials or certifications to make prominent

8. COUNSELLOR APTITUDE GUIDE: guidance to help the career counsellor assess whether this client is suited to this career path. Cover:
   - Key aptitudes and traits to look for or probe for in conversation (e.g. attention to detail, physical stamina, comfort with repetitive tasks, customer orientation, manual dexterity, ability to work alone/with others)
   - Suggested assessment questions or discussion prompts to draw out relevant strengths and concerns from the client
   - Red flags or indicators that this path may be a poor fit (and what to watch for)
   - Transferable indicators from the client's background (above) that already suggest aptitude
   - A short suitability summary: how to weigh the client's existing background against the role's demands

9. INTERNAL TRAINING MATCH (Candora): Candora currently offers the following in-house internal training/placement experiences:
   - Reception & admin internal training/placement
   - Food services (front end, back end, production)
   - Security training
   - Program facilitation assistant
   Recommend which of these (if any) would best help prepare this client for the target career path. For each relevant option, explain WHY it builds directly transferable skills for the target role (be specific about the overlap), what the client would gain, and how to position it on their resume. If none are a strong fit, say so and suggest the closest option. Output this as a list of recommended placements with a fit_rating of "strong", "moderate", or "weak".

Be specific to the Alberta labour market. Be practical, concrete, and encouraging. Avoid generic advice — tailor everything to this client's background and the target role.`;
}

export const CAREER_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    job_titles: { type: 'array', items: { type: 'string' } },
    education: { type: 'array', items: { type: 'string' } },
    experience: { type: 'array', items: { type: 'string' } },
    skills: { type: 'array', items: { type: 'string' } },
    certifications: { type: 'array', items: { type: 'string' } },
    wage_range: {
      type: 'object',
      properties: {
        hourly_min: { type: 'string' },
        hourly_max: { type: 'string' },
        annual_min: { type: 'string' },
        annual_max: { type: 'string' },
      },
    },
    progression: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          level: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          wage: { type: 'string' },
        },
      },
    },
    strengths: { type: 'array', items: { type: 'string' } },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          area: { type: 'string' },
          current: { type: 'string' },
          required: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
    action_plan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'number' },
          action: { type: 'string' },
          closes_gap: { type: 'string' },
          duration: { type: 'string' },
        },
      },
    },
    jobsite_expectations: {
      type: 'object',
      properties: {
        work_environment: { type: 'string' },
        safety_and_onboarding: { type: 'string' },
        workplace_culture: { type: 'string' },
        first_month_realities: { type: 'string' },
      },
    },
    entry_level_employers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          hires_for: { type: 'string' },
          region: { type: 'string' },
        },
      },
    },
    resume_tailoring: {
      type: 'object',
      properties: {
        highlight_on_resume: { type: 'array', items: { type: 'string' } },
        ats_keywords: { type: 'array', items: { type: 'string' } },
        transferable_experience_framing: { type: 'string' },
        cover_letter_focus: { type: 'string' },
        credentials_to_emphasize: { type: 'array', items: { type: 'string' } },
      },
    },
    counsellor_aptitude_guide: {
      type: 'object',
      properties: {
        aptitudes_to_probe: { type: 'array', items: { type: 'string' } },
        assessment_questions: { type: 'array', items: { type: 'string' } },
        red_flags: { type: 'array', items: { type: 'string' } },
        positive_indicators_from_background: { type: 'array', items: { type: 'string' } },
        suitability_summary: { type: 'string' },
      },
    },
    internal_training_match: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          placement: { type: 'string' },
          fit_rating: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
          why: { type: 'string' },
          skills_gained: { type: 'array', items: { type: 'string' } },
          resume_positioning: { type: 'string' },
        },
      },
    },
  },
};