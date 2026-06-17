import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, ChevronDown } from 'lucide-react';
import SectionRenderer from '@/components/reporting/SectionRenderer';

export default function ReportingAGRPreview() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [branding, setBranding] = useState(null);
  const [dataEntries, setDataEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.AGRReport.get(id),
      base44.entities.AGRReportSection.filter({ report_id: id }, 'order_index'),
      base44.entities.AGRBranding.filter({ report_id: id }),
      base44.entities.AGRReportData.filter({ report_id: id }),
    ]).then(([r, secs, brandList, dataList]) => {
      setReport(r);
      setSections(secs);
      setBranding(brandList[0] || null);
      setDataEntries(dataList);
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

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-8 space-y-6">
        {/* Cover */}
        {report?.cover_image && (
          <div className="mb-8 aspect-[8.5/11] w-full overflow-hidden"><img src={report.cover_image} alt="Cover" className="w-full h-full object-cover" /></div>
        )}

        {/* Branding header — only if no cover image */}
        {!report?.cover_image && branding && (
          <div className="text-center mb-8 pb-6 border-b">
            {branding.logo_urls?.[0] && <img src={branding.logo_urls[0]} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />}
            <h2 className="text-2xl font-heading font-bold" style={{ color: branding.primary_color || '#1a2744' }}>{report?.title}</h2>
            {branding.tagline && <p className="text-sm text-muted-foreground mt-1">{branding.tagline}</p>}
            {branding.common_name && <p className="text-sm font-medium mt-4" style={{ color: branding.primary_color || '#1a2744' }}>{branding.common_name}</p>}
          </div>
        )}

        {/* Table of Contents */}
        {sections.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Table of Contents</h3>
            <div className="space-y-1">
              {sections.map((s, i) => (
                <a key={s.id} href={`#section-${s.id}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-accent transition-colors py-1">
                  <span className="font-bold text-muted-foreground w-6">{i + 1}.</span>
                  <span>{s.title || 'Untitled'}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {sections.map((section, i) => (
          <div key={section.id} id={`section-${section.id}`}>
            <SectionRenderer
              section={section}
              dataEntries={dataEntries}
              pageNumber={i + 1}
              masterHeader={report?.master_header_text}
              masterFooter={report?.master_footer_text}
              showHeaderAll={report?.show_header_all}
              showFooterAll={report?.show_footer_all}
              showPageNumbersAll={report?.show_page_numbers_all}
            />
          </div>
        ))}

        {/* Subsidiary logos */}
        {branding?.subsidiary_logos?.length > 0 && (
          <div className="border-t pt-6 mt-6">
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

        {/* Back cover */}
        {report?.back_cover_image && (
          <div className="mt-6 aspect-[8.5/11] w-full overflow-hidden"><img src={report.back_cover_image} alt="Back Cover" className="w-full h-full object-cover" /></div>
        )}
      </div>
    </div>
  );
}