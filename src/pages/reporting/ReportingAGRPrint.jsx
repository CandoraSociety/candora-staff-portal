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
        {/* Front cover — full bleed with required info overlay */}
        <div className="print-break aspect-[8.5/11] w-full overflow-hidden relative">
          {report?.cover_image ? (
            <img src={report.cover_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center" style={{ backgroundColor: report?.cover_image ? 'rgba(0,0,0,0.3)' : 'transparent' }}>
            {branding?.logo_urls?.[0] && (
              <img src={branding.logo_urls[0]} alt="Logo" className="h-24 object-contain mb-6 drop-shadow-lg" />
            )}
            <h1 className="text-3xl font-heading font-bold text-white drop-shadow-lg mb-4">{report?.title || 'Annual Report'}</h1>
            {branding?.tagline && <p className="text-lg text-white/90 mb-6 drop-shadow">{branding.tagline}</p>}
            {report?.year && (
              <p className="text-lg text-white/90 font-medium drop-shadow">
                April 1, {report.year} – March 31, {report.year + 1}
              </p>
            )}
            {branding?.common_name && (
              <p className="text-sm text-white/80 mt-6 drop-shadow">{branding.common_name}</p>
            )}
          </div>
        </div>

        {/* Inside front cover — full bleed */}
        {report?.inside_front_cover_image && (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden"><img src={report.inside_front_cover_image} alt="Inside Front Cover" className="w-full h-full object-cover" /></div>
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
              dataEntries={dataEntries}
              branding={branding}
              isPrint
              pageNumber={i + 3}
              masterHeader={report?.master_header_text}
              masterFooter={report?.master_footer_text}
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

        {/* Inside back cover — full bleed */}
        {report?.inside_back_cover_image && (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden"><img src={report.inside_back_cover_image} alt="Inside Back Cover" className="w-full h-full object-cover" /></div>
        )}

        {/* Back cover — full bleed */}
        {report?.back_cover_image ? (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden"><img src={report.back_cover_image} alt="Back Cover" className="w-full h-full object-cover" /></div>
        ) : branding ? (
          <div className="print-break p-8 text-center py-12">
            {branding.logo_urls && branding.logo_urls[0] && (
              <img src={branding.logo_urls[0]} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />
            )}
            <p className="text-lg font-heading font-bold" style={{ color: branding.primary_color || '#1a2744' }}>
              {branding.legal_name || branding.common_name}
            </p>
            {(branding.address || branding.address_line1) && <p className="text-sm text-muted-foreground mt-2">{branding.address || [branding.address_line1, branding.address_line2, branding.address_city, branding.address_province, branding.address_postal_code].filter(Boolean).join(', ')}</p>}
            {branding.website && <p className="text-sm text-muted-foreground">{branding.website}</p>}
            {branding.footer_text && <p className="text-xs text-muted-foreground mt-4">{branding.footer_text}</p>}
          </div>
        ) : null}
      </div>
    </div>
  );
}