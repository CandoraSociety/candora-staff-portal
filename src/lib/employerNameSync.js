import { base44 } from '@/api/base44Client';

// When an employer's company name changes (e.g. corrected during portal registration),
// propagate the new name to denormalized fields on related records so every area
// that shows the employer's company name stays in sync.
export async function propagateEmployerName(employerId, newName) {
  if (!employerId || !newName) return;
  try {
    const placements = await base44.entities.WorkExposurePlacement.filter({ employer_id: employerId });
    if (placements.length) {
      await base44.entities.WorkExposurePlacement.bulkUpdate(
        placements.map(p => ({ id: p.id, business_name: newName }))
      );
    }
  } catch {}
  try {
    const subs = await base44.entities.WorkExposureHoursSubmission.filter({ employer_id: employerId });
    if (subs.length) {
      await base44.entities.WorkExposureHoursSubmission.bulkUpdate(
        subs.map(s => ({ id: s.id, employer_name: newName }))
      );
    }
  } catch {}
}