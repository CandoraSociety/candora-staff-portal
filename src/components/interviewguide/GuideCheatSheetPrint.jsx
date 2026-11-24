import React from 'react';
import EmphasisText from './EmphasisText';

// The cheat sheet as it prints: one letter page, two columns, nothing to expand.
// Hidden on screen - the quick reference tab's "Print this sheet" button prints
// this instead of the app.
export default function GuideCheatSheetPrint({ guide, questions }) {
  if (!guide) return null;
  const essentials = guide.quick_reference_info || [];

  return (
    <div className="hidden print:block bg-white text-[8pt] leading-[1.35] text-[#080c21]">
      <header className="flex items-start gap-3 border-b-2 border-[#fccf03] pb-2">
        <img
          src="https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png"
          alt="Candora Society"
          className="h-9 w-auto object-contain"
        />
        <div className="flex-1">
          <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-[#8a6d00]">
            Interview quick reference
          </p>
          <h1 className="font-display text-[13pt] font-bold leading-tight">{guide.title}</h1>
          <p className="text-[7.5pt] text-[#626784]">
            {[guide.show_name, guide.interviewer, guide.spokesperson].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {questions.map((question, index) => (
          <article key={question.id} className="break-inside-avoid rounded border border-[#dadce7] p-1.5">
            <div className="flex items-start gap-1.5">
              <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded bg-[#fccf03] font-display text-[6.5pt] font-extrabold text-[#0a0f29]">
                {index + 1}
              </span>
              <p className="font-semibold leading-[1.3]">{question.question}</p>
            </div>

            {question.key_message && (
              <div className="mt-1 border-l-[2px] border-[#fccf03] bg-[#f6f7fb] px-1.5 py-1">
                <p className="text-[6.5pt] font-bold uppercase tracking-[0.12em] text-[#8a6d00]">Key message</p>
                {String(question.key_message).split(/\n{2,}/).filter(Boolean).map((paragraph, i) => (
                  <p key={i} className="mt-0.5 leading-[1.3]"><EmphasisText text={paragraph} /></p>
                ))}
              </div>
            )}

            {(question.quick_points || []).length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {(question.quick_points || []).map((point, pointIndex) => (
                  <li key={pointIndex} className="flex gap-1 leading-[1.3] text-[#3b4265]">
                    <span className="mt-[0.5em] h-[3px] w-[3px] flex-shrink-0 rounded-full bg-[#fccf03]" />
                    <EmphasisText text={point} className="min-w-0" />
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {essentials.length > 0 && (
        <div className="mt-2 break-inside-avoid rounded border-l-[3px] border-[#fccf03] bg-[#fffbea] px-2 py-1.5">
          <p className="text-[6.5pt] font-bold uppercase tracking-[0.12em] text-[#8a6d00]">
            Essential donation information
          </p>
          <div className="mt-0.5 grid grid-cols-2 gap-x-4">
            {essentials.map((row) => (
              <p key={row.label} className="leading-[1.35]">
                <span className="font-semibold">{row.label}: </span>
                <span className="text-[#3b4265]">{row.value}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-1.5 text-[6.5pt] text-[#626784]">
        Candora Society of Edmonton · These are talking points, not a script to be memorized.
      </footer>
    </div>
  );
}