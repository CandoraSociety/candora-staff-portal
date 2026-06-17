import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Palette, LayoutTemplate, CheckSquare, ArrowRight } from 'lucide-react';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function ReportingAGRAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [summary, setSummary] = useState(null);
  const [visualStyle, setVisualStyle] = useState(null);
  const [layoutTemplate, setLayoutTemplate] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    base44.entities.AGRAnalysisResult.get(id).then(data => {
      setAnalysis(data);
      try {
        const raw = JSON.parse(data.raw_analysis || '{}');
        setSummary(raw.summary || '');
        setVisualStyle(JSON.parse(data.visual_style || '{}'));
        setLayoutTemplate(JSON.parse(data.layout_template || '[]'));
        setChecklist(JSON.parse(data.content_checklist || '[]'));
      } catch {}
      setLoading(false);
    });
  }, [id]);

  const handleCreateFromTemplate = async () => {
    setCreating(true);
    try {
      const report = await base44.entities.AGRReport.create({
        title: `Annual General Report ${new Date().getFullYear()}`,
        year: new Date().getFullYear(),
        status: 'draft',
        description: ''
      });
      // Pre-create sections matching the extracted layout
      await Promise.all(layoutTemplate.map((lt, i) =>
        base44.entities.AGRReportSection.create({
          report_id: report.id,
          title: lt.section_name,
          layout: lt.layout_type || 'text_only',
          order_index: i + 1
        })
      ));
      // Link analysis to the report
      await base44.entities.AGRAnalysisResult.update(id, { report_id: report.id });
      navigate(`/reporting/agr/${report.id}/edit`);
    } catch {}
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/reporting/agr" className="text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-accent">Report Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Extracted structure and insights from uploaded AGR</p>
        </div>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-bold text-lg">Executive Summary</h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{summary}</p>
        </div>
      )}

      {/* Visual Style */}
      {visualStyle && (
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-bold text-lg">Visual Style</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visualStyle.primary_colors?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Colors</p>
                <div className="flex gap-1.5 flex-wrap">
                  {visualStyle.primary_colors.map((c, i) => (
                    <span key={i} className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
            )}
            {visualStyle.fonts_detected?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Fonts</p>
                <div className="space-y-1">
                  {visualStyle.fonts_detected.map((f, i) => (
                    <p key={i} className="text-xs text-slate-600">{f}</p>
                  ))}
                </div>
              </div>
            )}
            {visualStyle.tone && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Tone</p>
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium capitalize">{visualStyle.tone.replace('_', ' ')}</span>
              </div>
            )}
            {visualStyle.notable_elements?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Notable Elements</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {visualStyle.notable_elements.map((el, i) => (
                    <li key={i} className="text-xs text-slate-600">{el}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Layout */}
      {layoutTemplate.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <LayoutTemplate className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-bold text-lg">Page Layout</h2>
          </div>
          <div className="space-y-3">
            {layoutTemplate.map((lt, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold">{lt.section_name}</p>
                  <p className="text-xs text-muted-foreground">{lt.layout_type?.replace('_', ' ')} — {lt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Checklist */}
      {checklist.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-accent" />
            <h2 className="font-heading font-bold text-lg">Content Update Checklist</h2>
          </div>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${PRIORITY_COLORS[item.priority] || 'bg-slate-50 border-slate-200'}`}>
                <span className="text-xs font-bold uppercase mt-0.5 shrink-0">{item.priority}</span>
                <div>
                  <p className="text-sm font-medium">{item.item}</p>
                  <p className="text-xs text-muted-foreground">{item.section}{item.notes ? ` · ${item.notes}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create from template */}
      <div className="flex justify-center">
        <Button onClick={handleCreateFromTemplate} disabled={creating} size="lg" className="gap-2">
          <ArrowRight className="w-4 h-4" />
          {creating ? 'Creating Report...' : 'Create Report from Template'}
        </Button>
      </div>
    </div>
  );
}