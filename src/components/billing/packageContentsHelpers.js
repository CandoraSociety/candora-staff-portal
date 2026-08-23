import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { RATE_PER_HOUR } from '@/lib/childmindingConstants';
import { parseBillingMonth } from './billingMonth';
import { brandFooterLines } from '@/lib/candoraBrand';
import { base44 } from '@/api/base44Client';

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
 * Build a Candora-branded PDF of the month's Work Exposure Payments list —
 * matches the official invoice letterhead (gold strip, navy band, no-anniversary
 * logo, meta band, brand footer) so it reads like the childminding list.
 * Returns a Promise<Blob>.
 */
export const buildWorkExposurePdfBlob = async (records, billingMonth, brand = {}) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const monthLabel = monthLabelFromBillingMonth(billingMonth);
  const W = 612;
  const navy = hexToRgb(brand.navy) || [15, 31, 107];
  const gold = hexToRgb(brand.gold) || [245, 193, 22];
  const navyTint = [235, 238, 243];
  const goldTint = [252, 244, 214];
  const logo = brand.logoUrl ? await loadLogo(brand.logoUrl) : null;

  // Gold top accent strip
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 6, 'F');

  // Navy letterhead band
  const lhTop = 6;
  const lhH = 110;
  doc.setFillColor(...navy);
  doc.rect(0, lhTop, W, lhH, 'F');

  if (logo) {
    const boxW = 300, boxH = lhH, boxX = 24;
    const scale = Math.min(boxW / logo.w, boxH / logo.h);
    const drawW = logo.w * scale;
    const drawH = logo.h * scale;
    const drawY = lhTop + (boxH - drawH) / 2;
    try {
      doc.addImage(logo.dataUrl, 'PNG', boxX, drawY, drawW, drawH);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...gold);
      doc.text('Candora', 40, lhTop + 62);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...gold);
    doc.text('Candora', 40, lhTop + 62);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...gold);
  doc.text(`Pathways ${monthLabel} Work Exposure List`, W - 40, lhTop + (lhH / 2) + 4, { align: 'right' });

  // Meta band
  const metaTop = lhTop + lhH;
  const metaH = 46;
  doc.setFillColor(...navyTint);
  doc.rect(0, metaTop, W, metaH, 'F');
  const metaY = metaTop + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...navy);
  const uniqueClients = new Set(records.map((r) => r.client_id).filter(Boolean)).size;
  doc.text('BILLING MONTH', 40, metaY);
  doc.text('DATE ISSUED', 220, metaY);
  doc.text('# PLACEMENTS', 380, metaY);
  doc.text('# SUBMISSIONS', 500, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(monthLabel, 40, metaY + 14);
  doc.text(format(new Date(), 'MMMM d, yyyy'), 220, metaY + 14);
  doc.text(String(uniqueClients), 380, metaY + 14);
  doc.text(String(records.length), 500, metaY + 14);

  // Rate statement band
  const rateTop = metaTop + metaH;
  const rateH = 24;
  doc.setFillColor(...goldTint);
  doc.rect(0, rateTop, W, rateH, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(1.5);
  doc.line(0, rateTop + rateH, W, rateTop + rateH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text('Work Exposure Wage Reimbursement', 40, rateTop + 16);

  // Table
  const widths = [22, 120, 134, 72, 46, 50, 54];
  const tableW = widths.reduce((a, b) => a + b, 0);
  const left = 40;
  const right = left + tableW;
  let y = rateTop + rateH + 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.setFillColor(...navy);
  doc.rect(left, y - 12, tableW, 16, 'F');
  let x = left;
  ['#', 'Client', 'Employer / Vendor', 'Work End', 'Hours', 'Rate', 'Amount'].forEach((c, i) => {
    doc.text(c, x + 3, y);
    x += widths[i];
  });
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  if (!records.length) {
    doc.text(`No work exposure placements recorded for ${monthLabel}.`, left, y + 6);
  }

  const tableTop = rateTop + rateH + 18;
  records.forEach((r, i) => {
    const amount = Number(r.total || r.amount || 0);
    const clientLines = doc.splitTextToSize(String(r.client_name || '-'), widths[1] - 6);
    const vendorLines = doc.splitTextToSize(String(r.vendor || '-'), widths[2] - 6);
    const rowH = Math.max(14, Math.max(clientLines.length, vendorLines.length) * 10 + 4);
    if (y + rowH > 730) {
      doc.addPage();
      y = tableTop;
    }
    if (i % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(left, y - 12, tableW, rowH, 'F');
    }
    const vals = [
      String(i + 1),
      null,
      null,
      r.work_end_date ? format(new Date(r.work_end_date + 'T00:00:00'), 'MMM d, yyyy') : '-',
      r.hours_worked != null ? String(r.hours_worked) : '-',
      r.hourly_rate != null ? `$${Number(r.hourly_rate).toFixed(2)}` : '-',
      `$${amount.toFixed(2)}`,
    ];
    let xx = left;
    vals.forEach((v, j) => {
      if (j === 1) {
        clientLines.forEach((line, li) => doc.text(line, xx + 3, y + li * 10));
      } else if (j === 2) {
        vendorLines.forEach((line, li) => doc.text(line, xx + 3, y + li * 10));
      } else {
        doc.text(String(v), xx + 3, y);
      }
      xx += widths[j];
    });
    y += rowH;
  });

  if (records.length) {
    const totalHours = records.reduce((s, r) => s + (Number(r.hours_worked) || 0), 0);
    const totalAmount = records.reduce((s, r) => s + Number(r.total || r.amount || 0), 0);
    y += 6;
    doc.setDrawColor(...navy);
    doc.setLineWidth(1);
    doc.line(left, y - 4, right, y - 4);
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text(
      `TOTAL (${uniqueClients} placements, ${records.length} submissions)   ${totalHours.toFixed(1)} hrs   $${totalAmount.toFixed(2)}`,
      left,
      y
    );
  }

  // Brand footer on every page
  const footerLines = brandFooterLines();
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...navy);
    doc.rect(0, 742, W, 50, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let fy = 758;
    footerLines.forEach((l, i) => {
      doc.setTextColor(...(i === 0 ? gold : [226, 232, 240]));
      doc.text(l, W / 2, fy, { align: 'center' });
      fy += 10;
    });
  }

  return doc.output('blob');
};

const hexToRgb = (hex) => {
  const m = String(hex || '').replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map((h) => parseInt(h, 16));
};

// Fetch the logo and convert it to a data URL jsPDF can embed. Best-effort —
// if CORS/fetch blocks it we fall back to a text wordmark so the doc still brands.
async function loadLogo(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dim = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    if (!dim) return null;
    return { dataUrl, ...dim };
  } catch {
    return null;
  }
}

