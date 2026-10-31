import { useEffect, useRef, useState } from 'react';
import RecapVideoScene from '@/components/training/RecapVideoScene';
import RecapVideoControls from '@/components/training/RecapVideoControls';
import useIntroPlaybackClock from '@/components/training/useIntroPlaybackClock';
import { STAFF_RECAP_SCENES } from '@/lib/training/recapVideos/staffRecaps';
import { PATHWAYS_RECAP_SCENES } from '@/lib/training/recapVideos/pathwaysRecaps';
import { DATABASE_RECAP_SCENES } from '@/lib/training/recapVideos/databaseRecaps';

const SCENES = { ...STAFF_RECAP_SCENES, ...PATHWAYS_RECAP_SCENES, ...DATABASE_RECAP_SCENES };

// The points ARE the video: each scene has its own matching narration.
// There is no paragraph player or supplementary takeaway panel below it.
export default function ModuleRecapVideo({ recap, moduleKey }) {
  const scenes = SCENES[moduleKey] || [];
  const [index, setIndex] = useState(0);
  const [replay, setReplay] = useState(0);
  const [started, setStarted] = useState(true);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const playbackKey = `${moduleKey}-recap:${index}:${replay}`;
  const time = useIntroPlaybackClock(audioRef, playbackKey);
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, [playbackKey]);
  if (!scenes.length) return null;
  const move = (next, autoPlay = !audioRef.current?.paused) => {
    audioRef.current?.pause();
    setDuration(0);
    setStarted(autoPlay);
    setIndex(next);
  };
  return (
    <section aria-label={`Recap presentation: ${recap.title}`} className="overflow-hidden rounded-xl border border-sidebar-border">
      <RecapVideoScene key={playbackKey} scene={scenes[index]} index={index} total={scenes.length} time={time} duration={duration} />
      <RecapVideoControls key={playbackKey} audioRef={audioRef} scene={scenes[index]} index={index} total={scenes.length}
        autoPlay={started} onDuration={setDuration}
        onEnded={() => { if (index < scenes.length - 1) move(index + 1, true); }}
        onPrevious={() => move(index - 1)} onNext={() => move(index + 1)}
        onReplay={() => { move(0, true); setReplay(value => value + 1); }}
      />
    </section>
  );
}