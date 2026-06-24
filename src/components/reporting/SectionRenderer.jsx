import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, RotateCw } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import CollageRenderer from './CollageRenderer';
import DraggableImageBlock from './DraggableImageBlock';
import { getFilterCss, ribbonGradient } from './imageFilters';

function parseZones(raw) {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function parseTitleStyles(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function parseStyles(raw) {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default function SectionRenderer({
  section, sectionNumber, dataEntries, branding, isPrint, masterStyles,
  pageNumber, masterHeader, masterFooter, headerImage, footerImage,
  headerImageHeight, footerImageHeight, headerFontSize, footerFontSize,
  headerLayout, footerLayout,
  headerZones: headerZonesRaw, footerZones: footerZonesRaw,
  showHeaderAll, showFooterAll, showPageNumbersAll, forceCollapsible, onUpdate
}) {
  const [expanded, setExpanded] = useState(section.is_expanded_default !== false);

  const contentRef = useRef(null);
  const editingContent = useRef(false);
  const titleRef = useRef(null);
  const editingTitle = useRef(false);

  useEffect(() => {
    if (contentRef.current && !editingContent.current) {
      const newHtml = section.content || '';
      if (contentRef.current.innerHTML !== newHtml) {
        contentRef.current.innerHTML = newHtml;
      }
    }
  }, [section.content, section.layout]);

  useEffect(() => {
    if (titleRef.current && !editingTitle.current) {
      const newTitle = section.title || '';
      if (titleRef.current.textContent !== newTitle) {
        titleRef.current.textContent = newTitle;
      }
    }
  }, [section.title]);

  const [rotating, setRotating] = useState(null);
  const imageRef = useRef(null);

  const startRotate = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    setRotating({ cx, cy, startAngle, startRotation: section.image_rotation || 0 });
  };

  useEffect(() => {
    if (!rotating || !onUpdate) return;
    const onMove = (e) => {
      const currentAngle = Math.atan2(e.clientY - rotating.cy, e.clientX - rotating.cx) * 180 / Math.PI;
      const delta = currentAngle - rotating.startAngle;
      let newRotation = (rotating.startRotation + delta) % 360;
      if (newRotation < 0) newRotation += 360;
      onUpdate(section.id, { image_rotation: Math.round(newRotation) });
    };
    const onUp = () => setRotating(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [rotating, onUpdate, section.id]);

  const pc = branding?.primary_color || '#1a2744';
  const ac = branding?.accent_color || '#2b2de8';

  const sectionData = dataEntries?.filter(d => d.section_id === section.id) || [];
  const showHeader = showHeaderAll && !section.hide_header;
  const showFooter = showFooterAll && !section.hide_footer;
  const showPageNum = showPageNumbersAll && isPrint;
  const isCollapsible = false;

  // ── Zone-based header/footer builder ─────────────────────────────
  const ZoneSlots = ({
    text, image, imageHeight, showPN, pageNum,
    zones: zonesRaw, layout, fontSize
  }) => {
    const zones = parseZones(zonesRaw);
    if (!zones.length) return null;
    const hasAny = zones.some(z => {
      if (z.content === 'ribbon') return true;
      if (z.content === 'text' && text) return true;
      if (z.content === 'image' && image) return true;
      if (z.content === 'page_number' && showPN && pageNum) return true;
      return false;
    });
    if (!hasAny) return null;

    const renderSlot = (z) => {
      if (z.content === 'ribbon') {
        return <div style={{ width: '100%', height: `${z.ribbon_height || 6}px`, background: ribbonGradient(branding), borderRadius: '2px' }} />;
      }
      if (z.content === 'text' && text) {
        return (
          <span className="break-words" style={{
            fontSize: `${fontSize || 12}px`,
            fontFamily: z.font_family || 'Inter',
            fontWeight: z.bold ? 'bold' : 'normal',
            fontStyle: z.italic ? 'italic' : 'normal',
            textDecoration: z.underline ? 'underline' : 'none',
            color: z.color || 'hsl(var(--muted-foreground))',
            textAlign: z.align || 'left',
            lineHeight: 1.3,
          }}>
            {text}
          </span>
        );
      }
      if (z.content === 'image' && image) {
        return (
          <img src={image} alt="" className="object-contain" style={{ maxHeight: `${imageHeight || 48}px`, maxWidth: '100%' }} />
        );
      }
      if (z.content === 'page_number' && showPN && pageNum) {
        return <span style={{ fontSize: `${fontSize || 12}px` }} className="text-muted-foreground">{pageNum}</span>;
      }
      return null;
    };

    if (layout === 'stacked') {
      return (
        <div className="flex flex-col items-center gap-1">
          {zones.map(z => {
            const el = renderSlot(z);
            return el ? <div key={z.id} style={{ width: '100%', textAlign: z.align || 'left' }}>{el}</div> : null;
          })}
        </div>
      );
    }

    return (
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
    );
  };

  const headerContent = showHeader && (
    <div className="pb-2 mb-4" style={{ borderBottom: `1px solid ${pc}20` }}>
      <ZoneSlots
        text={masterHeader}
        image={headerImage}
        imageHeight={headerImageHeight}
        showPN={showPageNum}
        pageNum={pageNumber}
        zones={headerZonesRaw}
        layout={headerLayout || 'inline'}
        fontSize={headerFontSize || 12}
      />
    </div>
  );

  const footerContent = showFooter && !isPrint && (
    <div className="pt-2 mt-6" style={{ borderTop: `1px solid ${pc}20` }}>
      <ZoneSlots
        text={masterFooter}
        image={footerImage}
        imageHeight={footerImageHeight}
        showPN={showPageNum}
        pageNum={pageNumber}
        zones={footerZonesRaw}
        layout={footerLayout || 'inline'}
        fontSize={footerFontSize || 12}
      />
    </div>
  );

  // ── Branded title bar ──────────────────────────────────────────────
  const master = parseStyles(masterStyles);
  const masterTitle = master.title || {};
  // Merge: section title_styles override master, master fills gaps
  const ts = { ...masterTitle, ...parseTitleStyles(section.title_styles) };
  const TitleBar = () => {
    const titleColor = ts.color || pc;
    const titleSize = ts.font_size || 18;
    const titleImage = section.title_image_url;
    return (
      <div className="relative mb-5 print:mb-6 print:block">
        <div
          className="h-1 w-full rounded-full mb-4 print:block print:mb-4"
          style={{ background: `linear-gradient(90deg, ${pc} 0%, ${ac} 100%)`, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        />
        <div className="flex items-center gap-3 print:flex">
          {sectionNumber != null && (
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold print:print-color-adjust" style={{ backgroundColor: pc, color: '#fff', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
              {sectionNumber}
            </div>
          )}
          <h3
            ref={titleRef}
            contentEditable={false}
            suppressContentEditableWarning
            className="font-heading font-bold leading-tight rounded px-1 -mx-1 print:text-black print:font-bold"
            style={{
              color: titleColor,
              fontSize: `${titleSize}px`,
              fontFamily: ts.font_family || undefined,
              fontWeight: ts.bold !== false ? 'bold' : 'normal',
              fontStyle: ts.italic ? 'italic' : 'normal',
              textDecoration: ts.underline ? 'underline' : 'none',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            }}
          >
            {section.title}
          </h3>
          {titleImage && (
            <div className="shrink-0 ml-auto">
              <img src={titleImage} alt="" className="object-contain rounded print:print-color-adjust" style={{ maxHeight: section.title_image_width ? `${section.title_image_width}px` : `${Math.max(titleSize + 8, 36)}px`, maxWidth: section.title_image_width ? `${section.title_image_width}px` : '120px', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 flex gap-[3px] opacity-[0.08]" style={{ color: pc }} aria-hidden="true">
          <div className="grid grid-cols-3 gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: i % 3 === 0 ? pc : ac }} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const masterContent = master.content || {};
    const hasCollage = (section.collage_photos || []).length >= 2 && section.layout !== 'text_only';
    const hasImage = (hasCollage || section.image_url) && section.layout !== 'text_only';
    const hasChart = sectionData.length > 0;
    const textColumns = section.text_columns || 1;
    const hasFloatedImage = ['image_left', 'image_right', 'image_wrap'].includes(section.layout);
    const contentBlock = (
      <div className="prose prose-sm max-w-none" style={{
        fontFamily: masterContent.font_family || undefined,
        fontSize: masterContent.font_size ? `${masterContent.font_size}px` : undefined,
        color: masterContent.color || undefined,
        ...(section.content_bg_color ? {
          backgroundColor: section.content_bg_color,
          padding: '1rem 1.25rem',
          borderRadius: '0.5rem',
          border: `1px solid ${pc}20`,
        } : {}),
        ...(textColumns > 1 && !hasFloatedImage ? {
          columnCount: textColumns,
          columnGap: '1.5rem',
          columnFill: 'balance',
        } : {}),
      }}>
        <div
          ref={contentRef}
          contentEditable={!!onUpdate && !isPrint}
          suppressContentEditableWarning
          data-placeholder="No content yet. Click to edit..."
          onFocus={() => { editingContent.current = true; }}
          onBlur={!!onUpdate && !isPrint ? (e) => {
            editingContent.current = false;
            const html = e.target.innerHTML;
            const cleaned = html === '<br>' || html === '<br/>' ? '' : html;
            if (cleaned !== (section.content || '')) onUpdate(section.id, { content: cleaned });
          } : undefined}
        />
      </div>
    );

    const imageWidth = section.image_width || 50;
    const chartWidth = section.chart_width || 100;
    const showImageSlider = onUpdate && ['image_left', 'image_right', 'image_full', 'image_wrap'].includes(section.layout);
    const imageBlock = hasImage ? (
      <DraggableImageBlock section={section} onUpdate={onUpdate}>
      <div className="relative group">
        {onUpdate && !isPrint && (
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(section.id, hasCollage ? { collage_photos: [], collage_layout: 'grid' } : { image_url: null }); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="no-print absolute top-1 right-1 z-30 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {hasCollage ? (
          <div style={{ padding: '6px', backgroundColor: `${pc}08`, borderRadius: '0.75rem', border: `1px solid ${pc}25`, boxShadow: `0 10px 28px ${pc}35, 0 4px 10px ${ac}20` }} className="overflow-hidden">
            <div style={{ border: `2px solid ${pc}`, borderRadius: '0.5rem', outline: `1px solid ${ac}40`, outlineOffset: '2px', overflow: 'hidden' }}>
              <CollageRenderer photos={section.collage_photos} layout={section.collage_layout || 'grid'} isPrint={isPrint} />
            </div>
          </div>
        ) : (
          <div ref={imageRef} className="relative" style={{ padding: '6px', backgroundColor: `${pc}08`, borderRadius: '0.75rem', ...(section.image_frame !== false ? { border: `1px solid ${pc}25` } : {}) }}>
            {onUpdate && !isPrint && (
              <div
                className={`no-print absolute -top-7 left-1/2 -translate-x-1/2 w-7 h-7 bg-blue-500 border-2 border-white rounded-full cursor-grab shadow-lg flex items-center justify-center transition-opacity z-30 ${rotating ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                onPointerDown={startRotate}
                title="Click and drag to rotate"
              >
                <RotateCw className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <img src={section.image_url} alt={section.image_caption || section.title} className="w-full rounded-lg object-contain" style={{ ...(section.image_frame !== false ? { border: `2px solid ${pc}`, outline: `1px solid ${ac}40`, outlineOffset: '2px' } : {}), ...(section.image_shadow !== false ? { boxShadow: `0 10px 28px ${pc}35, 0 4px 10px ${ac}20` } : {}), transform: `rotate(${section.image_rotation || 0}deg)`, opacity: section.image_opacity != null ? section.image_opacity / 100 : 1, filter: getFilterCss(section.image_filter) }} />
          </div>
        )}
        {section.image_caption && <p className="text-xs text-muted-foreground text-center mt-1 italic">{section.image_caption}</p>}
        {showImageSlider && (
          <div className="no-print absolute bottom-0 left-0 right-0 bg-black/55 rounded-b-lg px-2 py-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-white shrink-0">Width</span>
            <input type="range" min="10" max="100" value={imageWidth} onChange={e => onUpdate(section.id, { image_width: parseInt(e.target.value) })} className="flex-1 h-1 accent-white" />
            <span className="text-[10px] text-white w-9 text-right tabular-nums">{imageWidth}%</span>
          </div>
        )}
      </div>
      </DraggableImageBlock>
    ) : null;

    const showChartSlider = onUpdate;
    const dataBlock = sectionData.length > 0 ? (
      <div className="space-y-4">
        {sectionData.map(d => {
          const chartConfig = d.chart_config ? (typeof d.chart_config === 'string' ? JSON.parse(d.chart_config) : d.chart_config) : null;
          return (
            <div key={d.id} className="relative group border-2 rounded-lg p-4" style={{ borderColor: `${pc}30`, backgroundColor: `${pc}06`, boxShadow: `0 2px 8px ${pc}10` }}>
              {chartConfig && <ChartRenderer chartConfig={chartConfig} isPrint={isPrint} />}
              {d.ai_narrative && <p className="text-sm text-slate-700 mt-2">{d.ai_narrative}</p>}
              {showChartSlider && (
                <div className="no-print absolute bottom-0 left-0 right-0 bg-black/55 rounded-b-lg px-2 py-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white shrink-0">Width</span>
                  <input type="range" min="20" max="100" value={chartWidth} onChange={e => onUpdate(section.id, { chart_width: parseInt(e.target.value) })} className="flex-1 h-1 accent-white" />
                  <span className="text-[10px] text-white w-9 text-right tabular-nums">{chartWidth}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : null;

    // Chart is always draggable via a drag handle bar; chart_position controls left/right/full
    const chartPos = section.chart_position || 'full';
    const draggableChartBlock = dataBlock ? (
      <DraggableImageBlock section={section} onUpdate={onUpdate}
        positionField="chart_position" widthField="chart_width"
        positionMap={{ left: 'left', right: 'right', full: 'full' }}
        defaultWidth={100}
        dragHandle>
        {dataBlock}
      </DraggableImageBlock>
    ) : null;

    const floatedChart = draggableChartBlock && (chartPos === 'left' || chartPos === 'right') ? (
      <div style={{ float: chartPos, width: `${chartWidth}%` }} className={chartPos === 'left' ? 'mr-5 mb-3' : 'ml-5 mb-3'}>
        {draggableChartBlock}
      </div>
    ) : null;
    const belowChart = draggableChartBlock && !floatedChart ? (
      <div className="mt-4">{draggableChartBlock}</div>
    ) : null;

    switch (section.layout) {
      case 'image_left':
        return (
          <div className="relative" data-section-content style={{ display: 'flow-root' }}>
            {imageBlock && <div style={{ float: 'left', width: `${imageWidth}%` }} className="mr-5 mb-3">{imageBlock}</div>}
            {floatedChart}
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {belowChart}
          </div>
        );
      case 'image_wrap':
        return (
          <div className="relative" data-section-content style={{ display: 'flow-root' }}>
            {imageBlock && <div style={{ float: 'left', width: `${imageWidth}%` }} className="mr-5 mb-3">{imageBlock}</div>}
            {floatedChart}
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {belowChart}
          </div>
        );
      case 'image_right':
        return (
          <div className="relative" data-section-content style={{ display: 'flow-root' }}>
            {imageBlock && <div style={{ float: 'right', width: `${imageWidth}%` }} className="ml-5 mb-3">{imageBlock}</div>}
            {floatedChart}
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {belowChart}
          </div>
        );
      case 'image_full':
        return (
          <div className="relative" data-section-content>
            {imageBlock && <div className="mx-auto mb-4" style={{ width: `${imageWidth}%` }}>{imageBlock}</div>}
            {floatedChart}
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {belowChart}
          </div>
        );
      case 'two_column':
        return (
          <div className="relative" data-section-content>
            {imageBlock && <div className="mb-4">{imageBlock}</div>}
            {floatedChart}
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {belowChart}
          </div>
        );
      default:
        return (
          <div className="relative" data-section-content>
            {floatedChart}
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {belowChart}
          </div>
        );
    }
  };

  return (
    <div className="mb-8 print:mb-8" style={{ borderLeft: `3px solid ${pc}40`, paddingLeft: '0.75rem' }}>
      {isCollapsible ? (
        <>
          {headerContent}
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity">
            <div className="flex-1"><TitleBar /></div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                {renderContent()}
                {footerContent}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          {headerContent}
          <div className="print:block">
            <TitleBar />
          </div>
          {renderContent()}
          {footerContent}
        </>
      )}
    </div>
  );
}