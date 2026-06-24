import React, { useState, useRef, useLayoutEffect } from 'react';
import { ArrowBigUp } from 'lucide-react';
import { ribbonGradient } from './imageFilters';

const PAGE_HEIGHT_PX = 11 * 96; // 11 inches at 96 DPI
const TOP_BAR_PX = 4;
const PADDING_PX = 48; // 0.75in padding top/bottom
const FOOTER_RESERVE_PX = 64; // Space for footer content + border
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - TOP_BAR_PX - PADDING_PX * 2 - FOOTER_RESERVE_PX;
const CONTENT_HEIGHT_NO_FOOTER_PX = PAGE_HEIGHT_PX - TOP_BAR_PX - PADDING_PX * 2;
const CONTENT_WIDTH_PX = 8.5 * 96 - PADDING_PX * 2;
const LINE_HEIGHT_PX = 40; // ~2 lines buffer - absolutely prevents any text slicing
const SAFETY_OVERLAP_PX = 50; // Generous overlap between pages

function parseZones(raw) {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function PageFrame({ children, pageNum, primaryColor }) {
  return (
    <div className="relative print:shadow-none print:mb-0 mb-6">
      <div className="no-print absolute -inset-1 bg-gray-200 rounded-lg -z-10 translate-y-1" />
      <div className="no-print absolute -inset-2 bg-gray-100 rounded-lg -z-20 translate-y-2" />
      <div className="relative bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none overflow-hidden" style={{ height: '11in', width: '8.5in', maxWidth: '100%' }}>
        {children}
      </div>
      {pageNum && (
        <div className="no-print text-center mt-2">
          <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">Page {pageNum}</span>
        </div>
      )}
    </div>
  );
}

function ContinuationHeader({ masterHeader, headerImage, headerImageHeight, headerFontSize, headerLayout, headerZones, primaryColor, pageNum, showPageNumber, branding }) {
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

function PageFooter({ masterFooter, footerImage, footerImageHeight, footerFontSize, footerLayout, footerZones, primaryColor, pageNum, showPageNumber, useCssCounter, branding }) {
  const zones = parseZones(footerZones);
  if (!zones.length && !masterFooter && !footerImage) return null;

  const hasAny = zones.some(z => z.content === 'ribbon' || (z.content === 'text' && masterFooter) || (z.content === 'image' && footerImage) || (z.content === 'page_number' && showPageNumber && (useCssCounter || pageNum)));
  if (!hasAny && !masterFooter && !footerImage) return null;

  return (
    <div className="pt-2" style={{ borderTop: `1px solid ${primaryColor}20` }}>
      {footerLayout === 'stacked' ? (
        <div className="flex flex-col items-center gap-1">
          {zones.map(z => {
            if (z.content === 'ribbon') return <div key={z.id} style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} />;
            if (z.content === 'text' && masterFooter) return <span key={z.id} className="break-words" style={{ fontSize: `${footerFontSize || 12}px`, color: z.color || 'hsl(var(--muted-foreground))' }}>{masterFooter}</span>;
            if (z.content === 'image' && footerImage) return <img key={z.id} src={footerImage} alt="" className="object-contain" style={{ maxHeight: `${footerImageHeight || 48}px` }} />;
            if (z.content === 'page_number' && showPageNumber && pageNum) return <span key={z.id} style={{ fontSize: `${footerFontSize || 12}px` }} className="text-muted-foreground">{pageNum}</span>;
            return null;
          })}
        </div>
      ) : (
        <div className="flex items-center w-full gap-2">
          {zones.map(z => {
            if (z.content === 'ribbon') return <div key={z.id} style={{ width: `${z.w}%` }}><div style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} /></div>;
            if (z.content === 'text' && masterFooter) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span className="break-words" style={{ fontSize: `${footerFontSize || 12}px`, color: z.color || 'hsl(var(--muted-foreground))' }}>{masterFooter}</span></div>;
            if (z.content === 'image' && footerImage) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><img src={footerImage} alt="" className="object-contain" style={{ maxHeight: `${footerImageHeight || 48}px` }} /></div>;
            if (z.content === 'page_number' && showPageNumber && pageNum) return <div key={z.id} style={{ width: `${z.w}%`, textAlign: z.align || 'left' }}><span style={{ fontSize: `${footerFontSize || 12}px` }} className="text-muted-foreground">{pageNum}</span></div>;
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
  hideFooter
}) {
  const [pageCount, setPageCount] = useState(1);
  const [headerHeight, setHeaderHeight] = useState(0);
  const measureRef = useRef(null);
  const headerMeasureRef = useRef(null);

  const primaryColor = branding?.primary_color || '#1a2744';
  const hasContHeader = showHeaderAll;
  const hasFooter = showFooterAll && !hideFooter;
  const availableContentHeight = hasFooter ? CONTENT_HEIGHT_PX : CONTENT_HEIGHT_NO_FOOTER_PX;

  // Measure header height including margins and borders
  useLayoutEffect(() => {
    if (!hasContHeader) { setHeaderHeight(0); return; }
    const measureHeader = () => {
      if (headerMeasureRef.current) {
        const el = headerMeasureRef.current;
        const inner = el.firstElementChild;
        if (inner) {
          const style = getComputedStyle(inner);
          const mt = parseFloat(style.marginTop) || 0;
          const mb = parseFloat(style.marginBottom) || 0;
          const bt = parseFloat(style.borderTopWidth) || 0;
          const bb = parseFloat(style.borderBottomWidth) || 0;
          // scrollHeight includes padding, getBoundingClientRect includes borders
          const h = Math.ceil(inner.scrollHeight + mt + mb + bb);
          // Ensure minimum header height to prevent content encroachment
          const safeH = Math.max(h, 60); // At least 60px for header + border + margins
          if (safeH > 0 && safeH !== headerHeight) setHeaderHeight(safeH);
        }
      }
    };
    measureHeader();
    const timer = setTimeout(measureHeader, 50);
    return () => clearTimeout(timer);
  });

  // Measure content and calculate page count
  useLayoutEffect(() => {
    if (fitToPage) { setPageCount(1); if (onPageCountChange) onPageCountChange(sectionId, 1); return; }
    if (hasContHeader && headerHeight === 0) return;

    const measure = () => {
      if (measureRef.current) {
        const totalHeight = measureRef.current.scrollHeight;
        // Reserve one full line at bottom of each page to avoid slicing text
        const firstPageUsable = availableContentHeight - LINE_HEIGHT_PX;
        const contPageUsable = availableContentHeight - headerHeight - LINE_HEIGHT_PX;
        
        if (totalHeight <= firstPageUsable) { 
          if (pageCount !== 1) { setPageCount(1); if (onPageCountChange) onPageCountChange(sectionId, 1); }
          return; 
        }

        let remaining = totalHeight - firstPageUsable;
        let pages = 1;
        while (remaining > 0) { pages++; remaining -= contPageUsable; }
        if (pages !== pageCount) { setPageCount(pages); if (onPageCountChange) onPageCountChange(sectionId, pages); }
      }
    };

    const timer = setTimeout(measure, 150);
    const images = measureRef.current?.querySelectorAll('img') || [];
    images.forEach(img => { if (!img.complete) { img.addEventListener('load', measure); } });
    let observer;
    if (measureRef.current) { observer = new ResizeObserver(measure); observer.observe(measureRef.current); }

    return () => { clearTimeout(timer); observer?.disconnect(); };
  });

  if (fitToPage) {
    return (
      <PageFrame pageNum={pageNum} primaryColor={primaryColor}>
        <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
        <div className="relative" style={{ height: `calc(11in - ${TOP_BAR_PX}px)`, overflow: 'hidden' }}>
          <div className="p-8" style={{ height: `calc(100% - ${FOOTER_RESERVE_PX}px)`, paddingBottom: `${FOOTER_RESERVE_PX + 20}px`, overflow: 'hidden' }}>{children}</div>
          {hasFooter && (
            <div style={{ position: 'absolute', bottom: PADDING_PX, left: PADDING_PX, right: PADDING_PX, zIndex: 5 }}>
              <PageFooter masterFooter={masterFooter} footerImage={footerImage} footerImageHeight={footerImageHeight} footerFontSize={footerFontSize} footerLayout={footerLayout} footerZones={footerZones} primaryColor={primaryColor} branding={branding} pageNum={pageNum} showPageNumber={showPageNumbersAll} />
            </div>
          )}
        </div>
      </PageFrame>
    );
  }

  // Screen preview is more conservative than print - ensures no surprises
  const firstPageHeight = availableContentHeight - LINE_HEIGHT_PX * 2; // Extra buffer on screen
  const continuationPageHeight = availableContentHeight - headerHeight - LINE_HEIGHT_PX * 2;

  return (
    <>
      <div className="print:hidden">
        {Array.from({ length: pageCount }).map((_, i) => {
          const isFirstPage = i === 0;
          
          // Calculate cumulative content offset BEFORE this page
          let cumulativeOffset = 0;
          for (let p = 0; p < i; p++) {
            cumulativeOffset += (p === 0 ? firstPageHeight : continuationPageHeight);
          }

          // Content position: shift up by cumulative offset, then push down below header on continuation pages
          const contentTop = isFirstPage ? 0 : -cumulativeOffset + headerHeight;

          return (
            <PageFrame key={i} pageNum={pageNum ? pageNum + i : undefined} primaryColor={primaryColor}>
              <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
              <div className="relative" style={{ height: `calc(11in - ${TOP_BAR_PX}px)` }}>
                {i === 0 && onTogglePageBreak && (
                  <button onClick={onTogglePageBreak} className="no-print absolute top-2 right-2 z-20 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                    <ArrowBigUp className={`w-3.5 h-3.5 ${pageBreakBefore ? 'text-accent' : ''}`} />
                    {pageBreakBefore ? 'Forced page break' : 'Normal flow'}
                  </button>
                )}

                {/* Clipping window - includes safety overlap to prevent gaps */}
                <div
                  ref={i === 0 ? onSectionRef : null}
                  style={{ 
                    position: 'absolute', 
                    top: PADDING_PX, 
                    left: PADDING_PX, 
                    width: CONTENT_WIDTH_PX, 
                    height: isFirstPage ? firstPageHeight + SAFETY_OVERLAP_PX : continuationPageHeight + headerHeight + SAFETY_OVERLAP_PX, 
                    overflow: 'hidden' 
                  }}
                >
                  {/* Header on continuation pages */}
                  {!isFirstPage && hasContHeader && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerHeight, zIndex: 20, backgroundColor: 'white' }}>
                      <ContinuationHeader masterHeader={masterHeader} headerImage={headerImage} headerImageHeight={headerImageHeight} headerFontSize={headerFontSize} headerLayout={headerLayout} headerZones={headerZones} primaryColor={primaryColor} branding={branding} pageNum={pageNum ? pageNum + i : undefined} showPageNumber={showPageNumbersAll} />
                    </div>
                  )}

                  {/* Content container */}
                  <div
                    className="paginated-content"
                    style={{
                      position: 'absolute',
                      top: contentTop,
                      width: CONTENT_WIDTH_PX,
                    }}
                  >
                    {children}
                  </div>
                </div>

                {hasFooter && (
                  <div style={{ position: 'absolute', bottom: PADDING_PX, left: PADDING_PX, right: PADDING_PX, zIndex: 10 }}>
                    <PageFooter masterFooter={masterFooter} footerImage={footerImage} footerImageHeight={footerImageHeight} footerFontSize={footerFontSize} footerLayout={footerLayout} footerZones={footerZones} primaryColor={primaryColor} branding={branding} pageNum={pageNum ? pageNum + i : undefined} showPageNumber={showPageNumbersAll} />
                  </div>
                )}
              </div>
            </PageFrame>
          );
        })}
      </div>

      <div className={`hidden print:block ${pageBreakBefore ? 'print-break' : ''}`}>
        <div className="print-flow-page" style={{ width: '8.5in', maxWidth: '100%', position: 'relative' }}>
          <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
          {showHeaderAll && (
            <div className="mb-4" style={{ borderBottom: `1px solid ${primaryColor}20`, paddingBottom: '0.5rem' }}>
              <ContinuationHeader masterHeader={masterHeader} headerImage={headerImage} headerImageHeight={headerImageHeight} headerFontSize={headerFontSize} headerLayout={headerLayout} headerZones={headerZones} primaryColor={primaryColor} branding={branding} pageNum={pageNum} showPageNumber={showPageNumbersAll} />
            </div>
          )}
          <div className="px-12" style={{ paddingTop: '3rem', paddingBottom: '3.5rem' }}>{children}</div>
          {hasFooter && (
            <div className="print-footer" style={{ position: 'fixed', bottom: '0.5in', left: '0.5in', right: '0.5in' }}>
              <PageFooter masterFooter={masterFooter} footerImage={footerImage} footerImageHeight={footerImageHeight} footerFontSize={footerFontSize} footerLayout={footerLayout} footerZones={footerZones} primaryColor={primaryColor} branding={branding} pageNum={pageNum} showPageNumber={showPageNumbersAll} useCssCounter />
            </div>
          )}
        </div>
      </div>

      <div ref={measureRef} className="paginated-content absolute invisible pointer-events-none print:hidden" style={{ width: CONTENT_WIDTH_PX, position: 'absolute', top: '-9999px' }} aria-hidden="true">{children}</div>

      {hasContHeader && (
        <div ref={headerMeasureRef} className="absolute invisible pointer-events-none print:hidden" style={{ width: CONTENT_WIDTH_PX }} aria-hidden="true">
          <ContinuationHeader masterHeader={masterHeader} headerImage={headerImage} headerImageHeight={headerImageHeight} headerFontSize={headerFontSize} headerLayout={headerLayout} headerZones={headerZones} primaryColor={primaryColor} branding={branding} pageNum={pageNum ? pageNum + 1 : undefined} showPageNumber={showPageNumbersAll} />
        </div>
      )}
    </>
  );
}