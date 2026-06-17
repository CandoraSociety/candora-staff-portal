import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Palette, LayoutTemplate, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function TemplatePreview({ analysis }) {
  const [expanded, setExpanded] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  if (!analysis) return null;

  let summary = '';
  let visualStyle = null;
  let layoutTemplate = [];
  let checklist = [];
  try {
    const raw = JSON.parse(analysis.raw_analysis || '{}');
    summary = raw.summary || '';
    visualStyle = JSON.parse(analysis.visual_style || '{}');
    layoutTemplate = JSON.parse(analysis.layout_template || '[]');
    checklist = JSON.parse(analysis.content_checklist || '[]');
  } catch {}

  return (
    <div className="border rounded-xl bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl"
      >
        <FileText className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold">Uploaded Template</span>
        <span className="ml-auto">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t space-y-3 max-h-[60vh] overflow-y-auto">
          {/* PDF Preview */}
          {analysis.source_file_url && (
            <div className="pt-3">
              <button
                onClick={() => setShowPdf(!showPdf)}
                className="w-full flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                {showPdf ? 'Hide PDF' : 'Show Uploaded PDF'}
                {showPdf ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
              </button>
              {showPdf && (
                <iframe
                  src={analysis.source_file_url}
                  className="w-full h-64 mt-2 border rounded"
                  title="Uploaded template PDF"
                />
              )}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold">Summary</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4">{summary}</p>
            </div>
          )}

          {/* Visual Style */}
          {visualStyle && (visualStyle.primary_colors?.length > 0 || visualStyle.fonts_detected?.length > 0 || visualStyle.tone) && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Palette className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold">Visual Style</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {visualStyle.primary_colors?.slice(0, 4).map((c, i) => (
                  <span key={i} className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: c }} title={c} />
                ))}
                {visualStyle.tone && (
                  <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium capitalize">{visualStyle.tone.replace('_', ' ')}</span>
                )}
              </div>
              {visualStyle.fonts_detected?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{visualStyle.fonts_detected.slice(0, 2).join(', ')}</p>
              )}
            </div>
          )}

          {/* Layout */}
          {layoutTemplate.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <LayoutTemplate className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold">Layout ({layoutTemplate.length} sections)</span>
              </div>
              <div className="space-y-1">
                {layoutTemplate.map((lt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 bg-slate-50 rounded">
                    <span className="w-4 h-4 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span className="truncate">{lt.section_name}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{lt.layout_type?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <CheckSquare className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold">Content Checklist ({checklist.length})</span>
              </div>
              <div className="space-y-1">
                {checklist.map((item, i) => (
                  <div key={i} className={`text-xs px-2 py-1 rounded border ${PRIORITY_COLORS[item.priority] || 'bg-slate-50 border-slate-100'}`}>
                    <span className="font-bold uppercase mr-1">{item.priority}</span>
                    {item.item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}