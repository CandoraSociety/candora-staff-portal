import React, { useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';

const ORG_FIELDS = [
  { label: 'Legal Name', key: 'legal_name' },
  { label: 'Charitable #', key: 'charitable_number' },
  { label: 'Registration #', key: 'registration_number' },
  { label: 'GST #', key: 'gst_number' },
  { label: 'Fiscal Year End', key: 'fiscal_year_end' },
  { label: 'ED Name', key: 'executive_director_name' },
  { label: 'ED Email', key: 'executive_director_email' },
  { label: 'Mission', key: 'mission_statement' },
  { label: 'Address', key: 'address' },
  { label: 'Phone', key: 'phone' },
  { label: 'Website', key: 'website' },
];

export default function OrgInfoPopup({ orgInfo, position, onInsert, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const available = ORG_FIELDS.filter(f => orgInfo[f.key]);

  if (available.length === 0) return null;

  // Clamp to viewport
  const style = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - 300),
    left: Math.min(position.x, window.innerWidth - 240),
    zIndex: 9999,
  };

  return (
    <div ref={ref} style={style} className="bg-card border rounded-xl shadow-xl w-56 py-2 overflow-hidden">
      <p className="text-xs font-semibold text-muted-foreground px-3 py-1 uppercase tracking-wide">Insert Org Info</p>
      {available.map(f => (
        <button
          key={f.key}
          onClick={() => onInsert(orgInfo[f.key])}
          className="w-full text-left px-3 py-1.5 hover:bg-muted transition-colors flex items-center justify-between gap-2"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium">{f.label}</p>
            <p className="text-xs text-muted-foreground truncate">{orgInfo[f.key]}</p>
          </div>
          <Copy className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}