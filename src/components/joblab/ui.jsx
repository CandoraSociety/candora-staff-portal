import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-jl-ring/50';

const BUTTON_VARIANTS = {
  primary: 'bg-jl-primary text-jl-primary-fg shadow-sm hover:bg-jl-primary/90',
  outline: 'border border-jl-border bg-white text-jl-fg hover:bg-jl-secondary',
  ghost: 'text-jl-fg hover:bg-jl-secondary',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  warn: 'bg-jl-accent text-white hover:bg-jl-accent/90',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9',
};

export function JLButton({ variant = 'primary', size = 'md', className, ...props }) {
  return (
    <button
      className={cn(BASE_BUTTON, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  );
}

export function JLCard({ className, ...props }) {
  return <div className={cn('bg-jl-card border border-jl-border rounded-xl shadow-sm', className)} {...props} />;
}

export function JLInput({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-jl-border bg-white px-3 text-sm text-jl-fg placeholder:text-jl-muted-fg focus:outline-none focus:ring-2 focus:ring-jl-ring/40',
        className
      )}
      {...props}
    />
  );
}

export function JLTextarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-jl-border bg-white px-3 py-2 text-sm text-jl-fg placeholder:text-jl-muted-fg focus:outline-none focus:ring-2 focus:ring-jl-ring/40',
        className
      )}
      {...props}
    />
  );
}

export function JLSelect({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border border-jl-border bg-white px-3 text-sm text-jl-fg focus:outline-none focus:ring-2 focus:ring-jl-ring/40',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function JLLabel({ className, ...props }) {
  return <label className={cn('block text-xs font-semibold text-jl-fg mb-1.5', className)} {...props} />;
}

export function JLBadge({ className, ...props }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', className)}
      {...props}
    />
  );
}

export function JLSpinner({ className }) {
  return <div className={cn('w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin', className)} />;
}

export function JLTabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-lg bg-jl-secondary p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === tab.value
              ? 'bg-white text-jl-primary shadow-sm'
              : 'text-jl-muted-fg hover:text-jl-fg'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function JLDialog({ open, onClose, title, description, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8">
      <div
        className={cn(
          'w-full rounded-2xl bg-white shadow-2xl',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-jl-border px-5 py-4">
          <div>
            <h2 className="jl-heading text-lg font-semibold text-jl-fg">{title}</h2>
            {description && <p className="text-sm text-jl-muted-fg mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-jl-muted-fg hover:bg-jl-secondary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-jl-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function JLEmpty({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-jl-border bg-white/60 px-6 py-12 text-center">
      {Icon && <Icon className="w-8 h-8 text-jl-muted-fg mb-3" />}
      <p className="text-sm font-semibold text-jl-fg">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-jl-muted-fg">{hint}</p>}
    </div>
  );
}