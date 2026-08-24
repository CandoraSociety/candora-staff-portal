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

export function buildPrompt(background, jobType, location, hasClient, clientName) {
  const bg = buildBackgroundText(background);
  const who = hasClient
    ? `for the client ${clientName}`
    : 'for a client (manual entry — no specific client record attached)';
  return `You are a Canadian career counsellor supporting newcomers and job seekers in Alberta, Canada.

Client background:
${bg}

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
  },
};