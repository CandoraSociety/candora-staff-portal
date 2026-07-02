import React from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClickToCallButton({ phone, name, className, size = 'sm' }) {
  if (!phone) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Replace with Sunoco VOIP integration when available
    // For now, uses tel: protocol as a placeholder
    window.location.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <button
      onClick={handleClick}
      title={`Call ${name || ''}: ${phone}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        className
      )}
    >
      <Phone className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {size === 'sm' ? 'Call' : 'VOIP Call'}
    </button>
  );
}