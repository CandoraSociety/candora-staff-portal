import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

export default function RecapVideoControls({ audioRef, scene, index, total, autoPlay, onDuration, onEnded, onPrevious, onNext, onReplay }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const button = 'flex items-center gap-1.5 rounded-lg bg-sidebar px-3 py-1.5 text-xs font-semibold text-sidebar-primary hover:opacity-80 disabled:opacity-30';
  return (
    <div className="space-y-2 border-t border-sidebar-border bg-sidebar-accent p-3 text-sidebar-foreground">
      <audio ref={audioRef} controls playsInline autoPlay={autoPlay} preload="metadata" src={scene.audioUrl}
        aria-label={`Recap scene ${index + 1}: ${scene.title}`} className="w-full"
        onLoadedMetadata={event => onDuration(event.currentTarget.duration || 0)}
        onCanPlay={() => setLoading(false)}
        onPlay={() => { setPlaying(true); setEnded(false); }} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setEnded(true); onEnded(); }}
        onError={() => { setLoading(false); setFailed(true); }}
      >Your browser does not support audio playback.</audio>
      <p className="text-center text-[11px] text-sidebar-foreground/75" role="status">
        {failed ? 'Narration could not load. Read this scene and use Next scene to continue.'
          : loading ? 'Loading scene narration…'
          : ended && index === total - 1 ? 'Recap finished. Replay a scene or continue to the quiz.'
          : playing ? 'The next scene starts when this narration finishes. Pause to read at your own pace.'
          : 'Press Play to listen. The points stay visible while paused.'}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button className={button} disabled={index === 0} onClick={onPrevious}><ArrowLeft className="h-3.5 w-3.5" /> Previous scene</button>
        <button className={button} onClick={onReplay}><RotateCcw className="h-3.5 w-3.5" /> Replay recap</button>
        <button className={button} disabled={index === total - 1} onClick={onNext}>Next scene <ArrowRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}