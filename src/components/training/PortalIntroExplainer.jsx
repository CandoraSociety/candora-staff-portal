import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortalIntroScene from '@/components/training/PortalIntroScene';
import useIntroPlaybackClock from '@/components/training/useIntroPlaybackClock';
import { getModuleIntroScenes } from '@/lib/training/portalIntroContent';

export default function PortalIntroExplainer({ moduleKey }) {
  const scenes = getModuleIntroScenes(moduleKey);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [replay, setReplay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef(null);
  const playbackKey = `${moduleKey}:${index}:${replay}`;
  const time = useIntroPlaybackClock(audioRef, playbackKey);
  if (!scenes) return null;
  const scene = scenes[index];
  const advance = () => index < scenes.length - 1 ? setIndex(index + 1) : setStarted(false);
  return (
    <section aria-label="Module introduction" className="mb-2 rounded-xl border border-sidebar-border overflow-hidden">
      <PortalIntroScene scene={scene} index={index} total={scenes.length} time={time} />
      <div className="bg-sidebar-accent text-sidebar-foreground p-3 space-y-2">
        <audio
          ref={audioRef} key={playbackKey} controls playsInline autoPlay={started} preload="metadata"
          src={scene.audioUrl} aria-label={`Female narration: ${scene.title}`} className="w-full"
          onPlay={() => setStarted(true)} onEnded={advance}
          onLoadStart={() => { setLoading(true); setFailed(false); }}
          onCanPlay={() => setLoading(false)}
          onError={() => { setLoading(false); setFailed(true); }}
        >Your browser does not support audio playback.</audio>
        <p className="text-xs text-center text-sidebar-foreground/80" role="status">
          {failed ? 'Narration could not load. Read the scene above and use Next scene to continue.' : loading ? 'Loading narration…' : 'Press Play to listen. Each scene stays on screen until its narration has finished.'}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="secondary" size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Previous scene
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setIndex(0); setStarted(true); setReplay(value => value + 1); }}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Replay
          </Button>
          <Button variant="secondary" size="sm" disabled={index === scenes.length - 1} onClick={() => setIndex(index + 1)}>
            Next scene <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}