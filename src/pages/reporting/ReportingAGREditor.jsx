import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Eye, Printer, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SectionEditor from '@/components/reporting/SectionEditor';
import SectionRenderer from '@/components/reporting/SectionRenderer';
import BrandingPanel from '@/components/reporting/BrandingPanel';
import CoverGenerator from '@/components/reporting/CoverGenerator';
import DataPanel from '@/components/reporting/DataPanel';
import TemplatePreview from '@/components/reporting/TemplatePreview';

export default function ReportingAGREditor() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [branding, setBranding] = useState(null);
  const [dataEntries, setDataEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showHeaderPanel, setShowHeaderPanel] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [generatingHeader, setGeneratingHeader] = useState(false);
  const [generatingFooter, setGeneratingFooter] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const loadAll = useCallback(async () => {
    const [r, secs, brandList, dataList, analysisList] = await Promise.all([
      base44.entities.AGRReport.get(id),
      base44.entities.AGRReportSection.filter({ report_id: id }, 'order_index'),
      base44.entities.AGRBranding.filter({ report_id: id }),
      base44.entities.AGRReportData.filter({ report_id: id }),
      base44.entities.AGRAnalysisResult.filter({ report_id: id }),
    ]);
    setReport(r);
    setSections(secs);
    setBranding(brandList[0] || null);
    setDataEntries(dataList);
    setAnalysis(analysisList[0] || null);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const updateReport = async (patch) => {
    const updated = await base44.entities.AGRReport.update(id, patch);
    setReport(updated);
  };

  const handleAddSection = async () => {
    const order = sections.length + 1;
    const created = await base44.entities.AGRReportSection.create({ report_id: id, title: 'New Section', order_index: order, layout: 'text_only' });
    setSections(prev => [...prev, created]);
  };

  const handleUpdateSection = async (sectionId, patch) => {
    await base44.entities.AGRReportSection.update(sectionId, patch);
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, ...patch } : s));
  };

  const handleDeleteSection = async (sectionId) => {
    await base44.entities.AGRReportSection.delete(sectionId);
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(sections);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSections(reordered);
    await Promise.all(reordered.map((s, i) => base44.entities.AGRReportSection.update(s.id, { order_index: i + 1 })));
  };

  const handleGenerateSuggestions = async (section) => {
    try {
      const res = await base44.functions.invoke('generateSectionSuggestions', {
        section_title: section.title,
        section_content: section.content || '',
        report_context: report?.title + ' ' + (report?.description || '')
      });
      setSuggestions(prev => ({ ...prev, [section.id]: res.data?.suggestions || [] }));
    } catch {}
  };

  const handleGenerateHeaderText = async () => {
    setGeneratingHeader(true);
    try {
      const res = await base44.functions.invoke('generateSectionNarrative', {
        section_title: 'Master Page Header',
        section_content: 'A concise universal header for all pages of the annual report',
        report_context: `${report?.title} - ${branding?.common_name || ''} ${branding?.tagline || ''}`
      });
      if (res.data?.narrative) updateReport({ master_header_text: res.data.narrative.slice(0, 120) });
    } catch {}
    setGeneratingHeader(false);
  };

  const handleGenerateFooterText = async () => {
    setGeneratingFooter(true);
    try {
      const res = await base44.functions.invoke('generateSectionNarrative', {
        section_title: 'Master Page Footer',
        section_content: 'A concise universal footer for all pages',
        report_context: `${branding?.legal_name || branding?.common_name || ''} ${branding?.address || ''} ${branding?.website || ''}`
      });
      if (res.data?.narrative) updateReport({ master_footer_text: res.data.narrative.slice(0, 120) });
    } catch {}
    setGeneratingFooter(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link to="/reporting/agr" className="text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Input
          value={report?.title || ''}
          onChange={e => updateReport({ title: e.target.value })}
          className="text-lg font-bold border-0 border-b-2 border-transparent focus:border-accent rounded-none px-1 shadow-none max-w-md"
        />
        <div className="flex items-center gap-2 ml-auto">
          <Select value={report?.status || 'draft'} onValueChange={v => updateReport({ status: v })}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Link to={`/reporting/agr/${id}/preview`}>
            <Button variant="outline" size="sm" className="gap-1"><Eye className="w-3.5 h-3.5" />Preview</Button>
          </Link>
          <Link to={`/reporting/agr/${id}/print`}>
            <Button variant="outline" size="sm" className="gap-1"><Printer className="w-3.5 h-3.5" />Print</Button>
          </Link>
        </div>
      </div>

      {/* Master Header & Footer Panel */}
      <div className="border rounded-xl bg-white">
        <button
          onClick={() => setShowHeaderPanel(!showHeaderPanel)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl"
        >
          <span className="text-sm font-semibold">Master Header &amp; Footer</span>
          <span className="ml-auto">{showHeaderPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
        </button>
        {showHeaderPanel && (
          <div className="px-4 pb-4 space-y-3 border-t">
            <div className="grid sm:grid-cols-2 gap-3 pt-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Header Text</span>
                  <Button variant="ghost" size="sm" onClick={handleGenerateHeaderText} disabled={generatingHeader} className="text-xs gap-1 h-6"><Sparkles className="w-3 h-3" />{generatingHeader ? '...' : 'AI'}</Button>
                </div>
                <Input value={report?.master_header_text || ''} onChange={e => updateReport({ master_header_text: e.target.value })} placeholder="e.g. Candora Society — Annual Report 2025" className="text-xs" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Footer Text</span>
                  <Button variant="ghost" size="sm" onClick={handleGenerateFooterText} disabled={generatingFooter} className="text-xs gap-1 h-6"><Sparkles className="w-3 h-3" />{generatingFooter ? '...' : 'AI'}</Button>
                </div>
                <Input value={report?.master_footer_text || ''} onChange={e => updateReport({ master_footer_text: e.target.value })} placeholder="e.g. Candora Society of Edmonton · www.candorasociety.com" className="text-xs" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={report?.show_header_all || false} onChange={e => updateReport({ show_header_all: e.target.checked })} className="rounded" />Show header on all pages
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={report?.show_footer_all || false} onChange={e => updateReport({ show_footer_all: e.target.checked })} className="rounded" />Show footer on all pages
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={report?.show_page_numbers_all || false} onChange={e => updateReport({ show_page_numbers_all: e.target.checked })} className="rounded" />Show page numbers
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Covers */}
      <CoverGenerator reportId={id} report={report} branding={branding} onUpdate={updateReport} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Branding */}
          <BrandingPanel reportId={id} />

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-base">Sections ({sections.length})</h3>
              <Button onClick={handleAddSection} size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" />Add Section</Button>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <SectionEditor
                              section={section}
                              onUpdate={handleUpdateSection}
                              onDelete={handleDeleteSection}
                              onGenerateSuggestions={handleGenerateSuggestions}
                              suggestions={suggestions[section.id]}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No sections yet. Click "Add Section" to begin building your report.</p>
            )}
          </div>

          {/* Data Panel */}
          <DataPanel reportId={id} sections={sections} />
        </div>

        {/* Right: Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <TemplatePreview analysis={analysis} />
            <h3 className="font-heading font-semibold text-base flex items-center gap-2"><Eye className="w-4 h-4" />Live Preview</h3>
            <div className="border rounded-xl bg-white p-6 max-h-[calc(100vh-200px)] overflow-y-auto shadow-sm">
              {/* Front cover */}
              {report?.cover_image && (
                <div className="mb-6 aspect-[8.5/11] w-full overflow-hidden"><img src={report.cover_image} alt="Cover" className="w-full h-full object-cover" /></div>
              )}
              {/* Inside front cover */}
              {report?.inside_front_cover_image && (
                <div className="mb-6 aspect-[8.5/11] w-full overflow-hidden"><img src={report.inside_front_cover_image} alt="Inside Front Cover" className="w-full h-full object-cover" /></div>
              )}

              {/* Branding header — only if no cover image */}
              {!report?.cover_image && branding && (
                <div className="text-center mb-6 pb-4 border-b">
                  {branding.logo_urls?.[0] && <img src={branding.logo_urls[0]} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />}
                  <h2 className="text-base font-heading font-bold" style={{ color: branding.primary_color || '#1a2744' }}>{report?.title}</h2>
                  {branding.tagline && <p className="text-xs text-muted-foreground mt-1">{branding.tagline}</p>}
                </div>
              )}

              {/* Table of Contents */}
              {sections.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Contents</h4>
                  {sections.map((s, i) => (
                    <p key={s.id} className="text-xs text-muted-foreground py-0.5">{i + 1}. {s.title || 'Untitled'}</p>
                  ))}
                </div>
              )}

              {/* Sections */}
              {sections.map((section, i) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  dataEntries={dataEntries}
                  pageNumber={i + 1}
                  masterHeader={report?.master_header_text}
                  masterFooter={report?.master_footer_text}
                  showHeaderAll={report?.show_header_all}
                  showFooterAll={report?.show_footer_all}
                  showPageNumbersAll={report?.show_page_numbers_all}
                />
              ))}

              {/* Inside back cover */}
              {report?.inside_back_cover_image && (
                <div className="mb-6 aspect-[8.5/11] w-full overflow-hidden"><img src={report.inside_back_cover_image} alt="Inside Back Cover" className="w-full h-full object-cover" /></div>
              )}
              {/* Back cover */}
              {report?.back_cover_image && (
                <div className="mt-6 aspect-[8.5/11] w-full overflow-hidden"><img src={report.back_cover_image} alt="Back Cover" className="w-full h-full object-cover" /></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}