import { useLayoutEffect } from 'react';
import { useMotionValue } from 'framer-motion';

// The narration is the video's clock: pausing, seeking and replaying also
// pause, seek and restart its visuals, without a separate animation timer.
export default function useIntroPlaybackClock(audioRef, playbackKey) {
  const time = useMotionValue(0);
  useLayoutEffect(() => {
    time.set(0);
    const audio = audioRef.current;
    if (!audio) return;
    let frame;
    const sync = () => {
      cancelAnimationFrame(frame);
      time.set(audio.currentTime || 0);
      if (!audio.paused && !audio.ended) frame = requestAnimationFrame(sync);
    };
    const events = ['play', 'playing', 'pause', 'timeupdate', 'seeking', 'seeked', 'ended', 'loadedmetadata'];
    events.forEach(event => audio.addEventListener(event, sync));
    sync();
    return () => {
      cancelAnimationFrame(frame);
      events.forEach(event => audio.removeEventListener(event, sync));
    };
  }, [audioRef, playbackKey, time]);
  return time;
}