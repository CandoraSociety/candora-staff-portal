import React, { useState } from 'react';
import SectionRenderer from '@/components/reporting/SectionRenderer';
import StyledCoverPreview from '@/components/reporting/CoverPreview';
import ScaledTOC from '@/components/reporting/ScaledTOC';
import { base44 } from '@/api/base44Client';

export default function ReportPrintView({ report, sections, branding, dataEntries, onSectionRef, onSectionsUpdate, onSectionUpdate }) {
  const [sectionPageCounts, setSectionPageCounts] = useState({});

  if (!report) return null;

  const hasInsideFront = !!report.inside_front_cover_image;
  const tocPage = hasInsideFront ? 3 : 2;

  const getSectionPage = (index) => {
    let page = 1;
    for (let i = 0; i < index; i++) {
      page += sectionPageCounts[sections[i]?.id] || 1;
    }
    return page;
  };

  const handlePageCountChange = (sectionId, count) => {
    setSectionPageCounts(prev => prev[sectionId] === count ? prev : { ...prev, [sectionId]: count });
  };

  const togglePageBreak = async (sectionId, current) => {
    await base44.entities.AGRReportSection.update(sectionId, { page_break_before: !current });
    if (onSectionsUpdate) {
      onSectionsUpdate(prev => prev.map(s => s.id === sectionId ? { ...s, page_break_before: !current } : s));
    }
  };

  const primaryColor = branding?.primary_color || '#1a2744';

  return (
    <div className="print:block">
      {/* Front cover */}
      <div className="print:break-after-page" style={{ width: '8.5in', minHeight: '11in', backgroundColor: branding?.primary_color || '#1a2744' }}>
        <StyledCoverPreview coverType="front" report={report} branding={branding} noPadding />
      </div>

      {/* Inside front cover */}
      {report.inside_front_cover_image && (
        <div className="print:break-after-page" style={{ width: '8.5in', minHeight: '11in' }}>
          <StyledCoverPreview coverType="inside_front" report={report} branding={branding} noPadding />
        </div>
      )}

      {/* Table of Contents */}
      <div className="print:break-after-page" style={{ width: '8.5in', minHeight: '11in' }}>
        <div className="p-8">
          <ScaledTOC sections={sections} branding={branding} getPage={getSectionPage} containerHeight="11in" padding="2.5rem" />
        </div>
      </div>

      {/* Sections - simple flow layout */}
      {sections.map((section, i) => (
        <div key={section.id} style={{ width: '8.5in' }}>
          {section.page_break_before && <div className="print:break-before-page" />}
          <SectionRenderer
            section={section}
            sectionNumber={i + 1}
            dataEntries={dataEntries}
            branding={branding}
            isPrint={true}
            masterStyles={report.master_section_styles}
            pageNumber={getSectionPage(i)}
            masterHeader={report.master_header_text}
            masterFooter={report.master_footer_text}
            headerImage={report.master_header_image}
            footerImage={report.master_footer_image}
            headerImageHeight={report.header_image_height}
            footerImageHeight={report.footer_image_height}
            headerFontSize={report.header_font_size}
            footerFontSize={report.footer_font_size}
            headerLayout={report.header_layout}
            headerZones={report.header_zones}
            footerLayout={report.footer_layout}
            footerZones={report.footer_zones}
            showHeaderAll={report.show_header_all}
            showFooterAll={report.show_footer_all}
            showPageNumbersAll={report.show_page_numbers_all}
            noBorder
            onUpdate={onSectionUpdate}
          />
        </div>
      ))}

      {/* Subsidiary logos */}
      {branding?.subsidiary_logos?.length > 0 && (
        <div className="print:block print:break-before-page" style={{ width: '8.5in', minHeight: '11in' }}>
          <div className="p-8">
            <p className="text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground">Our Sub-Brands</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {branding.subsidiary_logos.map((sl, i) => (
                <div key={i} className="text-center">
                  <img src={sl.url} alt={sl.purpose} className="h-12 object-contain mx-auto" />
                  {sl.purpose && <p className="text-xs text-muted-foreground mt-1">{sl.purpose}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Funder logos */}
      {branding?.funder_logos?.length > 0 && (
        <div className="print:block print:break-before-page" style={{ width: '8.5in', minHeight: '11in' }}>
          <div className="p-8">
            <p className="text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground">Our Funders</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {branding.funder_logos.map((fl, i) => (
                <div key={i} className="text-center">
                  <img src={fl.url} alt={fl.purpose} className="h-12 object-contain mx-auto" />
                  {fl.purpose && <p className="text-xs text-muted-foreground mt-1">{fl.purpose}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inside back cover */}
      {report.inside_back_cover_image && (
        <div className="print:block print:break-after-page" style={{ width: '8.5in', height: '11in' }}>
          <StyledCoverPreview coverType="inside_back" report={report} branding={branding} noPadding />
        </div>
      )}

      {/* Back cover */}
      {(report.back_cover_image || branding) && (
        <div className="print:block" style={{ width: '8.5in', height: '11in', backgroundColor: branding?.primary_color || '#1a2744' }}>
          {report.back_cover_image ? (
            <StyledCoverPreview coverType="back" report={report} branding={branding} noPadding />
          ) : (
            <div className="h-full w-full overflow-hidden relative">
              {report.back_cover_text && (
                <p className="text-xl text-white whitespace-pre-line text-center p-12">{report.back_cover_text}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}