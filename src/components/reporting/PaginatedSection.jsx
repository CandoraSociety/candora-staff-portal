import React, { useRef, useLayoutEffect, useState } from 'react';
import { ArrowBigUp } from 'lucide-react';
import { ribbonGradient } from './imageFilters';

const PAGE_WIDTH_PX = 8.5 * 96; // 816
const MARGIN_PX = 72; // 0.75in = 72px
const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - MARGIN_PX * 2; // 672
const PAGE_HEIGHT_PX = 11 * 96; // 1056
const CONTENT_AREA_HEIGHT = PAGE_HEIGHT_PX - MARGIN_PX * 2; // 912

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
            if (z.content === 'page_number' && showPageNumber) return <span key={z.id} style={{ fontSize: `${footerFontSize || 12}px` }} className="text-muted-foreground"><span className="print:hidden">{pageNum || ''}</span><span className="hidden print:inline print-page-counter" /></span>;
            return null;
          })}
        </div>
      ) : (
        <div className="flex items-center w-full gap-2">
          {zones.map(z => {
            if (z.content === 'ribbon') return <div key={z.id} style={{ width: `${z.w}%` }}><div style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} /></div>;
            if (z.content === 'text' && masterFooter) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span className="break-words" style={{ fontSize: `${footerFontSize || 12}px`, color: z.color || 'hsl(var(--muted-foreground))' }}>{masterFooter}</span></div>;
            if (z.content === 'image' && footerImage) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><img src={footerImage} alt="" className="object-contain" style={{ maxHeight: `${footerImageHeight || 48}px` }} /></div>;
            if (z.content === 'page_number' && showPageNumber) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span style={{ fontSize: `${footerFontSize || 12}px` }} className="text-muted-foreground"><span className="print:hidden">{pageNum || ''}</span><span className="hidden print:inline print-page-counter" /></span></div>;
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
        const pages = Math.max(1, Math.ceil(h / CONTENT_AREA_HEIGHT));
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
      {/* ── Screen preview: full 8.5x11" page containers with header/footer ── */}
      <div className="print:hidden">
        {Array.from({ length: estPages }).map((_, pageIndex) => (
          <div key={pageIndex} className="relative mb-4" ref={pageIndex === 0 ? onSectionRef : undefined}>
            <div className="no-print absolute -inset-1 bg-gray-200 rounded-lg -z-10 translate-y-1" />
            <div className="no-print absolute -inset-2 bg-gray-100 rounded-lg -z-20 translate-y-2" />
            <div
              className="relative bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ width: '8.5in', height: '11in', maxWidth: '100%' }}
            >
              {/* Accent bar */}
              <div className="h-1 w-full absolute top-0 left-0 right-0 z-10" style={{ backgroundColor: primaryColor }} />

              {/* Header (within top margin) */}
              {showHeaderAll && (
                <div className="absolute z-10" style={{ top: '0.3in', left: '0.75in', right: '0.75in' }}>
                  <ContinuationHeader
                    masterHeader={masterHeader}
                    headerImage={headerImage}
                    headerImageHeight={headerImageHeight}
                    headerFontSize={headerFontSize}
                    headerLayout={headerLayout}
                    headerZones={headerZones}
                    primaryColor={primaryColor}
                    branding={branding}
                    pageNum={showPageNumbersAll ? (pageNum + pageIndex) : undefined}
                    showPageNumber={showPageNumbersAll}
                  />
                </div>
              )}

              {/* Content area — clipped, content translated to show this page's portion */}
              <div className="absolute overflow-hidden" style={{ top: '0.75in', left: '0.75in', right: '0.75in', bottom: '0.75in' }}>
                <div style={{ transform: `translateY(-${pageIndex * CONTENT_AREA_HEIGHT}px)` }}>
                  {children}
                </div>
              </div>

              {/* Footer (within bottom margin) */}
              {hasFooter && (
                <div className="absolute z-10" style={{ bottom: '0.3in', left: '0.75in', right: '0.75in' }}>
                  <PageFooter
                    masterFooter={masterFooter}
                    footerImage={footerImage}
                    footerImageHeight={footerImageHeight}
                    footerFontSize={footerFontSize}
                    footerLayout={footerLayout}
                    footerZones={footerZones}
                    primaryColor={primaryColor}
                    branding={branding}
                    pageNum={showPageNumbersAll ? (pageNum + pageIndex) : undefined}
                    showPageNumber={showPageNumbersAll}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Page label and page break toggle */}
        <div className="no-print flex items-center justify-center gap-3 mb-4">
          {pageNum && (
            <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
              {estPages > 1 ? `Pages ${pageNum}–${pageNum + estPages - 1}` : `Page ${pageNum}`}
            </span>
          )}
          {onTogglePageBreak && (
            <button onClick={onTogglePageBreak} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
              <ArrowBigUp className={`w-3.5 h-3.5 ${pageBreakBefore ? 'text-accent' : ''}`} />
              {pageBreakBefore ? 'Starts on new page' : 'Normal flow'}
            </button>
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