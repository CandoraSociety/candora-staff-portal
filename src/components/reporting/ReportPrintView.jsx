import React from 'react';
import SectionRenderer from '@/components/reporting/SectionRenderer';
import StyledCoverPreview from '@/components/reporting/CoverPreview';
import ScaledTOC from '@/components/reporting/ScaledTOC';
import { ArrowBigUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function PagePreview({ pageNum, children, className }) {
  return (
    <div className={`relative print:shadow-none print:mb-0 mb-6 ${className || ''}`}>
      <div className="no-print absolute -inset-1 bg-gray-200 rounded-lg -z-10 translate-y-1" />
      <div className="no-print absolute -inset-2 bg-gray-100 rounded-lg -z-20 translate-y-2" />
      <div className="bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none overflow-hidden" style={{ minHeight: '11in', width: '210mm', maxWidth: '100%' }}>
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
  if (!report) return null;

  const hasInsideFront = !!report.inside_front_cover_image;
  const tocPage = hasInsideFront ? 3 : 2;
  const getSectionPage = (index) => tocPage + 1 + index;

  const togglePageBreak = async (sectionId, current) => {
    await base44.entities.AGRReportSection.update(sectionId, { page_break_before: !current });
    if (onSectionsUpdate) {
      onSectionsUpdate(prev => prev.map(s => s.id === sectionId ? { ...s, page_break_before: !current } : s));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
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
        <PagePreview key={section.id} pageNum={getSectionPage(i)}>
          <div className="h-1 w-full" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
          <div className="p-8 relative">
            <button
              onClick={() => togglePageBreak(section.id, section.page_break_before)}
              className="no-print absolute top-2 right-2 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
              title={section.page_break_before ? 'Click to let this section flow naturally' : 'Click to force this section to start on a new page'}
            >
              <ArrowBigUp className={`w-3.5 h-3.5 ${section.page_break_before ? 'text-accent' : ''}`} />
              {section.page_break_before ? 'Forced page break' : 'Normal flow'}
            </button>
            <div ref={el => { if (onSectionRef) onSectionRef(section.id, el); }}>
              <SectionRenderer
                section={section}
                sectionNumber={i + 1}
                dataEntries={dataEntries}
                branding={branding}
                isPrint
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
            </div>
          </div>
        </PagePreview>
      ))}

      {/* Subsidiary logos */}
      {branding?.subsidiary_logos?.length > 0 && (
        <PagePreview pageNum={tocPage + sections.length + 1}>
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
        <PagePreview>
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
        <PagePreview>
          <StyledCoverPreview coverType="inside_back" report={report} branding={branding} noPadding />
        </PagePreview>
      )}

      {/* Back cover */}
      {report.back_cover_image ? (
        <PagePreview>
          <StyledCoverPreview coverType="back" report={report} branding={branding} noPadding />
        </PagePreview>
      ) : branding ? (
        <PagePreview>
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