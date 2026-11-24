import React from 'react';
import { Play } from 'lucide-react';
import EmphasisText from './EmphasisText';
import { ON_AIR_REMINDERS } from '@/lib/interviewTips';

// The seven reminders that keep an answer short, clear and on message. They sit
// as a compact two-column band under the quick reference, on screen and on paper,
// so they never push the sheet onto a second page.
export default function OnAirReminders({ dark = false, print = false, hasAudio, active, playing, onListen }) {
  const wrap = print
    ? 'break-inside-avoid rounded border-t-[2.5px] border-[#fccf03] bg-[#fafbfe] px-2 py-1.5'
    : dark
      ? 'rounded-lg border border-[#26305a] border-t-[3px] border-t-[#fccf03] bg-[#0e1734] px-3 py-2'
      : 'rounded-lg border border-[#e8ebf3] border-t-[3px] border-t-[#fccf03] bg-[#fafbfe] px-3 py-2';

  const heading = print
    ? 'text-[6.5pt] font-bold uppercase tracking-[0.14em] text-[#8a6d00]'
    : `text-[9px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-[#fccf03]' : 'text-[#b38b00]'}`;

  const item = print
    ? 'text-[7.5pt] leading-[1.32] text-[#1a2140]'
    : `text-[11.5px] leading-[1.4] ${dark ? 'text-[#dfe4f7]' : 'text-[#1a2140]'}`;

  const dot = print ? 'mt-[0.5em] h-[2.5px] w-[2.5px]' : 'mt-[0.55em] h-1 w-1';

  return (
    <div className={wrap}>
      <div className="flex items-center justify-between gap-2">
        <p className={heading}>On-air reminders</p>
        {!print && hasAudio && (
          <button
            type="button"
            onClick={onListen}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium print:hidden ${
              active
                ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]'
                : dark
                  ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]'
                  : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]'
            }`}
          >
            <Play className="w-2.5 h-2.5" /> {active && playing ? 'Playing' : 'Listen'}
          </button>
        )}
      </div>

      <ul className={`mt-1 grid gap-x-3 ${print ? 'gap-y-[1px] grid-cols-2' : 'gap-y-0.5 sm:grid-cols-2'}`}>
        {ON_AIR_REMINDERS.map((reminder) => (
          <li key={reminder.label} className={`flex gap-1 ${item}`}>
            <span className={`${dot} flex-shrink-0 rounded-full bg-[#fccf03]`} />
            <EmphasisText text={`**${reminder.label}:** ${reminder.text}`} className="min-w-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}