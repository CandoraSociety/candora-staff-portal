import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ChartRenderer from './ChartRenderer';

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
  showHeaderAll, showFooterAll, showPageNumbersAll, forceCollapsible
}) {
  const [expanded, setExpanded] = useState(section.is_expanded_default !== false);

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
            className="font-heading font-bold leading-tight"
            style={{
              color: titleColor,
              fontSize: `${titleSize}px`,
              fontFamily: ts.font_family || undefined,
              fontWeight: ts.bold !== false ? 'bold' : 'normal',
              fontStyle: ts.italic ? 'italic' : 'normal',
              textDecoration: ts.underline ? 'underline' : 'none',
            }}
          >
            {section.title}
          </h3>
          {titleImage && (
            <img src={titleImage} alt="" className="shrink-0 object-contain rounded ml-auto" style={{ maxHeight: section.title_image_width ? `${section.title_image_width}px` : `${Math.max(titleSize + 8, 36)}px`, maxWidth: section.title_image_width ? `${section.title_image_width}px` : '120px' }} />
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
        {section.content ? (
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        ) : <p className="text-muted-foreground italic">No content yet.</p>}
      </div>
    );

    const hasImage = section.image_url && section.layout !== 'text_only';
    const imageBlock = hasImage ? (
      <div className={section.layout === 'image_full' ? 'my-4' : ''}>
        <img src={section.image_url} alt={section.image_caption || section.title} className="w-full rounded-lg object-cover" style={{ maxHeight: isPrint ? '200px' : '300px' }} />
        {section.image_caption && <p className="text-xs text-muted-foreground text-center mt-1 italic">{section.image_caption}</p>}
      </div>
    ) : null;

    const dataBlock = sectionData.length > 0 ? (
      <div className="space-y-4">
        {sectionData.map(d => {
          const chartConfig = d.chart_config ? (typeof d.chart_config === 'string' ? JSON.parse(d.chart_config) : d.chart_config) : null;
          return (
            <div key={d.id} className="border rounded-lg p-4" style={{ borderColor: `${ac}30`, backgroundColor: `${ac}05` }}>
              {chartConfig && <ChartRenderer chartConfig={chartConfig} isPrint={isPrint} />}
              {d.ai_narrative && <p className="text-sm text-slate-700 mt-2">{d.ai_narrative}</p>}
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
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/5 shrink-0 space-y-4">{imageBlock}{dataBlock}</div>
            <div className="flex-1">{contentBlock}</div>
          </div>
        );
      case 'image_right':
        return (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">{contentBlock}</div>
            <div className="md:w-2/5 shrink-0 space-y-4">{imageBlock}{dataBlock}</div>
          </div>
        );
      case 'image_full':
        return <div>{imageBlock}{contentBlock}{dataBlock}</div>;
      case 'two_column':
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div>{contentBlock}</div><div className="space-y-4">{imageBlock}{dataBlock}</div></div>;
      default:
        return <div>{imageBlock}{contentBlock}{dataBlock}</div>;
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