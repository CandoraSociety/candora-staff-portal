import React from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { getFilterCss } from './imageFilters';

/**
 * Renders multiple independently-positionable images inside a section's
 * content area. Each image is absolutely positioned and can be dragged
 * freely in the preview. Images sit on top of the text content.
 */
export default function MultiImageLayer({ section, onUpdate, branding, isPrint }) {
  const images = section.images || [];
  if (!images.length) return null;

  const pc = branding?.primary_color || '#1a2744';
  const ac = branding?.accent_color || '#2b2de8';
  const editable = !!onUpdate && !isPrint;

  const updateImage = (id, updates) => {
    const newImages = images.map(img => (img.id === id ? { ...img, ...updates } : img));
    onUpdate(section.id, { images: newImages });
  };

  const removeImage = (id) => {
    onUpdate(section.id, { images: images.filter(img => img.id !== id) });
  };

  const handleDragStart = (e, img) => {
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    const container = handle.closest('[data-section-content]');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    // Account for CSS zoom on ancestor elements
    let zoomScale = 1;
    let el = container.parentElement;
    while (el) {
      const z = window.getComputedStyle(el).zoom;
      if (z && z !== '1' && z !== 'normal' && z !== '') {
        zoomScale = parseFloat(z);
        break;
      }
      el = el.parentElement;
    }

    const containerWidth = containerRect.width / zoomScale;
    const startX = img.x != null ? img.x : 50;
    const startY = img.y || 0;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const onMove = (ev) => {
      const deltaX = (ev.clientX - startMouseX) / zoomScale;
      const deltaY = (ev.clientY - startMouseY) / zoomScale;
      const deltaPct = (deltaX / containerWidth) * 100;
      const newX = Math.max(0, Math.min(100, startX + deltaPct));
      const newY = Math.max(0, startY + deltaY);
      updateImage(img.id, { x: Math.round(newX), y: Math.round(newY) });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <>
      {images.map(img => (
        <div
          key={img.id}
          className="absolute group"
          style={{
            left: `${img.x != null ? img.x : 50}%`,
            top: `${img.y || 0}px`,
            width: `${img.width || 40}%`,
            transform: `translateX(-50%) rotate(${img.rotation || 0}deg)`,
            opacity: img.opacity != null ? img.opacity / 100 : 1,
            zIndex: 5,
          }}
        >
          {editable && (
            <div className="no-print absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
              <div
                onMouseDown={(e) => handleDragStart(e, img)}
                className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg"
                title="Drag to reposition"
              >
                <GripHorizontal className="w-3.5 h-3.5" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div
            style={{
              padding: '6px',
              backgroundColor: `${pc}08`,
              borderRadius: '0.75rem',
              ...(img.frame !== false ? { border: `1px solid ${pc}25` } : {}),
            }}
          >
            <img
              src={img.url}
              alt={img.caption || ''}
              className="w-full rounded-lg object-contain"
              style={{
                ...(img.frame !== false ? { border: `2px solid ${pc}`, outline: `1px solid ${ac}40`, outlineOffset: '2px' } : {}),
                ...(img.shadow !== false ? { boxShadow: `0 10px 28px ${pc}35, 0 4px 10px ${ac}20` } : {}),
                filter: getFilterCss(img.filter),
              }}
            />
          </div>
          {img.caption && <p className="text-xs text-muted-foreground text-center mt-1 italic">{img.caption}</p>}
          {editable && (
            <div className="no-print absolute bottom-0 left-0 right-0 bg-black/55 rounded-b-lg px-2 py-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-white shrink-0">W</span>
              <input
                type="range"
                min="10"
                max="100"
                value={img.width || 40}
                onChange={e => updateImage(img.id, { width: parseInt(e.target.value) })}
                className="flex-1 h-1 accent-white"
              />
              <span className="text-[10px] text-white w-9 text-right tabular-nums">{img.width || 40}%</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}