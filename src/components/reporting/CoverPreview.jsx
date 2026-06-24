import React from 'react';
import { getFilterCss } from './imageFilters';
import { useCoverScale } from './useCoverScale';

const IMG_MAP = {
  front: 'cover_image', inside_front: 'inside_front_cover_image',
  inside_back: 'inside_back_cover_image', back: 'back_cover_image',
};

function parseOverlays(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default function StyledCoverPreview({ coverType, report, branding, roundedTop, noPadding }) {
  const [containerRef, scale] = useCoverScale();
  const imageUrl = report?.[IMG_MAP[coverType]];
  const overlays = parseOverlays(report?.cover_overlays)[coverType] || [];

  return (
    <div ref={containerRef} className={`${noPadding ? '' : ''} w-full overflow-hidden relative${roundedTop ? ' rounded-t-xl' : ''}`} style={{ height: '11in' }}>
      {imageUrl ? (
        <img src={imageUrl} alt={coverType} className="absolute inset-0 w-full h-full object-cover" style={{ pointerEvents: 'none' }} />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
      )}

      {overlays.map(el => {
        if (el.type === 'text') {
          return (
            <div key={el.id} className="absolute select-none pointer-events-none"
              style={{
                left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)',
                width: `${(el.w || 280) * scale}px`, minHeight: el.h ? `${el.h * scale}px` : undefined,
                fontSize: `${(el.font_size || 20) * scale}px`, fontFamily: el.font_family || 'Inter',
                color: el.color || '#fff', fontWeight: el.bold ? 'bold' : 'normal',
                fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none',
                textAlign: el.align || 'center', textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                lineHeight: 1.3, whiteSpace: 'pre-line', wordBreak: 'break-word',
                zIndex: 10,
              }}
            >
              {el.content}
            </div>
          );
        }
        if (el.type === 'image') {
          return (
            <div key={el.id} className="absolute" style={{
              left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)',
              width: `${(el.w || 160) * scale}px`, height: `${(el.h || 160) * scale}px`, zIndex: 10,
            }}>
              <img src={el.url} alt="" className="w-full h-full object-cover rounded" style={{
                transform: `rotate(${el.rotation || 0}deg)`,
                opacity: el.opacity != null ? el.opacity : 1,
                filter: getFilterCss(el.filter),
                ...(el.frame ? { border: `3px solid ${branding?.primary_color || '#1a2744'}`, outline: `1px solid ${branding?.accent_color || '#2b2de8'}`, outlineOffset: '2px' } : {}),
                ...(el.shadow ? { boxShadow: '0 8px 24px rgba(0,0,0,0.35)' } : {}),
              }} />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}