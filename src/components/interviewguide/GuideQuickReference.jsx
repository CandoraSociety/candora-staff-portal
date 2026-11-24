import React from 'react';
import { Play, Pause, CalendarDays, Handshake, Phone } from 'lucide-react';

// The scannable summary: priority messages, partners, dates, reminders, contacts.
export default function GuideQuickReference({ guide, dark, active, onListen }) {
  const card = dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]';
  const text = dark ? 'text-[#eef1ff]' : 'text-[#080c21]';
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const soft = dark ? 'bg-[#0d1533]' : 'bg-[#f6f7fb]';
  const rule = dark ? 'border-[#26305a]' : 'border-[#e8ebf3]';

  const blocks = guide.quick_reference || [];
  const partners = guide.partners || [];
  const dates = guide.important_dates || [];
  const reminders = guide.reminders || [];
  const contacts = guide.contacts || [];

  return (
    <section id="quick-reference" className={`rounded-2xl border p-5 sm:p-6 ${card} ${active ? 'ring-2 ring-[#fccf03]' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`g-h2 font-display font-bold ${text}`}>Interview quick reference</h2>
        {guide.quick_reference_audio_url ? (
          <button
            type="button"
            onClick={onListen}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border ${
              active ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]'
            }`}
          >
            {active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {active ? 'Playing quick reference' : 'Listen to quick reference'}
          </button>
        ) : (
          <span className={`text-xs ${muted}`}>Quick-reference narration has not been generated yet.</span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {blocks.map((block) => (
          <div key={block.heading} className={`rounded-xl p-4 ${soft}`}>
            <p className={`g-h3 font-display font-bold ${text}`}>{block.heading}</p>
            <ul className="mt-1.5 space-y-1">
              {(block.items || []).map((item) => (
                <li key={item} className={`flex gap-2 ${muted}`}>
                  <span className="mt-[0.6em] w-1 h-1 rounded-full bg-[#fccf03] flex-shrink-0" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {partners.length > 0 && (
        <div className="mt-5">
          <p className={`g-h3 font-display font-bold flex items-center gap-2 ${text}`}>
            <Handshake className="w-4 h-4" /> Important partners and supporters
          </p>
          <ul className={`mt-2 divide-y ${rule}`}>
            {partners.map((partner) => (
              <li key={partner.name} className="py-2 flex flex-col sm:flex-row sm:gap-3">
                <span className={`font-semibold sm:w-64 flex-shrink-0 ${text}`}>{partner.name}</span>
                <span className={muted}>{partner.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dates.length > 0 && (
        <div className="mt-5">
          <p className={`g-h3 font-display font-bold flex items-center gap-2 ${text}`}>
            <CalendarDays className="w-4 h-4" /> Important dates
          </p>
          <ul className={`mt-2 divide-y ${rule}`}>
            {dates.map((row, i) => (
              <li key={i} className="py-2 grid sm:grid-cols-[9rem_1fr_1fr] gap-x-3 gap-y-0.5">
                <span className={`font-semibold ${text}`}>{row.when}</span>
                <span className={text}>{row.event}</span>
                <span className={muted}>{row.location}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="mt-5">
          <p className={`g-h3 font-display font-bold ${text}`}>Interview reminders</p>
          <ul className="mt-2 space-y-1.5">
            {reminders.map((reminder) => (
              <li key={reminder} className={`flex gap-2 ${muted}`}>
                <span className="mt-[0.6em] w-1 h-1 rounded-full bg-[#fccf03] flex-shrink-0" />
                <span className="min-w-0">{reminder}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contacts.length > 0 && (
        <div className={`mt-5 rounded-xl p-4 ${soft}`}>
          <p className={`g-h3 font-display font-bold flex items-center gap-2 ${text}`}>
            <Phone className="w-4 h-4" /> Essential contact information
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