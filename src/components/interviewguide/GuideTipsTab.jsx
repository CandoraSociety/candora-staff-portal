import React, { useEffect, useState } from 'react';
import { Play, Pause, ChevronDown, CheckCircle2, Headphones, Lightbulb, Quote } from 'lucide-react';
import EmphasisText from './EmphasisText';
import { INTERVIEW_TIPS, TIPS_INTRO } from '@/lib/interviewTips';

// The coaching tab: the same general media interview tips for every guide, laid
// out as numbered sections that open one at a time, with the examples and the
// pre-interview checklist called out. Nothing here is interview-specific, so a
// new guide inherits all of it.
export default function GuideTipsTab({ guide, dark, item, playing, segments = [], onListenAll, onPlaySection }) {
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const text = dark ? 'text-[#eef1ff]' : 'text-[#080c21]';
  const body = dark ? 'text-[#dfe4f7]' : 'text-[#1a2140]';
  const card = dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]';
  const tile = dark ? 'bg-[#0e1734] border-[#26305a]' : 'bg-white border-[#e8ebf3]';
  const softBtn = dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]';
  const example = dark ? 'bg-[#0b1330] border-[#26305a]' : 'bg-[#fffbea] border-[#f0e0a8]';
  const phraseBox = dark ? 'bg-[#141e44] border-[#26305a]' : 'bg-[#f6f7fb] border-[#e8ebf3]';

  const [open, setOpen] = useState([INTERVIEW_TIPS[0].id]);
  const storageKey = `guide-tips-checklist-${guide?.token || 'guide'}`;
  const [done, setDone] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) setDone(saved);
    } catch (error) {
      setDone([]);
    }
  }, [storageKey]);

  const toggleDone = (index) => {
    const next = done.includes(index) ? done.filter((value) => value !== index) : [...done, index];
    setDone(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      /* a private window simply forgets the ticks */
    }
  };

  const toggleSection = (id) =>
    setOpen((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  const listening = item?.section === 'tips';
  const hasAudio = segments.some((segment) => segment.audio_url);

  const renderBlock = (block, key) => {
    if (block.kind === 'paragraph') {
      return (
        <p key={key} className={`mt-1.5 text-[13.5px] leading-[1.6] ${body}`}>
          <EmphasisText text={block.text} />
        </p>
      );
    }

    if (block.kind === 'bullets') {
      return (
        <ul key={key} className="mt-1.5 space-y-1">
          {block.items.map((line, index) => (
            <li key={index} className={`flex gap-2 text-[13.5px] leading-[1.55] ${body}`}>
              <span className="mt-[0.6em] h-1 w-1 flex-shrink-0 rounded-full bg-[#fccf03]" />
              <EmphasisText text={line} className="min-w-0" />
            </li>
          ))}
        </ul>
      );
    }

    if (block.kind === 'note') {
      return (
        <div key={key} className={`mt-2 rounded-lg border-l-[3px] border-[#fccf03] px-3 py-2 ${example}`}>
          <p className={`flex gap-2 text-[13px] leading-[1.55] ${body}`}>
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#b38b00]" />
            <EmphasisText text={block.text} className="min-w-0" />
          </p>
        </div>
      );
    }

    if (block.kind === 'example') {
      return (
        <div key={key} className={`mt-2 rounded-lg border px-3 py-2 ${example}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b38b00]">Example</p>
          <p className={`mt-0.5 text-[12px] font-semibold ${text}`}>{block.title}</p>
          <ul className="mt-1 space-y-0.5">
            {(block.items || []).map((line, index) => (
              <li key={index} className={`flex gap-2 text-[13px] leading-[1.5] ${body}`}>
                <span className="mt-[0.6em] h-1 w-1 flex-shrink-0 rounded-full bg-[#b38b00]" />
                <EmphasisText text={line} className="min-w-0" />
              </li>
            ))}
          </ul>
          {block.note && <p className={`mt-1.5 text-[12px] italic leading-[1.5] ${muted}`}>{block.note}</p>}
        </div>
      );
    }

    if (block.kind === 'phrases') {
      return (
        <div key={key} className={`mt-2 rounded-lg border px-3 py-2 ${phraseBox}`}>
          <p className={`flex items-center gap-1.5 text-[12px] font-semibold ${text}`}>
            <Quote className="h-3 w-3 text-[#b38b00]" /> {block.title}
          </p>
          <ul className="mt-1 space-y-0.5">
            {(block.items || []).map((line, index) => (
              <li key={index} className={`text-[13px] leading-[1.5] ${body}`}>{line}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (block.kind === 'checklist') {
      const ready = done.filter((index) => index < block.items.length).length;
      return (
        <div key={key} className="mt-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-[12px] font-semibold ${text}`}>
              {ready} of {block.items.length} ready
            </p>
            <div className={`h-1.5 w-24 overflow-hidden rounded-full ${dark ? 'bg-[#26305a]' : 'bg-[#e8ebf3]'}`}>
              <div
                className="h-full rounded-full bg-[#fccf03] transition-all"
                style={{ width: `${(ready / block.items.length) * 100}%` }}
              />
            </div>
          </div>
          <ul className="mt-1.5 space-y-1">
            {block.items.map((line, index) => {
              const ticked = done.includes(index);
              return (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => toggleDone(index)}
                    className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[13px] leading-[1.45] transition-colors ${
                      ticked
                        ? dark
                          ? 'border-[#fccf03]/50 bg-[#fccf03]/10'
                          : 'border-[#f0e0a8] bg-[#fffbea]'
                        : tile
                    }`}
                  >
                    <span
                      className={`mt-[1px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                        ticked ? 'border-[#fccf03] bg-[#fccf03] text-[#0a0f29]' : dark ? 'border-[#3a4574]' : 'border-[#c9cede]'
                      }`}
                    >
                      {ticked && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                    <span className={`min-w-0 ${ticked ? muted : body}`}>{line}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <section className={`rounded-xl border p-3 sm:p-4 ${card}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className={`font-display text-base font-bold ${text}`}>Media interview tips</h2>
          <p className={`mt-0.5 text-[11.5px] leading-[1.5] ${muted}`}>{TIPS_INTRO}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {hasAudio && (
            <button
              type="button"
              onClick={onListenAll}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${
                listening ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              {listening && playing ? <Pause className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
              {listening && playing ? 'Playing' : 'Listen to all tips'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(open.length === INTERVIEW_TIPS.length ? [] : INTERVIEW_TIPS.map((s) => s.id))}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${softBtn}`}
          >
            {open.length === INTERVIEW_TIPS.length ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {!hasAudio && (
        <p className={`mt-2 rounded-lg border border-dashed px-3 py-2 text-[11.5px] ${dark ? 'border-[#26305a] text-[#a9b0cd]' : 'border-[#dadce7] text-[#626784]'}`}>
          Narration for these tips hasn’t been recorded yet. Everything below can still be read and printed.
        </p>
      )}

      <div className="mt-2.5 space-y-2">
        {INTERVIEW_TIPS.map((section, index) => {
          const isOpen = open.includes(section.id);
          const active = listening && item?.categoryIndex === index;
          const sectionHasAudio = segments.some(
            (segment) => segment.audio_url && segment.category_index === index
          );

          return (
            <article
              key={section.id}
              id={`guide-tip-${section.id}`}
              className={`rounded-lg border ${tile} ${active ? 'ring-2 ring-[#fccf03]' : ''}`}
            >
              <div className="flex items-start gap-2 p-2.5">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#fccf03] font-display text-[10px] font-extrabold text-[#0a0f29]">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex flex-1 items-center justify-between gap-2 text-left"
                >
                  <span className={`text-[13.5px] font-semibold leading-snug ${text}`}>{section.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 transition-transform ${muted} ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {sectionHasAudio && (
                  <button
                    type="button"
                    onClick={() => onPlaySection(index)}
                    aria-label={`Listen to ${section.title}`}
                    className={`flex-shrink-0 rounded-full border p-1 ${
                      active ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
                    }`}
                  >
                    <Play className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="px-3 pb-3">
                  {section.blocks.map((block, blockIndex) => renderBlock(block, `${section.id}-${blockIndex}`))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className={`mt-3 text-center text-[11.5px] ${muted}`}>
        These are coaching notes, not a script. Speak in your own words.
      </p>
    </section>
  );
}