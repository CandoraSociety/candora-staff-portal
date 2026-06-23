import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import CollageRenderer from './CollageRenderer';
import DraggableImageBlock from './DraggableImageBlock';

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
  }, [section.content]);

  useEffect(() => {
    if (titleRef.current && !editingTitle.current) {
      const newTitle = section.title || '';
      if (titleRef.current.textContent !== newTitle) {
        titleRef.current.textContent = newTitle;
      }
    }
  }, [section.title]);

  const pc = branding?.primary_color || '#1a2744';
  const ac = branding?.accent_color || '#2b2de8';

  const sectionData = dataEntries?.filter(d => d.section_id === section.id) || [];
  const showHeader = showHeaderAll && !section.hide_header;
  const showFooter = showFooterAll && !section.hide_footer;
  const showPageNum = showPageNumbersAll;
  const isCollapsible = (section.is_collapsible || forceCollapsible) && !isPrint;

  // ── Zone-based header/footer builder ─────────────────────────────
  const ZoneSlots = ({
    text, image, imageHeight, showPN, pageNum,
    zones: zonesRaw, layout, fontSize
  }) => {
    const zones = parseZones(zonesRaw);
    if (!zones.length) return null;
    const hasAny = zones.some(z => {
      if (z.content === 'text' && text) return true;
      if (z.content === 'image' && image) return true;
      if (z.content === 'page_number' && showPN && pageNum) return true;
      return false;
    });
    if (!hasAny) return null;

    const renderSlot = (z) => {
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

  const footerContent = showFooter && (
    <div className="pt-2 mt-6" style={{ borderTop: `1px solid ${pc}20` }}>
      <ZoneSlots
        text={masterFooter}
        image={footerImage}
        imageHeight={footerImageHeight}
        showPN={showPageNum && !showHeader}
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
      <div className="relative mb-5">
        <div
          className="h-1 w-full rounded-full mb-4"
          style={{ background: `linear-gradient(90deg, ${pc} 0%, ${ac}60 45%, transparent 100%)` }}
        />
        <div className="flex items-center gap-3">
          {sectionNumber != null && (
            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: pc, color: '#fff' }}>
              {sectionNumber}
            </div>
          )}
          <h3
            ref={titleRef}
            contentEditable={!!onUpdate && !isPrint}
            suppressContentEditableWarning
            onMouseDown={!!onUpdate && !isPrint ? (e) => e.stopPropagation() : undefined}
            onClick={!!onUpdate && !isPrint ? (e) => e.stopPropagation() : undefined}
            onFocus={() => { editingTitle.current = true; }}
            onBlur={!!onUpdate && !isPrint ? (e) => {
              editingTitle.current = false;
              const newTitle = e.target.textContent.trim();
              if (newTitle !== section.title) onUpdate(section.id, { title: newTitle });
            } : undefined}
            className="font-heading font-bold leading-tight rounded px-1 -mx-1 focus:outline-none focus:bg-accent/5"
            style={{
              color: titleColor,
              fontSize: `${titleSize}px`,
              fontFamily: ts.font_family || undefined,
              fontWeight: ts.bold !== false ? 'bold' : 'normal',
              fontStyle: ts.italic ? 'italic' : 'normal',
              textDecoration: ts.underline ? 'underline' : 'none',
            }}
          />
          {titleImage && (
            <div className="relative group/title shrink-0 ml-auto">
              <img src={titleImage} alt="" className="object-contain rounded" style={{ maxHeight: section.title_image_width ? `${section.title_image_width}px` : `${Math.max(titleSize + 8, 36)}px`, maxWidth: section.title_image_width ? `${section.title_image_width}px` : '120px' }} />
              {onUpdate && (
                <div className="no-print absolute bottom-0 left-0 right-0 bg-black/55 rounded-b-lg px-2 py-1 flex items-center gap-1.5 opacity-0 group-hover/title:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white shrink-0">Size</span>
                  <input type="range" min="24" max="200" value={section.title_image_width || 80} onChange={e => onUpdate(section.id, { title_image_width: parseInt(e.target.value) })} className="flex-1 h-1 accent-white" />
                  <span className="text-[10px] text-white w-10 text-right tabular-nums">{section.title_image_width || 80}px</span>
                </div>
              )}
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
    const contentBlock = (
      <div className="prose prose-sm max-w-none" style={{
        fontFamily: masterContent.font_family || undefined,
        fontSize: masterContent.font_size ? `${masterContent.font_size}px` : undefined,
        color: masterContent.color || undefined,
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

    const hasCollage = (section.collage_photos || []).length >= 2 && section.layout !== 'text_only';
    const hasImage = (hasCollage || section.image_url) && section.layout !== 'text_only';
    const imageWidth = section.image_width || 50;
    const chartWidth = section.chart_width || 100;
    const showImageSlider = onUpdate && ['image_left', 'image_right', 'image_full'].includes(section.layout);
    const imageBlock = hasImage ? (
      <DraggableImageBlock section={section} onUpdate={onUpdate}>
      <div className="relative group">
        {hasCollage ? (
          <div style={{ border: `3px solid ${pc}`, borderRadius: '0.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }} className="overflow-hidden">
            <CollageRenderer photos={section.collage_photos} layout={section.collage_layout || 'grid'} isPrint={isPrint} />
          </div>
        ) : (
          <img src={section.image_url} alt={section.image_caption || section.title} className="w-full rounded-lg object-contain" style={{ border: `3px solid ${pc}`, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }} />
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
      <div className="space-y-4" style={{ width: chartWidth < 100 ? `${chartWidth}%` : '100%', margin: chartWidth < 100 ? '0 auto' : undefined }}>
        {sectionData.map(d => {
          const chartConfig = d.chart_config ? (typeof d.chart_config === 'string' ? JSON.parse(d.chart_config) : d.chart_config) : null;
          return (
            <div key={d.id} className="relative group border rounded-lg p-4" style={{ borderColor: `${ac}30`, backgroundColor: `${ac}05` }}>
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

    const hasChart = dataBlock !== null;
    const hasVisual = hasImage || hasChart;

    // Smart layout: when there are charts but no image in text_only, use a responsive grid
    if (section.layout === 'text_only' && hasChart && !hasImage) {
      return (
        <div className="grid md:grid-cols-5 gap-6 items-start">
          <div className="md:col-span-3">{contentBlock}</div>
          <div className="md:col-span-2">{dataBlock}</div>
        </div>
      );
    }

    switch (section.layout) {
      case 'image_left':
        return (
          <div className="overflow-hidden relative" data-section-content>
            <div style={{ float: 'left', width: `${imageWidth}%` }} className="mr-5 mb-3">{imageBlock}</div>
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {dataBlock}
          </div>
        );
      case 'image_right':
        return (
          <div className="overflow-hidden relative" data-section-content>
            <div style={{ float: 'right', width: `${imageWidth}%` }} className="ml-5 mb-3">{imageBlock}</div>
            {contentBlock}
            <div style={{ clear: 'both' }} />
            {dataBlock}
          </div>
        );
      case 'image_full':
        return <div className="relative" data-section-content><div className="mx-auto" style={{ width: `${imageWidth}%` }}>{imageBlock}</div>{contentBlock}{dataBlock}</div>;
      case 'two_column':
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative" data-section-content><div>{contentBlock}</div><div className="space-y-4">{imageBlock}{dataBlock}</div></div>;
      default:
        return <div className="relative" data-section-content>{imageBlock}{contentBlock}{dataBlock}</div>;
    }
  };

  return (
    <div className={isPrint ? 'mb-8' : 'mb-6'}>
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
          <TitleBar />
          {renderContent()}
          {footerContent}
        </>
      )}
    </div>
  );
}