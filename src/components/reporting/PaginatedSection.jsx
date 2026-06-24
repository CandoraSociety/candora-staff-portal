import React, { useState, useRef, useLayoutEffect } from 'react';
import { ArrowBigUp } from 'lucide-react';

const PAGE_HEIGHT_PX = 11 * 96; // 1056px
const TOP_BAR_PX = 4; // h-1 = 0.25rem
const PADDING_PX = 32; // p-8 = 2rem
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - TOP_BAR_PX - PADDING_PX * 2; // 988px
const CONTENT_WIDTH_PX = 8.5 * 96 - PADDING_PX * 2; // 752px

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

export default function PaginatedSection({
  children,
  pageNum,
  branding,
  fitToPage,
  pageBreakBefore,
  onTogglePageBreak,
  onSectionRef,
  sectionId
}) {
  const [pageCount, setPageCount] = useState(1);
  const measureRef = useRef(null);

  useLayoutEffect(() => {
    if (fitToPage) {
      setPageCount(1);
      return;
    }

    const measure = () => {
      if (measureRef.current) {
        const height = measureRef.current.scrollHeight;
        const pages = Math.ceil(height / CONTENT_HEIGHT_PX);
        setPageCount(Math.max(1, pages));
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

  const primaryColor = branding?.primary_color || '#1a2744';

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

  return (
    <>
      {/* Screen view: paginated pages */}
      <div className="print:hidden">
        {Array.from({ length: pageCount }).map((_, i) => (
          <PageFrame key={i} pageNum={i === 0 ? pageNum : undefined} primaryColor={primaryColor}>
            <div className="h-1 w-full" style={{ backgroundColor: primaryColor }} />
            <div className="p-8 relative" style={{ height: `calc(11in - ${TOP_BAR_PX}px)`, overflow: 'hidden' }}>
              {i === 0 && onTogglePageBreak && (
                <button
                  onClick={onTogglePageBreak}
                  className="no-print absolute top-2 right-2 z-10 text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
                  title={pageBreakBefore ? 'Click to let this section flow naturally' : 'Click to force this section to start on a new page'}
                >
                  <ArrowBigUp className={`w-3.5 h-3.5 ${pageBreakBefore ? 'text-accent' : ''}`} />
                  {pageBreakBefore ? 'Forced page break' : 'Normal flow'}
                </button>
              )}
              <div ref={i === 0 ? (el => { if (onSectionRef) onSectionRef(sectionId, el); }) : null}>
                <div style={{ position: 'absolute', top: `-${i * CONTENT_HEIGHT_PX}px`, left: PADDING_PX, right: PADDING_PX }}>
                  {children}
                </div>
              </div>
            </div>
          </PageFrame>
        ))}
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