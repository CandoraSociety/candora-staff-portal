import React from 'react';
import EmphasisText from './EmphasisText';

// The essential promotional information box - when and where the donation drive
// is, what gifts are needed, where to give and the reminders to land on air.
// It sits beside the last question on the quick reference, on screen and on paper.
const linesOf = (value) =>
  String(value || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

export default function PromoPanel({ rows = [], dark = false, print = false }) {
  if (!rows.length) return null;

  const wrap = print
    ? 'rounded border-l-[3px] border-[#fccf03] bg-[#fffbea] px-2 py-1.5'
    : dark
      ? 'rounded-lg border-l-4 border-[#fccf03] bg-[#0e1734] px-3 py-2'
      : 'rounded-lg border-l-4 border-[#fccf03] bg-[#fffbea] px-3 py-2';

  const heading = print
    ? 'text-[6.5pt] font-bold uppercase tracking-[0.14em] text-[#8a6d00]'
    : `text-[9px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-[#fccf03]' : 'text-[#b38b00]'}`;

  const title = print
    ? 'text-[6.5pt] font-extrabold uppercase tracking-[0.1em] text-[#0a0f29]'
    : `text-[10px] font-extrabold uppercase tracking-[0.08em] ${dark ? 'text-[#eef1ff]' : 'text-[#0a0f29]'}`;

  const line = print
    ? 'text-[8pt] leading-[1.35] text-[#1a2140]'
    : `text-[12px] leading-[1.45] ${dark ? 'text-[#dfe4f7]' : 'text-[#1a2140]'}`;

  const link = print
    ? 'text-[12pt] font-extrabold leading-tight text-[#0a0f29] underline decoration-[#fccf03] decoration-[4px] underline-offset-2'
    : 'text-[15px] font-extrabold underline decoration-[#fccf03] decoration-[3px] underline-offset-2';

  return (
    <div className={`break-inside-avoid ${wrap}`}>
      <p className={heading}>Essential promotional information</p>

      {rows.map((row) => {
        const bulleted = /^remember$/i.test(row.label);
        const lines = linesOf(row.value);

        return (
          <div key={row.label} className={print ? 'mt-1' : 'mt-1.5'}>
            <p className={title}>{row.label}</p>

            {row.url ? (
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                {row.value || row.link_label}
              </a>
            ) : bulleted ? (
              <ul className={print ? 'mt-0.5 space-y-[2px]' : 'mt-0.5 space-y-0.5'}>
                {lines.map((text, index) => (
                  <li key={index} className={`flex gap-1 ${line}`}>
                    <span className="mt-[0.5em] h-[3px] w-[3px] flex-shrink-0 rounded-full bg-[#fccf03]" />
                    <EmphasisText text={text} className="min-w-0" />
                  </li>
                ))}
              </ul>
            ) : (
              <div className={print ? 'mt-0.5 space-y-[1px]' : 'mt-0.5 space-y-0.5'}>
                {lines.map((text, index) => (
                  <p key={index} className={line}>
                    <EmphasisText text={text} />
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}