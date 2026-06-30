import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, FileDown, ExternalLink, Loader2, Check } from 'lucide-react';
import SlidePreview from '@/components/presentations/SlidePreview';
import SlidePanel from '@/components/presentations/SlidePanel';
import SlideProperties from '@/components/presentations/SlideProperties';
import { CATEGORY_LABELS, newSlide } from '@/components/presentations/presentationConstants';

export default function PresentationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isNew = id === 'new';
  const [presentation, setPresentation] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isNew) {
      setPresentation({
        title: 'Untitled Presentation',
        category: 'general',
        description: '',
        slides: [newSlide('title')],
      });
    } else {
      setLoading(true);
      base44.entities.Presentation.get(id)
        .then(setPresentation)
        .catch(() => {
          toast({ title: 'Error', description: 'Presentation not found', variant: 'destructive' });
          navigate('/presentations');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew, navigate, toast]);

  // Auto-save for existing presentations
  useEffect(() => {
    if (!presentation?.id) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      base44.entities.Presentation.update(presentation.id, {
        title: presentation.title,
        category: presentation.category,
        description: presentation.description,
        slides: presentation.slides,
      })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'));
    }, 1500);
    return () => clearTimeout(timer);
  }, [presentation]);

  const updatePresentation = useCallback((updates) => {
    setPresentation(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const updateSlide = (index, updates) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map((s, i) => i === index ? { ...s, ...updates } : s),
    }));
  };

  const addSlide = (layout) => {
    setPresentation(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide(layout)],
    }));
    setSelectedSlideIndex(presentation.slides.length);
  };

  const deleteSlide = (index) => {
    if (presentation.slides.length <= 1) return;
    const newSlides = presentation.slides.filter((_, i) => i !== index);
    setPresentation({ ...presentation, slides: newSlides });
    if (selectedSlideIndex >= newSlides.length) setSelectedSlideIndex(newSlides.length - 1);
  };

  const duplicateSlide = (index) => {
    const dup = { ...presentation.slides[index], id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36) };
    const newSlides = [...presentation.slides];
    newSlides.splice(index + 1, 0, dup);
    setPresentation({ ...presentation, slides: newSlides });
    setSelectedSlideIndex(index + 1);
  };

  const moveSlide = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= presentation.slides.length) return;
    const newSlides = [...presentation.slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    setPresentation({ ...presentation, slides: newSlides });
    setSelectedSlideIndex(newIndex);
  };

  const handleSave = async () => {
    if (!presentation.title?.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    setSaveStatus('saving');
    try {
      if (!presentation.id) {
        const created = await base44.entities.Presentation.create({
          title: presentation.title,
          category: presentation.category,
          description: presentation.description,
          slides: presentation.slides,
          status: 'draft',
        });
        setPresentation(prev => ({ ...prev, id: created.id }));
        navigate(`/presentations/editor/${created.id}`, { replace: true });
      } else {
        await base44.entities.Presentation.update(presentation.id, {
          title: presentation.title,
          category: presentation.category,
          description: presentation.description,
          slides: presentation.slides,
        });
      }
      queryClient.invalidateQueries(['presentations']);
      setSaveStatus('saved');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      setSaveStatus('error');
    }
  };

  const handleExport = async () => {
    if (!presentation.id) {
      await handleSave();
    }
    setExporting(true);
    setExportResult(null);
    try {
      const res = await base44.functions.invoke('generatePptx', {
        title: presentation.title,
        description: presentation.description,
        slides: presentation.slides,
        presentation_id: presentation.id,
      });
      setExportResult(res.data);
      queryClient.invalidateQueries(['presentations']);
      toast({ title: 'PowerPoint generated', description: 'Saved to SharePoint' });
    } catch (e) {
      toast({ title: 'Export failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
    setExporting(false);
  };

  if (loading || !presentation) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedSlide = presentation.slides[selectedSlideIndex];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/presentations')} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Input
          value={presentation.title}
          onChange={(e) => updatePresentation({ title: e.target.value })}
          className="flex-1 min-w-[200px] font-semibold"
          placeholder="Presentation title"
        />
        <select
          value={presentation.category}
          onChange={(e) => updatePresentation({ category: e.target.value })}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {saveStatus === 'saving' && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
        {saveStatus === 'saved' && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
        <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
          <Save className="w-4 h-4" />
          Save
        </Button>
        <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-1.5">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {exporting ? 'Generating…' : 'Generate PowerPoint'}
        </Button>
      </div>

      {exportResult && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-700">PowerPoint generated successfully!</p>
            <p className="text-xs text-muted-foreground">Saved to SharePoint → Presentations folder</p>
          </div>
          <a href={exportResult.file_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Open in SharePoint
            </Button>
          </a>
        </div>
      )}

      <Input
        value={presentation.description || ''}
        onChange={(e) => updatePresentation({ description: e.target.value })}
        placeholder="Subtitle / description (shown on title slide)"
        className="text-sm"
      />

      {/* Editor: 3-column layout */}
      <div className="flex border border-border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        <SlidePanel
          slides={presentation.slides}
          selectedIndex={selectedSlideIndex}
          onSelect={setSelectedSlideIndex}
          onAdd={addSlide}
          onDelete={deleteSlide}
          onMoveUp={(i) => moveSlide(i, -1)}
          onMoveDown={(i) => moveSlide(i, 1)}
          onDuplicate={duplicateSlide}
        />
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/30 overflow-auto">
          <div className="w-full max-w-3xl">
            <SlidePreview slide={selectedSlide} description={presentation.description} />
          </div>
        </div>
        <SlideProperties
          slide={selectedSlide}
          onUpdate={(updates) => updateSlide(selectedSlideIndex, updates)}
          setUploading={setUploading}
        />
      </div>
    </div>
  );
}