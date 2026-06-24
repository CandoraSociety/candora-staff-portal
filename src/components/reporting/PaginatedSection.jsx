import React, { useState, useRef, useLayoutEffect } from 'react';
import { ArrowBigUp } from 'lucide-react';

const PAGE_HEIGHT_PX = 11 * 96; // 1056px
const TOP_BAR_PX = 4; // h-1 = 0.25rem
const PADDING_PX = 32; // p-8 = 2rem
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - TOP_BAR_PX - PADDING_PX * 2; // 988px
const CONTENT_WIDTH_PX = 8.5 * 96 - PADDING_PX * 2; // 752px
const CONT_HEADER_PX = 44; // Height reserved for the continuation header

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

function ContinuationHeader({ masterHeader, headerImage, headerImageHeight, headerFontSize, headerLayout, headerZones, primaryColor, pageNum, showPageNumber }) {
  const zones = parseZones(headerZones);

  const renderSlot = (z) => {
    if (z.content === 'text' && masterHeader) {
      return (
        <span className="break-words" style={{
          fontSize: `${headerFontSize || 12}px`,
          fontFamily: z.font_family || 'Inter',
          fontWeight: z.bold ? 'bold' : 'normal',
          fontStyle: z.italic ? 'italic' : 'normal',
          textDecoration: z.underline ? 'underline' : 'none',
          color: z.color || 'hsl(var(--muted-foreground))',
          textAlign: z.align || 'left',
          lineHeight: 1.3,
        }}>
          {masterHeader} (continued)
        </span>
      );
    }
    if (z.content === 'image' && headerImage) {
      return <img src={headerImage} alt="" className="object-contain" style={{ maxHeight: `${headerImageHeight || 48}px`, maxWidth: '100%' }} />;
    }
    if (z.content === 'page_number' && showPageNumber && pageNum) {
      return <span style={{ fontSize: `${headerFontSize || 12}px` }} className="text-muted-foreground">{pageNum}</span>;
    }
    return null;
  };

  // No zones configured — simple fallback
  if (!zones.length) {
    if (!masterHeader && !headerImage) return null;
    return (
      <div className="pb-2 mb-4" style={{ borderBottom: `1px solid ${primaryColor}20` }}>
        <div className="flex items-center gap-2">
          {headerImage && <img src={headerImage} alt="" className="object-contain" style={{ maxHeight: `${headerImageHeight || 48}px` }} />}
          {masterHeader && (
            <span style={{ fontSize: `${headerFontSize || 12}px`, color: 'hsl(var(--muted-foreground))' }}>
              {masterHeader} (continued)
            </span>
          )}
        </div>
      </div>
    );
  }

  const hasAny = zones.some(z => {
    if (z.content === 'text' && masterHeader) return true;
    if (z.content === 'image' && headerImage) return true;
    if (z.content === 'page_number' && showPageNumber && pageNum) return true;
    return false;
  });
  if (!hasAny) return null;

  if (headerLayout === 'stacked') {
    return (
      <div className="pb-2 mb-4" style={{ borderBottom: `1px solid ${primaryColor}20` }}>
        <div className="flex flex-col items-center gap-1">
          {zones.map(z => {
            const el = renderSlot(z);
            return el ? <div key={z.id} style={{ width: '100%', textAlign: z.align || 'left' }}>{el}</div> : null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2 mb-4" style={{ borderBottom: `1px solid ${primaryColor}20` }}>
      <div className="flex items-center w-full gap-2">
        {zones.map(z => {
          const el = renderSlot(z);
          const just = z.align === 'right' ? 'flex-end' : z.align === 'center' ? 'center' : 'flex-start';
          return (
            <div key={z.id} className="flex" style={{ width: `${z.w}%`, justifyContent: just }}>
              {el}
            </div>
          );
        })}
      </div>
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
  sectionId,
  masterHeader,
  headerImage,
  headerImageHeight,
  headerFontSize,
  headerLayout,
  headerZones,
  showHeaderAll,
  showPageNumbersAll
}) {
  const [pageCount, setPageCount] = useState(1);
  const measureRef = useRef(null);

  const primaryColor = branding?.primary_color || '#1a2744';
  const hasContHeader = showHeaderAll && !!(masterHeader || headerImage);

  useLayoutEffect(() => {
    if (fitToPage) {
      setPageCount(1);
      return;
    }

    const measure = () => {
      if (measureRef.current) {
        const height = measureRef.current.scrollHeight;
        if (height <= CONTENT_HEIGHT_PX) {
          setPageCount(1);
        } else {
          const contHeight = hasContHeader ? CONTENT_HEIGHT_PX - CONT_HEADER_PX : CONTENT_HEIGHT_PX;
          const pages = 1 + Math.ceil((height - CONTENT_HEIGHT_PX) / contHeight);
          setPageCount(Math.max(1, pages));
        }
      }
    };

    const timer = setTimeout(measure, 50);

    const images = measureRef.current?.querySelectorAll('img') || [];
    const imageLoaders = [];
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', measure);
        imageLoaders.push(img);
      }
    });

    let observer;
    if (measureRef.current) {
      observer = new ResizeObserver(measure);
      observer.observe(measureRef.current);
    }

    return () => {
      clearTimeout(timer);
      imageLoaders.forEach(img => img.removeEventListener('load', measure));
      observer?.disconnect();
    };
  });

  // Fit to page: single page with scaling
  if (fitToPage) {
    return (
      <PageFrame pageNum={pageNum} primaryColor={primaryColor}>
        <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
        <div className="p-8 relative" style={{ height: `calc(11in - ${TOP_BAR_PX}px)`, overflow: 'hidden' }}>
          {children}
        </div>
      </PageFrame>
    );
  }

  // Cumulative content offset for each page
  // Page 0 shows CONTENT_HEIGHT_PX of content; pages 1+ show CONTENT_HEIGHT_PX - CONT_HEADER_PX
  const getContentOffset = (i) => {
    if (i === 0) return 0;
    const contHeight = hasContHeader ? CONTENT_HEIGHT_PX - CONT_HEADER_PX : CONTENT_HEIGHT_PX;
    return CONTENT_HEIGHT_PX + (i - 1) * contHeight;
  };

  return (
    <>
      {/* Screen view: paginated pages */}
      <div className="print:hidden">
        {Array.from({ length: pageCount }).map((_, i) => {
          const contHeaderOffset = i > 0 && hasContHeader ? CONT_HEADER_PX : 0;
          return (
            <PageFrame key={i} pageNum={i === 0 ? pageNum : undefined} primaryColor={primaryColor}>
              <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
              <div className="relative" style={{ height: `calc(11in - ${TOP_BAR_PX}px)` }}>
                {i === 0 && onTogglePageBreak && (
                  <button
                    onClick={onTogglePageBreak}
                    className="no-print absolute top-2 right-2 z-20 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                    title={pageBreakBefore ? 'Click to let this section flow naturally' : 'Click to force this section to start on a new page'}
                  >
                    <ArrowBigUp className={`w-3.5 h-3.5 ${pageBreakBefore ? 'text-accent' : ''}`} />
                    {pageBreakBefore ? 'Forced page break' : 'Normal flow'}
                  </button>
                )}

                {/* Content window: positioned at the top margin, clipped to the bottom margin */}
                <div
                  ref={i === 0 ? (el => { if (onSectionRef) onSectionRef(sectionId, el); }) : null}
                  style={{ position: 'absolute', top: PADDING_PX, left: PADDING_PX, right: PADDING_PX, height: CONTENT_HEIGHT_PX }}
                >
                  {/* Continuation header at the top of the content window */}
                  {i > 0 && hasContHeader && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }}>
                      <ContinuationHeader
                        masterHeader={masterHeader}
                        headerImage={headerImage}
                        headerImageHeight={headerImageHeight}
                        headerFontSize={headerFontSize}
                        headerLayout={headerLayout}
                        headerZones={headerZones}
                        primaryColor={primaryColor}
                        pageNum={pageNum ? pageNum + i : undefined}
                        showPageNumber={showPageNumbersAll}
                      />
                    </div>
                  )}

                  {/* Content area: below the continuation header, clipped to the bottom margin */}
                  <div style={{ position: 'absolute', top: contHeaderOffset, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: `${-getContentOffset(i)}px`, left: 0, right: 0 }}>
                      {children}
                    </div>
                  </div>
                </div>
              </div>
            </PageFrame>
          );
        })}
      </div>

      {/* Print view: single flowing content */}
      <div className={`hidden print:block ${pageBreakBefore ? 'print-break' : ''}`}>
        <div className="print-flow-page" style={{ width: '8.5in', maxWidth: '100%' }}>
          <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Hidden measurement container */}
      <div
        ref={measureRef}
        className="absolute invisible pointer-events-none print:hidden"
        style={{ width: `${CONTENT_WIDTH_PX}px` }}
        aria-hidden="true"
      >
        {children}
      </div>
    </>
  );
}