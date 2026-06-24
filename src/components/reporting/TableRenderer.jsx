import React from 'react';

export default function TableRenderer({ chartConfig, branding, isPrint }) {
  const primaryColor = branding?.primary_color || '#1a2744';
  const accentColor = branding?.accent_color || '#2b2de8';

  if (!chartConfig) return null;

  let config;
  try {
    config = typeof chartConfig === 'string' ? JSON.parse(chartConfig) : chartConfig;
  } catch { return null; }

  const { data } = config;
  if (!data || data.length === 0) return null;

  // Extract columns from first row's columns property
  const firstRow = data[0];
  const columns = firstRow?.columns ? Object.keys(firstRow.columns) : ['name', 'value'];

  return (
    <div className="my-4 overflow-hidden rounded-lg border" style={{ borderColor: `${primaryColor}30` }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: `${primaryColor}10` }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left font-semibold border-b"
                style={{ 
                  borderColor: `${primaryColor}20`,
                  color: primaryColor,
                  fontWeight: 600
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              style={{ 
                backgroundColor: rowIdx % 2 === 0 ? 'transparent' : `${primaryColor}05`,
                borderBottom: `1px solid ${primaryColor}15`
              }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className="px-4 py-3"
                  style={{
                    color: colIdx === 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    fontWeight: colIdx === 0 ? 500 : 400
                  }}
                >
                  {row.columns?.[col] || row[col] || row.value || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Branded accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      />
    </div>
  );
}