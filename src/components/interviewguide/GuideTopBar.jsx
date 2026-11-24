import React from 'react';
import { Play, Sun, Moon, Type, ListChecks, X, Printer } from 'lucide-react';

// Sticky top bar: brand, what this guide is, the tab switch and the reading controls.
export default function GuideTopBar({
  guide, dark, onToggleDark, onScale, scale, practice, onTogglePractice, onListenAll, hasAudio,
  view, onChangeView,
}) {
  const surface = dark ? 'bg-[#0a0f29] border-[#26305a] text-[#eef1ff]' : 'bg-white border-[#dadce7] text-[#080c21]';
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const btn = dark ? 'border-[#26305a] hover:bg-[#1b2550]' : 'border-[#dadce7] hover:bg-[#f0f2f8]';

  return (
    <header className={`sticky top-0 z-30 border-b ${surface}`}>
      <div className="max-w-3xl mx-auto px-4 py-3 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-[#fccf03] flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                src="https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png"
                alt="Candora Society"
                className="w-7 h-7 object-contain"
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b38b00]">Candora Society</p>
              <h1 className="g-small font-display font-bold leading-tight truncate">{guide.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button type="button" aria-label="Smaller text" onClick={() => onScale(-1)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${btn}`}>
              <Type className="w-3.5 h-3.5" />
            </button>
            <button type="button" aria-label="Larger text" onClick={() => onScale(1)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${btn}`}>
              A+
            </button>
            <button type="button" aria-label="Switch reading mode" onClick={onToggleDark}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center ${btn}`}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${muted}`}>
          {guide.show_name && <span className="font-medium">{guide.show_name}</span>}
          {guide.outlet && <span>{guide.outlet}</span>}
          {guide.interview_date && <span>{new Date(guide.interview_date).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}</span>}
          {guide.spokesperson && <span>For {guide.spokesperson}</span>}
        </div>

        <div
          className={`flex gap-1 rounded-xl border p-1 print:hidden ${
            dark ? 'border-[#26305a] bg-[#0e1734]' : 'border-[#dadce7] bg-[#f6f7fb]'
          }`}
        >
          {[
            { key: 'guide', label: 'The guide' },
            { key: 'reference', label: 'Quick reference & key points' },
            { key: 'tips', label: 'Interview tips' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeView(tab.key)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold leading-tight transition-colors sm:px-3 sm:text-sm ${
                view === tab.key
                  ? 'bg-[#fccf03] text-[#0a0f29]'
                  : dark ? 'text-[#a9b0cd] hover:text-[#eef1ff]' : 'text-[#626784] hover:text-[#080c21]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={onListenAll}
            disabled={!hasAudio}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0f29] text-white px-3.5 py-1.5 text-sm font-semibold disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5" /> Listen to the whole guide
          </button>
          <button
            type="button"
            onClick={onTogglePractice}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium ${btn} ${
              practice ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : ''
            }`}
          >
            {practice ? <X className="w-3.5 h-3.5" /> : <ListChecks className="w-3.5 h-3.5" />}
            {practice ? 'Exit practice mode' : 'Practise'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium ${btn}`}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <span className={`text-xs ${muted}`}>Text size {Math.round(scale * 100)}%</span>
        </div>
      </div>
    </header>
  );
}