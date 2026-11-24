import React, { useState } from 'react';
import { Play, Pause, Eye, EyeOff, Check } from 'lucide-react';
import EmphasisText from './EmphasisText';

const palette = (dark) => ({
  card: dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]',
  text: dark ? 'text-[#eef1ff]' : 'text-[#080c21]',
  muted: dark ? 'text-[#a9b0cd]' : 'text-[#626784]',
  soft: dark ? 'bg-[#0d1533]' : 'bg-[#f6f7fb]',
  rule: dark ? 'border-[#26305a]' : 'border-[#e8ebf3]',
  chip: dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]',
});

// One question and the preparation material behind it: the question as the host
// will ask it, the key points grouped into thematic categories, and the key
// message. The category or talking point being narrated is highlighted so the
// written guide can be followed while listening.
export default function GuideQuestionCard({
  question, number, dark, practice, playing,
  activeQuestionId, activeSegmentId,
  onPlayQuestion, onPlayCategory, onPlayKeyMessage,
}) {
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState({});
  const p = palette(dark);

  const categories = question.categories || [];
  const checklist = question.checklist || [];
  const showAnswers = !practice || revealed;
  const hasAudio = (question.narration_segments || []).some((segment) => segment.audio_url);
  const isThisQuestion = activeQuestionId === question.id;
  const isActive = (segmentId) => isThisQuestion && activeSegmentId === segmentId;
  const isKeyActive = isThisQuestion && (activeSegmentId === 'keylabel' || String(activeSegmentId || '').startsWith('k'));

  const toggleCheck = (item) => setChecked((c) => ({ ...c, [item]: !c[item] }));

  return (
    <article
      id={`question-${number}`}
      className={`rounded-2xl border p-5 sm:p-6 ${p.card} ${isThisQuestion ? 'ring-2 ring-[#fccf03]' : ''}`}
    >
      <div className="flex gap-3 sm:gap-4">
        <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#fccf03] text-[#0a0f29] font-display font-extrabold flex items-center justify-center">
          {number}
        </span>
        <div className="min-w-0">
          <p className={`g-small font-semibold uppercase tracking-[0.14em] ${p.muted}`}>Question {number}</p>
          <h2 className={`g-h2 font-display font-bold leading-snug ${p.text}`}>{question.question}</h2>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 print:hidden">
        {hasAudio ? (
          <button
            type="button"
            onClick={onPlayQuestion}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
              isThisQuestion
                ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]'
                : p.chip
            }`}
          >
            {isThisQuestion && playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isThisQuestion && playing ? 'Playing this briefing' : isThisQuestion ? 'Resume this briefing' : 'Listen to this briefing'}
          </button>
        ) : (
          <span className={`text-xs ${p.muted}`}>Narration for this question has not been generated yet.</span>
        )}

        {practice && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border ${p.chip}`}
          >
            {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {revealed ? 'Hide the key points' : 'Reveal the key points'}
          </button>
        )}
      </div>

      {practice && !revealed && (
        <p className={`mt-4 text-sm rounded-xl px-4 py-3 ${p.soft} ${p.muted}`}>
          Answer out loud in your own words first. Reveal the key points when you're ready to compare.
        </p>
      )}

      {showAnswers && (
        <div className="mt-5 space-y-5">
          <p className={`g-small font-semibold uppercase tracking-[0.14em] ${p.muted}`}>
            Key points and context for the response
          </p>

          {categories.map((category, categoryIndex) => (
            <section key={categoryIndex} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3
                  className={`g-h3 font-display font-bold ${isActive(`h${categoryIndex}`) ? 'text-[#b38b00]' : p.text}`}
                >
                  {category.heading}
                </h3>
                {hasAudio && (
                  <button
                    type="button"
                    onClick={() => onPlayCategory(categoryIndex)}
                    aria-label={`Listen to ${category.heading}`}
                    className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium print:hidden ${
                      isActive(`h${categoryIndex}`) ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : p.chip
                    }`}
                  >
                    <Play className="w-3 h-3" /> Listen
                  </button>
                )}
              </div>

              <ul className="space-y-2">
                {(category.points || []).map((point, pointIndex) => {
                  const active = isActive(`p${categoryIndex}-${pointIndex}`);
                  return (
                    <li
                      key={pointIndex}
                      id={`guide-seg-${question.id}-p${categoryIndex}-${pointIndex}`}
                      className={`flex gap-2.5 rounded-lg px-2 py-1.5 -mx-2 transition-colors ${
                        active ? 'bg-[#fccf03]/25' : ''
                      }`}
                    >
                      <span className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-[#fccf03] flex-shrink-0" />
                      <EmphasisText text={point} className={`min-w-0 ${p.text}`} />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {question.key_message && (
            <div
              id={`guide-seg-${question.id}-keylabel`}
              className={`rounded-xl border-l-4 border-[#fccf03] px-4 py-3 ${p.soft} ${isKeyActive ? 'ring-1 ring-[#fccf03]' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="g-small font-semibold uppercase tracking-[0.14em] text-[#b38b00]">Key message</p>
                {hasAudio && (
                  <button
                    type="button"
                    onClick={onPlayKeyMessage}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium print:hidden ${
                      isKeyActive ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : p.chip
                    }`}
                  >
                    <Play className="w-3 h-3" /> Listen
                  </button>
                )}
              </div>
              {String(question.key_message).split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
                <p key={index} className={`mt-1 ${p.text}`}>{paragraph}</p>
              ))}
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