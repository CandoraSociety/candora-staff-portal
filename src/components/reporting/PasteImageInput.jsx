import React, { useState, useRef } from 'react';
import { Clipboard } from 'lucide-react';

export default function PasteImageInput({ onPasteImage, disabled = false }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  const handlePaste = (e) => {
    if (disabled) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Ensure the pasted image has a proper filename
          if (!file.name || file.name === 'image.png') {
            const ext = file.type.split('/')[1] || 'png';
            onPasteImage(new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type }));
          } else {
            onPasteImage(file);
          }
          ref.current?.blur();
        }
        return;
      }
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="button"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPaste={handlePaste}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border-2 border-dashed cursor-pointer transition-colors select-none ${
        focused ? 'border-accent bg-accent/5 text-accent' : 'border-muted-foreground/30 text-muted-foreground hover:border-accent/40 hover:bg-muted/30'
      }`}
    >
      <Clipboard className="w-3.5 h-3.5 shrink-0" />
      <span>{focused ? 'Press Ctrl+V to paste...' : 'Or paste image from clipboard'}</span>
    </div>
  );
}