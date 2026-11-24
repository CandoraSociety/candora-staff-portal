import { useCallback, useEffect, useRef, useState } from 'react';

// One audio element drives the whole guide. The playlist is the flat list of
// clips; a queue is the run of clips being played - the whole guide, one question,
// one thematic category, the key message or the quick reference. Every clip is
// followed by its own pause, which is what gives the briefing its deliberate pace
// and lets the reader follow the point being spoken.
export default function useGuideAudio(playlist) {
  const elRef = useRef(null);
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;
  const queueRef = useRef([]);
  const posRef = useRef(0);
  const rateRef = useRef(1);
  const timerRef = useRef(null);

  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playPos = useCallback((pos) => {
    const el = elRef.current;
    const index = queueRef.current[pos];
    const item = playlistRef.current[index];
    if (!el || !item?.url) { setPlaying(false); return; }
    clearTimer();
    posRef.current = pos;
    setCurrent(index);
    el.src = item.url;
    el.playbackRate = rateRef.current;
    setTime(0);
    setDuration(0);
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [clearTimer]);

  const playPosRef = useRef(playPos);
  playPosRef.current = playPos;

  useEffect(() => {
    const el = new Audio();
    el.preload = 'metadata';
    elRef.current = el;

    const onTime = () => setTime(el.currentTime || 0);
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      const item = playlistRef.current[queueRef.current[posRef.current]];
      const nextPos = posRef.current + 1;
      if (nextPos >= queueRef.current.length) { setPlaying(false); return; }
      // The written pause, shortened only when the listener speeds playback up.
      const wait = Math.max(0, (item?.pauseAfterMs || 0) / (rateRef.current || 1));
      if (!wait) { playPosRef.current(nextPos); return; }
      timerRef.current = setTimeout(() => playPosRef.current(nextPos), wait);
    };

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);

    return () => {
      el.pause();
      clearTimer();
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      elRef.current = null;
    };
  }, [clearTimer]);

  const playIndices = useCallback((indices) => {
    const list = (indices || []).filter((index) => playlistRef.current[index]?.url);
    if (!list.length) return;
    queueRef.current = list;
    playPos(0);
  }, [playPos]);

  const playAll = useCallback(() => {
    playIndices(playlistRef.current.map((_, index) => index));
  }, [playIndices]);

  const toggle = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    if (playing) { clearTimer(); el.pause(); return; }
    if (!queueRef.current.length) { playAll(); return; }
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [playing, playAll, clearTimer]);

  const next = () => {
    const pos = posRef.current + 1;
    if (pos < queueRef.current.length) playPos(pos);
  };

  const prev = () => {
    const pos = posRef.current - 1;
    if (pos >= 0) playPos(pos);
  };

  const restart = () => {
    const el = elRef.current;
    if (!el) return;
    clearTimer();
    el.currentTime = 0;
    if (!playing) el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const seek = (delta) => {
    const el = elRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.min(el.duration, Math.max(0, el.currentTime + delta));
  };

  const seekTo = (seconds) => {
    const el = elRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.min(el.duration, Math.max(0, seconds));
  };

  const setRate = (value) => {
    rateRef.current = value;
    setRateState(value);
    if (elRef.current) elRef.current.playbackRate = value;
  };

  const item = current >= 0 ? playlist[current] : null;

  // Lock-screen and headphone controls where the device supports them.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !item) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${item.sectionLabel} · ${item.categoryLabel}`,
      artist: 'Candora Society',
      album: 'Interview preparation',
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const pos = posRef.current - 1;
      if (pos >= 0) playPosRef.current(pos);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const pos = posRef.current + 1;
      if (pos < queueRef.current.length) playPosRef.current(pos);
    });
  }, [item]);

  return {
    current,
    item,
    playing,
    time,
    duration,
    rate,
    playIndices,
    playAll,
    toggle,
    next,
    prev,
    restart,
    seek,
    seekTo,
    setRate,
  };
}