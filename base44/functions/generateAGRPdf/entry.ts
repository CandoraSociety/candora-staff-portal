import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:image/jpeg;base64,${base64}`;
  } catch (e) {
    console.error('Image fetch error:', e);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report_id } = await req.json();
    if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });

    const [report, sections, brandingList, dataEntries] = await Promise.all([
      base44.entities.AGRReport.get(report_id),
      base44.entities.AGRReportSection.filter({ report_id }, 'order_index'),
      base44.entities.AGRBranding.filter({ report_id }),
      base44.entities.AGRReportData.filter({ report_id }),
    ]);

    const branding = brandingList[0] || null;
    const pc = branding?.primary_color || '#1a2744';
    const ac = branding?.accent_color || '#2b2de8';

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 54;
    const contentWidth = pageWidth - 2 * margin;

    let yPosition = margin;
    let pageNumber = 1;

    const addPage = () => { doc.addPage(); pageNumber++; yPosition = margin; };
    const checkPageBreak = (neededHeight) => {
      if (yPosition + neededHeight > pageHeight - margin) { addPage(); return true; }
      return false;
    };

    // Front cover
    doc.setFillColor(pc);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    if (report.cover_image) {
      const imgData = await fetchImageAsBase64(report.cover_image);
      if (imgData) {
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = Math.min(contentWidth, imgProps.width * 0.5);
        const imgHeight = imgProps.height * (imgWidth / imgProps.width);
        doc.addImage(imgData, 'JPEG', margin, pageHeight / 2 - imgHeight / 2, imgWidth, imgHeight);
      }
    }
    addPage();

    // Inside front cover
    if (report.inside_front_cover_image) {
      const imgData = await fetchImageAsBase64(report.inside_front_cover_image);
      if (imgData) {
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = Math.min(contentWidth, imgProps.width * 0.5);
        const imgHeight = imgProps.height * (imgWidth / imgProps.width);
        doc.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      }
      addPage();
    }

    // Table of Contents
    doc.setFontSize(18);
    doc.setTextColor(ac);
    doc.text('Table of Contents', margin, yPosition);
    yPosition += 30;
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (checkPageBreak(20)) {
        doc.setFontSize(18);
        doc.setTextColor(ac);
        doc.text('Table of Contents (cont.)', margin, yPosition);
        yPosition += 20;
      }
      doc.setFontSize(11);
      doc.setTextColor('#333');
      doc.text(`${i + 1}. ${section.title}`, margin, yPosition);
      doc.text(`Page ${i + 2}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 18;
    }
    addPage();

    // Sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.page_break_before) addPage();

      doc.setDrawColor(ac);
      doc.setLineWidth(2);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFillColor(pc);
      doc.circle(margin + 12, yPosition + 10, 12, 'F');
      doc.setTextColor('#fff');
      doc.setFontSize(10);
      doc.text(String(i + 1), margin + 12, yPosition + 13, { align: 'center' });

      doc.setTextColor(pc);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margin + 30, yPosition + 14);
      yPosition += 35;

      const content = (section.content || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
      doc.setTextColor('#333');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      if (content) {
        const lines = doc.splitTextToSize(content, contentWidth);
        for (const line of lines) {
          if (checkPageBreak(15)) doc.setFontSize(10);
          doc.text(line, margin, yPosition);
          yPosition += 15;
        }
      }

      if (section.image_url && section.layout !== 'text_only') {
        if (checkPageBreak(150)) doc.setFontSize(10);
        const imgData = await fetchImageAsBase64(section.image_url);
        if (imgData) {
          const imgProps = doc.getImageProperties(imgData);
          const imgWidth = Math.min(contentWidth * 0.5, imgProps.width * 0.3);
          const imgHeight = imgProps.height * (imgWidth / imgProps.width);
          doc.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
        }
      }
      yPosition += 20;
    }

    // Subsidiary logos
    if (branding?.subsidiary_logos?.length > 0) {
      addPage();
      doc.setFontSize(18);
      doc.setTextColor(ac);
      doc.text('Our Sub-Brands', margin, yPosition);
      yPosition += 30;
      let logoX = margin;
      let logoY = yPosition;
      for (let i = 0; i < branding.subsidiary_logos.length; i++) {
        const logo = branding.subsidiary_logos[i];
        if (i > 0 && i % 4 === 0) { logoX = margin; logoY += 80; checkPageBreak(80); }
        const imgData = await fetchImageAsBase64(logo.url);
        if (imgData) {
          doc.addImage(imgData, 'JPEG', logoX, logoY, 100, 50);
          if (logo.purpose) {
            doc.setFontSize(8);
            doc.setTextColor('#666');
            doc.text(logo.purpose, logoX, logoY + 60);
          }
        }
        logoX += 140;
      }
    }

    // Funder logos
    if (branding?.funder_logos?.length > 0) {
      addPage();
      doc.setFontSize(18);
      doc.setTextColor(ac);
      doc.text('Our Funders', margin, yPosition);
      yPosition += 30;
      let logoX = margin;
      let logoY = yPosition;
      for (let i = 0; i < branding.funder_logos.length; i++) {
        const logo = branding.funder_logos[i];
        if (i > 0 && i % 4 === 0) { logoX = margin; logoY += 80; checkPageBreak(80); }
        const imgData = await fetchImageAsBase64(logo.url);
        if (imgData) {
          doc.addImage(imgData, 'JPEG', logoX, logoY, 100, 50);
          if (logo.purpose) {
            doc.setFontSize(8);
            doc.setTextColor('#666');
            doc.text(logo.purpose, logoX, logoY + 60);
          }
        }
        logoX += 140;
      }
    }

    // Inside back cover
    if (report.inside_back_cover_image) {
      addPage();
      const imgData = await fetchImageAsBase64(report.inside_back_cover_image);
      if (imgData) {
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = Math.min(contentWidth, imgProps.width * 0.5);
        const imgHeight = imgProps.height * (imgWidth / imgProps.width);
        doc.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      }
    }

    // Back cover
    addPage();
    doc.setFillColor(pc);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    if (report.back_cover_image) {
      const imgData = await fetchImageAsBase64(report.back_cover_image);
      if (imgData) {
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = Math.min(contentWidth, imgProps.width * 0.5);
        const imgHeight = imgProps.height * (imgWidth / imgProps.width);
        doc.addImage(imgData, 'JPEG', margin, pageHeight / 2 - imgHeight / 2, imgWidth, imgHeight);
      }
    } else if (report.back_cover_text) {
      doc.setTextColor('#fff');
      doc.setFontSize(14);
      const lines = doc.splitTextToSize(report.back_cover_text, contentWidth);
      doc.text(lines, pageWidth / 2, pageHeight / 2, { align: 'center' });
    }

    const totalPages = doc.internal.getNumberOfPages();
    if (totalPages > 1) doc.deletePage(totalPages);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
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