import { useRef, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import PortalIntroLogo from '@/components/training/PortalIntroLogo';
import useIntroPlaybackClock from '@/components/training/useIntroPlaybackClock';

// The "What we've learned" wrap-up video. Same treatment as the module intro:
// a scene whose pacing comes from its static narration, so pausing, replaying
// or finishing the audio controls the visuals. The key points sit under the
// player so the learner can read them at their own pace afterwards.
export default function ModuleRecapVideo({ recap, moduleKey }) {
  const audioRef = useRef(null);
  const [replay, setReplay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const playbackKey = `${moduleKey}-recap:${replay}`;
  const time = useIntroPlaybackClock(audioRef, playbackKey);
  const delay = useTransform(time, value => `${-value}s`);
  const textStart = 4.7;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-sidebar-border">
        <div className="portal-intro-bg relative overflow-hidden px-5 pb-4 pt-4 text-center text-sidebar-foreground sm:px-8">
          <div className="portal-intro-blob portal-intro-blob-gold" aria-hidden="true" />
          <div className="portal-intro-blob portal-intro-blob-blue" aria-hidden="true" />
          <PortalIntroLogo time={time} first />
          <motion.div style={{ '--intro-time': delay }} className="relative min-w-0 pt-[140px]">
            <p style={{ '--intro-start': `${textStart}s` }} className="portal-intro-text-reveal text-xs font-semibold uppercase tracking-widest text-sidebar-primary">
              {recap.kicker}
            </p>
            <h4 className="mt-3 text-xl font-bold leading-snug break-words sm:text-2xl">
              {recap.title.split(' ').map((word, i) => (
                <span key={i} style={{ '--intro-start': `${textStart + 0.45 + i * 0.06}s` }} className="portal-intro-text-reveal inline-block">{word}{'\u00A0'}</span>
              ))}
            </h4>
            <div style={{ '--intro-start': `${textStart + 0.7}s` }} className="portal-intro-divider-reveal mx-auto my-2 h-1 w-24 rounded-full bg-sidebar-primary" />
            <p style={{ '--intro-start': `${textStart + 1.05}s` }} className="portal-intro-text-reveal mx-auto max-w-2xl text-base leading-relaxed break-words sm:text-lg">
              {recap.body}
            </p>
          </motion.div>
        </div>
        <div className="space-y-2 bg-sidebar-accent p-3 text-sidebar-foreground">
          <audio
            ref={audioRef}
            key={playbackKey}
            controls
            playsInline
            autoPlay
            preload="metadata"
            src={recap.audioUrl}
            aria-label={`Recap narration: ${recap.title}`}
            className="w-full"
            onLoadStart={() => { setLoading(true); setFailed(false); }}
            onCanPlay={() => setLoading(false)}
            onError={() => { setLoading(false); setFailed(true); }}
          >
            Your browser does not support audio playback.
          </audio>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-sidebar-foreground/80" role="status">
              {failed ? 'Narration could not load — read the recap above.' : loading ? 'Loading narration…' : 'Press Play to listen to the recap.'}
            </p>
            <button
              onClick={() => setReplay(value => value + 1)}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-sidebar px-2.5 py-1 text-[11px] font-semibold text-sidebar-primary hover:opacity-80"
            >
              <RotateCcw className="h-3 w-3" /> Replay
            </button>
          </div>
        </div>
      </div>

      {!!recap.takeaways?.length && (
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 px-3 py-2.5">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-sidebar-primary">Key points</p>
          <ul className="space-y-1">
            {recap.takeaways.map(point => (
              <li key={point} className="flex gap-1.5 text-xs leading-snug text-sidebar-foreground/90">
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}