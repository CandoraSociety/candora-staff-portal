import React, { useState, useRef, useLayoutEffect } from 'react';
import { ArrowBigUp } from 'lucide-react';
import { ribbonGradient } from './imageFilters';

const PAGE_HEIGHT_PX = 11 * 96; // 1056px
const TOP_BAR_PX = 4; // h-1 = 0.25rem
const PADDING_PX = 32; // p-8 = 2rem
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - TOP_BAR_PX - PADDING_PX * 2; // 988px
const CONTENT_WIDTH_PX = 8.5 * 96 - PADDING_PX * 2; // 752px
const CONT_HEADER_PX = 44; // Height reserved for the continuation header
const FOOTER_HEIGHT_PX = 48; // Height reserved for the page footer

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

  const renderSlot = (z) => {
    if (z.content === 'ribbon') {
      return <div style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} />;
    }
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
    if (z.content === 'ribbon') return true;
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

function PageFooter({ masterFooter, footerImage, footerImageHeight, footerFontSize, footerLayout, footerZones, primaryColor, pageNum, showPageNumber, useCssCounter, branding }) {
  const zones = parseZones(footerZones);

  const renderSlot = (z) => {
    if (z.content === 'ribbon') {
      return <div style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} />;
    }
    if (z.content === 'text' && masterFooter) {
      return (
        <span className="break-words" style={{
          fontSize: `${footerFontSize || 12}px`,
          fontFamily: z.font_family || 'Inter',
          fontWeight: z.bold ? 'bold' : 'normal',
          fontStyle: z.italic ? 'italic' : 'normal',
          textDecoration: z.underline ? 'underline' : 'none',
          color: z.color || 'hsl(var(--muted-foreground))',
          textAlign: z.align || 'left',
          lineHeight: 1.3,
        }}>
          {masterFooter}
        </span>
      );
    }
    if (z.content === 'image' && footerImage) {
      return <img src={footerImage} alt="" className="object-contain" style={{ maxHeight: `${footerImageHeight || 48}px`, maxWidth: '100%' }} />;
    }
    if (z.content === 'page_number' && showPageNumber && (useCssCounter || pageNum)) {
      if (useCssCounter) {
        return <span className="print-page-counter" style={{ fontSize: `${footerFontSize || 12}px` }} />;
      }
      return <span style={{ fontSize: `${footerFontSize || 12}px` }} className="text-muted-foreground">{pageNum}</span>;
    }
    return null;
  };

  if (!zones.length) {
    if (!masterFooter && !footerImage) return null;
    return (
      <div className="pt-2" style={{ borderTop: `1px solid ${primaryColor}20` }}>
        <div className="flex items-center gap-2">
          {footerImage && <img src={footerImage} alt="" className="object-contain" style={{ maxHeight: `${footerImageHeight || 48}px` }} />}
          {masterFooter && <span style={{ fontSize: `${footerFontSize || 12}px`, color: 'hsl(var(--muted-foreground))' }}>{masterFooter}</span>}
        </div>
      </div>
    );
  }

  const hasAny = zones.some(z => {
    if (z.content === 'ribbon') return true;
    if (z.content === 'text' && masterFooter) return true;
    if (z.content === 'image' && footerImage) return true;
    if (z.content === 'page_number' && showPageNumber && (useCssCounter || pageNum)) return true;
    return false;
  });
  if (!hasAny) return null;

  if (footerLayout === 'stacked') {
    return (
      <div className="pt-2" style={{ borderTop: `1px solid ${primaryColor}20` }}>
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
    <div className="pt-2" style={{ borderTop: `1px solid ${primaryColor}20` }}>
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
  const hasContHeader = showHeaderAll && !!(masterHeader || headerImage);
  const hasFooter = showFooterAll && !hideFooter && parseZones(footerZones).length > 0;
  const footerReservedHeight = hasFooter ? FOOTER_HEIGHT_PX : 0;
  const availableContentHeight = CONTENT_HEIGHT_PX - footerReservedHeight + 80;
  // Only subtract header height on continuation pages (i > 0), not the first page
  const columnHeight = availableContentHeight;

  // Measure the real header height
  useLayoutEffect(() => {
    if (!hasContHeader) {
      setHeaderHeight(0);
      return;
    }
    const measureHeader = () => {
      if (headerMeasureRef.current) {
        const h = headerMeasureRef.current.offsetHeight;
        if (h > 0 && h !== headerHeight) setHeaderHeight(h);
      }
    };
    measureHeader();
    const timer = setTimeout(measureHeader, 50);
    return () => clearTimeout(timer);
  });

  useLayoutEffect(() => {
    if (fitToPage) {
      setPageCount(1);
      if (onPageCountChange) onPageCountChange(sectionId, 1);
      return;
    }
    if (hasContHeader && headerHeight === 0) return; // wait for header measurement

    const measure = () => {
      if (measureRef.current) {
        // scrollWidth tells us how many column-widths the content produced
        const sw = measureRef.current.scrollWidth;
        const pages = Math.max(1, Math.ceil(sw / CONTENT_WIDTH_PX));
        setPageCount(pages);
        if (onPageCountChange) onPageCountChange(sectionId, pages);
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
        <div className="relative" style={{ height: `calc(11in - ${TOP_BAR_PX}px)`, overflow: 'hidden' }}>
          <div className="p-8" style={{ height: hasFooter ? `calc(100% - ${FOOTER_HEIGHT_PX}px)` : '100%', overflow: 'hidden' }}>
            {children}
          </div>
          {hasFooter && (
            <div style={{ position: 'absolute', bottom: PADDING_PX, left: PADDING_PX, right: PADDING_PX, zIndex: 5 }}>
              <PageFooter
                masterFooter={masterFooter}
                footerImage={footerImage}
                footerImageHeight={footerImageHeight}
                footerFontSize={footerFontSize}
                footerLayout={footerLayout}
                footerZones={footerZones}
                primaryColor={primaryColor}
                branding={branding}
                pageNum={pageNum}
                showPageNumber={showPageNumbersAll}
              />
            </div>
          )}
        </div>
      </PageFrame>
    );
  }

  return (
    <>
      {/* Screen view: paginated pages using CSS multi-column flow */}
      <div className="print:hidden">
        {Array.from({ length: pageCount }).map((_, i) => (
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

              {/* Content window: positioned at the margins, clips one column at a time */}
              <div
                ref={i === 0 ? (el => { if (onSectionRef) onSectionRef(sectionId, el); }) : null}
                style={{ position: 'absolute', top: PADDING_PX, left: PADDING_PX, width: CONTENT_WIDTH_PX, height: availableContentHeight, overflow: 'hidden' }}
              >
                {/* Continuation header sits at the top of the content window */}
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
                      branding={branding}
                      pageNum={pageNum ? pageNum + i : undefined}
                      showPageNumber={showPageNumbersAll}
                    />
                  </div>
                )}

                {/* Multi-column container: CSS flows content column-by-column,
                    breaking at line boundaries (just like Word page flow).
                    We translate it horizontally to reveal one column per page. */}
                <div
                  className="paginated-content"
                  style={{
                    columnWidth: CONTENT_WIDTH_PX,
                    columnGap: 0,
                    columnFill: 'auto',
                    height: availableContentHeight - (i > 0 && hasContHeader ? headerHeight : 0),
                    position: 'absolute',
                    top: i > 0 && hasContHeader ? headerHeight : 0,
                    left: 0,
                    width: pageCount * CONTENT_WIDTH_PX,
                    transform: `translateX(-${i * CONTENT_WIDTH_PX}px)`,
                  }}
                >
                  {children}
                </div>
              </div>
              {hasFooter && (
                <div style={{ position: 'absolute', bottom: PADDING_PX, left: PADDING_PX, right: PADDING_PX, zIndex: 5 }}>
                  <PageFooter
                    masterFooter={masterFooter}
                    footerImage={footerImage}
                    footerImageHeight={footerImageHeight}
                    footerFontSize={footerFontSize}
                    footerLayout={footerLayout}
                    footerZones={footerZones}
                    primaryColor={primaryColor}
                    branding={branding}
                    pageNum={pageNum ? pageNum + i : undefined}
                    showPageNumber={showPageNumbersAll}
                  />
                </div>
              )}
            </div>
          </PageFrame>
        ))}
      </div>

      {/* Print view: single flowing content — browser handles pagination natively */}
      <div className={`hidden print:block ${pageBreakBefore ? 'print-break' : ''}`}>
        <div className="print-flow-page" style={{ width: '8.5in', maxWidth: '100%' }}>
          <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
          <div className="p-8">
            {children}
          </div>
        </div>
        {hasFooter && (
          <div className="hidden print:block" style={{ position: 'fixed', bottom: '0.4in', left: '0.5in', right: '0.5in', zIndex: 100 }}>
            <PageFooter
              masterFooter={masterFooter}
              footerImage={footerImage}
              footerImageHeight={footerImageHeight}
              footerFontSize={footerFontSize}
              footerLayout={footerLayout}
              footerZones={footerZones}
              primaryColor={primaryColor}
              branding={branding}
              showPageNumber={showPageNumbersAll}
              useCssCounter
            />
          </div>
        )}
      </div>

      {/* Hidden measurement container — same column setup so scrollWidth gives us the page count */}
      <div
        ref={measureRef}
        className="paginated-content absolute invisible pointer-events-none print:hidden"
        style={{
          width: CONTENT_WIDTH_PX,
          height: columnHeight,
          columnWidth: CONTENT_WIDTH_PX,
          columnGap: 0,
          columnFill: 'auto',
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Hidden header measurement — measures the real continuation header height */}
      {hasContHeader && (
        <div
          ref={headerMeasureRef}
          className="absolute invisible pointer-events-none print:hidden"
          style={{ width: CONTENT_WIDTH_PX }}
          aria-hidden="true"
        >
          <ContinuationHeader
            masterHeader={masterHeader}
            headerImage={headerImage}
            headerImageHeight={headerImageHeight}
            headerFontSize={headerFontSize}
            headerLayout={headerLayout}
            headerZones={headerZones}
            primaryColor={primaryColor}
            branding={branding}
            pageNum={pageNum ? pageNum + 1 : undefined}
            showPageNumber={showPageNumbersAll}
          />
        </div>
      )}
    </>
  );
}