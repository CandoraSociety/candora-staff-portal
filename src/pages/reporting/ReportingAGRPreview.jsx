import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, ChevronDown, FileText } from 'lucide-react';
import SectionRenderer from '@/components/reporting/SectionRenderer';

export default function ReportingAGRPreview() {
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/reporting/agr/${id}/edit`} className="text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold text-accent">{report?.title || 'Annual Report'}</h1>
          <p className="text-xs text-muted-foreground">Electronic preview</p>
        </div>
        <Link to={`/reporting/agr/${id}/print`}>
          <Button variant="outline" size="sm" className="gap-1"><Printer className="w-3.5 h-3.5" />Print</Button>
        </Link>
      </div>

      {analysis?.source_file_url && (
        <div className="max-w-4xl mx-auto">
          <a href={analysis.source_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
            <FileText className="w-3.5 h-3.5" />View Original Source Document
          </a>
        </div>
      )}

      {/* Front cover — full bleed, no overlays */}
      <div className="max-w-4xl mx-auto aspect-[8.5/11] overflow-hidden relative">
        {report?.cover_image ? (
          <img src={report.cover_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
        )}
      </div>
      {/* Inside front cover — truly full bleed */}
      {report?.inside_front_cover_image && (
        <div className="max-w-4xl mx-auto aspect-[8.5/11] overflow-hidden relative">
          <img src={report.inside_front_cover_image} alt="Inside Front Cover" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-8 space-y-6">
        {/* Branding header — only if no cover image */}
        {!report?.cover_image && branding && (
          <div className="text-center pb-6 border-b">
            {branding.logo_urls?.[0] && <img src={branding.logo_urls[0]} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />}
            <h2 className="text-2xl font-heading font-bold" style={{ color: branding.primary_color || '#1a2744' }}>{report?.title}</h2>
            {branding.tagline && <p className="text-sm text-muted-foreground mt-1">{branding.tagline}</p>}
            {branding.common_name && <p className="text-sm font-medium mt-4" style={{ color: branding.primary_color || '#1a2744' }}>{branding.common_name}</p>}
          </div>
        )}

        {/* Table of Contents — full page, always fully visible */}
        {sections.length > 0 && (() => {
          const tocPage = 1 + (report?.cover_image ? 1 : 0) + (report?.inside_front_cover_image ? 1 : 0);
          return (
            <div className="max-w-4xl mx-auto min-h-[80vh] bg-white rounded-xl shadow-sm border flex flex-col justify-center p-16">
              <h3 className="text-2xl font-heading font-bold mb-8" style={{ color: branding?.primary_color || '#1a2744' }}>Table of Contents</h3>
              <div className="space-y-1">
                {sections.map((s, i) => (
                  <a key={s.id} href={`#section-${s.id}`} className="flex items-center gap-4 text-base py-2 transition-colors hover:bg-slate-50 rounded px-3 -mx-3" style={{ color: branding?.secondary_color || '#3b5998' }}>
                    <span className="font-bold w-8 text-right" style={{ color: branding?.primary_color || '#1a2744' }}>{i + 1}.</span>
                    <span>{s.title || 'Untitled'}</span>
                    <span className="flex-1 border-b border-dotted mx-3 opacity-30" />
                    <span className="text-xs opacity-50">{tocPage + 1 + i}</span>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Sections */}
        {sections.map((section, i) => (
          <div key={section.id} id={`section-${section.id}`}>
            <SectionRenderer
              section={section}
              sectionNumber={i + 1}
              dataEntries={dataEntries}
              branding={branding}
              pageNumber={i + 1}
              masterHeader={report?.master_header_text}
              masterFooter={report?.master_footer_text}
              headerImage={report?.master_header_image}
              footerImage={report?.master_footer_image}
              headerImageHeight={report?.header_image_height}
              footerImageHeight={report?.footer_image_height}
              showHeaderAll={report?.show_header_all}
              showFooterAll={report?.show_footer_all}
              showPageNumbersAll={report?.show_page_numbers_all}
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

      {/* Inside back cover — truly full bleed */}
      {report?.inside_back_cover_image && (
        <div className="max-w-4xl mx-auto aspect-[8.5/11] overflow-hidden relative">
          <img src={report.inside_back_cover_image} alt="Inside Back Cover" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}
      {/* Back cover — full bleed with contact info overlay */}
      {report?.back_cover_image ? (
        <div className="max-w-4xl mx-auto aspect-[8.5/11] overflow-hidden relative">
          <img src={report.back_cover_image} alt="Back Cover" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
            {branding?.logo_urls?.[0] && (
              <img src={branding.logo_urls[0]} alt="Logo" className="h-16 md:h-20 object-contain mb-6 drop-shadow-lg" />
            )}
            <p className="text-xl md:text-2xl font-heading font-bold text-white drop-shadow-lg mb-4">
              {branding?.legal_name || branding?.common_name || ''}
            </p>
            {(branding?.address || branding?.address_line1) && (
              <p className="text-sm md:text-base text-white/90 drop-shadow">
                {branding.address || [branding.address_line1, branding.address_line2, branding.address_city, branding.address_province, branding.address_postal_code].filter(Boolean).join(', ')}
              </p>
            )}
            {branding?.website && (
              <p className="text-sm md:text-base text-white/90 drop-shadow mt-1">{branding.website}</p>
            )}
          </div>
        </div>
      ) : branding ? (
        <div className="max-w-4xl mx-auto aspect-[8.5/11] overflow-hidden relative" style={{ backgroundColor: branding.primary_color || '#1a2744' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
            <p className="text-xl md:text-2xl font-heading font-bold text-white drop-shadow-lg mb-4">
              {branding.legal_name || branding.common_name || ''}
            </p>
            {(branding.address || branding.address_line1) && (
              <p className="text-sm md:text-base text-white/90 drop-shadow">
                {branding.address || [branding.address_line1, branding.address_line2, branding.address_city, branding.address_province, branding.address_postal_code].filter(Boolean).join(', ')}
              </p>
            )}
            {branding?.website && (
              <p className="text-sm md:text-base text-white/90 drop-shadow mt-1">{branding.website}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}