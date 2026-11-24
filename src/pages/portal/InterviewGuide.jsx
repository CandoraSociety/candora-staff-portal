import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Play, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import GuideTopBar from '@/components/interviewguide/GuideTopBar';
import GuideQuestionCard from '@/components/interviewguide/GuideQuestionCard';
import GuideQuickReference from '@/components/interviewguide/GuideQuickReference';
import GuideAudioPlayer from '@/components/interviewguide/GuideAudioPlayer';
import GuidePracticeTimer from '@/components/interviewguide/GuidePracticeTimer';
import useGuideAudio from '@/components/interviewguide/useGuideAudio';

const SCALES = [0.9, 1, 1.12, 1.25, 1.4];

// The spokesperson's own copy of an interview guide - read, listen and practise
// from one page, opened through the guide's share link.
export default function InterviewGuide() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, guide: null, questions: [], error: null });
  const [dark, setDark] = useState(false);
  const [scaleIndex, setScaleIndex] = useState(1);
  const [practice, setPractice] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [simIndex, setSimIndex] = useState(0);

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

  const sections = useMemo(() => {
    if (!guide) return [];
    const list = [];
    if (guide.intro_audio_url) list.push({ id: 'intro', label: 'Introduction', url: guide.intro_audio_url });
    questions.forEach((q, i) => {
      if (q.audio_url) list.push({ id: `q-${q.id}`, label: `Question ${i + 1}`, url: q.audio_url });
    });
    if (guide.key_messages_audio_url) list.push({ id: 'key', label: 'Key messages', url: guide.key_messages_audio_url });
    if (guide.quick_reference_audio_url) list.push({ id: 'quick', label: 'Quick reference', url: guide.quick_reference_audio_url });
    return list;
  }, [guide, questions]);

  const audio = useGuideAudio(sections);
  const currentId = audio.section?.id;

  const playSection = (id) => {
    const at = sections.findIndex((s) => s.id === id);
    if (at < 0) return;
    if (currentId === id && audio.playing) { audio.toggle(); return; }
    audio.playAt(at);
  };

  const jumpQuickRef = () => {
    document.getElementById('quick-reference')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scale = SCALES[scaleIndex];
  const bg = dark ? 'bg-[#0a0f29]' : 'bg-[#f9fafb]';
  const text = dark ? 'text-[#eef1ff]' : 'text-[#080c21]';
  const muted = dark ? 'text-[#a9b0cd]' : 'text-[#626784]';
  const card = dark ? 'bg-[#111a3d] border-[#26305a]' : 'bg-white border-[#dadce7]';
  const softBtn = dark ? 'border-[#26305a] text-[#eef1ff] hover:bg-[#1b2550]' : 'border-[#dadce7] text-[#080c21] hover:bg-[#f0f2f8]';

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

  const shown = simulated ? questions.slice(simIndex, simIndex + 1) : questions;

  return (
    <div className={`guide-reader min-h-screen ${bg} ${text}`} style={{ '--guide-scale': scale }}>
      <GuideTopBar
        guide={guide}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        scale={scale}
        onScale={(dir) => setScaleIndex((i) => Math.min(SCALES.length - 1, Math.max(0, i + dir)))}
        practice={practice}
        onTogglePractice={() => { setPractice((p) => !p); setSimulated(false); }}
        onListenAll={() => audio.playAt(0)}
        hasAudio={sections.length > 0}
        onJumpQuickRef={jumpQuickRef}
      />

      <main className="max-w-3xl mx-auto px-4 pt-5 pb-48 space-y-5">
        {guide.purpose && <p className={`${muted}`}>{guide.purpose}</p>}

        <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="g-h2 font-display font-bold">How to use this guide</h2>
            {guide.intro_audio_url && (
              <button
                type="button"
                onClick={() => playSection('intro')}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                  currentId === 'intro' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
                }`}
              >
                <Play className="w-4 h-4" /> Listen to the introduction
              </button>
            )}
          </div>
          <p className="mt-2">{guide.intro_narration}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => playSection('key')}
              disabled={!guide.key_messages_audio_url}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium disabled:opacity-40 ${
                currentId === 'key' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Listen to key messages only
            </button>
            <button
              type="button"
              onClick={() => playSection('quick')}
              disabled={!guide.quick_reference_audio_url}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium disabled:opacity-40 ${
                currentId === 'quick' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Listen to the quick reference
            </button>
          </div>
        </section>

        {practice && (
          <section className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 ${card}`}>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold">Practice mode</p>
              <GuidePracticeTimer dark={dark} />
            </div>
            <button
              type="button"
              onClick={() => { setSimulated((s) => !s); setSimIndex(0); }}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                simulated ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              {simulated ? 'Leave simulated interview' : 'Simulated interview'}
            </button>
          </section>
        )}

        {simulated && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSimIndex((i) => Math.max(0, i - 1))}
              disabled={simIndex === 0}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm disabled:opacity-30 ${softBtn}`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <p className={`text-sm ${muted}`}>Question {simIndex + 1} of {questions.length}</p>
            <button
              type="button"
              onClick={() => setSimIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={simIndex >= questions.length - 1}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm disabled:opacity-30 ${softBtn}`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {shown.map((question) => {
          const number = questions.indexOf(question) + 1;
          return (
            <GuideQuestionCard
              key={question.id}
              question={question}
              number={number}
              dark={dark}
              practice={practice}
              active={currentId === `q-${question.id}`}
              playing={audio.playing}
              onListen={() => playSection(`q-${question.id}`)}
            />
          );
        })}

        {!simulated && (
          <GuideQuickReference
            guide={guide}
            dark={dark}
            active={currentId === 'quick'}
            onListen={() => playSection('quick')}
          />
        )}

        <footer className={`text-center text-sm pt-4 ${muted}`}>
          <p className="font-semibold">Candora Society of Edmonton</p>
          <p>These are talking points, not a script to be memorized.</p>
        </footer>
      </main>

      {!simulated && (
        <button
          type="button"
          onClick={jumpQuickRef}
          className="fixed right-4 bottom-32 z-30 rounded-full bg-[#0a0f29] text-white text-xs font-semibold px-4 py-2.5 shadow-lg print:hidden"
        >
          Quick reference
        </button>
      )}

      {sections.length > 0 && <GuideAudioPlayer audio={audio} total={sections.length} dark={dark} />}
    </div>
  );
}