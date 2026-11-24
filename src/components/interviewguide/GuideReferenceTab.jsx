import React from 'react';
import { Play, Pause } from 'lucide-react';
import GuideQuickReference from './GuideQuickReference';
import EmphasisText from './EmphasisText';

// The second tab of the guide: the message to land for each question, the ground
// each answer covers, and the quick reference - partners, dates, reminders, contacts.
export default function GuideReferenceTab({
  guide, questions, dark, item, playing,
  onPlayKeyMessages, onPlayQuickReference, onPlayBlock, onPlayKeyMessage,
}) {
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const card = dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]';
  const softBtn = dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]';
  const chip = dark ? 'bg-[#1b2550] text-[#a9b0cd]' : 'bg-[#f6f7fb] text-[#626784]';
  const divider = dark ? 'border-[#26305a]' : 'border-[#e8ebf3]';
  const keyPanel = dark ? 'bg-[#0e1734]' : 'bg-[#f6f7fb]';

  return (
    <>
      <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="g-h2 font-display font-bold">Key points</h2>
            <p className={`mt-1 text-sm ${muted}`}>
              The message to land for each question, and the ground each answer covers.
            </p>
          </div>
          {guide?.key_messages_audio_url && (
            <button
              type="button"
              onClick={onPlayKeyMessages}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium print:hidden ${
                item?.section === 'key' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Listen to key messages
            </button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {questions.map((question, index) => {
            const keyActive = item?.questionId === question.id && (item.kind === 'keylabel' || item.kind === 'key');
            const hasKeyAudio = (question.narration_segments || []).some(
              (segment) => segment.audio_url && (segment.kind === 'keylabel' || segment.kind === 'key')
            );

            return (
              <article
                key={question.id}
                id={`guide-key-${question.id}`}
                className={`rounded-xl border p-4 ${divider} ${keyActive ? 'ring-2 ring-[#fccf03]' : ''}`}
              >
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#fccf03] text-[#0a0f29] font-display font-extrabold text-sm flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-snug">{question.question}</p>
                </div>

                {(question.categories || []).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 sm:pl-10">
                    {(question.categories || []).map((category, categoryIndex) => (
                      <span key={categoryIndex} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${chip}`}>
                        {category.heading}
                      </span>
                    ))}
                  </div>
                )}

                {question.key_message && (
                  <div className={`mt-3 rounded-lg border-l-4 border-[#fccf03] px-3 py-2.5 ${keyPanel}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="g-small font-semibold uppercase tracking-[0.14em] text-[#b38b00]">Key message</p>
                      {hasKeyAudio && (
                        <button
                          type="button"
                          onClick={() => onPlayKeyMessage(question.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium print:hidden ${
                            keyActive ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
                          }`}
                        >
                          {keyActive && playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          Listen
                        </button>
                      )}
                    </div>
                    {String(question.key_message).split(/\n{2,}/).filter(Boolean).map((paragraph, i) => (
                      <p key={i} className="mt-1"><EmphasisText text={paragraph} /></p>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <GuideQuickReference
        guide={guide}
        dark={dark}
        active={item?.section === 'quick'}
        activeCategory={item?.section === 'quick' ? item.categoryLabel : null}
        playing={playing}
        onListen={onPlayQuickReference}
        onPlayBlock={onPlayBlock}
      />
    </>
  );
}