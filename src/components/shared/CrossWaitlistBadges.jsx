import React from 'react';

// Small "Also waitlisted: ELL, EmpowerU" pill row — shown on waitlist cards and
// central database profiles when the same person is waiting in other programs.
export default function CrossWaitlistBadges({ otherWaitlists, prefix = 'Also waitlisted:' }) {
  if (!otherWaitlists || otherWaitlists.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium">{prefix}</span>
      {otherWaitlists.map((m) => (
        <span key={m.area} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${m.color}1a`, color: m.color }}>
          {m.label}
        </span>
      ))}
    </span>
  );
}