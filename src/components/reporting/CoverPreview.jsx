import React from 'react';

const DEFAULT_STYLE = { font_size: 24, font_family: 'Inter', color: '#ffffff', bold: false, italic: false, underline: false, align: 'center', x: 50, y: 50 };

function parseStyles(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

const IMG_MAP = {
  front: 'cover_image',
  inside_front: 'inside_front_cover_image',
  inside_back: 'inside_back_cover_image',
  back: 'back_cover_image',
};
const TXT_MAP = {
  front: 'front_cover_text',
  inside_front: 'inside_front_cover_text',
  inside_back: 'inside_back_cover_text',
  back: 'back_cover_text',
};

export function CoverTextDisplay({ type, report }) {
  const text = report?.[TXT_MAP[type]];
  if (!text) return null;
  const allStyles = parseStyles(report?.cover_text_styles);
  const style = { ...DEFAULT_STYLE, ...allStyles[type] };
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
      <div style={{
        position: 'absolute',
        left: `${style.x}%`, top: `${style.y}%`,
        transform: 'translate(-50%, -50%)',
        maxWidth: '85%',
        textAlign: style.align,
        fontSize: `${style.font_size}px`,
        fontFamily: style.font_family,
        color: style.color,
        fontWeight: style.bold ? 'bold' : 'normal',
        fontStyle: style.italic ? 'italic' : 'normal',
        textDecoration: style.underline ? 'underline' : 'none',
        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        lineHeight: 1.3,
        whiteSpace: 'pre-line',
      }}>
        {text}
      </div>
    </div>
  );
}

export default function StyledCoverPreview({ coverType, report, branding, roundedTop, noPadding }) {
  const imageUrl = report?.[IMG_MAP[coverType]];
  const text = report?.[TXT_MAP[coverType]];
  return (
    <div className={`${noPadding ? '' : ''} aspect-[8.5/11] w-full overflow-hidden relative${roundedTop ? ' rounded-t-xl' : ''}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={coverType} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: branding?.primary_color || '#1a2744' }} />
      )}
      {text && <CoverTextDisplay type={coverType} report={report} />}
    </div>
  );
}