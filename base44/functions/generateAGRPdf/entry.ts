import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import puppeteer from 'npm:puppeteer@22.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id } = await req.json();
    if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });

    // Fetch report data
    const [report, sections, brandingList, dataEntries] = await Promise.all([
      base44.entities.AGRReport.get(report_id),
      base44.entities.AGRReportSection.filter({ report_id }, 'order_index'),
      base44.entities.AGRBranding.filter({ report_id }),
      base44.entities.AGRReportData.filter({ report_id }),
    ]);

    const branding = brandingList[0] || null;
    const pc = branding?.primary_color || '#1a2744';
    const ac = branding?.accent_color || '#2b2de8';

    // Build HTML for PDF
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: letter; margin: 0.75in; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .page { width: 8.5in; height: 11in; page-break-after: always; position: relative; }
    .cover { background: ${pc}; display: flex; align-items: center; justify-content: center; }
    .cover img { max-width: 100%; max-height: 100%; }
    .header { position: fixed; top: 0.35in; left: 0.75in; right: 0.75in; border-bottom: 1px solid ${pc}40; padding-bottom: 0.1in; }
    .footer { position: fixed; bottom: 0.35in; left: 0.75in; right: 0.75in; border-top: 1px solid ${pc}40; padding-top: 0.1in; }
    .section { margin-bottom: 0.5in; }
    .section-header { display: flex; align-items: center; gap: 0.25in; margin-bottom: 0.25in; }
    .section-number { width: 0.3in; height: 0.3in; border-radius: 50%; background: ${pc}; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
    .section-title { font-size: 14px; font-weight: bold; color: ${pc}; }
    .section-content { font-size: 10px; color: #333; line-height: 1.5; }
    .toc-entry { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 0.15in; }
    .logo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5in; }
    .logo-item { text-align: center; }
    .logo-item img { max-height: 0.5in; max-width: 100%; }
    h1 { font-size: 18px; color: ${ac}; }
  </style>
</head>
<body>
`;

    // Front cover
    html += `<div class="page cover">`;
    if (report.cover_image) {
      html += `<img src="${report.cover_image}" alt="Cover" />`;
    }
    html += `</div>`;

    // Inside front cover
    if (report.inside_front_cover_image) {
      html += `<div class="page"><img src="${report.inside_front_cover_image}" style="width:100%;height:100%;object-fit:contain;" /></div>`;
    }

    // Table of Contents
    html += `<div class="page"><h1>Table of Contents</h1>`;
    sections.forEach((section, i) => {
      html += `<div class="toc-entry"><span>${i + 1}. ${section.title}</span><span>Page ${i + 2}</span></div>`;
    });
    html += `</div>`;

    // Sections
    sections.forEach((section, i) => {
      if (section.page_break_before) html += `<div class="page">`;
      else if (i === 0) html += `<div class="page">`;
      
      const content = (section.content || '').replace(/<[^>]*>/g, ' ');
      
      html += `
        <div class="section">
          <div class="section-header">
            <div class="section-number">${i + 1}</div>
            <div class="section-title">${section.title}</div>
          </div>
          <div class="section-content">${content}</div>
      `;
      
      if (section.image_url && section.layout !== 'text_only') {
        html += `<img src="${section.image_url}" style="max-width:50%;margin:0.25in 0;" />`;
      }
      
      html += `</div>`;
    });
    html += `</div>`;

    // Subsidiary logos
    if (branding?.subsidiary_logos?.length > 0) {
      html += `<div class="page"><h1>Our Sub-Brands</h1><div class="logo-grid">`;
      branding.subsidiary_logos.forEach(logo => {
        html += `<div class="logo-item"><img src="${logo.url}" /><p>${logo.purpose || ''}</p></div>`;
      });
      html += `</div></div>`;
    }

    // Funder logos
    if (branding?.funder_logos?.length > 0) {
      html += `<div class="page"><h1>Our Funders</h1><div class="logo-grid">`;
      branding.funder_logos.forEach(logo => {
        html += `<div class="logo-item"><img src="${logo.url}" /><p>${logo.purpose || ''}</p></div>`;
      });
      html += `</div></div>`;
    }

    // Inside back cover
    if (report.inside_back_cover_image) {
      html += `<div class="page"><img src="${report.inside_back_cover_image}" style="width:100%;height:100%;object-fit:contain;" /></div>`;
    }

    // Back cover
    html += `<div class="page cover">`;
    if (report.back_cover_image) {
      html += `<img src="${report.back_cover_image}" alt="Back Cover" />`;
    } else if (report.back_cover_text) {
      html += `<p style="color:white;font-size:14px;text-align:center;white-space:pre-line;">${report.back_cover_text}</p>`;
    }
    html += `</div>`;

    html += `</body></html>`;

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
    });
    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.title || 'Annual_Report'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});