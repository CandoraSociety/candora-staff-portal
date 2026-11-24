import React, { useState } from 'react';
import { Play, Pause, Eye, EyeOff, Check } from 'lucide-react';

const palette = (dark) => ({
  card: dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]',
  text: dark ? 'text-[#eef1ff]' : 'text-[#080c21]',
  muted: dark ? 'text-[#a9b0cd]' : 'text-[#626784]',
  soft: dark ? 'bg-[#0d1533]' : 'bg-[#f6f7fb]',
  rule: dark ? 'border-[#26305a]' : 'border-[#e8ebf3]',
});

export default function GuideQuestionCard({ question, number, dark, practice, active, playing, onListen }) {
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState({});
  const p = palette(dark);
  const points = question.talking_points || [];
  const checklist = question.checklist || [];
  const showAnswers = !practice || revealed;

  const toggleCheck = (item) => setChecked((c) => ({ ...c, [item]: !c[item] }));

  return (
    <article
      id={`question-${number}`}
      className={`rounded-2xl border p-5 sm:p-6 ${p.card} ${active ? 'ring-2 ring-[#fccf03]' : ''}`}
    >
      <div className="flex gap-3 sm:gap-4">
        <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#fccf03] text-[#0a0f29] font-display font-extrabold flex items-center justify-center">
          {number}
        </span>
        <h2 className={`g-h2 font-display font-bold leading-snug ${p.text}`}>{question.question}</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 print:hidden">
        {question.audio_url ? (
          <button
            type="button"
            onClick={onListen}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
              active
                ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]'
                : dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]'
            }`}
          >
            {active && playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {active && playing ? 'Playing this answer' : active ? 'Resume this answer' : 'Listen to this answer'}
          </button>
        ) : (
          <span className={`text-xs ${p.muted}`}>Narration for this answer has not been generated yet.</span>
        )}

        {practice && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border ${
              dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]'
            }`}
          >
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {revealed ? 'Hide talking points' : 'Reveal talking points'}
          </button>
        )}
      </div>

      {practice && !revealed && (
        <p className={`mt-4 text-sm rounded-xl px-4 py-3 ${p.soft} ${p.muted}`}>
          Answer out loud in your own words first. Reveal the talking points when you're ready to compare.
        </p>
      )}

      {showAnswers && (
        <div className="mt-5 space-y-5">
          {points.length > 0 && (
            <ul className="space-y-2.5">
              {points.map((point, i) => (
                <li key={i} className={`flex gap-2.5 ${p.text}`}>
                  <span className="mt-[0.55em] w-1.5 h-1.5 rounded-full bg-[#fccf03] flex-shrink-0" />
                  <div className="min-w-0">
                    <span>{point.text}</span>
                    {point.details?.length > 0 && (
                      <ul className={`mt-1.5 space-y-1.5 pl-3 border-l ${p.rule}`}>
                        {point.details.map((detail, j) => (
                          <li key={j} className={`flex gap-2 ${p.muted}`}>
                            <span className="mt-[0.6em] w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-60" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {question.key_message && (
            <div className={`rounded-xl border-l-4 border-[#fccf03] px-4 py-3 ${p.soft}`}>
              <p className="g-small font-semibold uppercase tracking-[0.14em] text-[#b38b00]">Key message</p>
              <p className={`mt-1 ${p.text}`}>{question.key_message}</p>
            </div>
          )}

          {practice && checklist.length > 0 && (
            <div className={`rounded-xl border p-4 ${p.rule}`}>
              <p className={`g-small font-semibold uppercase tracking-[0.14em] ${p.muted}`}>
                Messages to include
              </p>
              <ul className="mt-2 space-y-2">
                {checklist.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => toggleCheck(item)} className="flex items-start gap-2.5 text-left w-full">
                      <span
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                          checked[item] ? 'bg-[#fccf03] border-[#fccf03] text-[#0a0f29]' : dark ? 'border-[#3a4570]' : 'border-[#c9cee0]'
                        }`}
                      >
                        {checked[item] && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span className={`${checked[item] ? p.muted : p.text} ${checked[item] ? 'line-through' : ''}`}>{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}