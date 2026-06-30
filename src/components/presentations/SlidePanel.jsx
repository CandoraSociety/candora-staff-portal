import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { LAYOUT_LABELS, newSlide } from './presentationConstants';
import { cn } from '@/lib/utils';

const LAYOUT_OPTIONS = Object.entries(LAYOUT_LABELS);

export default function SlidePanel({ slides, selectedIndex, onSelect, onAdd, onDelete, onMoveUp, onMoveDown, onDuplicate }) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Slides ({slides.length})</div>
        <div className="flex flex-wrap gap-1">
          {LAYOUT_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onAdd(key)}
              title={label}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSelect(index)}
            className={cn(
              'group relative rounded-lg border-2 cursor-pointer p-2 transition-all',
              index === selectedIndex
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 bg-background'
            )}
          >
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{LAYOUT_LABELS[slide.layout]}</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {slide.title || 'Untitled slide'}
                </p>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
                disabled={index === 0}
                className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
                disabled={index === slides.length - 1}
                className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(index); }}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(index); }}
                  className="p-1 rounded hover:bg-destructive/10 text-destructive ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}