// Shared helper: computes which roadmap timeline items are not yet complete.
// Used by the status menu to gate "Mark EDAs as Complete" when items remain
// incomplete, and by the roadmap view itself.

const PLACEMENT_TYPE_LABELS = {
  cleaning_arc: 'Cleaning ARC',
  food_services_onsite: 'Food Services (Onsite)',
  food_services_offsite: 'Food Services (Offsite)',
  reception: 'Reception/Admin',
  childcare: 'Childcare',
  program_support: 'Program Support',
  security: 'Security',
};

const ITEM_LABELS = {
  job_search_workshop: 'Job Search Workshop',
  resume_writing_workshop: 'Resume Writing Workshop',
  interview_skills_workshop: 'Interview Skills Workshop',
  workplace_readiness_workshop: 'Workplace Readiness Workshop',
  financial_literacy_workshop: 'Financial Literacy Workshop',
  digital_literacy_workshop: 'Digital Literacy Workshop',
  empoweru: 'EmpowerU',
  ell_classes: 'ELL Classes',
  skills_assessment: 'Skills Assessment',
  internal_placement: 'Internal Placement',
  exposure_course: 'Exposure Course',
  paid_external_placement: 'Paid External Placement',
  employment_supports: 'Employment Supports',
  job_applications: 'Job Applications',
  networking: 'Networking',
  other: 'Other',
};

const EXCLUDED_SDP_KEYS = ['barrier_support', 'internal_placement', 'paid_external_placement'];

// Returns an array of { key, label, status } for all timeline items.
export function buildRoadmapItems(client, internalTrainings = [], workExposures = []) {
  const roadmapStatus = client?.roadmap_item_status || {};
  const selectedItems = (client?.sdp_items || []).filter(k => !EXCLUDED_SDP_KEYS.includes(k));

  const items = selectedItems.map(key => ({
    key,
    label: ITEM_LABELS[key] || key.replace(/_/g, ' '),
    status: roadmapStatus[key]?.status || 'planned',
  }));

  for (let n = 1; n <= 3; n++) {
    if (client?.[`barrier_${n}`]) {
      items.push({
        key: `barrier_${n}`,
        label: `Barrier: ${client[`barrier_${n}`]}`,
        status: roadmapStatus[`barrier_${n}`]?.status || 'planned',
      });
    }
  }

  (client?.dea_activities || []).forEach(activity => {
    if (!activity.type) return;
    const status = roadmapStatus[`dea_${activity.id}`]?.status
      || (activity.completed_date ? 'completed' : 'planned');
    items.push({
      key: `dea_${activity.id}`,
      label: activity.type,
      status,
    });
  });

  internalTrainings.forEach(t => {
    const status = t.status === 'completed' ? 'completed'
      : t.status === 'active' ? 'started'
      : (t.status === 'withdrawn' || t.status === 'cancelled') ? 'cancelled'
      : 'planned';
    items.push({
      key: `it_${t.id}`,
      label: `Internal: ${PLACEMENT_TYPE_LABELS[t.placement_type] || t.placement_type}`,
      status,
    });
  });

  workExposures.forEach(w => {
    const status = w.status === 'completed' ? 'completed'
      : w.status === 'in_progress' ? 'started'
      : w.status === 'cancelled' ? 'cancelled'
      : 'planned';
    items.push({
      key: `wep_${w.id}`,
      label: `Work Exposure: ${w.business_name}`,
      status,
    });
  });

  return items;
}

// Returns items that are not completed and not cancelled (i.e. still pending or in progress).
export function getIncompleteRoadmapItems(client, internalTrainings = [], workExposures = []) {
  return buildRoadmapItems(client, internalTrainings, workExposures)
    .filter(item => item.status === 'planned' || item.status === 'started');
}