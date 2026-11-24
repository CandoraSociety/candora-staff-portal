import React from 'react';
import {
  Play, Pause, RotateCcw, SkipBack, SkipForward, Download,
  ChevronLeft, ChevronRight, LocateFixed,
} from 'lucide-react';

const RATES = [0.75, 1, 1.25, 1.5];

const clock = (value) => {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const m = Math.floor(value / 60);
  const s = Math.floor(value % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Stays on screen while the guide is scrolled, so playback is never lost. It shows
// the category being narrated and lets the listener move between categories,
// between talking points, or stop the guide scrolling along with the audio.
export default function GuideAudioPlayer({ audio, item, dark, follow, onToggleFollow, onPrevCategory, onNextCategory }) {
  const { playing, time, duration, rate } = audio;
  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;

  const surface = dark ? 'bg-[#111a3d] border-[#26305a] text-[#eef1ff]' : 'bg-white border-[#dadce7] text-[#080c21]';
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const btn = dark ? 'hover:bg-[#1b2550] text-[#eef1ff]' : 'hover:bg-[#f0f2f8] text-[#080c21]';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2 pb-2 sm:px-4 sm:pb-4 print:hidden">
      <div className={`mx-auto max-w-3xl rounded-2xl border shadow-xl ${surface}`}>
        <div className="px-4 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${muted}`}>
                {item ? `Now playing · ${item.sectionLabel}` : 'Choose a section to listen'}
              </p>
              <p className="text-sm font-semibold truncate">{item ? item.categoryLabel : '—'}</p>
              {item?.text && (
                <p className={`text-xs mt-0.5 line-clamp-2 ${muted}`}>{item.text}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onToggleFollow}
              aria-pressed={follow}
              className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                follow
                  ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]'
                  : dark ? 'border-[#26305a]' : 'border-[#dadce7]'
              }`}
            >
              <LocateFixed className="w-3 h-3" /> Follow
            </button>
          </div>

          <button
            type="button"
            aria-label="Seek within this clip"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const fraction = (e.clientX - rect.left) / rect.width;
              audio.seekTo(fraction * duration);
            }}
            className={`mt-2 h-1.5 w-full rounded-full overflow-hidden ${dark ? 'bg-[#26305a]' : 'bg-[#e8ebf3]'}`}
          >
            <div className="h-full rounded-full bg-[#fccf03]" style={{ width: `${pct}%` }} />
          </button>
          <div className={`mt-1 text-right text-[11px] tabular-nums ${muted}`}>{clock(time)} / {clock(duration)}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-2">
          <div className="flex items-center">
            <button type="button" onClick={onPrevCategory} aria-label="Previous category"
              className={`p-2 rounded-lg ${btn}`}><ChevronLeft className="w-5 h-5" /></button>
            <button type="button" onClick={audio.prev} aria-label="Previous talking point"
              className={`p-2 rounded-lg ${btn}`}><SkipBack className="w-5 h-5" /></button>
            <button type="button" onClick={audio.toggle} aria-label={playing ? 'Pause' : 'Play'}
              className="mx-1 w-11 h-11 rounded-full bg-[#fccf03] text-[#0a0f29] flex items-center justify-center shadow">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button type="button" onClick={audio.next} aria-label="Next talking point"
              className={`p-2 rounded-lg ${btn}`}><SkipForward className="w-5 h-5" /></button>
            <button type="button" onClick={onNextCategory} aria-label="Next category"
              className={`p-2 rounded-lg ${btn}`}><ChevronRight className="w-5 h-5" /></button>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={audio.restart} aria-label="Replay this clip"
              className={`p-2 rounded-lg ${btn}`}><RotateCcw className="w-4 h-4" /></button>
            <select
              value={rate}
              onChange={(e) => audio.setRate(Number(e.target.value))}
              aria-label="Playback speed"
              className={`text-xs rounded-lg px-2 py-1.5 border bg-transparent ${dark ? 'border-[#26305a]' : 'border-[#dadce7]'}`}
            >
              {RATES.map((r) => <option key={r} value={r}>{r}×</option>)}
            </select>
            {item?.url && (
              <a href={item.url} download aria-label="Download this clip"
                className={`p-2 rounded-lg ${btn}`}><Download className="w-4 h-4" /></a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}