import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import GuideQuickReference from '@/components/interviewguide/GuideQuickReference';
import GuideAudioPlayer from '@/components/interviewguide/GuideAudioPlayer';
import EmphasisText from '@/components/interviewguide/EmphasisText';
import useGuideAudio from '@/components/interviewguide/useGuideAudio';
import { buildPlaylist } from '@/lib/interviewGuides';

// Everything Dawn needs in one place before going on air: the message to land for
// each question, what each answer covers, and the quick reference - partners,
// dates, reminders and contacts. Opened from the guide's own share link.
export default function InterviewGuideQuickReference() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, guide: null, questions: [], error: null });
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await base44.functions.invoke('getPublicInterviewGuide', { token });
        if (!alive) return;
        if (res.data?.error) {
          setState({ loading: false, guide: null, questions: [], error: res.data.error });
          return;
        }
        setState({ loading: false, guide: res.data.guide, questions: res.data.questions || [], error: null });
      } catch (err) {
        if (alive) setState({ loading: false, guide: null, questions: [], error: 'This guide could not be opened.' });
      }
    };
    load();
    return () => { alive = false; };
  }, [token]);

  const { guide, questions, loading, error } = state;

  const playlist = useMemo(() => buildPlaylist(guide, questions), [guide, questions]);
  const audio = useGuideAudio(playlist);
  const item = audio.current >= 0 ? playlist[audio.current] : null;

  const groups = useMemo(() => {
    const out = [];
    playlist.forEach((entry, index) => {
      const key = `${entry.sectionLabel}|${entry.categoryLabel}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.indices.push(index);
      else out.push({ key, indices: [index] });
    });
    return out;
  }, [playlist]);

  const groupAt = groups.findIndex((group) => group.indices.includes(audio.current));

  const indicesFor = (predicate) =>
    playlist.map((entry, index) => (predicate(entry) ? index : -1)).filter((index) => index >= 0);

  const playKeyMessages = () => audio.playIndices(indicesFor((entry) => entry.section === 'key'));
  const playQuickReference = () => audio.playIndices(indicesFor((entry) => entry.section === 'quick'));
  const playQuickBlock = (label) =>
    audio.playIndices(indicesFor((entry) => entry.section === 'quick' && entry.categoryLabel === label));
  const playKeyMessage = (questionId) =>
    audio.playIndices(indicesFor((entry) => entry.questionId === questionId && (entry.kind === 'keylabel' || entry.kind === 'key')));

  const playGroup = (index) => {
    const group = groups[index];
    if (group) audio.playIndices(group.indices);
  };

  useEffect(() => {
    if (!follow || !audio.playing || !item?.questionId) return;
    const target = document.getElementById(`guide-key-${item.questionId}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [item?.key, follow, audio.playing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="w-8 h-8 border-[3px] border-[#0a0f29]/20 border-t-[#0a0f29] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] px-6">
        <div className="max-w-md text-center space-y-2">
          <p className="font-display font-bold text-xl text-[#080c21]">This guide isn’t available</p>
          <p className="text-sm text-[#626784]">
            {error || 'The link may have expired, or the guide has been archived. Contact Candora for a new link.'}
          </p>
        </div>
      </div>
    );
  }

  const muted = 'text-[#626784]';
  const softBtn = 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]';

  return (
    <div className="guide-reader min-h-screen bg-[#f9fafb] text-[#080c21]">
      <header className="sticky top-0 z-30 border-b bg-white border-[#dadce7]">
        <div className="max-w-3xl mx-auto px-4 py-3 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-[#fccf03] flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src="https://media.base44.com/images/public/6a249282cb496579542673b7/c7fbd36e2_logo.png"
                  alt="Candora Society"
                  className="w-7 h-7 object-contain"
                />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b38b00]">Candora Society</p>
                <h1 className="g-small font-display font-bold leading-tight">Quick reference and key points</h1>
              </div>
            </div>
            <Link
              to={`/interview-guide/${token}`}
              className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium ${softBtn}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Guide
            </Link>
          </div>

          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${muted}`}>
            <span className="font-medium">{guide.title}</span>
            {guide.spokesperson && <span>For {guide.spokesperson}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={playKeyMessages}
              disabled={!guide.key_messages_audio_url}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium disabled:opacity-40 ${
                item?.section === 'key' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Listen to key messages
            </button>
            <button
              type="button"
              onClick={playQuickReference}
              disabled={!playlist.some((entry) => entry.section === 'quick')}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium disabled:opacity-40 ${
                item?.section === 'quick' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Listen to quick reference
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 pb-48 space-y-5">
        <section className="rounded-2xl border bg-white border-[#dadce7] p-5 sm:p-6">
          <h2 className="g-h2 font-display font-bold">Key points</h2>
          <p className={`mt-1 text-sm ${muted}`}>
            The message to land for each question, and the ground each answer covers.
          </p>

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
                  className={`rounded-xl border border-[#e8ebf3] p-4 ${keyActive ? 'ring-2 ring-[#fccf03]' : ''}`}
                >
                  <div className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#fccf03] text-[#0a0f29] font-display font-extrabold text-sm flex items-center justify-center">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold leading-snug">{question.question}</p>
                  </div>

                  {(question.categories || []).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 pl-10">
                      {(question.categories || []).map((category, categoryIndex) => (
                        <span
                          key={categoryIndex}
                          className="rounded-full bg-[#f6f7fb] px-2.5 py-1 text-[11px] font-medium text-[#626784]"
                        >
                          {category.heading}
                        </span>
                      ))}
                    </div>
                  )}

                  {question.key_message && (
                    <div className="mt-3 rounded-lg border-l-4 border-[#fccf03] bg-[#f6f7fb] px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="g-small font-semibold uppercase tracking-[0.14em] text-[#b38b00]">Key message</p>
                        {hasKeyAudio && (
                          <button
                            type="button"
                            onClick={() => playKeyMessage(question.id)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium print:hidden ${
                              keyActive ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
                            }`}
                          >
                            {keyActive && audio.playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
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
          dark={false}
          active={item?.section === 'quick'}
          activeCategory={item?.section === 'quick' ? item.categoryLabel : null}
          playing={audio.playing}
          onListen={playQuickReference}
          onPlayBlock={playQuickBlock}
        />

        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/interview-guide/${token}`}
            className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium ${softBtn}`}
          >
            <ArrowLeft className="w-4 h-4" /> Back to the full guide
          </Link>
          <Link
            to={`/interview-guide/${token}`}
            className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium ${softBtn}`}
          >
            Practise the questions <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <footer className={`text-center text-sm pt-2 ${muted}`}>
          <p className="font-semibold">Candora Society of Edmonton</p>
          <p>These are talking points, not a script to be memorized.</p>
        </footer>
      </main>

      {playlist.length > 0 && (
        <GuideAudioPlayer
          audio={audio}
          item={item}
          dark={false}
          follow={follow}
          onToggleFollow={() => setFollow((f) => !f)}
          onPrevCategory={() => playGroup(groupAt - 1)}
          onNextCategory={() => playGroup(groupAt + 1)}
        />
      )}
    </div>
  );
}