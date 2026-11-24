import React from 'react';

// A talking point as written, with **marked** phrases shown in bold so the facts
// that matter stand out while Dawn is reading.
export default function EmphasisText({ text, className }) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}