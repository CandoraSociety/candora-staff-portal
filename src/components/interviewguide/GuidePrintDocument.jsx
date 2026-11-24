import React from 'react';
import EmphasisText from './EmphasisText';

// The guide as a real document on paper: letterhead, the briefing for each
// question, and the quick reference - laid out for a page, not a screen.
// Hidden on screen; the guide's Print button prints this instead of the app UI.
export default function GuidePrintDocument({ guide, questions }) {
  if (!guide) return null;

  const formatDay = (value) => {
    if (!value) return '';
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return value;
    return new Date(year, month - 1, day).toLocaleDateString('en-CA', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  const meta = [
    guide.show_name,
    guide.outlet,
    guide.interviewer ? `with ${guide.interviewer}` : '',
    formatDay(guide.interview_date),
  ].filter(Boolean);

  const paragraphs = (text) => String(text || '').split(/\n{2,}/).filter(Boolean);

  return (
    <div className="hidden print:block bg-white text-[#080c21] text-[10.5pt] leading-[1.5]">
      <header className="flex items-start gap-4 border-b-2 border-[#fccf03] pb-3">
        <img
          src="https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png"
          alt="Candora Society"
          className="h-12 w-auto object-contain"
        />
        <div className="flex-1">
          <p className="text-[8pt] font-semibold uppercase tracking-[0.18em] text-[#8a6d00]">
            Interview preparation guide
          </p>
          <h1 className="font-display text-[17pt] font-bold leading-tight">{guide.title}</h1>
          {meta.length > 0 && <p className="mt-0.5 text-[9.5pt] text-[#626784]">{meta.join(' · ')}</p>}
          {guide.spokesperson && (
            <p className="mt-0.5 text-[9.5pt] font-semibold">Prepared for {guide.spokesperson}</p>
          )}
        </div>
      </header>

      {guide.purpose && (
        <p className="mt-3 text-[10.5pt] italic text-[#3b4265]">{guide.purpose}</p>
      )}

      {paragraphs(guide.intro_narration).length > 0 && (
        <section className="mt-4 break-inside-avoid">
          <h2 className="font-display text-[12pt] font-bold">How to use this guide</h2>
          {paragraphs(guide.intro_narration).map((paragraph, index) => (
            <p key={index} className="mt-1">{paragraph}</p>
          ))}
        </section>
      )}

      <section className="mt-5">
        <h2 className="font-display text-[12pt] font-bold border-b border-[#dadce7] pb-1">
          Questions and key points
        </h2>

        <div className="mt-3 space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} className="break-inside-avoid border border-[#dadce7] rounded p-3">
              <div className="flex gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded bg-[#fccf03] text-[#0a0f29] font-display font-extrabold text-[9pt] flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="font-semibold leading-snug">{question.question}</p>
              </div>

              {(question.categories || []).length > 0 && (
                <div className="mt-2 space-y-2 pl-7">
                  {(question.categories || []).map((category, categoryIndex) => (
                    <div key={categoryIndex} className="break-inside-avoid">
                      <p className="text-[9pt] font-bold uppercase tracking-[0.1em] text-[#3b4265]">
                        {category.heading}
                      </p>
                      <ul className="mt-0.5 list-disc pl-4 space-y-0.5">
                        {(category.points || []).map((point, pointIndex) => (
                          <li key={pointIndex}><EmphasisText text={point} /></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {question.key_message && (
                <div className="mt-2.5 ml-7 border-l-[3px] border-[#fccf03] bg-[#f6f7fb] px-2.5 py-1.5 break-inside-avoid">
                  <p className="text-[8pt] font-bold uppercase tracking-[0.12em] text-[#8a6d00]">Key message</p>
                  {paragraphs(question.key_message).map((paragraph, i) => (
                    <p key={i} className="mt-0.5"><EmphasisText text={paragraph} /></p>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 break-before-page">
        <h2 className="font-display text-[12pt] font-bold border-b border-[#dadce7] pb-1">
          Quick reference
        </h2>

        {(guide.quick_reference || []).map((block, index) => (
          <div key={index} className="mt-3 break-inside-avoid">
            <p className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#3b4265]">{block.heading}</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {(block.items || []).map((item, itemIndex) => (
                <li key={itemIndex}><EmphasisText text={item} /></li>
              ))}
            </ul>
          </div>
        ))}

        {(guide.partners || []).length > 0 && (
          <div className="mt-3 break-inside-avoid">
            <p className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#3b4265]">Partners and supporters</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {(guide.partners || []).map((partner, index) => (
                <li key={index}>
                  <strong className="font-semibold">{partner.name}</strong>
                  {partner.note ? ` — ${partner.note}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(guide.important_dates || []).length > 0 && (
          <div className="mt-3 break-inside-avoid">
            <p className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#3b4265]">Dates you may be asked about</p>
            <table className="mt-1 w-full border-collapse text-[10pt]">
              <tbody>
                {(guide.important_dates || []).map((entry, index) => (
                  <tr key={index} className="border-b border-[#eef0f5] align-top">
                    <td className="py-1 pr-3 font-semibold whitespace-nowrap">{entry.when}</td>
                    <td className="py-1 pr-3">{entry.event}</td>
                    <td className="py-1 text-[#626784]">{entry.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(guide.reminders || []).length > 0 && (
          <div className="mt-3 break-inside-avoid">
            <p className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#3b4265]">Reminders</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {(guide.reminders || []).map((reminder, index) => (
                <li key={index}><EmphasisText text={reminder} /></li>
              ))}
            </ul>
          </div>
        )}

        {(guide.contacts || []).length > 0 && (
          <div className="mt-3 break-inside-avoid">
            <p className="text-[9.5pt] font-bold uppercase tracking-[0.1em] text-[#3b4265]">Contacts</p>
            <ul className="mt-1 space-y-0.5">
              {(guide.contacts || []).map((contact, index) => (
                <li key={index}>
                  <span className="font-semibold">{contact.label}:</span> {contact.value}
                  {contact.url ? ` · ${contact.url}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <footer className="mt-4 border-t border-[#dadce7] pt-2 text-[8.5pt] text-[#626784]">
        <p className="font-semibold text-[#080c21]">Candora Society of Edmonton</p>
        <p>These are talking points, not a script to be memorized.</p>
      </footer>
    </div>
  );
}