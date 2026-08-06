// Pure helper that builds the CRT "Comments (Column S)" text from a client
// object. This mirrors the composition logic in base44/shared/crtWorkbook.ts
// (mapClientToCrtRow) so the frontend (Compass task instructions + the
// Additional Comments preview) shows exactly what the backend will write to
// the CRT on the next sync. Keep this in sync with crtWorkbook.ts when the
// column-S composition changes.
//
// monthEnd (Date|null): when set, date fields dated after monthEnd are blanked
// (point-in-time snapshot). Pass null for the current/live state.

function formatDateForCrt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

const OUTCOME_DESC = {
  'E-RF': 'Employed, Related Field',
  'E-UF': 'Employed, Unrelated Field',
  'SE': 'Self-Employed',
  'UE-LFW': 'Unemployed, Looking for Work',
  'UE-NLF': 'Unemployed, Not in Labour Force',
  'FTT': 'Further Training',
  'AoP': 'Attending other Program',
  'UTC': 'Unable to Contact',
  'P': 'Pending',
  'C': 'Cancelled',
};

const EMPLOYED_OUTCOMES = ['E-RF', 'E-UF', 'SE'];
const SERVICENAV_OUTCOMES = ['E-RF', 'E-UF', 'SE'];

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

const EXCLUDED_SDP = ['barrier_support', 'internal_placement', 'paid_external_placement'];

export function buildCrtComments(client, monthEnd = null) {
  if (!client) return '';
  const gate = (dateStr) => {
    if (!monthEnd || !dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    return d.getTime() <= monthEnd.getTime();
  };

  const isDea = client.service_type === 'direct_to_employment';
  const isWd = client.service_type === 'pathways';

  // Resolved barriers
  const resolutionParts = [];
  for (let i = 1; i <= 3; i++) {
    if (client[`barrier_${i}`] && client[`barrier_${i}_status`] === 'resolved') {
      const note = String(client[`barrier_${i}_resolution_notes`] || '').trim();
      const endDate = client[`barrier_${i}_timeline_end`]
        ? formatDateForCrt(client[`barrier_${i}_timeline_end`])
        : '';
      if (note) {
        const dateTag = endDate ? ` (resolved ${endDate})` : '';
        resolutionParts.push(`Barrier ${i} resolved${dateTag}: ${note}`);
      }
    }
  }

  // EDA activity completions
  const deaActivities = Array.isArray(client.dea_activities) ? client.dea_activities : [];
  const edaParts = [];
  if (isDea) {
    deaActivities.forEach((a) => {
      if (a.completed_date && gate(a.completed_date)) {
        const label = String(a.type || 'EDA Activity').trim() || 'EDA Activity';
        edaParts.push(`EDA: ${label} completed (${formatDateForCrt(a.completed_date)})`);
      }
    });
  } else if (isWd) {
    const roadmapStatus = client.roadmap_item_status || {};
    (client.sdp_items || []).forEach((key) => {
      if (EXCLUDED_SDP.includes(key)) return;
      const st = roadmapStatus[key] || {};
      if (st.status === 'completed' && st.completed_date && gate(st.completed_date)) {
        const label = SDP_LABELS[key] || key.replace(/_/g, ' ');
        edaParts.push(`EDA: ${label} completed (${formatDateForCrt(st.completed_date)})`);
      }
    });
  }
  if (client.eda_completion_date && gate(client.eda_completion_date)) {
    edaParts.push(`Action Plan completed (${formatDateForCrt(client.eda_completion_date)})`);
  }

  // Found Employment (WD only)
  const employmentParts = [];
  if (isWd && client.post_completion_employment_date && gate(client.post_completion_employment_date)) {
    const bits = [];
    if (client.employer_name) bits.push(`Employer: ${client.employer_name}`);
    if (client.job_title) bits.push(`Job Title: ${client.job_title}`);
    if (client.job_hours) bits.push(`Hours/week: ${client.job_hours}`);
    if (client.job_wage !== undefined && client.job_wage !== null && client.job_wage !== '') {
      bits.push(`Wage: $${client.job_wage}/hr`);
    }
    if (client.employed_ftpt) {
      bits.push(client.employed_ftpt === 'FT' ? 'Full-Time' : 'Part-Time');
    }
    employmentParts.push(`Found Employment (${formatDateForCrt(client.post_completion_employment_date)}): ${bits.join('; ')}`);
  }

  // 90-Day Follow-up
  const followupParts = [];
  if (client.followup_90day_status && gate(client.followup_90day_date)) {
    const fDate = formatDateForCrt(client.followup_90day_date);
    if (EMPLOYED_OUTCOMES.includes(client.followup_90day_status)) {
      const bits = [];
      if (client.employer_name) bits.push(`Employer: ${client.employer_name}`);
      if (client.job_title) bits.push(`Job Title: ${client.job_title}`);
      if (client.job_hours) bits.push(`Hours/week: ${client.job_hours}`);
      if (client.job_wage !== undefined && client.job_wage !== null && client.job_wage !== '') {
        bits.push(`Wage: $${client.job_wage}/hr`);
      }
      if (client.employed_ftpt) {
        bits.push(client.employed_ftpt === 'FT' ? 'Full-Time' : 'Part-Time');
      }
      followupParts.push(`At the 90 Day Follow up, the client was employed (${fDate})${bits.length ? ': ' + bits.join('; ') : ''}`);
    } else {
      const desc = OUTCOME_DESC[client.followup_90day_status] || client.followup_90day_status;
      followupParts.push(`At the 90 Day Follow up, the client was ${desc} (${client.followup_90day_status}) (${fDate})`);
    }
  }

  const commentsParts = [];
  if (client.intake_notes && String(client.intake_notes).trim()) {
    commentsParts.push(String(client.intake_notes).trim());
  }
  commentsParts.push(...resolutionParts);
  commentsParts.push(...edaParts);
  commentsParts.push(...employmentParts);
  commentsParts.push(...followupParts);
  if (client.crt_additional_comments && String(client.crt_additional_comments).trim()) {
    commentsParts.push(String(client.crt_additional_comments).trim());
  }
  return commentsParts.join(' | ');
}