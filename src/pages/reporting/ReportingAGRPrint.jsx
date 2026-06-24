import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, Download } from 'lucide-react';
import ReportPrintView from '@/components/reporting/ReportPrintView';

export default function ReportingAGRPrint() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [branding, setBranding] = useState(null);
  const [dataEntries, setDataEntries] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await base44.functions.invoke('generateAGRPdf', { report_id: id });
      // response.data is already an ArrayBuffer from the backend
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title || 'Annual_Report'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Loading timed out - please refresh or go back and try again');
      }, 8000);
      
      try {
        console.log('Loading report:', id);
        const r = await base44.entities.AGRReport.get(id);
        console.log('Report loaded:', r);
        setReport(r);
        
        const secs = await base44.entities.AGRReportSection.filter({ report_id: id }, 'order_index');
        console.log('Sections loaded:', secs.length);
        setSections(secs);
        
        const brandList = await base44.entities.AGRBranding.filter({ report_id: id });
        console.log('Branding loaded:', brandList?.length);
        setBranding(brandList[0] || null);
        
        const dataList = await base44.entities.AGRReportData.filter({ report_id: id });
        console.log('Data loaded:', dataList?.length);
        setDataEntries(dataList);
        
        const analysisList = await base44.entities.AGRAnalysisResult.filter({ report_id: id });
        console.log('Analysis loaded:', analysisList?.length);
        setAnalysis(analysisList[0] || null);
        
        clearTimeout(timeout);
        setLoading(false);
      } catch (e) {
        clearTimeout(timeout);
        console.error('Load error:', e);
        setError(e.message || 'Failed to load report: ' + e.message);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive font-semibold">Error loading report</p>
        <p className="text-sm text-muted-foreground max-w-md text-center">{error}</p>
        <p className="text-xs text-muted-foreground">Check browser console (F12) for details</p>
        <Link to="/reporting/agr" className="text-accent hover:underline text-sm">Back to AGR Reports</Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive font-semibold">Report not found</p>
        <Link to="/reporting/agr" className="text-accent hover:underline text-sm">Back to AGR Reports</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 print:space-y-0">
      <div className="no-print flex items-center gap-3 mb-6">
        <Link to={`/reporting/agr/${id}/edit`} className="text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold text-accent">{report?.title || 'Annual Report'}</h1>
          <p className="text-xs text-muted-foreground">Click the button below, then choose "Save as PDF"</p>
        </div>
        <Button onClick={() => window.print()} variant="default" className="gap-2">
          <Printer className="w-4 h-4" />Save as PDF
        </Button>
      </div>

      {analysis?.source_file_url && (
        <div className="no-print max-w-[210mm] mx-auto mb-2">
          <a href={analysis.source_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
            <FileText className="w-3.5 h-3.5" />View Original Source Document
          </a>
        </div>
      )}

      <ReportPrintView report={report} sections={sections} branding={branding} dataEntries={dataEntries} onSectionsUpdate={setSections} />
    </div>
  );
}