import React from 'react';
import { Play, Pause, CalendarDays, Handshake, Phone, Megaphone } from 'lucide-react';
import EmphasisText from './EmphasisText';

// The scannable summary: priority messages, partners, dates, reminders, contacts.
// Each priority-message block can be listened to on its own, and the section being
// narrated is highlighted.
export default function GuideQuickReference({
  guide, dark, active, activeCategory, playing, onListen, onPlayBlock,
}) {
  const card = dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]';
  const text = dark ? 'text-[#eef1ff]' : 'text-[#080c21]';
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const soft = dark ? 'bg-[#0d1533]' : 'bg-[#f6f7fb]';
  const rule = dark ? 'border-[#26305a]' : 'border-[#e8ebf3]';
  const chip = dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]';

  const blocks = guide.quick_reference || [];
  const partners = guide.partners || [];
  const dates = guide.important_dates || [];
  const reminders = guide.reminders || [];
  const contacts = guide.contacts || [];
  const hasAudio = (guide.quick_reference_segments || []).some((segment) => segment.audio_url);

  const sectionActive = (label) => active && activeCategory === label;

  return (
    <section id="quick-reference" className={`rounded-2xl border p-5 sm:p-6 ${card} ${active ? 'ring-2 ring-[#fccf03]' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`g-h2 font-display font-bold ${text}`}>Interview quick reference</h2>
        {hasAudio ? (
          <button
            type="button"
            onClick={onListen}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border ${
              active ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : chip
            }`}
          >
            {active && playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {active && playing ? 'Playing quick reference' : 'Listen to quick reference'}
          </button>
        ) : (
          <span className={`text-xs ${muted}`}>Quick-reference narration has not been generated yet.</span>
        )}
      </div>

      <p className={`g-small font-semibold uppercase tracking-[0.14em] mt-5 flex items-center gap-2 ${
        sectionActive('Priority messages') ? 'text-[#b38b00]' : muted
      }`}>
        <Megaphone className="w-3.5 h-3.5" /> Priority messages
      </p>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {blocks.map((block) => (
          <div
            key={block.heading}
            className={`rounded-xl p-4 ${soft} ${sectionActive(block.heading) ? 'ring-1 ring-[#fccf03]' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`g-h3 font-display font-bold ${text}`}>{block.heading}</p>
              {hasAudio && (
                <button
                  type="button"
                  onClick={() => onPlayBlock(block.heading)}
                  aria-label={`Listen to ${block.heading}`}
                  className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium print:hidden ${
                    sectionActive(block.heading) ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : chip
                  }`}
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
            </div>
            <ul className="mt-1.5 space-y-1">
              {(block.items || []).map((item) => (
                <li key={item} className={`flex gap-2 ${muted}`}>
                  <span className="mt-[0.6em] w-1 h-1 rounded-full bg-[#fccf03] flex-shrink-0" />
                  <EmphasisText text={item} className="min-w-0" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {partners.length > 0 && (
        <div className="mt-5">
          <p className={`g-h3 font-display font-bold flex items-center gap-2 ${sectionActive('Important partners to acknowledge') ? 'text-[#b38b00]' : text}`}>
            <Handshake className="w-4 h-4" /> Important partners to acknowledge
          </p>
          <ul className={`mt-2 divide-y ${rule}`}>
            {partners.map((partner) => (
              <li key={partner.name} className="py-2 flex flex-col sm:flex-row sm:gap-3">
                <span className={`font-semibold sm:w-64 flex-shrink-0 ${text}`}>{partner.name}</span>
                <EmphasisText text={partner.note} className={muted} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {dates.length > 0 && (
        <div className="mt-5">
          <p className={`g-h3 font-display font-bold flex items-center gap-2 ${sectionActive('Important dates') ? 'text-[#b38b00]' : text}`}>
            <CalendarDays className="w-4 h-4" /> Important dates
          </p>
          <ul className={`mt-2 divide-y ${rule}`}>
            {dates.map((row, i) => (
              <li key={i} className="py-2 grid sm:grid-cols-[9rem_1fr_1fr] gap-x-3 gap-y-0.5">
                <span className={`font-semibold ${text}`}>{row.when}</span>
                <EmphasisText text={row.event} className={text} />
                <EmphasisText text={row.location} className={muted} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="mt-5">
          <p className={`g-h3 font-display font-bold ${sectionActive('Important interview reminders') ? 'text-[#b38b00]' : text}`}>
            Important interview reminders
          </p>
          <ul className="mt-2 space-y-1.5">
            {reminders.map((reminder) => (
              <li key={reminder} className={`flex gap-2 ${muted}`}>
                <span className="mt-[0.6em] w-1 h-1 rounded-full bg-[#fccf03] flex-shrink-0" />
                <EmphasisText text={reminder} className="min-w-0" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {contacts.length > 0 && (
        <div className={`mt-5 rounded-xl p-4 ${soft}`}>
          <p className={`g-h3 font-display font-bold flex items-center gap-2 ${sectionActive('Contact information') ? 'text-[#b38b00]' : text}`}>
            <Phone className="w-4 h-4" /> Contact information
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {contacts.map((contact) => (
              <li key={contact.label} className={text}>
                <span className={`${muted}`}>{contact.label}: </span>
                {contact.url ? (
                  <a href={contact.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[#fccf03] decoration-2 underline-offset-2">
                    {contact.value}
                  </a>
                ) : (
                  <span className="font-semibold">{contact.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}