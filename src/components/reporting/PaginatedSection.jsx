import React, { useRef, useLayoutEffect, useState } from 'react';
import { ArrowBigUp } from 'lucide-react';
import { ribbonGradient } from './imageFilters';

const PAGE_WIDTH_PX = 8.5 * 96;
const PADDING_PX = 48; // 0.75in
const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - PADDING_PX * 2;
const PAGE_CONTENT_HEIGHT = 11 * 96 - PADDING_PX * 2 - 80; // for TOC page estimate only

function parseZones(raw) {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

export function ContinuationHeader({ masterHeader, headerImage, headerImageHeight, headerFontSize, headerLayout, headerZones, primaryColor, pageNum, showPageNumber, branding }) {
  const zones = parseZones(headerZones);
  const hasContent = masterHeader || headerImage || zones.length > 0 || (showPageNumber && pageNum);
  if (!hasContent) return null;

  return (
    <div className="pb-2 mb-4" style={{ borderBottom: `1px solid ${primaryColor}20` }}>
      {headerLayout === 'stacked' ? (
        <div className="flex flex-col items-center gap-1">
          {zones.length > 0 ? zones.map(z => {
            if (z.content === 'ribbon') return <div key={z.id} style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} />;
            if (z.content === 'text') return <span key={z.id} className="break-words" style={{ fontSize: `${headerFontSize || 12}px`, color: z.color || 'hsl(var(--muted-foreground))' }}>{masterHeader || ''}</span>;
            if (z.content === 'image') return <img key={z.id} src={headerImage} alt="" className="object-contain" style={{ maxHeight: `${headerImageHeight || 48}px` }} />;
            if (z.content === 'page_number') return <span key={z.id} style={{ fontSize: `${headerFontSize || 12}px` }} className="text-muted-foreground">{pageNum || ''}</span>;
            return null;
          }) : (
            <>
              {masterHeader && <span className="break-words" style={{ fontSize: `${headerFontSize || 12}px`, color: 'hsl(var(--muted-foreground))' }}>{masterHeader}</span>}
              {headerImage && <img src={headerImage} alt="" className="object-contain" style={{ maxHeight: `${headerImageHeight || 48}px` }} />}
              {showPageNumber && pageNum && <span style={{ fontSize: `${headerFontSize || 12}px` }} className="text-muted-foreground">{pageNum}</span>}
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center w-full gap-2">
          {zones.length > 0 ? zones.map(z => {
            if (z.content === 'ribbon') return <div key={z.id} style={{ width: `${z.w}%` }}><div style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} /></div>;
            if (z.content === 'text') return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span className="break-words" style={{ fontSize: `${headerFontSize || 12}px`, color: z.color || 'hsl(var(--muted-foreground))' }}>{masterHeader || ''}</span></div>;
            if (z.content === 'image') return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><img src={headerImage} alt="" className="object-contain" style={{ maxHeight: `${headerImageHeight || 48}px` }} /></div>;
            if (z.content === 'page_number') return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span style={{ fontSize: `${headerFontSize || 12}px` }} className="text-muted-foreground">{pageNum || ''}</span></div>;
            return null;
          }) : (
            <>
              {masterHeader && <div style={{ flex: 1 }}><span className="break-words" style={{ fontSize: `${headerFontSize || 12}px`, color: 'hsl(var(--muted-foreground))' }}>{masterHeader}</span></div>}
              {headerImage && <div><img src={headerImage} alt="" className="object-contain" style={{ maxHeight: `${headerImageHeight || 48}px` }} /></div>}
              {showPageNumber && pageNum && <div><span style={{ fontSize: `${headerFontSize || 12}px` }} className="text-muted-foreground">{pageNum}</span></div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function PageFooter({ masterFooter, footerImage, footerImageHeight, footerFontSize, footerLayout, footerZones, primaryColor, pageNum, showPageNumber, useCssCounter, branding }) {
  const zones = parseZones(footerZones);
  if (!zones.length && !masterFooter && !footerImage) return null;

  return (
    <div className="pt-2" style={{ borderTop: `1px solid ${primaryColor}20` }}>
      {footerLayout === 'stacked' ? (
        <div className="flex flex-col items-center gap-1">
          {zones.map(z => {
            if (z.content === 'ribbon') return <div key={z.id} style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} />;
            if (z.content === 'text' && masterFooter) return <span key={z.id} className="break-words" style={{ fontSize: `${footerFontSize || 12}px`, color: z.color || 'hsl(var(--muted-foreground))' }}>{masterFooter}</span>;
            if (z.content === 'image' && footerImage) return <img key={z.id} src={footerImage} alt="" className="object-contain" style={{ maxHeight: `${footerImageHeight || 48}px` }} />;
            if (z.content === 'page_number' && showPageNumber) return <span key={z.id} style={{ fontSize: `${footerFontSize || 12}px` }} className="text-muted-foreground print-page-counter" />;
            return null;
          })}
        </div>
      ) : (
        <div className="flex items-center w-full gap-2">
          {zones.map(z => {
            if (z.content === 'ribbon') return <div key={z.id} style={{ width: `${z.w}%` }}><div style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} /></div>;
            if (z.content === 'text' && masterFooter) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span className="break-words" style={{ fontSize: `${footerFontSize || 12}px`, color: z.color || 'hsl(var(--muted-foreground))' }}>{masterFooter}</span></div>;
            if (z.content === 'image' && footerImage) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><img src={footerImage} alt="" className="object-contain" style={{ maxHeight: `${footerImageHeight || 48}px` }} /></div>;
            if (z.content === 'page_number' && showPageNumber) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span style={{ fontSize: `${footerFontSize || 12}px` }} className="text-muted-foreground print-page-counter" /></div>;
            return null;
          })}
        </div>
      )}
    </div>
  );
}

export default function PaginatedSection({
  children,
  pageNum,
  branding,
  fitToPage,
  pageBreakBefore,
  onTogglePageBreak,
  onSectionRef,
  onPageCountChange,
  sectionId,
  masterHeader,
  headerImage,
  headerImageHeight,
  headerFontSize,
  headerLayout,
  headerZones,
  showHeaderAll,
  showPageNumbersAll,
  masterFooter,
  footerImage,
  footerImageHeight,
  footerFontSize,
  footerLayout,
  footerZones,
  showFooterAll,
  hideFooter,
  isFirstSection,
  isLastSection
}) {
  const primaryColor = branding?.primary_color || '#1a2744';
  const hasFooter = showFooterAll && !hideFooter;
  const measureRef = useRef(null);
  const [estPages, setEstPages] = useState(1);

  // Page count based on actual 8.5x11 page height (1056px = 11in)
  useLayoutEffect(() => {
    if (fitToPage) { setEstPages(1); onPageCountChange?.(sectionId, 1); return; }
    const measure = () => {
      if (measureRef.current) {
        const h = measureRef.current.scrollHeight;
        // Total card height = content + top/bottom padding + accent bar (4px)
        const totalCardHeight = h + PADDING_PX * 2 + 4;
        const pages = Math.max(1, Math.ceil(totalCardHeight / 1056));
        if (pages !== estPages) { setEstPages(pages); onPageCountChange?.(sectionId, pages); }
      }
    };
    const timer = setTimeout(measure, 200);
    const images = measureRef.current?.querySelectorAll('img') || [];
    images.forEach(img => { if (!img.complete) img.addEventListener('load', measure); });
    let observer;
    if (measureRef.current) { observer = new ResizeObserver(measure); observer.observe(measureRef.current); }
    return () => { clearTimeout(timer); observer?.disconnect(); };
  });

  return (
    <>
      {/* ── Screen preview: content flows naturally with visual page boundary lines ── */}
      <div className="print:hidden">
        <div className="relative mb-6">
          <div className="no-print absolute -inset-1 bg-gray-200 rounded-lg -z-10 translate-y-1" />
          <div className="no-print absolute -inset-2 bg-gray-100 rounded-lg -z-20 translate-y-2" />
          <div
            ref={onSectionRef}
            className="relative bg-white rounded-lg shadow-lg overflow-visible"
            style={{ width: '8.5in', maxWidth: '100%' }}
          >
            <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
            {onTogglePageBreak && (
              <button onClick={onTogglePageBreak} className="no-print absolute top-2 right-2 z-20 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                <ArrowBigUp className={`w-3.5 h-3.5 ${pageBreakBefore ? 'text-accent' : ''}`} />
                {pageBreakBefore ? 'Page break' : 'Normal'}
              </button>
            )}
            {/* Content flows naturally — grows as tall as it needs */}
            <div style={{ padding: `${PADDING_PX}px` }}>
              {children}
            </div>
            {/* Visual page boundary lines at every 11in (1056px) mark */}
            {Array.from({ length: Math.max(0, estPages - 1) }).map((_, i) => (
              <div
                key={i}
                className="no-print absolute left-0 right-0 z-40 pointer-events-none"
                style={{ top: `${(i + 1) * 1056}px` }}
              >
                <div className="border-t-2 border-dashed border-red-400" />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-500 bg-white px-2 py-0.5 rounded-full shadow border border-red-200 whitespace-nowrap">
                  ↕ Page break — page {i + 2}
                </span>
              </div>
            ))}
          </div>
          {pageNum && (
            <div className="no-print text-center mt-2">
              <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                Page {pageNum}{estPages > 1 ? ` (≈${estPages} pages)` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Print: native browser pagination, sections flow naturally ── */}
      <div className={`hidden print:block ${pageBreakBefore ? 'print-break' : ''}`}>
        <div className="print-flow-page">
          {/* Content — flows naturally across pages, browser handles breaks.
              Header/footer are rendered as position:fixed elements in ReportPrintView
              so they repeat on every page like Word, sitting within the @page margins. */}
          {children}
        </div>
      </div>

      {/* Hidden measurement div for TOC page estimate */}
      <div ref={measureRef} className="paginated-content absolute invisible pointer-events-none print:hidden" style={{ width: CONTENT_WIDTH_PX, position: 'absolute', top: '-9999px' }} aria-hidden="true">
        {children}
      </div>
    </>
  );
}