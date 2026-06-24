import React, { useState } from 'react';
import SectionRenderer from '@/components/reporting/SectionRenderer';
import StyledCoverPreview from '@/components/reporting/CoverPreview';
import ScaledTOC from '@/components/reporting/ScaledTOC';
import FitToPage from '@/components/reporting/FitToPage';
import PaginatedSection, { ContinuationHeader, PageFooter } from '@/components/reporting/PaginatedSection';
import { base44 } from '@/api/base44Client';

function PagePreview({ pageNum, children, className, fitToPage }) {
  return (
    <div className={`relative print:shadow-none print:mb-0 mb-6 ${className || ''}`}>
      <div className="no-print absolute -inset-1 bg-gray-200 rounded-lg -z-10 translate-y-1" />
      <div className="no-print absolute -inset-2 bg-gray-100 rounded-lg -z-20 translate-y-2" />
      <div className={`relative bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none overflow-hidden print-flow-page print-page-end`} style={{ height: '11in', width: '8.5in', maxWidth: '100%' }}>
        {children}
      </div>
      {pageNum && (
        <div className="no-print text-center mt-2">
          <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">Page {pageNum}</span>
        </div>
      )}
    </div>
  );
}

export default function ReportPrintView({ report, sections, branding, dataEntries, onSectionRef, onSectionsUpdate, onSectionUpdate }) {
  const [sectionPageCounts, setSectionPageCounts] = useState({});

  if (!report) return null;

  const hasInsideFront = !!report.inside_front_cover_image;
  const tocPage = hasInsideFront ? 3 : 2;

  // Calculate section start pages based on actual measured page counts.
  // Page numbering starts at 1 for the first section — covers and TOC are excluded.
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
    <div className="flex flex-col items-center gap-3 force-block-print">
      {/* ── Fixed print header — repeats on every page via position:fixed, sits in top margin ── */}
      {report.show_header_all && (
        <div className="hidden print:block print-header">
          <ContinuationHeader
            masterHeader={report.master_header_text}
            headerImage={report.master_header_image}
            headerImageHeight={report.header_image_height}
            headerFontSize={report.header_font_size}
            headerLayout={report.header_layout}
            headerZones={report.header_zones}
            primaryColor={primaryColor}
            branding={branding}
            showPageNumber={false}
          />
        </div>
      )}

      {/* ── Fixed print footer — repeats on every page via position:fixed, sits in bottom margin ── */}
      {report.show_footer_all && (
        <div className="hidden print:block print-footer">
          <PageFooter
            masterFooter={report.master_footer_text}
            footerImage={report.master_footer_image}
            footerImageHeight={report.footer_image_height}
            footerFontSize={report.footer_font_size}
            footerLayout={report.footer_layout}
            footerZones={report.footer_zones}
            primaryColor={primaryColor}
            branding={branding}
            showPageNumber={report.show_page_numbers_all}
            useCssCounter
          />
        </div>
      )}

      {/* Front cover */}
      <PagePreview pageNum={1}>
        <StyledCoverPreview coverType="front" report={report} branding={branding} noPadding />
      </PagePreview>

      {/* Inside front cover */}
      {report.inside_front_cover_image && (
        <PagePreview pageNum={2}>
          <StyledCoverPreview coverType="inside_front" report={report} branding={branding} noPadding />
        </PagePreview>
      )}

      {/* Table of Contents */}
      <PagePreview pageNum={tocPage}>
        <ScaledTOC sections={sections} branding={branding} getPage={getSectionPage} containerHeight="11in" padding="2.5rem" />
      </PagePreview>

      {/* Sections */}
      {sections.map((section, i) => (
        <PaginatedSection
          key={section.id}
          sectionId={section.id}
          pageNum={getSectionPage(i)}
          branding={branding}
          fitToPage={section.fit_to_page}
          pageBreakBefore={section.page_break_before}
          onTogglePageBreak={() => togglePageBreak(section.id, section.page_break_before)}
          onSectionRef={onSectionRef}
          onPageCountChange={handlePageCountChange}
          isFirstSection={i === 0}
          isLastSection={i === sections.length - 1}
          masterHeader={report.master_header_text}
          headerImage={report.master_header_image}
          headerImageHeight={report.header_image_height}
          headerFontSize={report.header_font_size}
          headerLayout={report.header_layout}
          headerZones={report.header_zones}
          showHeaderAll={report.show_header_all}
          showPageNumbersAll={report.show_page_numbers_all}
          masterFooter={report.master_footer_text}
          footerImage={report.master_footer_image}
          footerImageHeight={report.footer_image_height}
          footerFontSize={report.footer_font_size}
          footerLayout={report.footer_layout}
          footerZones={report.footer_zones}
          showFooterAll={report.show_footer_all}
          hideFooter={section.hide_footer}
        >
          <FitToPage enabled={section.fit_to_page} availableHeightPx={988}>
            <SectionRenderer
              section={section}
              sectionNumber={i + 1}
              dataEntries={dataEntries}
              branding={branding}
              isPrint={false}
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
              onUpdate={onSectionUpdate}
            />
          </FitToPage>
        </PaginatedSection>
      ))}

      {/* Subsidiary logos */}
      {branding?.subsidiary_logos?.length > 0 && (
        <PagePreview pageNum={tocPage + sections.length + 1} className="print-break">
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
        </PagePreview>
      )}

      {/* Funder logos */}
      {branding?.funder_logos?.length > 0 && (
        <PagePreview className="print-break">
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
        </PagePreview>
      )}

      {/* Inside back cover */}
      {report.inside_back_cover_image && (
        <PagePreview className="print-break">
          <StyledCoverPreview coverType="inside_back" report={report} branding={branding} noPadding />
        </PagePreview>
      )}

      {/* Back cover */}
      {report.back_cover_image ? (
        <PagePreview className="print-break">
          <StyledCoverPreview coverType="back" report={report} branding={branding} noPadding />
        </PagePreview>
      ) : branding ? (
        <PagePreview className="print-break">
          <div className="h-full w-full overflow-hidden relative" style={{ backgroundColor: branding.primary_color || '#1a2744' }}>
            {report.back_cover_text && (
              <p className="text-xl text-white drop-shadow-lg whitespace-pre-line text-center p-12">{report.back_cover_text}</p>
            )}
          </div>
        </PagePreview>
      ) : null}
    </div>
  );
}