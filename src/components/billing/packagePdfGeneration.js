import { base44 } from '@/api/base44Client';
import { buildWorkExposurePdfBlob, buildReimbursementPdfBlob, cleanFileName } from './packageContentsHelpers';

/**
 * Upload a generated PDF Blob to the app's file storage and return its URL.
 */
export async function uploadPdfBlob(blob, filename) {
  const file = new File([blob], filename, { type: 'application/pdf' });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

/**
 * Build + upload the Work Exposure Payments list PDF for a package's month
 * and persist its URL on the InvoicePackage record.
 */
export async function generateWorkExposurePdf(pkg, weRecords, brand, displayLabel, monthsKey) {
  const bm = pkg.billing_month;
  const blob = await buildWorkExposurePdfBlob(weRecords, bm, brand, displayLabel);
  const weName = cleanFileName(`WorkExposure_${monthsKey || bm}.pdf`);
  const file_url = await uploadPdfBlob(blob, weName);
  const updates = { work_exposure_pdf_url: file_url, work_exposure_pdf_name: weName };
  await base44.entities.InvoicePackage.update(pkg.id, updates);
  return updates;
}

/**
 * Build + upload the combined Employment Supports & Exposure Courses list
 * PDF for a package's month and persist its URL on the InvoicePackage record.
 */
export async function generateReimbursementPdf(pkg, reimbRecords, brand, displayLabel, monthsKey) {
  const bm = pkg.billing_month;
  const blob = await buildReimbursementPdfBlob(reimbRecords, bm, brand, displayLabel);
  const reName = cleanFileName(`EmploymentSupports_ExposureCourses_${monthsKey || bm}.pdf`);
  const file_url = await uploadPdfBlob(blob, reName);
  const updates = { reimbursement_pdf_url: file_url, reimbursement_pdf_name: reName };
  await base44.entities.InvoicePackage.update(pkg.id, updates);
  return updates;
}

/**
 * Generate both package PDFs (Work Exposure list + combined Employment
 * Supports/Exposure Courses list), upload them, and persist the URLs on the
 * package. Best-effort — a failure on one PDF does not block the other.
 */
export async function generateAndStorePackagePdfs(pkg, { weRecords, reimbRecords, brand }) {
  const results = {};
  try {
    const we = await generateWorkExposurePdf(pkg, weRecords, brand);
    if (we) Object.assign(results, we);
  } catch (e) {
    console.error('Work exposure PDF generation failed', e);
  }
  try {
    const re = await generateReimbursementPdf(pkg, reimbRecords, brand);
    if (re) Object.assign(results, re);
  } catch (e) {
    console.error('Reimbursement PDF generation failed', e);
  }
  return results;
}