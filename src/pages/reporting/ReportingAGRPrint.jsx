import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, ArrowBigUp } from 'lucide-react';
import SectionRenderer from '@/components/reporting/SectionRenderer';
import StyledCoverPreview from '@/components/reporting/CoverPreview';

export default function ReportingAGRPrint() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [branding, setBranding] = useState(null);
  const [dataEntries, setDataEntries] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const togglePageBreak = async (sectionId, current) => {
    await base44.entities.AGRReportSection.update(sectionId, { page_break_before: !current });
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, page_break_before: !current } : s));
  };

  const hasInsideFront = !!report?.inside_front_cover_image;
  const tocPage = hasInsideFront ? 3 : 2;
  const getSectionPage = (index) => tocPage + 1 + index;

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
    }).catch(e => {
      setError(e.message || 'Failed to load report');
    }).finally(() => {
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

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive font-semibold">{error ? 'Failed to load report' : 'Report not found'}</p>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        <Link to="/reporting/agr" className="text-accent hover:underline text-sm">Back to AGR Reports</Link>
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
          <p className="text-xs text-muted-foreground">Print-optimized view • Click a section heading to toggle page break</p>
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
        {/* Front cover — styled overlay */}
        <div className="print-break w-full">
          <StyledCoverPreview coverType="front" report={report} branding={branding} />
        </div>

        {/* Inside front cover — styled overlay */}
        {report?.inside_front_cover_image && (
          <div className="print-break w-full">
            <StyledCoverPreview coverType="inside_front" report={report} branding={branding} />
          </div>
        )}

        <div className="print-break p-10 flex flex-col" style={{ minHeight: '11in' }}>
          <h3 className="text-lg font-heading font-bold uppercase tracking-wider mb-10" style={{ color: branding?.primary_color || '#1a2744' }}>Table of Contents</h3>
          <div className="flex-1 space-y-3">
            {sections.map((s, i) => (
              <div key={s.id} className="flex items-baseline text-sm" style={{ color: branding?.secondary_color || '#3b5998' }}>
                <span className="font-bold mr-3 shrink-0" style={{ color: branding?.primary_color || '#1a2744' }}>{i + 1}.</span>
                <span className="flex-1">{s.title || 'Untitled'}</span>
                <span className="flex-1 mx-2 border-b border-dotted" style={{ borderColor: branding?.accent_color ? `${branding.accent_color}40` : '#2b2de840' }} />
                <span className="shrink-0 font-medium tabular-nums" style={{ color: branding?.primary_color || '#1a2744' }}>{getSectionPage(i)}</span>
              </div>
            ))}
          </div>
        </div>

        {sections.map((section, i) => (
          <div key={section.id} className={section.page_break_before ? 'print-break' : ''}>
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
            <SectionRenderer
              section={section}
              sectionNumber={i + 1}
              dataEntries={dataEntries}
              branding={branding}
              isPrint
              masterStyles={report?.master_section_styles}
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
              headerZones={report?.header_zones}
              footerLayout={report?.footer_layout}
              footerZones={report?.footer_zones}
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

        {/* Inside back cover — styled overlay */}
        {report?.inside_back_cover_image && (
          <div className="print-break w-full">
            <StyledCoverPreview coverType="inside_back" report={report} branding={branding} />
          </div>
        )}

        {/* Back cover — styled overlay */}
        {report?.back_cover_image ? (
          <div className="print-break w-full">
            <StyledCoverPreview coverType="back" report={report} branding={branding} />
          </div>
        ) : branding ? (
          <div className="print-break aspect-[8.5/11] w-full overflow-hidden relative" style={{ backgroundColor: branding.primary_color || '#1a2744' }}>
            {report?.back_cover_text && (
              <p className="text-xl text-white drop-shadow-lg whitespace-pre-line text-center p-12">{report.back_cover_text}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}