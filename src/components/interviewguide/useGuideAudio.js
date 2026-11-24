import { useCallback, useEffect, useRef, useState } from 'react';

// One audio element drives the whole guide. Sections play in order, so
// "listen to everything" and "listen to one question" share the same player.
export default function useGuideAudio(sections) {
  const audioRef = useRef(null);
  const indexRef = useRef(-1);
  const rateRef = useRef(1);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);

  const playAt = useCallback((i) => {
    const el = audioRef.current;
    const section = sectionsRef.current[i];
    if (!el || !section?.url) { setPlaying(false); return; }
    if (indexRef.current !== i) {
      el.src = section.url;
      indexRef.current = i;
      setIndex(i);
      setTime(0);
      setDuration(0);
    }
    el.playbackRate = rateRef.current;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const playAtRef = useRef(playAt);
  playAtRef.current = playAt;

  useEffect(() => {
    const el = new Audio();
    el.preload = 'metadata';
    audioRef.current = el;

    const onTime = () => setTime(el.currentTime || 0);
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      const next = indexRef.current + 1;
      if (next < sectionsRef.current.length) playAtRef.current(next);
      else setPlaying(false);
    };

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);

    return () => {
      el.pause();
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, []);

  const current = sections[index];

  // Lock-screen and headphone controls where the device supports them.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.label,
      artist: 'Candora Society',
      album: 'Interview preparation',
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => playAtRef.current(Math.max(0, indexRef.current - 1)));
    navigator.mediaSession.setActionHandler('nexttrack', () => playAtRef.current(Math.min(sections.length - 1, indexRef.current + 1)));
  }, [current, sections.length]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); return; }
    if (indexRef.current === -1) { playAt(0); return; }
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const next = () => playAt(Math.min(sections.length - 1, indexRef.current + 1));
  const prev = () => playAt(Math.max(0, indexRef.current - 1));

  const seek = (delta) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.min(el.duration, Math.max(0, el.currentTime + delta));
  };

  const seekTo = (seconds) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    el.currentTime = Math.min(el.duration, Math.max(0, seconds));
  };

  const restart = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    if (!playing) el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const setRate = (value) => {
    rateRef.current = value;
    setRateState(value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  };

  return {
    index,
    section: current,
    playing,
    time,
    duration,
    rate,
    playAt,
    toggle,
    next,
    prev,
    seek,
    seekTo,
    restart,
    setRate,
  };
}