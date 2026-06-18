import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import SectionRenderer from '@/components/reporting/SectionRenderer';

export default function ReportingAGRPrint() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [branding, setBranding] = useState(null);
  const [dataEntries, setDataEntries] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.AGRReport.get(id),
      base44.entities.AGRReportSection.filter({ report_id: id }, 'order_index'),
      base44.entities.AGRBranding.filter({ report_id: id }),
      base44.entities.AGRReportData.filter({ report_id: id }),
      base44.entities.AGRAnalysisResult.filter({ report_id: id }),
    ]).then(([r, secs, brandList, dataList, analysisList]) => {
      setReport(r);
      setSections(secs);
      setBranding(brandList[0] || null);
      setDataEntries(dataList);
      setAnalysis(analysisList[0] || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center gap-3 mb-6">
        <Link to={`/reporting/agr/${id}/edit`} className="text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold text-accent">{report?.title || 'Annual Report'}</h1>
          <p className="text-xs text-muted-foreground">Print-optimized view</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" />Print / Save PDF
        </Button>
      </div>

      {analysis?.source_file_url && (
        <div className="no-print max-w-[210mm] mx-auto mb-2">
          <a href={analysis.source_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
            <FileText className="w-3.5 h-3.5" />View Original Source Document
          </a>
        </div>
      )}

      <div className="max-w-[210mm] mx-auto bg-white print:shadow-none print:border-0">
        {/* Front cover — full bleed with manual overlay text */}
        <div className="print-break aspect-[8.5/11] w-full overflow-hidden relative">
          {report?.cover_image ? (
            <img src={report.cover_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
          )}
          {report?.front_cover_text && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: report?.cover_image ? 'rgba(0,0,0,0.3)' : 'transparent' }}>
              <p className="text-xl md:text-3xl text-white drop-shadow-lg whitespace-pre-line">{report.front_cover_text}</p>
            </div>
          )}
        </div>

        {/* Inside front cover — full bleed with manual overlay text */}
        {report?.inside_front_cover_image && (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden relative">
            <img src={report.inside_front_cover_image} alt="Inside Front Cover" className="absolute inset-0 w-full h-full object-cover" />
            {report?.inside_front_cover_text && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <p className="text-xl text-white drop-shadow-lg whitespace-pre-line">{report.inside_front_cover_text}</p>
              </div>
            )}
          </div>
        )}

        <div className="print-break p-8">
          {branding && (
            <div className="text-center mb-8 pb-6 border-b">
              <h2 className="text-xl font-heading font-bold" style={{ color: branding.primary_color || '#1a2744' }}>{branding.common_name}</h2>
              {(branding.address || branding.address_line1) && <p className="text-sm text-muted-foreground mt-1">{branding.address || [branding.address_line1, branding.address_line2, branding.address_city, branding.address_province, branding.address_postal_code].filter(Boolean).join(', ')}</p>}
              {branding.website && <p className="text-sm text-muted-foreground">{branding.website}</p>}
            </div>
          )}
          <h3 className="text-base font-bold uppercase tracking-wider mb-4" style={{ color: branding?.primary_color || '#1a2744' }}>Table of Contents</h3>
          <div style={{ borderLeft: `2px solid ${branding?.accent_color || '#2b2de8'}`, paddingLeft: '14px', borderRadius: '0 4px 4px 0' }}>
            {sections.map((s, i) => (
              <p key={s.id} className="text-sm py-0.5" style={{ color: branding?.secondary_color || '#3b5998' }}>
                <span className="font-bold mr-2" style={{ color: branding?.primary_color || '#1a2744' }}>{i + 1}.</span>
                {s.title || 'Untitled'}
              </p>
            ))}
          </div>
        </div>

        {sections.map((section, i) => (
          <div key={section.id} className="print-break">
            <div className="h-1 w-full" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
            <div className="p-8">
            <SectionRenderer
              section={section}
              sectionNumber={i + 1}
              dataEntries={dataEntries}
              branding={branding}
              isPrint
              pageNumber={i + 3}
              masterHeader={report?.master_header_text}
              masterFooter={report?.master_footer_text}
              headerImage={report?.master_header_image}
              footerImage={report?.master_footer_image}
              headerImageHeight={report?.header_image_height}
              footerImageHeight={report?.footer_image_height}
              headerFontSize={report?.header_font_size}
              footerFontSize={report?.footer_font_size}
              headerLayout={report?.header_layout}
              headerTextAlign={report?.header_text_align}
              headerImageAlign={report?.header_image_align}
              headerPageNumberAlign={report?.header_page_number_align}
              footerLayout={report?.footer_layout}
              footerTextAlign={report?.footer_text_align}
              footerImageAlign={report?.footer_image_align}
              footerPageNumberAlign={report?.footer_page_number_align}
              showHeaderAll={report?.show_header_all}
              showFooterAll={report?.show_footer_all}
              showPageNumbersAll={report?.show_page_numbers_all}
            />
            </div>
          </div>
        ))}

        {branding?.subsidiary_logos?.length > 0 && (
          <div className="print-break p-8">
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
        )}

        {branding?.funder_logos?.length > 0 && (
          <div className="print-break p-8">
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
        )}

        {/* Inside back cover — full bleed with manual overlay text */}
        {report?.inside_back_cover_image && (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden relative">
            <img src={report.inside_back_cover_image} alt="Inside Back Cover" className="absolute inset-0 w-full h-full object-cover" />
            {report?.inside_back_cover_text && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <p className="text-xl text-white drop-shadow-lg whitespace-pre-line">{report.inside_back_cover_text}</p>
              </div>
            )}
          </div>
        )}

        {/* Back cover — full bleed with manual overlay text */}
        {report?.back_cover_image ? (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden relative">
            <img src={report.back_cover_image} alt="Back Cover" className="absolute inset-0 w-full h-full object-cover" />
            {report?.back_cover_text && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                <p className="text-xl text-white drop-shadow-lg whitespace-pre-line">{report.back_cover_text}</p>
              </div>
            )}
          </div>
        ) : branding ? (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden relative" style={{ backgroundColor: branding.primary_color || '#1a2744' }}>
            {report?.back_cover_text && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <p className="text-xl text-white drop-shadow-lg whitespace-pre-line">{report.back_cover_text}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}