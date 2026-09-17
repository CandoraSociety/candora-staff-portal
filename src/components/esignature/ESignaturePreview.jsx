import React from 'react';

export default function ESignaturePreview({ signature }) {
  if (!signature?.signature_type) {
    return <span className="text-sm text-muted-foreground">No signature yet</span>;
  }
  if (signature.signature_type === 'typed') {
    return (
      <span
        style={{
          fontFamily: signature.font_family || "'Great Vibes', cursive",
          color: signature.font_color || '#0f172a',
          fontStyle: signature.italic ? 'italic' : 'normal',
          fontWeight: signature.bold ? '700' : '400',
          textShadow: signature.shadow ? '2px 2px 3px rgba(0,0,0,0.25)' : 'none',
        }}
        className="text-4xl whitespace-nowrap"
      >
        {signature.typed_text}
      </span>
    );
  }
  if (signature.signature_url) {
    return (
      <img src={signature.signature_url} alt="Signature" className="max-h-24 max-w-full object-contain" />
    );
  }
  return <span className="text-sm text-muted-foreground">Draw or upload your signature first</span>;
}