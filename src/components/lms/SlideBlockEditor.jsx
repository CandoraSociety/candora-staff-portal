import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Copy, LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const SLIDE_LAYOUTS = [
  { value: "title_content", label: "Title + Content", icon: "☰" },
  { value: "title_only", label: "Title Only", icon: "▬" },
  { value: "image_right", label: "Image Right", icon: "▤" },
  { value: "full_image", label: "Full Image", icon: "🖼" },
];

const THEMES = [
  { value: "light", label: "Light", bg: "bg-white", text: "text-slate-800", accent: "bg-indigo-600" },
  { value: "dark", label: "Dark", bg: "bg-slate-800", text: "text-white", accent: "bg-indigo-500" },
  { value: "brand", label: "Brand", bg: "bg-accent", text: "text-accent-foreground", accent: "bg-primary" },
];

function getTheme(value) {
  return THEMES.find(t => t.value === value) || THEMES[0];
}

export default function SlideBlockEditor({ data, onChange }) {
  const slides = data.slides || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentSlide = slides[currentIdx];

  const updateSlide = (idx, patch) => {
    const newSlides = slides.map((s, i) => i === idx ? { ...s, ...patch } : s);
    onChange({ slides: newSlides });
  };

  const addSlide = () => {
    const newSlide = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      image_url: "",
      layout: "title_content",
      notes: "",
    };
    const newSlides = [...slides, newSlide];
    onChange({ slides: newSlides });
    setCurrentIdx(newSlides.length - 1);
  };

  const duplicateSlide = (idx) => {
    const dup = { ...slides[idx], id: crypto.randomUUID() };
    const newSlides = [...slides];
    newSlides.splice(idx + 1, 0, dup);
    onChange({ slides: newSlides });
    setCurrentIdx(idx + 1);
  };

  const deleteSlide = (idx) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== idx);
    onChange({ slides: newSlides });
    setCurrentIdx(Math.max(0, idx - 1));
  };

  if (slides.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">No slides yet. Create your first slide to start building a presentation.</p>
        <Button size="sm" onClick={addSlide}><Plus className="w-3.5 h-3.5 mr-1" /> Add First Slide</Button>
      </div>
    );
  }

  const theme = getTheme(data.theme || "light");

  return (
    <div className="space-y-3">
      {/* Theme selector */}
      <div className="flex items-center gap-2">
        <Label className="text-xs shrink-0">Theme:</Label>
        <div className="flex gap-1">
          {THEMES.map(t => (
            <button key={t.value} onClick={() => onChange({ theme: t.value })}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${(data.theme || "light") === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input text-muted-foreground hover:bg-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide canvas preview */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
        <SlidePreview slide={currentSlide} theme={theme} />
        {/* Slide nav controls */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur rounded-full px-1.5 py-0.5">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] text-white font-medium px-1">{currentIdx + 1} / {slides.length}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:bg-white/20" disabled={currentIdx === slides.length - 1} onClick={() => setCurrentIdx(i => i + 1)}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Slide thumbnail strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {slides.map((slide, idx) => (
          <button key={slide.id} onClick={() => setCurrentIdx(idx)}
            className={`relative shrink-0 w-20 aspect-video rounded border-2 overflow-hidden transition-colors ${idx === currentIdx ? "border-primary" : "border-border hover:border-muted-foreground"}`}>
            <div className={`w-full h-full ${theme.bg} ${theme.text} p-1`}>
              <p className="text-[7px] font-semibold truncate leading-tight">{slide.title || "Untitled"}</p>
              <p className="text-[6px] line-clamp-2 leading-tight opacity-70">{slide.body}</p>
            </div>
            <span className="absolute top-0 left-0 bg-black/50 text-white text-[7px] px-0.5 rounded-br">{idx + 1}</span>
          </button>
        ))}
        <button onClick={addSlide} className="shrink-0 w-20 aspect-video rounded border-2 border-dashed border-input hover:border-primary hover:text-primary flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Slide editor controls */}
      <div className="border rounded-md p-3 space-y-2.5 bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Editing Slide {currentIdx + 1}</span>
          <div className="flex items-center gap-0.5">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicateSlide(currentIdx)} title="Duplicate slide">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" disabled={slides.length <= 1} onClick={() => deleteSlide(currentIdx)} title="Delete slide">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Layout selector */}
        <div>
          <Label className="text-xs mb-1 block">Slide Layout</Label>
          <div className="flex gap-1.5 flex-wrap">
            {SLIDE_LAYOUTS.map(l => (
              <button key={l.value} onClick={() => updateSlide(currentIdx, { layout: l.value })}
                className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors flex items-center gap-1 ${(currentSlide.layout || "title_content") === l.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-input text-muted-foreground hover:bg-muted"}`}>
                <span>{l.icon}</span> {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Slide Title</Label>
          <Input value={currentSlide.title || ""} onChange={e => updateSlide(currentIdx, { title: e.target.value })} placeholder="Slide title..." className="text-sm h-8" />
        </div>

        {currentSlide.layout !== "title_only" && currentSlide.layout !== "full_image" && (
          <div>
            <Label className="text-xs mb-1 block">Content (one bullet per line)</Label>
            <Textarea value={currentSlide.body || ""} onChange={e => updateSlide(currentIdx, { body: e.target.value })} rows={3} placeholder={"First point\nSecond point\nThird point"} className="text-sm" />
          </div>
        )}

        {(currentSlide.layout === "image_right" || currentSlide.layout === "full_image") && (
          <div>
            <Label className="text-xs mb-1 block">Image URL</Label>
            <Input value={currentSlide.image_url || ""} onChange={e => updateSlide(currentIdx, { image_url: e.target.value })} placeholder="https://..." className="text-sm h-8" />
          </div>
        )}

        <div>
          <Label className="text-xs mb-1 block">Speaker Notes (optional)</Label>
          <Textarea value={currentSlide.notes || ""} onChange={e => updateSlide(currentIdx, { notes: e.target.value })} rows={2} placeholder="Notes for the presenter..." className="text-sm" />
        </div>
      </div>
    </div>
  );
}

function SlidePreview({ slide, theme }) {
  if (!slide) return <div className={`w-full h-full ${theme.bg} ${theme.text} flex items-center justify-center text-xs opacity-50`}>No slide</div>;

  const layout = slide.layout || "title_content";
  const bullets = (slide.body || "").split("\n").filter(l => l.trim());

  if (layout === "title_only") {
    return (
      <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col items-center justify-center p-4`}>
        <h3 className="text-sm sm:text-base font-bold text-center">{slide.title || "Slide Title"}</h3>
      </div>
    );
  }

  if (layout === "full_image") {
    return (
      <div className={`w-full h-full ${theme.bg} ${theme.text} relative`}>
        {slide.image_url ? (
          <img src={slide.image_url} alt={slide.title || ""} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs opacity-40">No image</div>
        )}
        {slide.title && (
          <div className={`absolute bottom-0 left-0 right-0 ${theme.accent} bg-opacity-80 p-2`}>
            <p className="text-[10px] font-bold text-white truncate">{slide.title}</p>
          </div>
        )}
      </div>
    );
  }

  if (layout === "image_right") {
    return (
      <div className={`w-full h-full ${theme.bg} ${theme.text} flex`}>
        <div className="flex-1 p-3 flex flex-col justify-center">
          <h3 className="text-xs sm:text-sm font-bold mb-2">{slide.title || "Slide Title"}</h3>
          <ul className="space-y-1">
            {bullets.length > 0 ? bullets.map((b, i) => (
              <li key={i} className="text-[9px] sm:text-[10px] flex items-start gap-1">
                <span className={`${theme.accent} w-1 h-1 rounded-full mt-1 shrink-0`} />
                <span className="line-clamp-2">{b}</span>
              </li>
            )) : <li className="text-[9px] opacity-40">Content appears here</li>}
          </ul>
        </div>
        <div className="w-2/5 border-l border-black/10 flex items-center justify-center">
          {slide.image_url ? (
            <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-[8px] opacity-30">Image</div>
          )}
        </div>
      </div>
    );
  }

  // Default: title_content
  return (
    <div className={`w-full h-full ${theme.bg} ${theme.text} flex flex-col p-3`}>
      {slide.title && (
        <>
          <h3 className="text-xs sm:text-sm font-bold mb-2">{slide.title}</h3>
          <div className={`h-0.5 ${theme.accent} rounded-full mb-2 w-12`} />
        </>
      )}
      <div className="flex-1 overflow-hidden">
        <ul className="space-y-1">
          {bullets.length > 0 ? bullets.map((b, i) => (
            <li key={i} className="text-[9px] sm:text-[10px] flex items-start gap-1.5">
              <span className={`${theme.accent} w-1 h-1 rounded-full mt-1 shrink-0`} />
              <span className="line-clamp-2">{b}</span>
            </li>
          )) : <li className="text-[9px] opacity-40">Content appears here</li>}
        </ul>
      </div>
    </div>
  );
}