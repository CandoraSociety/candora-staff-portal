import React from 'react';
import { Play, Pause, Printer } from 'lucide-react';
import EmphasisText from './EmphasisText';

// The second tab of the guide: a one-page cheat sheet Dawn can scan in seconds
// right before - or during - the interview. Each question keeps its heading and
// key message, with two or three short bullets underneath, and the practical
// donation details appear once at the bottom. Nothing expands, nothing repeats.
export default function GuideReferenceTab({
  guide, questions, dark, item, playing, onListen, onPlaySection, onPrint,
}) {
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const text = dark ? 'text-[#eef1ff]' : 'text-[#080c21]';
  const card = dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]';
  const tile = dark ? 'bg-[#0e1734] border-[#26305a]' : 'bg-white border-[#e8ebf3]';
  const keyPanel = dark ? 'bg-[#111a3d]' : 'bg-[#f6f7fb]';
  const softBtn = dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]';

  const segments = guide?.quick_reference_segments || [];
  const hasAudio = segments.some((segment) => segment.audio_url);
  const essentials = guide?.quick_reference_info || [];
  const listening = item?.section === 'quick';

  return (
    <section className={`rounded-xl border p-3 sm:p-4 ${card}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className={`font-display text-base font-bold ${text}`}>Interview quick reference</h2>
          <p className={`text-[11px] ${muted}`}>
            The essentials for each question. Scan in seconds, read in about two minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 print:hidden">
          {hasAudio && (
            <button
              type="button"
              onClick={onListen}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${
                listening ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              {listening && playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {listening && playing ? 'Playing' : 'Listen'}
            </button>
          )}
          <button
            type="button"
            onClick={onPrint}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium ${softBtn}`}
          >
            <Printer className="w-3 h-3" /> Print this sheet
          </button>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
        {questions.map((question, index) => {
          const active = listening && item?.categoryIndex === index;
          const hasSectionAudio = segments.some(
            (segment) => segment.audio_url && segment.category_index === index
          );

          return (
            <article
              key={question.id}
              id={`guide-sheet-${question.id}`}
              className={`rounded-lg border p-2.5 ${tile} ${active ? 'ring-2 ring-[#fccf03]' : ''}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-[#fccf03] font-display text-[9px] font-extrabold text-[#0a0f29]">
                  {index + 1}
                </span>
                <p className={`flex-1 text-[12px] font-semibold leading-snug ${text}`}>{question.question}</p>
                {hasSectionAudio && (
                  <button
                    type="button"
                    onClick={() => onPlaySection(index)}
                    aria-label={`Listen to this question`}
                    className={`flex-shrink-0 rounded-full border p-1 print:hidden ${
                      active ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
                    }`}
                  >
                    <Play className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {question.key_message && (
                <div className={`mt-1.5 rounded border-l-[3px] border-[#fccf03] px-2 py-1.5 ${keyPanel}`}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b38b00]">Key message</p>
                  {String(question.key_message).split(/\n{2,}/).filter(Boolean).map((paragraph, i) => (
                    <p key={i} className="mt-0.5 text-[12px] leading-[1.45]">
                      <EmphasisText text={paragraph} />
                    </p>
                  ))}
                </div>
              )}

              {(question.quick_points || []).length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {(question.quick_points || []).map((point, pointIndex) => (
                    <li key={pointIndex} className={`flex gap-1.5 text-[12px] leading-[1.4] ${muted}`}>
                      <span className="mt-[0.55em] h-1 w-1 flex-shrink-0 rounded-full bg-[#fccf03]" />
                      <EmphasisText text={point} className="min-w-0" />
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      {essentials.length > 0 && (
        <div className={`mt-2.5 rounded-lg border-l-4 border-[#fccf03] px-3 py-2 ${dark ? 'bg-[#0e1734]' : 'bg-[#fffbea]'}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b38b00]">
            Essential donation information
          </p>
          <div className="mt-1 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
            {essentials.map((row) => (
              <p key={row.label} className="text-[12px] leading-[1.4]">
                <span className={`font-semibold ${text}`}>{row.label}: </span>
                {row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline decoration-[#fccf03] decoration-2 underline-offset-2"
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className={muted}>{row.value}</span>
                )}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}