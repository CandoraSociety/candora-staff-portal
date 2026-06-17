import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
import ChartRenderer from './ChartRenderer';

export default function SectionRenderer({ section, dataEntries, isPrint, pageNumber, masterHeader, masterFooter, showHeaderAll, showFooterAll, showPageNumbersAll }) {
  const [expanded, setExpanded] = useState(section.is_expanded_default !== false);

  const sectionData = dataEntries?.filter(d => d.section_id === section.id) || [];
  const showHeader = showHeaderAll && !section.hide_header;
  const showFooter = showFooterAll && !section.hide_footer;
  const showPageNum = showPageNumbersAll;

  const headerContent = (
    <div className="text-xs text-muted-foreground border-b pb-2 mb-4">
      {showHeader && masterHeader && <span>{masterHeader}</span>}
      {showPageNum && pageNumber && <span className="float-right">{pageNumber}</span>}
    </div>
  );

  const footerContent = (
    <div className="text-xs text-muted-foreground border-t pt-2 mt-6">
      {showFooter && masterFooter && <span>{masterFooter}</span>}
      {showPageNum && !showHeader && pageNumber && <span className="float-right">{pageNumber}</span>}
    </div>
  );

  const hasImage = section.image_url && section.layout !== 'text_only';
  const isCollapsible = section.is_collapsible && !isPrint;

  const renderContent = () => {
    const contentBlock = (
      <div className="prose prose-sm max-w-none">
        {section.content ? <ReactMarkdown>{section.content}</ReactMarkdown> : <p className="text-muted-foreground italic">No content yet.</p>}
      </div>
    );

    const imageBlock = hasImage ? (
      <div className={section.layout === 'image_full' ? 'my-4' : ''}>
        <img src={section.image_url} alt={section.image_caption || section.title} className="w-full rounded-lg object-cover" style={{ maxHeight: isPrint ? '200px' : '300px' }} />
        {section.image_caption && <p className="text-xs text-muted-foreground text-center mt-1 italic">{section.image_caption}</p>}
      </div>
    ) : null;

    const dataBlock = sectionData.length > 0 ? (
      <div className="mt-4 space-y-4">
        {sectionData.map(d => {
          const chartConfig = d.chart_config ? (typeof d.chart_config === 'string' ? JSON.parse(d.chart_config) : d.chart_config) : null;
          return (
            <div key={d.id} className="border rounded-lg p-4 bg-slate-50">
              {chartConfig && <ChartRenderer chartConfig={chartConfig} isPrint={isPrint} />}
              {d.ai_narrative && <p className="text-sm text-slate-700 mt-2">{d.ai_narrative}</p>}
            </div>
          );
        })}
      </div>
    ) : null;

    switch (section.layout) {
      case 'image_left':
        return (
          <div className="flex gap-4">
            <div className="w-1/3 shrink-0">{imageBlock}</div>
            <div className="flex-1">{contentBlock}{dataBlock}</div>
          </div>
        );
      case 'image_right':
        return (
          <div className="flex gap-4">
            <div className="flex-1">{contentBlock}{dataBlock}</div>
            <div className="w-1/3 shrink-0">{imageBlock}</div>
          </div>
        );
      case 'image_full':
        return <div>{imageBlock}{contentBlock}{dataBlock}</div>;
      case 'two_column':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div>{contentBlock}</div>
            <div>{imageBlock}{dataBlock}</div>
          </div>
        );
      default:
        return <div>{imageBlock}{contentBlock}{dataBlock}</div>;
    }
  };

  return (
    <div className={isPrint ? 'mb-8' : 'mb-6'}>
      {isCollapsible ? (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 w-full text-left mb-3 hover:opacity-80 transition-opacity"
          >
            <h3 className="text-lg font-heading font-bold text-accent">{section.title}</h3>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                {headerContent}
                {renderContent()}
                {footerContent}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          <h3 className="text-lg font-heading font-bold text-accent mb-3">{section.title}</h3>
          {headerContent}
          {renderContent()}
          {footerContent}
        </>
      )}
    </div>
  );
}