/**
 * Build a Candora-branded PDF of the month's Pathways childminding sessions —
 * matches the official invoice letterhead (gold strip, navy band, no-anniversary
 * logo) and includes the "Billed at $20/hr per child" rate statement + brand
 * footer. Returns a Promise<Blob>.
 */
export const buildChildmindingPdfBlob = async (records, billingMonth, brand = {}) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const monthLabel = monthLabelFromBillingMonth(billingMonth);
  const W = 612;
  const navy = hexToRgb(brand.navy) || [15, 31, 107];
  const gold = hexToRgb(brand.gold) || [245, 193, 22];
  const navyTint = [235, 238, 243];
  const goldTint = [252, 244, 214];

  const logo = brand.logoUrl ? await loadLogo(brand.logoUrl) : null;

  // Gold top accent strip
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 6, 'F');

  // Navy letterhead band
  const lhTop = 6;
  const lhH = 110;
  doc.setFillColor(...navy);
  doc.rect(0, lhTop, W, lhH, 'F');

  if (logo) {
    // Fill the navy letterhead band with the logo so the mark reads large.
    const boxW = 300;
    const boxH = lhH;
    const boxX = 24;
    const scale = Math.min(boxW / logo.w, boxH / logo.h);
    const drawW = logo.w * scale;
    const drawH = logo.h * scale;
    const drawY = lhTop + (boxH - drawH) / 2;
    try {
      doc.addImage(logo.dataUrl, 'PNG', boxX, drawY, drawW, drawH);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...gold);
      doc.text('Candora', 40, lhTop + 62);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...gold);
    doc.text('Candora', 40, lhTop + 62);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...gold);
  doc.text(`Pathways ${monthLabel} Childminding List`, W - 40, lhTop + (lhH / 2) + 4, { align: 'right' });

  // Meta band
  const metaTop = lhTop + lhH;
  const metaH = 46;
  doc.setFillColor(...navyTint);
  doc.rect(0, metaTop, W, metaH, 'F');
  const metaY = metaTop + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...navy);
  doc.text('BILLING MONTH', 40, metaY);
  doc.text('DATE ISSUED', 240, metaY);
  doc.text('# PARTICIPANTS', 440, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(monthLabel, 40, metaY + 14);
  doc.text(format(new Date(), 'MMMM d, yyyy'), 240, metaY + 14);
  doc.text(String(records.length), 440, metaY + 14);

  // Rate statement
  const rateTop = metaTop + metaH;
  const rateH = 24;
  doc.setFillColor(...goldTint);
  doc.rect(0, rateTop, W, rateH, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(1.5);
  doc.line(0, rateTop + rateH, W, rateTop + rateH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text(`Billed at $${RATE_PER_HOUR}/hr per child`, 40, rateTop + 16);

  // Table
  const widths = [24, 80, 180, 150, 48, 50];
  const tableW = widths.reduce((a, b) => a + b, 0);
  const left = 40;
  const right = left + tableW;
  let y = rateTop + rateH + 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.setFillColor(...navy);
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
  }

  records.forEach((r, i) => {
    if (y > 730) {
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

  if (records.length) {
    const totalHours = records.reduce((s, r) => s + (r.hours || 0), 0);
    const totalAmount = records.reduce(
      (s, r) => s + (r.billing_amount || (r.hours || 0) * RATE_PER_HOUR),
      0
    );
    y += 6;
    doc.setDrawColor(...navy);
    doc.setLineWidth(1);
    doc.line(left, y - 4, right, y - 4);
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text(
      `TOTAL (${records.length} participants)   ${totalHours.toFixed(1)} hrs   $${totalAmount.toFixed(2)}`,
      left,
      y
    );
  }

  // Brand footer on every page
  const footerLines = brandFooterLines();
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...navy);
    doc.rect(0, 742, W, 50, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let fy = 758;
    footerLines.forEach((l, i) => {
      doc.setTextColor(...(i === 0 ? gold : [226, 232, 240]));
      doc.text(l, W / 2, fy, { align: 'center' });
      fy += 10;
    });
  }

  return doc.output('blob');
};

/**
 * Build a Candora-branded combined PDF of the month's Employment Supports and
 * Exposure Courses lists — mirrors the childminding letterhead (gold strip,
 * navy band, no-anniversary logo, meta band, brand footer). Records should be
 * the FinancialRecord entries for the month whose record_type is
 * 'employment_supports' or 'exposure_course'. Returns a Promise<Blob>.
 */
export const buildReimbursementPdfBlob = async (records, billingMonth, brand = {}) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const monthLabel = monthLabelFromBillingMonth(billingMonth);
  const W = 612;
  const navy = hexToRgb(brand.navy) || [15, 31, 107];
  const gold = hexToRgb(brand.gold) || [245, 193, 22];
  const navyTint = [235, 238, 243];
  const goldTint = [252, 244, 214];
  const logo = brand.logoUrl ? await loadLogo(brand.logoUrl) : null;

  // Gold top accent strip
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 6, 'F');

  // Navy letterhead band
  const lhTop = 6;
  const lhH = 110;
  doc.setFillColor(...navy);
  doc.rect(0, lhTop, W, lhH, 'F');

  if (logo) {
    const boxW = 300, boxH = lhH, boxX = 24;
    const scale = Math.min(boxW / logo.w, boxH / logo.h);
    const drawW = logo.w * scale;
    const drawH = logo.h * scale;
    const drawY = lhTop + (boxH - drawH) / 2;
    try {
      doc.addImage(logo.dataUrl, 'PNG', boxX, drawY, drawW, drawH);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...gold);
      doc.text('Candora', 40, lhTop + 62);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...gold);
    doc.text('Candora', 40, lhTop + 62);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...gold);
  doc.text(`Pathways ${monthLabel} Reimbursement List`, W - 40, lhTop + (lhH / 2) + 4, { align: 'right' });

  // Meta band
  const metaTop = lhTop + lhH;
  const metaH = 46;
  doc.setFillColor(...navyTint);
  doc.rect(0, metaTop, W, metaH, 'F');
  const metaY = metaTop + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...navy);
  doc.text('BILLING MONTH', 40, metaY);
  doc.text('DATE ISSUED', 240, metaY);
  doc.text('# ENTRIES', 440, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(monthLabel, 40, metaY + 14);
  doc.text(format(new Date(), 'MMMM d, yyyy'), 240, metaY + 14);
  doc.text(String(records.length), 440, metaY + 14);

  // Statement band
  const rateTop = metaTop + metaH;
  const rateH = 24;
  doc.setFillColor(...goldTint);
  doc.rect(0, rateTop, W, rateH, 'F');
  doc.setDrawColor(...gold);
  doc.setLineWidth(1.5);
  doc.line(0, rateTop + rateH, W, rateTop + rateH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text('Employment Supports & Exposure Courses (Reimbursable — excluding tax)', 40, rateTop + 16);

  // Table — two sections (Employment Supports, Exposure Courses) with subheaders.
  const widths = [20, 64, 116, 184, 90, 52];
  const tableW = widths.reduce((a, b) => a + b, 0);
  const left = 40;
  const right = left + tableW;
  const tableTop = rateTop + rateH + 18;
  let y = tableTop;
  const pageBottom = 730;

  const renderColHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.setFillColor(...navy);
    doc.rect(left, y - 12, tableW, 16, 'F');
    let x = left;
    ['#', 'Date', 'Client', 'Description', 'Vendor', 'Amount'].forEach((c, i) => {
      doc.text(c, x + 3, y);
      x += widths[i];
    });
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
  };

  const renderSection = (title, sectionRecords, tagClients = false) => {
    if (!sectionRecords.length) return;
    // Section subheader band
    if (y + 24 > pageBottom) {
      doc.addPage();
      y = tableTop;
    }
    doc.setFillColor(...goldTint);
    doc.rect(left, y - 10, tableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text(`${title} (${sectionRecords.length})`, left + 6, y + 2);
    y += 22;
    renderColHeader();
    sectionRecords.forEach((r, i) => {
      const amount = Number(r.amount || 0);
      const baseClient = String(r.client_name || '-');
      const tag = tagClients && r.client_id ? programTagFor(clientServiceMap[r.client_id]) : '';
      const clientText = tag ? `${baseClient} (${tag})` : baseClient;
      const clientLines = doc.splitTextToSize(clientText, widths[2] - 6);
      const descLines = doc.splitTextToSize(String(r.description || '-'), widths[3] - 6);
      const vendorLines = doc.splitTextToSize(String(r.vendor || '-'), widths[4] - 6);
      const rowH = Math.max(14, Math.max(clientLines.length, descLines.length, vendorLines.length) * 10 + 4);
      if (y + rowH > pageBottom) {
        doc.addPage();
        y = tableTop;
      }
      if (i % 2 === 1) {
        doc.setFillColor(245, 247, 250);
        doc.rect(left, y - 12, tableW, rowH, 'F');
      }
      const vals = [
        String(i + 1),
        r.date ? format(new Date(r.date + 'T00:00:00'), 'MMM d, yyyy') : '-',
        null,
        null,
        null,
        `$${amount.toFixed(2)}`,
      ];
      let xx = left;
      vals.forEach((v, j) => {
        if (j === 2) {
          clientLines.forEach((line, li) => doc.text(line, xx + 3, y + li * 10));
        } else if (j === 3) {
          descLines.forEach((line, li) => doc.text(line, xx + 3, y + li * 10));
        } else if (j === 4) {
          vendorLines.forEach((line, li) => doc.text(line, xx + 3, y + li * 10));
        } else {
          doc.text(String(v), xx + 3, y);
        }
        xx += widths[j];
      });
      y += rowH;
    });
    // Section subtotal
    const subtotal = sectionRecords.reduce((s, r) => s + Number(r.amount || 0), 0);
    y += 6;
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.75);
    doc.line(left + tableW * 0.55, y, right, y);
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...navy);
    doc.text(`${title} Subtotal   $${subtotal.toFixed(2)}`, right, y, { align: 'right' });
    y += 16;
  };

  const supportsRecords = records.filter((r) => r.record_type !== 'exposure_course');
  const courseRecords = records.filter((r) => r.record_type === 'exposure_course');

  // For exposure courses, identify each client's program stream (WD vs DEA)
  // from the Client record so it shows next to the client name in that section.
  const courseClientIds = [...new Set(courseRecords.map((r) => r.client_id).filter(Boolean))];
  const clientServiceMap = {};
  if (courseClientIds.length) {
    const clients = await Promise.all(
      courseClientIds.map((id) => base44.entities.Client.get(id).catch(() => null))
    );
    clients.forEach((c) => { if (c && c.id) clientServiceMap[c.id] = c.service_type; });
  }
  const programTagFor = (serviceType) =>
    serviceType === 'pathways' ? 'WD' : serviceType === 'direct_to_employment' ? 'DEA' : '';

  if (!records.length) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(`No employment supports or exposure courses recorded for ${monthLabel}.`, left, y + 6);
  } else {
    renderSection('Employment Supports', supportsRecords);
    renderSection('Exposure Courses', courseRecords, true);

    const totalAmount = records.reduce((s, r) => s + Number(r.amount || 0), 0);
    y += 4;
    if (y + 16 > pageBottom) {
      doc.addPage();
      y = tableTop;
    }
    doc.setDrawColor(...navy);
    doc.setLineWidth(1);
    doc.line(left, y - 4, right, y - 4);
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text(`TOTAL (${records.length} entries)   $${totalAmount.toFixed(2)}`, left, y);
  }

  // Brand footer on every page
  const footerLines = brandFooterLines();
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...navy);
    doc.rect(0, 742, W, 50, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let fy = 758;
    footerLines.forEach((l, i) => {
      doc.setTextColor(...(i === 0 ? gold : [226, 232, 240]));
      doc.text(l, W / 2, fy, { align: 'center' });
      fy += 10;
    });
  }

  return doc.output('blob');
};

/**
 * Render an already-mounted InvoiceDocument DOM node into a letter-size PDF
 * blob (multi-page slicing when the invoice is taller than one page). Used to
 * bundle the month's invoice into the package ZIP so the archive contains the
 * real invoice PDF instead of a README placeholder.
 */
export const buildInvoicePdfFromNode = async (node) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  });
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const usableW = pageW;
  const fullImgH = (canvas.height / canvas.width) * usableW;
  if (fullImgH <= pageH) {
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, usableW, fullImgH);
  } else {
    const pxPerPg = Math.floor((canvas.width / usableW) * pageH);
    let pos = 0;
    while (pos < canvas.height) {
      const sliceH = Math.min(pxPerPg, canvas.height - pos);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceH;
      slice.getContext('2d').drawImage(canvas, 0, pos, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (pos > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, usableW, (sliceH / canvas.width) * usableW);
      pos += sliceH;
    }
  }
  return pdf.output('blob');
};

// Some downstream systems reject underscores and hyphens in downloaded file
// names. Replace both with a space, collapse runs, and trim. Keep the file
// extension (dots are untouched).
export const cleanFileName = (s) =>
  String(s || '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

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