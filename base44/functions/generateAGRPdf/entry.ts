import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

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

    // Initialize PDF - letter size (8.5in x 11in)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
      compress: true,
    });

    const pageWidth = 8.5;
    const pageHeight = 11;
    const margin = 0.75;
    const contentWidth = pageWidth - margin * 2;
    const headerHeight = 0.35;
    const footerHeight = 0.35;
    const contentTop = margin + headerHeight + 0.1;
    const contentBottom = pageHeight - margin - footerHeight;
    const contentHeight = contentBottom - contentTop;

    let currentPage = 1;
    let yPos = contentTop;

    const addPage = () => {
      pdf.addPage('letter', 'portrait');
      currentPage++;
      yPos = contentTop;
    };

    const checkPageBreak = (neededHeight) => {
      if (yPos + neededHeight > contentBottom) {
        addPage();
        return true;
      }
      return false;
    };

    // Add header/footer helper
    const addHeaderFooter = (pageNum) => {
      // Header
      if (report.master_header_text || report.master_header_image) {
        pdf.setDrawColor(hexToRgb(pc));
        pdf.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight);
        
        if (report.master_header_text) {
          pdf.setFontSize(report.header_font_size || 10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(report.master_header_text, margin, margin + 0.15);
        }
        
        if (report.master_header_image) {
          try {
            pdf.addImage(report.master_header_image, 'JPEG', pageWidth - margin - 1, margin, 1, report.header_image_height / 96 || 0.5);
          } catch (e) { /* ignore image errors */ }
        }
        
        if (report.show_page_numbers_all) {
          pdf.setFontSize(report.header_font_size || 10);
          pdf.text(String(pageNum), pageWidth - margin - 0.5, margin + 0.15);
        }
      }

      // Footer
      if (report.master_footer_text || report.master_footer_image) {
        pdf.setDrawColor(hexToRgb(pc));
        pdf.line(margin, pageHeight - margin - footerHeight, pageWidth - margin, pageHeight - margin - footerHeight);
        
        if (report.master_footer_text) {
          pdf.setFontSize(report.footer_font_size || 10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(report.master_footer_text, margin, pageHeight - margin - 0.15);
        }
      }
    };

    // Hex to RGB helper
    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [100, 100, 100];
    }

    // Split text to fit width
    function splitText(text, fontSize, maxWidth) {
      pdf.setFontSize(fontSize);
      return pdf.splitTextToSize(text || '', maxWidth);
    }

    // FRONT COVER
    pdf.setFillColor(hexToRgb(pc)[0], hexToRgb(pc)[1], hexToRgb(pc)[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    if (report.cover_image) {
      try {
        pdf.addImage(report.cover_image, 'JPEG', margin, 2, contentWidth, 6);
      } catch (e) { /* ignore */ }
    }
    
    // Cover text overlays
    try {
      const overlays = report.cover_overlays ? JSON.parse(report.cover_overlays) : [];
      overlays.forEach(overlay => {
        if (overlay.type === 'text' && overlay.text) {
          pdf.setFontSize(overlay.font_size || 24);
          pdf.setTextColor(255, 255, 255);
          if (overlay.bold) pdf.setFont('helvetica', 'bold');
          const x = (overlay.x || 50) / 100 * pageWidth;
          const y = (overlay.y || 50) / 100 * pageHeight;
          pdf.text(overlay.text, x, y, { align: overlay.align || 'center' });
        }
      });
    } catch (e) { /* ignore overlay errors */ }

    addPage();

    // INSIDE FRONT COVER
    if (report.inside_front_cover_image) {
      try {
        pdf.addImage(report.inside_front_cover_image, 'JPEG', margin, margin, contentWidth, pageHeight - margin * 2);
      } catch (e) { /* ignore */ }
      addPage();
    }

    // TABLE OF CONTENTS
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(hexToRgb(ac)[0], hexToRgb(ac)[1], hexToRgb(ac)[2]);
    pdf.text('Table of Contents', margin, yPos);
    yPos += 0.4;

    sections.forEach((section, i) => {
      if (checkPageBreak(0.3)) {
        addHeaderFooter(currentPage);
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      const pageNum = i + 2;
      pdf.text(`${i + 1}. ${section.title}`, margin, yPos);
      pdf.text(`Page ${pageNum}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 0.25;
    });

    addHeaderFooter(currentPage);
    addPage();

    // SECTIONS
    sections.forEach((section, sectionIndex) => {
      if (section.page_break_before) {
        addPage();
        addHeaderFooter(currentPage);
      }

      // Check if we need a new page for this section
      checkPageBreak(1.5);
      addHeaderFooter(currentPage);

      // Section header bar
      pdf.setFillColor(hexToRgb(pc)[0], hexToRgb(pc)[1], hexToRgb(pc)[2]);
      pdf.rect(margin, yPos, contentWidth, 0.08, 'F');
      yPos += 0.15;

      // Section number badge
      pdf.setFillColor(hexToRgb(pc)[0], hexToRgb(pc)[1], hexToRgb(pc)[2]);
      pdf.circle(margin + 0.2, yPos + 0.15, 0.15, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text(String(sectionIndex + 1), margin + 0.2, yPos + 0.16, { align: 'center' });

      // Section title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(hexToRgb(pc)[0], hexToRgb(pc)[1], hexToRgb(pc)[2]);
      pdf.text(section.title, margin + 0.5, yPos + 0.2);
      yPos += 0.4;

      // Section content (strip HTML tags for plain text)
      const content = (section.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (content) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(50, 50, 50);
        const lines = splitText(content, 10, contentWidth - 0.5);
        
        lines.forEach(line => {
          if (checkPageBreak(0.25)) {
            addHeaderFooter(currentPage);
          }
          pdf.text(line, margin + 0.5, yPos);
          yPos += 0.15;
        });
      }

      // Section image
      if (section.image_url && section.layout !== 'text_only') {
        try {
          checkPageBreak(2);
          const imgWidth = (section.image_width || 50) / 100 * contentWidth;
          const imgX = section.layout === 'image_right' ? pageWidth - margin - imgWidth : margin;
          pdf.addImage(section.image_url, 'JPEG', imgX, yPos, imgWidth, 2);
          yPos += 2.1;
        } catch (e) { /* ignore image errors */ }
      }

      // Chart data
      const sectionData = dataEntries.filter(d => d.section_id === section.id);
      if (sectionData.length > 0) {
        checkPageBreak(2.5);
        sectionData.forEach(d => {
          if (d.chart_config) {
            const chartConfig = typeof d.chart_config === 'string' ? JSON.parse(d.chart_config) : d.chart_config;
            // Simple table representation of chart data
            if (chartConfig.data && Array.isArray(chartConfig.data)) {
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              pdf.text(chartConfig.title || 'Data', margin + 0.5, yPos);
              yPos += 0.2;
              
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(8);
              chartConfig.data.forEach((row, i) => {
                if (checkPageBreak(0.2)) {
                  addHeaderFooter(currentPage);
                }
                pdf.text(`${row.label || `Row ${i + 1}`}: ${row.value}`, margin + 0.5, yPos);
                yPos += 0.15;
              });
              yPos += 0.1;
            }
          }
          if (d.ai_narrative) {
            const narrative = d.ai_narrative.replace(/\s+/g, ' ').trim();
            if (narrative) {
              pdf.setFont('helvetica', 'italic');
              pdf.setFontSize(9);
              const lines = splitText(narrative, 9, contentWidth - 0.5);
              lines.forEach(line => {
                if (checkPageBreak(0.2)) {
                  addHeaderFooter(currentPage);
                }
                pdf.text(line, margin + 0.5, yPos);
                yPos += 0.13;
              });
            }
          }
        });
      }

      yPos += 0.3; // Section spacing
    });

    // SUBSIDIARY LOGOS
    if (branding?.subsidiary_logos?.length > 0) {
      addPage();
      addHeaderFooter(currentPage);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Our Sub-Brands', margin, yPos);
      yPos += 0.4;
      
      branding.subsidiary_logos.forEach((logo, i) => {
        try {
          pdf.addImage(logo.url, 'JPEG', margin + (i % 4) * 2, yPos, 1.5, 0.5);
          if ((i + 1) % 4 === 0) yPos += 0.7;
        } catch (e) { /* ignore */ }
      });
    }

    // FUNDER LOGOS
    if (branding?.funder_logos?.length > 0) {
      addPage();
      addHeaderFooter(currentPage);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Our Funders', margin, yPos);
      yPos += 0.4;
      
      branding.funder_logos.forEach((logo, i) => {
        try {
          pdf.addImage(logo.url, 'JPEG', margin + (i % 4) * 2, yPos, 1.5, 0.5);
          if ((i + 1) % 4 === 0) yPos += 0.7;
        } catch (e) { /* ignore */ }
      });
    }

    // INSIDE BACK COVER
    if (report.inside_back_cover_image) {
      addPage();
      try {
        pdf.addImage(report.inside_back_cover_image, 'JPEG', margin, margin, contentWidth, pageHeight - margin * 2);
      } catch (e) { /* ignore */ }
    }

    // BACK COVER
    addPage();
    pdf.setFillColor(hexToRgb(pc)[0], hexToRgb(pc)[1], hexToRgb(pc)[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    if (report.back_cover_image) {
      try {
        pdf.addImage(report.back_cover_image, 'JPEG', margin, 2, contentWidth, 6);
      } catch (e) { /* ignore */ }
    }

    if (report.back_cover_text) {
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      const lines = splitText(report.back_cover_text, 14, contentWidth);
      const textHeight = lines.length * 0.2;
      pdf.text(lines, pageWidth / 2, pageHeight / 2, { align: 'center', maxWidth: contentWidth });
    }

    // Generate PDF as arraybuffer
    const pdfArrayBuffer = pdf.output('arraybuffer');
    
    return new Response(pdfArrayBuffer, {
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