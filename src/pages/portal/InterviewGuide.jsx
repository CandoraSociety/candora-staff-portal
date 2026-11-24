import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Play, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import GuideTopBar from '@/components/interviewguide/GuideTopBar';
import GuideQuestionCard from '@/components/interviewguide/GuideQuestionCard';
import GuideQuickReference from '@/components/interviewguide/GuideQuickReference';
import GuideReferenceTab from '@/components/interviewguide/GuideReferenceTab';
import GuidePrintDocument from '@/components/interviewguide/GuidePrintDocument';
import GuideCheatSheetPrint from '@/components/interviewguide/GuideCheatSheetPrint';
import GuideAudioPlayer from '@/components/interviewguide/GuideAudioPlayer';
import GuidePracticeTimer from '@/components/interviewguide/GuidePracticeTimer';
import useGuideAudio from '@/components/interviewguide/useGuideAudio';
import { buildPlaylist } from '@/lib/interviewGuides';

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
  const [follow, setFollow] = useState(true);
  const [view, setView] = useState('guide');
  const [printSheet, setPrintSheet] = useState(false);

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

  // Consecutive clips that belong to the same category, so the player can step
  // between categories rather than between single talking points.
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

  const playAll = () => audio.playIndices(indicesFor(() => true));
  const playIntro = () => audio.playIndices(indicesFor((entry) => entry.segmentId === 'intro'));
  const playKeyMessages = () => audio.playIndices(indicesFor((entry) => entry.section === 'key'));
  const playQuickReference = () => audio.playIndices(indicesFor((entry) => entry.section === 'quick'));
  const playQuickBlock = (label) =>
    audio.playIndices(indicesFor((entry) => entry.section === 'quick' && entry.categoryLabel === label));
  const playQuestion = (questionId) =>
    audio.playIndices(indicesFor((entry) => entry.questionId === questionId));
  const playCategory = (questionId, categoryIndex) =>
    audio.playIndices(indicesFor((entry) => entry.questionId === questionId && entry.categoryIndex === categoryIndex));
  const playKeyMessage = (questionId) =>
    audio.playIndices(indicesFor((entry) => entry.questionId === questionId && (entry.kind === 'keylabel' || entry.kind === 'key')));

  const playGroup = (index) => {
    const group = groups[index];
    if (group) audio.playIndices(group.indices);
  };

  const playQuickSection = (index) =>
    audio.playIndices(indicesFor((entry) => entry.section === 'quick' && entry.categoryIndex === index));

  // Printing the cheat sheet prints only the sheet, not the whole guide.
  useEffect(() => {
    const done = () => setPrintSheet(false);
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  const printCheatSheet = () => {
    setPrintSheet(true);
    setTimeout(() => window.print(), 150);
  };

  // Keep the talking point being narrated in view, unless the listener has turned
  // following off so they can browse the rest of the guide while it plays.
  useEffect(() => {
    if (!follow || !audio.playing || !item || !item.questionId) return;
    const target = view === 'reference'
      ? document.getElementById(`guide-key-${item.questionId}`)
      : document.getElementById(`guide-seg-${item.questionId}-${item.segmentId}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [item?.key, follow, audio.playing, view]);

  const changeView = (next) => {
    setView(next);
    window.scrollTo({ top: 0 });
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
    <>
    <div className={`guide-reader min-h-screen print:hidden ${bg} ${text}`} style={{ '--guide-scale': scale }}>
      <GuideTopBar
        guide={guide}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        scale={scale}
        onScale={(dir) => setScaleIndex((i) => Math.min(SCALES.length - 1, Math.max(0, i + dir)))}
        practice={practice}
        onTogglePractice={() => { setPractice((p) => !p); setSimulated(false); }}
        onListenAll={playAll}
        hasAudio={playlist.length > 0}
        view={view}
        onChangeView={changeView}
      />

      <main className="max-w-3xl mx-auto px-4 pt-5 pb-48 space-y-5">
        {view === 'reference' ? (
          <GuideReferenceTab
            guide={guide}
            questions={questions}
            dark={dark}
            item={item}
            playing={audio.playing}
            onListen={playQuickReference}
            onPlaySection={playQuickSection}
            onPrint={printCheatSheet}
          />
        ) : (
        <>
        {guide.purpose && <p className={`${muted}`}>{guide.purpose}</p>}

        <section className={`rounded-2xl border p-5 sm:p-6 ${card}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="g-h2 font-display font-bold">How to use this guide</h2>
            {guide.intro_audio_url && (
              <button
                type="button"
                onClick={playIntro}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                  item?.segmentId === 'intro' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
                }`}
              >
                <Play className="w-4 h-4" /> Listen to the introduction
              </button>
            )}
          </div>
          {String(guide.intro_narration || '').split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
            <p key={index} className="mt-2">{paragraph}</p>
          ))}

          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={playKeyMessages}
              disabled={!guide.key_messages_audio_url}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium disabled:opacity-40 ${
                item?.section === 'key' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
              }`}
            >
              <Play className="w-3.5 h-3.5" /> Listen to key messages only
            </button>
            <button
              type="button"
              onClick={playQuickReference}
              disabled={!playlist.some((entry) => entry.section === 'quick')}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium disabled:opacity-40 ${
                item?.section === 'quick' ? 'bg-[#fccf03] text-[#0a0f29] border-[#fccf03]' : softBtn
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

        {shown.map((question) => (
          <GuideQuestionCard
            key={question.id}
            question={question}
            number={questions.findIndex((q) => q.id === question.id) + 1}
            dark={dark}
            practice={practice}
            playing={audio.playing}
            activeQuestionId={item?.questionId || null}
            activeSegmentId={item?.questionId === question.id ? item.segmentId : null}
            onPlayQuestion={() => playQuestion(question.id)}
            onPlayCategory={(categoryIndex) => playCategory(question.id, categoryIndex)}
            onPlayKeyMessage={() => playKeyMessage(question.id)}
          />
        ))}

        {!simulated && (
          <GuideQuickReference
            guide={guide}
            dark={dark}
            active={item?.section === 'quick'}
            activeCategory={item?.section === 'quick' ? item.categoryLabel : null}
            playing={audio.playing}
            onListen={playQuickReference}
            onPlayBlock={playQuickBlock}
          />
        )}
        </>
        )}

        <footer className={`text-center text-sm pt-4 ${muted}`}>
          <p className="font-semibold">Candora Society of Edmonton</p>
          <p>These are talking points, not a script to be memorized.</p>
        </footer>
      </main>

      {!simulated && view === 'guide' && (
        <button
          type="button"
          onClick={() => changeView('reference')}
          className="fixed right-4 bottom-32 z-30 rounded-full bg-[#0a0f29] text-white text-xs font-semibold px-4 py-2.5 shadow-lg print:hidden"
        >
          Quick reference
        </button>
      )}

      {playlist.length > 0 && (
        <GuideAudioPlayer
          audio={audio}
          item={item}
          dark={dark}
          follow={follow}
          onToggleFollow={() => setFollow((f) => !f)}
          onPrevCategory={() => playGroup(groupAt - 1)}
          onNextCategory={() => playGroup(groupAt + 1)}
        />
      )}
    </div>

    {printSheet ? (
      <GuideCheatSheetPrint guide={guide} questions={questions} />
    ) : (
      <GuidePrintDocument guide={guide} questions={questions} />
    )}
    </>
  );
}