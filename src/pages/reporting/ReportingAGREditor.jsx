import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Eye, Printer, Sparkles, ChevronDown, ChevronUp, FileText, Upload, X, Check, Monitor, ArrowBigUp, ClipboardList } from 'lucide-react';
import InfoToGatherPanel from '@/components/reporting/InfoToGatherPanel';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SectionEditor from '@/components/reporting/SectionEditor';
import SectionRenderer from '@/components/reporting/SectionRenderer';
import BrandingPanel from '@/components/reporting/BrandingPanel';
import CoverGenerator from '@/components/reporting/CoverGenerator';
import TemplatePreview from '@/components/reporting/TemplatePreview';
import HeaderFooterMapEditor from '@/components/reporting/HeaderFooterMapEditor';
import StyledCoverPreview from '@/components/reporting/CoverPreview';
import MasterStyleControl from '@/components/reporting/MasterStyleControl';

export default function ReportingAGREditor() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [branding, setBranding] = useState(null);
  const [dataEntries, setDataEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHeaderPanel, setShowHeaderPanel] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [generatingHeader, setGeneratingHeader] = useState(false);
  const [generatingFooter, setGeneratingFooter] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localHeaderText, setLocalHeaderText] = useState('');
  const [localFooterText, setLocalFooterText] = useState('');
  const [localHeaderImageHeight, setLocalHeaderImageHeight] = useState(48);
  const [localFooterImageHeight, setLocalFooterImageHeight] = useState(48);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [previewMode, setPreviewMode] = useState('digital');
  const [activeTab, setActiveTab] = useState('editor');
  const sectionRefs = useRef({});
  const previewRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  // Scroll live preview to active section
  useEffect(() => {
    if (activeSectionId && sectionRefs.current[activeSectionId]) {
      sectionRefs.current[activeSectionId].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSectionId]);

  const loadAll = useCallback(async () => {
    // Phase 1: critical data — render the page immediately
    try {
      const [r, secs, brandList] = await Promise.all([
        base44.entities.AGRReport.get(id),
        base44.entities.AGRReportSection.filter({ report_id: id }, 'order_index'),
        base44.entities.AGRBranding.filter({ report_id: id }),
      ]);
      setReport(r);
      setSections(secs);
      setBranding(brandList[0] || null);
      if (!initRef.current) {
        setLocalTitle(r?.title || '');
        setLocalHeaderText(r?.master_header_text || '');
        setLocalFooterText(r?.master_footer_text || '');
        setLocalHeaderImageHeight(r?.header_image_height || 48);
        setLocalFooterImageHeight(r?.footer_image_height || 48);
        initRef.current = true;
      }
    } catch (e) {
      setError(e.message || 'Failed to load report');
    }
    setLoading(false);

    // Phase 2: heavy data — load in background
    try {
      const [dataList, analysisList] = await Promise.all([
        base44.entities.AGRReportData.filter({ report_id: id }),
        base44.entities.AGRAnalysisResult.filter({ report_id: id }),
      ]);
      setDataEntries(dataList);
      setAnalysis(analysisList[0] || null);
    } catch (e) {
      // Non-critical — page is already visible
      console.error('Failed to load report data/analysis:', e);
    }
  }, [id]);

  const updateReport = async (patch) => {
    const updated = await base44.entities.AGRReport.update(id, patch);
    setReport(updated);
    if ('title' in patch) setLocalTitle(updated.title || '');
    if ('master_header_text' in patch) setLocalHeaderText(updated.master_header_text || '');
    if ('master_footer_text' in patch) setLocalFooterText(updated.master_footer_text || '');
    if ('header_image_height' in patch) setLocalHeaderImageHeight(updated.header_image_height || 48);
    if ('footer_image_height' in patch) setLocalFooterImageHeight(updated.footer_image_height || 48);
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

  const handleImageUpload = async (field, file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateReport({ [field]: file_url });
    } catch {}
  };

  const handleRemoveImage = (field) => updateReport({ [field]: null });

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
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link to="/reporting/agr" className="text-muted-foreground hover:text-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1">
          <Input
            value={localTitle}
            onChange={e => setLocalTitle(e.target.value)}
            className="text-lg font-bold border-0 border-b-2 border-transparent focus:border-accent rounded-none px-1 shadow-none max-w-md"
          />
          {localTitle !== (report?.title || '') && (
            <Button size="icon" variant="ghost" onClick={() => updateReport({ title: localTitle })} className="h-8 w-8 text-green-600" title="Apply">
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Select value={report?.status || 'draft'} onValueChange={v => updateReport({ status: v })}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1 lg:hidden" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-3.5 h-3.5" />{showPreview ? 'Hide Preview' : 'Preview'}
          </Button>
          <Link to={`/reporting/agr/${id}/preview`}>
            <Button variant="outline" size="sm" className="gap-1"><Eye className="w-3.5 h-3.5" />Full Preview</Button>
          </Link>
          <Link to={`/reporting/agr/${id}/print`}>
            <Button variant="outline" size="sm" className="gap-1"><Printer className="w-3.5 h-3.5" />Print</Button>
          </Link>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'editor' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <FileText className="w-3.5 h-3.5" />Editor
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'info' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ClipboardList className="w-3.5 h-3.5" />Info to Gather
        </button>
      </div>

      {activeTab === 'info' && (
        <InfoToGatherPanel reportId={id} sections={sections} />
      )}

      {activeTab === 'editor' && (
        <>

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
                  <span className="text-xs font-semibold">Header</span>
                  <Button variant="ghost" size="sm" onClick={handleGenerateHeaderText} disabled={generatingHeader} className="text-xs gap-1 h-6"><Sparkles className="w-3 h-3" />{generatingHeader ? '...' : 'AI'}</Button>
                </div>
                <div className="flex items-center gap-1">
                  <Input value={localHeaderText} onChange={e => setLocalHeaderText(e.target.value)} placeholder="Header text" className="text-xs flex-1" />
                  {localHeaderText !== (report?.master_header_text || '') && (
                    <Button size="icon" variant="ghost" onClick={() => updateReport({ master_header_text: localHeaderText })} className="h-7 w-7 text-green-600" title="Apply">
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {report?.master_header_image ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <img src={report.master_header_image} alt="Header" className="h-6 object-contain rounded" />
                      <button onClick={() => handleRemoveImage('master_header_image')} className="text-destructive hover:underline"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1 text-xs text-accent cursor-pointer hover:underline">
                      <Upload className="w-3 h-3" />Upload image
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload('master_header_image', e.target.files?.[0])} />
                    </label>
                  )}
                  {report?.master_header_image && (
                   <div className="flex items-center gap-1">
                     <span className="text-xs text-muted-foreground">Height:</span>
                     <input
                       type="number"
                       value={localHeaderImageHeight}
                       onChange={e => setLocalHeaderImageHeight(parseInt(e.target.value) || 48)}
                       className="w-14 h-6 text-xs border rounded px-1"
                       min="16"
                       max="200"
                     />
                     <span className="text-xs text-muted-foreground">px</span>
                     {localHeaderImageHeight !== (report?.header_image_height || 48) && (
                       <Button size="icon" variant="ghost" onClick={() => updateReport({ header_image_height: localHeaderImageHeight })} className="h-6 w-6 text-green-600" title="Apply">
                         <Check className="w-3 h-3" />
                       </Button>
                     )}
                   </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Footer</span>
                  <Button variant="ghost" size="sm" onClick={handleGenerateFooterText} disabled={generatingFooter} className="text-xs gap-1 h-6"><Sparkles className="w-3 h-3" />{generatingFooter ? '...' : 'AI'}</Button>
                </div>
                <div className="flex items-center gap-1">
                  <Input value={localFooterText} onChange={e => setLocalFooterText(e.target.value)} placeholder="Footer text" className="text-xs flex-1" />
                  {localFooterText !== (report?.master_footer_text || '') && (
                    <Button size="icon" variant="ghost" onClick={() => updateReport({ master_footer_text: localFooterText })} className="h-7 w-7 text-green-600" title="Apply">
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {report?.master_footer_image ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <img src={report.master_footer_image} alt="Footer" className="h-6 object-contain rounded" />
                      <button onClick={() => handleRemoveImage('master_footer_image')} className="text-destructive hover:underline"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1 text-xs text-accent cursor-pointer hover:underline">
                      <Upload className="w-3 h-3" />Upload image
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload('master_footer_image', e.target.files?.[0])} />
                    </label>
                  )}
                  {report?.master_footer_image && (
                   <div className="flex items-center gap-1">
                     <span className="text-xs text-muted-foreground">Height:</span>
                     <input
                       type="number"
                       value={localFooterImageHeight}
                       onChange={e => setLocalFooterImageHeight(parseInt(e.target.value) || 48)}
                       className="w-14 h-6 text-xs border rounded px-1"
                       min="16"
                       max="200"
                     />
                     <span className="text-xs text-muted-foreground">px</span>
                     {localFooterImageHeight !== (report?.footer_image_height || 48) && (
                       <Button size="icon" variant="ghost" onClick={() => updateReport({ footer_image_height: localFooterImageHeight })} className="h-6 w-6 text-green-600" title="Apply">
                         <Check className="w-3 h-3" />
                       </Button>
                     )}
                   </div>
                  )}
                </div>
              </div>
            </div>
            {/* Header/Footer Layout Maps */}
            <div className="grid sm:grid-cols-2 gap-3">
              <HeaderFooterMapEditor
                label="Header"
                text={report?.master_header_text}
                imageUrl={report?.master_header_image}
                font_size={report?.header_font_size}
                layout={report?.header_layout || 'inline'}
                zones={(() => { try { return JSON.parse(report?.header_zones || '[]'); } catch { return []; } })()}
                onUpdate={(zonesArr) => updateReport({ header_zones: JSON.stringify(zonesArr) })}
                onFontSize={(v) => updateReport({ header_font_size: v })}
                onLayout={(v) => updateReport({ header_layout: v })}
              />
              <HeaderFooterMapEditor
                label="Footer"
                text={report?.master_footer_text}
                imageUrl={report?.master_footer_image}
                font_size={report?.footer_font_size}
                layout={report?.footer_layout || 'inline'}
                zones={(() => { try { return JSON.parse(report?.footer_zones || '[]'); } catch { return []; } })()}
                onUpdate={(zonesArr) => updateReport({ footer_zones: JSON.stringify(zonesArr) })}
                onFontSize={(v) => updateReport({ footer_font_size: v })}
                onLayout={(v) => updateReport({ footer_layout: v })}
              />
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

      {/* Master Section Styles */}
      <MasterStyleControl report={report} onUpdate={updateReport} />

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
                              masterStyles={report?.master_section_styles}
                              onUpdate={handleUpdateSection}
                              onDelete={handleDeleteSection}
                              onGenerateSuggestions={handleGenerateSuggestions}
                              suggestions={suggestions[section.id]}
                              onExpand={setActiveSectionId}
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

        </div>

        {/* Right: Preview — always on desktop, toggleable on mobile */}
        <div className={showPreview ? 'block lg:block' : 'hidden lg:block'}>
          <div className="sticky top-24 space-y-4">
            <TemplatePreview analysis={analysis} />
            {analysis?.source_file_url && (
              <a href={analysis.source_file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-accent hover:underline">
                <FileText className="w-3.5 h-3.5" />View Original Source Document
              </a>
            )}
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-base flex items-center gap-2"><Eye className="w-4 h-4" />Live Preview</h3>
              <div className="flex items-center gap-0.5 ml-auto bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewMode('digital')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${previewMode === 'digital' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Monitor className="w-3 h-3" />Digital
                </button>
                <button
                  onClick={() => setPreviewMode('print')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${previewMode === 'print' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Printer className="w-3 h-3" />Print
                </button>
              </div>
            </div>

            {previewMode === 'digital' ? (
              /* ── Digital Preview (matches ReportingAGRPreview exactly) ── */
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-0">
                <div className="max-w-4xl mx-auto">
                  <StyledCoverPreview coverType="front" report={report} branding={branding} />
                </div>
                {report?.inside_front_cover_image && (
                  <div className="max-w-4xl mx-auto">
                    <StyledCoverPreview coverType="inside_front" report={report} branding={branding} />
                  </div>
                )}
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-8 space-y-6">
                    {!report?.cover_image && branding && (
                      <div className="text-center pb-6 border-b">
                        {branding.logo_urls?.[0] && <img src={branding.logo_urls[0]} alt="Logo" className="h-16 mx-auto mb-3 object-contain" />}
                        <h2 className="text-2xl font-heading font-bold" style={{ color: branding.primary_color || '#1a2744' }}>{report?.title}</h2>
                        {branding.tagline && <p className="text-sm text-muted-foreground mt-1">{branding.tagline}</p>}
                        {branding.common_name && <p className="text-sm font-medium mt-4" style={{ color: branding.primary_color || '#1a2744' }}>{branding.common_name}</p>}
                      </div>
                    )}
                    {sections.length > 0 && (() => {
                      const tocPage = 1 + (report?.cover_image ? 1 : 0) + (report?.inside_front_cover_image ? 1 : 0);
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
                    {sections.map((section, i) => (
                      <div key={section.id} ref={el => { sectionRefs.current[section.id] = el; }}>
                        <SectionRenderer
                          section={section} sectionNumber={i + 1} dataEntries={dataEntries} branding={branding}
                          masterStyles={report?.master_section_styles} pageNumber={i + 1}
                          masterHeader={report?.master_header_text} masterFooter={report?.master_footer_text}
                          headerImage={report?.master_header_image} footerImage={report?.master_footer_image}
                          headerImageHeight={report?.header_image_height} footerImageHeight={report?.footer_image_height}
                          headerFontSize={report?.header_font_size} footerFontSize={report?.footer_font_size}
                          headerLayout={report?.header_layout} headerZones={report?.header_zones}
                          footerLayout={report?.footer_layout} footerZones={report?.footer_zones}
                          showHeaderAll={report?.show_header_all} showFooterAll={report?.show_footer_all}
                          showPageNumbersAll={report?.show_page_numbers_all} forceCollapsible
                        />
                      </div>
                    ))}
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
                {report?.inside_back_cover_image && (
                  <div className="max-w-4xl mx-auto">
                    <StyledCoverPreview coverType="inside_back" report={report} branding={branding} />
                  </div>
                )}
                {report?.back_cover_image ? (
                  <div className="max-w-4xl mx-auto">
                    <StyledCoverPreview coverType="back" report={report} branding={branding} />
                  </div>
                ) : branding ? (
                  <div className="max-w-4xl mx-auto aspect-[8.5/11] overflow-hidden relative" style={{ backgroundColor: branding.primary_color || '#1a2744' }}>
                    {report?.back_cover_text && (
                      <p className="text-base md:text-xl text-white drop-shadow-lg whitespace-pre-line text-center p-12">{report.back_cover_text}</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              /* ── Print Preview (matches ReportingAGRPrint) ── */
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="flex flex-col items-center gap-3">
                  {(() => {
                    const PagePreview = ({ pageNum, children }) => (
                      <div className="relative shrink-0 w-full">
                        <div className="no-print absolute -inset-1 bg-gray-200 rounded-lg -z-10 translate-y-1" />
                        <div className="no-print absolute -inset-2 bg-gray-100 rounded-lg -z-20 translate-y-2" />
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '11in', width: '210mm', maxWidth: '100%' }}>
                          {children}
                        </div>
                        {pageNum && (
                          <div className="no-print text-center mt-2">
                            <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">Page {pageNum}</span>
                          </div>
                        )}
                      </div>
                    );
                    const hasInsideFront = !!report?.inside_front_cover_image;
                    const tocPageNum = hasInsideFront ? 3 : 2;
                    const getSectionPage = (idx) => tocPageNum + 1 + idx;

                    const togglePageBreak = async (sectionId, current) => {
                      await base44.entities.AGRReportSection.update(sectionId, { page_break_before: !current });
                      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, page_break_before: !current } : s));
                    };

                    return (
                      <>
                        <PagePreview pageNum={1}>
                          <StyledCoverPreview coverType="front" report={report} branding={branding} noPadding />
                        </PagePreview>
                        {report?.inside_front_cover_image && (
                          <PagePreview pageNum={2}>
                            <StyledCoverPreview coverType="inside_front" report={report} branding={branding} noPadding />
                          </PagePreview>
                        )}
                        <PagePreview pageNum={tocPageNum}>
                          <div className="p-10 flex flex-col" style={{ minHeight: '11in' }}>
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
                        </PagePreview>
                        {sections.map((section, i) => (
                          <PagePreview key={section.id} pageNum={getSectionPage(i)}>
                            <div className="h-1 w-full" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
                            <div className="p-8 relative">
                              <button
                                onClick={() => togglePageBreak(section.id, section.page_break_before)}
                                className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                                title={section.page_break_before ? 'Click to let this section flow naturally' : 'Click to force this section to start on a new page'}
                              >
                                <ArrowBigUp className={`w-3.5 h-3.5 ${section.page_break_before ? 'text-accent' : ''}`} />
                                {section.page_break_before ? 'Forced page break' : 'Normal flow'}
                              </button>
                              <div ref={el => { sectionRefs.current[section.id] = el; }}>
                                <SectionRenderer
                                  section={section} sectionNumber={i + 1} dataEntries={dataEntries} branding={branding} isPrint
                                  masterStyles={report?.master_section_styles} pageNumber={getSectionPage(i)}
                                  masterHeader={report?.master_header_text} masterFooter={report?.master_footer_text}
                                  headerImage={report?.master_header_image} footerImage={report?.master_footer_image}
                                  headerImageHeight={report?.header_image_height} footerImageHeight={report?.footer_image_height}
                                  headerFontSize={report?.header_font_size} footerFontSize={report?.footer_font_size}
                                  headerLayout={report?.header_layout} headerZones={report?.header_zones}
                                  footerLayout={report?.footer_layout} footerZones={report?.footer_zones}
                                  showHeaderAll={report?.show_header_all} showFooterAll={report?.show_footer_all}
                                  showPageNumbersAll={report?.show_page_numbers_all}
                                />
                              </div>
                            </div>
                          </PagePreview>
                        ))}
                        {branding?.subsidiary_logos?.length > 0 && (
                          <PagePreview>
                            <div className="p-8">
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
                          </PagePreview>
                        )}
                        {branding?.funder_logos?.length > 0 && (
                          <PagePreview>
                            <div className="p-8">
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
                          </PagePreview>
                        )}
                        {report?.inside_back_cover_image && (
                          <PagePreview>
                            <StyledCoverPreview coverType="inside_back" report={report} branding={branding} noPadding />
                          </PagePreview>
                        )}
                        <PagePreview>
                          {report?.back_cover_image ? (
                            <StyledCoverPreview coverType="back" report={report} branding={branding} noPadding />
                          ) : branding ? (
                            <div className="h-full w-full overflow-hidden relative" style={{ backgroundColor: branding.primary_color || '#1a2744' }}>
                              {report?.back_cover_text && (
                                <p className="text-xl text-white drop-shadow-lg whitespace-pre-line text-center p-12">{report.back_cover_text}</p>
                              )}
                            </div>
                          ) : null}
                        </PagePreview>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        </>
      )}
    </div>
  );
}