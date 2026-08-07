import { base44 } from '@/api/base44Client';

// Recompute a placement's total hours_worked from all its hours submissions.
export async function recomputePlacementHours(placementId) {
  const subs = await base44.entities.WorkExposureHoursSubmission.filter({ placement_id: placementId });
  const total = subs.reduce((s, x) => s + (Number(x.hours_worked) || 0), 0);
  await base44.entities.WorkExposurePlacement.update(placementId, { hours_worked: total });
  return total;
}

// Keep the client's CRT flags in sync with placements + submissions.
//   paid_external_placement (CRT col U — Work Exposure Y/N): yes if any placement
//   has hours submitted OR is completed.
//   wage_subsidy_accessed (CRT col V): yes if any placement is completed.
export async function updateClientFlags(clientId) {
  const placements = await base44.entities.WorkExposurePlacement.filter({ client_id: clientId });
  const hasCompleted = placements.some(p => p.status === 'completed');
  const subs = await base44.entities.WorkExposureHoursSubmission.filter({ client_id: clientId });
  const hasSubmissions = subs.length > 0;
  await base44.entities.Client.update(clientId, {
    paid_external_placement: hasCompleted || hasSubmissions,
    wage_subsidy_accessed: hasCompleted,
  });
}

// Create / upsert the per-submission FinancialRecord (payable), then recompute
// placement hours and refresh the client's CRT flags.
export async function syncSubmissionCreate(submission, placement) {
  const rate = Number(placement.hourly_rate) || 15;
  const hours = Number(submission.hours_worked) || 0;
  const amount = Math.round(hours * rate * 100) / 100;

  const frData = {
    record_type: 'paid_external_placement',
    client_id: placement.client_id,
    client_name: placement.client_name || '',
    assigned_worker: placement.assigned_worker || '',
    vendor: placement.business_name || '',
    description: placement.position_type ? `Work Exposure: ${placement.position_type}` : 'Work Exposure Placement',
    date: submission.period_start_date || submission.submitted_date || '',
    work_end_date: submission.period_end_date || '',
    billing_month: submission.billing_month || '',
    completion_status: placement.status === 'completed' ? 'completed' : 'in_progress',
    linked_placement_id: placement.id,
    linked_submission_id: submission.id,
    hours_worked: hours,
    hourly_rate: rate,
    amount,
    tax: 0,
    total: amount,
    receipt_urls: submission.timesheet_url ? [submission.timesheet_url] : [],
    notes: submission.comments || '',
  };

  const existing = await base44.entities.FinancialRecord.filter({ linked_submission_id: submission.id });
  if (existing.length > 0) {
    await base44.entities.FinancialRecord.update(existing[0].id, frData);
  } else {
    await base44.entities.FinancialRecord.create(frData);
  }

  await recomputePlacementHours(placement.id);
  await updateClientFlags(placement.client_id);
}

// Delete a submission and its linked payable, then recompute + refresh flags.
export async function syncSubmissionDelete(submission, placement) {
  const frs = await base44.entities.FinancialRecord.filter({ linked_submission_id: submission.id });
  for (const fr of frs) {
    await base44.entities.FinancialRecord.delete(fr.id);
  }
  await base44.entities.WorkExposureHoursSubmission.delete(submission.id);
  await recomputePlacementHours(placement.id);
  await updateClientFlags(placement.client_id);
}