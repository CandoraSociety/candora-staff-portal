import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { RATE_PER_HOUR } from '@/lib/childmindingConstants';
import { parseBillingMonth } from './billingMonth';

export const monthLabelFromBillingMonth = (ym) =>
  format(parseBillingMonth(ym), 'MMMM yyyy');

/**
 * Find the CRT workbook file (from getCrtWorkbookStatus.allFiles) whose name
 * matches the billing month. CRT files are named CRT_<Month>_<Year>.xlsx
 */
export const findCrtFileForMonth = (allFiles, billingMonth) => {
  if (!allFiles?.length || !billingMonth) return null;
  const date = parseBillingMonth(billingMonth);
  const lowerMonth = format(date, 'MMMM').toLowerCase();
  const year = format(date, 'yyyy');
  return (
    allFiles.find(
      (f) => f.name && f.name.toLowerCase().includes(lowerMonth) && f.name.includes(year)
    ) || null
  );
};

const csvEscape = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const buildWorkExposureCsv = (records) => {
  const headers = [
    'Client',
    'Employer/Vendor',
    'Work End Date',
    'Hours',
    'Rate',
    'Billing Amount',
    'Status',
  ];
  const rows = records.map((r) => [
    r.client_name || '',
    r.vendor || '',
    r.work_end_date || '',
    r.hours_worked != null ? r.hours_worked : '',
    r.hourly_rate != null ? r.hourly_rate : '',
    Number(r.total || r.amount || 0).toFixed(2),
    r.invoiced ? 'Invoiced' : 'Pending',
  ]);
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
};

export const buildWorkExposureCsvBlob = (records) =>
  new Blob([buildWorkExposureCsv(records)], { type: 'text/csv;charset=utf-8;' });

/**
 * Build a clean, branded PDF of the month's Pathways childminding sessions.
 * Returns a Blob (used both for the standalone download and the ZIP bundle).
 */
export const buildChildmindingPdfBlob = (records, billingMonth) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const monthLabel = monthLabelFromBillingMonth(billingMonth);
  const NAVY = [23, 37, 84];
  const widths = [24, 70, 150, 120, 50, 70];
  const tableW = widths.reduce((a, b) => a + b, 0);
  const left = 40;
  const right = left + tableW;

  let y = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text('Pathways Childminding Services', left, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text(`${monthLabel} — Billing Sheet`, left, y);
  y += 8;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1);
  doc.line(left, y, right, y);
  y += 18;

  // Header row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(...NAVY);
  doc.rect(left, y - 12, tableW, 16, 'F');
  let x = left;
  ['#', 'Date', 'Parent/Guardian', 'Child', 'Hours', 'Amount'].forEach((c, i) => {
    doc.text(c, x + 3, y);
    x += widths[i];
  });
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  if (!records.length) {
    doc.text(`No Pathways childminding sessions recorded for ${monthLabel}.`, left, y + 6);
    return doc.output('blob');
  }

  records.forEach((r, i) => {
    if (y > 740) {
      doc.addPage();
      y = 44;
    }
    if (i % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(left, y - 12, tableW, 14, 'F');
    }
    const amount = r.billing_amount || (r.hours || 0) * RATE_PER_HOUR;
    const parentName =
      r.parent_name ||
      `${r.parent_first_name || ''} ${r.parent_last_name || ''}`.trim() ||
      '-';
    const vals = [
      String(i + 1),
      r.date ? format(new Date(r.date + 'T00:00:00'), 'MMM d, yyyy') : '-',
      parentName,
      r.child_first_name || '-',
      String(r.hours || 0),
      `$${amount.toFixed(2)}`,
    ];
    let xx = left;
    vals.forEach((v, j) => {
      doc.text(String(v), xx + 3, y);
      xx += widths[j];
    });
    y += 14;
  });

  const totalHours = records.reduce((s, r) => s + (r.hours || 0), 0);
  const totalAmount = records.reduce(
    (s, r) => s + (r.billing_amount || (r.hours || 0) * RATE_PER_HOUR),
    0
  );
  y += 6;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1);
  doc.line(left, y - 4, right, y - 4);
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `TOTAL (${records.length} sessions)   ${totalHours.toFixed(1)} hrs   $${totalAmount.toFixed(2)}`,
    left,
    y
  );

  return doc.output('blob');
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const downloadUrl = (url, filename) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || '';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const extFromUrl = (url) => {
  const m = String(url || '').match(/\.(\w{2,5})(?:\?|#|$)/);
  return m ? m[1].toLowerCase() : 'pdf';
};