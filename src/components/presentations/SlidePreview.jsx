import React from 'react';
import { ImageOff } from 'lucide-react';

export default function SlidePreview({ slide, description, className = '' }) {
  if (!slide) {
    return <div className={`aspect-video bg-muted rounded-lg flex items-center justify-center ${className}`}>
      <p className="text-muted-foreground text-sm">No slide selected</p>
    </div>;
  }

  const layout = slide.layout || 'title_content';
  const lines = slide.content ? slide.content.split('\n').filter(l => l.trim()) : [];

  if (layout === 'title') {
    return (
      <div className={`aspect-video bg-white rounded-lg border border-border overflow-hidden flex flex-col items-center justify-center p-8 ${className}`}>
        {slide.title && <h2 className="text-2xl font-bold text-[#0f1f6b] text-center">{slide.title}</h2>}
        {description && <p className="text-sm text-[#2b2de8] mt-3 text-center">{description}</p>}
      </div>
    );
  }

  if (layout === 'section') {
    return (
      <div className={`aspect-video rounded-lg overflow-hidden flex items-center justify-center p-8 ${className}`} style={{ backgroundColor: '#0f1f6b' }}>
        {slide.title && <h2 className="text-2xl font-bold text-white text-center">{slide.title}</h2>}
      </div>
    );
  }

  if (layout === 'title_image') {
    return (
      <div className={`aspect-video bg-white rounded-lg border border-border overflow-hidden p-6 flex flex-col ${className}`}>
        {slide.title && <h2 className="text-xl font-bold text-[#0f1f6b] mb-3">{slide.title}</h2>}
        <div className="flex-1 flex items-center justify-center">
          {slide.image_url ? (
            <img src={slide.image_url} alt="" className="max-h-full max-w-full object-contain rounded" />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageOff className="w-8 h-8 mb-1" />
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'title_content_image') {
    return (
      <div className={`aspect-video bg-white rounded-lg border border-border overflow-hidden p-6 flex flex-col ${className}`}>
        {slide.title && <h2 className="text-xl font-bold text-[#0f1f6b] mb-3">{slide.title}</h2>}
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="flex-1 overflow-hidden">
            <ul className="space-y-1">
              {lines.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-[#2b2de8] font-bold">•</span>
                  <span>{line.replace(/^[-•*]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-2/5 flex items-center justify-center">
            {slide.image_url ? (
              <img src={slide.image_url} alt="" className="max-h-full max-w-full object-contain rounded" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageOff className="w-6 h-6 mb-1" />
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // title_content (default)
  return (
    <div className={`aspect-video bg-white rounded-lg border border-border overflow-hidden p-6 flex flex-col ${className}`}>
      {slide.title && <h2 className="text-xl font-bold text-[#0f1f6b] mb-3">{slide.title}</h2>}
      <div className="flex-1 overflow-hidden">
        <ul className="space-y-1.5">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-[#2b2de8] font-bold">•</span>
              <span>{line.replace(/^[-•*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}