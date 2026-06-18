import React from 'react';
import SectionRenderer from '@/components/reporting/SectionRenderer';
import StyledCoverPreview from '@/components/reporting/CoverPreview';

export default function ReportDigitalView({ report, sections, branding, dataEntries, onSectionRef }) {
  if (!report) return null;

  return (
    <div className="space-y-0">
      {/* Front cover */}
      <div className="max-w-4xl mx-auto">
        <StyledCoverPreview coverType="front" report={report} branding={branding} />
      </div>
      {/* Inside front cover */}
      {report.inside_front_cover_image && (
        <div className="max-w-4xl mx-auto">
          <StyledCoverPreview coverType="inside_front" report={report} branding={branding} />
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-8 space-y-6">
          {/* Branding header — only if no cover image */}
          {!report.cover_image && branding && (
            <div className="text-center pb-6 border-b">
              {branding.logo_urls?.[0] && <img src={branding.logo_urls[0]} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />}
              <h2 className="text-2xl font-heading font-bold" style={{ color: branding.primary_color || '#1a2744' }}>{report.title}</h2>
              {branding.tagline && <p className="text-sm text-muted-foreground mt-1">{branding.tagline}</p>}
              {branding.common_name && <p className="text-sm font-medium mt-4" style={{ color: branding.primary_color || '#1a2744' }}>{branding.common_name}</p>}
            </div>
          )}

          {/* Table of Contents */}
          {sections.length > 0 && (() => {
            const tocPage = 1 + (report.cover_image ? 1 : 0) + (report.inside_front_cover_image ? 1 : 0);
            return (
              <div className="min-h-[80vh] bg-white rounded-xl shadow-sm border flex flex-col justify-center p-16">
                <h3 className="text-2xl font-heading font-bold mb-8" style={{ color: branding?.primary_color || '#1a2744' }}>Table of Contents</h3>
                <div className="space-y-1">
                  {sections.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-4 text-base py-2 transition-colors hover:bg-slate-50 rounded px-3 -mx-3" style={{ color: branding?.secondary_color || '#3b5998' }}>
                      <span className="font-bold w-8 text-right" style={{ color: branding?.primary_color || '#1a2744' }}>{i + 1}.</span>
                      <span>{s.title || 'Untitled'}</span>
                      <span className="flex-1 border-b border-dotted mx-3 opacity-30" />
                      <span className="text-xs opacity-50">{tocPage + 1 + i}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Sections */}
          {sections.map((section, i) => (
            <div key={section.id} ref={el => { if (onSectionRef) onSectionRef(section.id, el); }}>
              <SectionRenderer
                section={section}
                sectionNumber={i + 1}
                dataEntries={dataEntries}
                branding={branding}
                masterStyles={report.master_section_styles}
                pageNumber={i + 1}
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
                forceCollapsible
              />
            </div>
          ))}

          {/* Subsidiary logos */}
          {branding?.subsidiary_logos?.length > 0 && (
            <div className="border-t pt-6">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 text-muted-foreground">Our Sub-Brands</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {branding.subsidiary_logos.map((sl, i) => (
                  <div key={i} className="text-center">
                    <img src={sl.url} alt={sl.purpose} className="h-10 object-contain mx-auto" />
                    {sl.purpose && <p className="text-[10px] text-muted-foreground mt-1">{sl.purpose}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funder logos */}
          {branding?.funder_logos?.length > 0 && (
            <div className="border-t pt-6">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 text-muted-foreground">Our Funders</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {branding.funder_logos.map((fl, i) => (
                  <div key={i} className="text-center">
                    <img src={fl.url} alt={fl.purpose} className="h-10 object-contain mx-auto" />
                    {fl.purpose && <p className="text-[10px] text-muted-foreground mt-1">{fl.purpose}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inside back cover */}
      {report.inside_back_cover_image && (
        <div className="max-w-4xl mx-auto">
          <StyledCoverPreview coverType="inside_back" report={report} branding={branding} />
        </div>
      )}
      {/* Back cover */}
      {report.back_cover_image ? (
        <div className="max-w-4xl mx-auto">
          <StyledCoverPreview coverType="back" report={report} branding={branding} />
        </div>
      ) : branding ? (
        <div className="max-w-4xl mx-auto aspect-[8.5/11] overflow-hidden relative" style={{ backgroundColor: branding.primary_color || '#1a2744' }}>
          {report.back_cover_text && (
            <p className="text-base md:text-xl text-white drop-shadow-lg whitespace-pre-line text-center p-12">{report.back_cover_text}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}