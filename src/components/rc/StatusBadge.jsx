import React from 'react';

export default function StatusBadge({ status, options }) {
  const opt = options.find(o => o.value === status);
  if (!opt) return <span className="text-xs text-muted-foreground">{status}</span>;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ backgroundColor: opt.color + '20', color: opt.color }}
    >
      {opt.label}
    </span>
  );
}