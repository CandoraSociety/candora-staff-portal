import React from 'react';
import { useOrgSettings } from '@/lib/useOrgSettings';
import { RESOURCE_CATEGORY_LABELS } from '@/lib/receptionConstants';

// Printable version of the Resource Finder results. Hidden on screen; the page's
// print button adds a body class so only this sheet reaches the printer.
export default function ResourceFinderPrintSheet({ community = [], directory = [], query = '', reasoning = '' }) {
  const { logoUrl, orgName } = useOrgSettings();
  const printedOn = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const empty = community.length === 0 && directory.length === 0;

  const row = (label, value) => value ? (
    <p style={{ margin: '2px 0', fontSize: 11, color: '#334155', lineHeight: 1.4 }}>
      <span style={{ fontWeight: 600, color: '#0f172a' }}>{label}:</span> {value}
    </p>
  ) : null;

  const entry = (key, name, subtitle, description, fields) => (
    <div key={key} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px', marginBottom: 10, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{name}</div>
      {subtitle && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{subtitle}</div>}
      {description && <p style={{ fontSize: 11, color: '#334155', margin: '5px 0 6px', lineHeight: 1.45 }}>{description}</p>}
      {fields}
    </div>
  );

  return (
    <div className="resource-print-sheet hidden print:block" style={{ background: '#fff', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #0f1f6b', paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoUrl && <img src={logoUrl} alt={orgName} style={{ height: 40, objectFit: 'contain' }} />}
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>Resource Finder — Results</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{orgName || 'Candora'}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#475569', textAlign: 'right' }}>Printed {printedOn}</div>
      </div>

      {query && (
        <div style={{ fontSize: 11, color: '#334155', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Search:</span> “{query}”
        </div>
      )}
      {reasoning && (
        <p style={{ fontSize: 11, fontStyle: 'italic', color: '#475569', margin: '0 0 12px' }}>{reasoning}</p>
      )}

      {empty ? (
        <p style={{ fontSize: 12, color: '#64748b' }}>No resources to print.</p>
      ) : (
        <>
          {community.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#0f1f6b', borderBottom: '1px solid #cbd5e1', paddingBottom: 4, marginBottom: 10 }}>
                Edmonton Metro Area Resources
              </h2>
              {community.map((r, i) => entry(
                `c-${i}`,
                r.name,
                r.category || 'Community service',
                r.description,
                <>
                  {row('Phone', r.contact_phone)}
                  {row('Address', r.address)}
                  {row('Website', r.website)}
                  {row('Hours', r.hours)}
                  {row('Eligibility', r.eligibility)}
                  {row('Cost', r.cost)}
                </>
              ))}
            </div>
          )}

          {directory.length > 0 && (
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#0f1f6b', borderBottom: '1px solid #cbd5e1', paddingBottom: 4, marginBottom: 10 }}>
                Candora Directory Resources
              </h2>
              {directory.map((r) => entry(
                r.id,
                r.name,
                [RESOURCE_CATEGORY_LABELS[r.category], r.provider_organization || (r.type === 'internal' ? 'Candora' : 'External')].filter(Boolean).join(' · '),
                r.description,
                <>
                  {row('Phone', r.contact_phone)}
                  {row('Email', r.contact_email)}
                  {row('Address', r.address ? (r.city ? `${r.address}, ${r.city}` : r.address) : '')}
                  {row('Website', r.website_url)}
                  {row('Hours', r.hours)}
                  {row('Eligibility', r.eligibility_criteria)}
                  {row('Cost', r.cost)}
                </>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}