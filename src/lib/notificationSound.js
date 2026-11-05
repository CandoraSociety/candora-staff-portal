// Short two-tone chime for new mail. Generated in the browser so there is no
// audio file to load — browsers only allow sound after an interaction, so the
// engine is warmed up on the first click or keypress anywhere in the portal.

let audioContext = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) audioContext = new AudioCtx();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

export function primeNotificationSound() {
  getAudioContext();
}

export function playMailChime() {
  const audio = getAudioContext();
  if (!audio || audio.state !== 'running') return;

  const now = audio.currentTime;
  [
    [880, 0],
    [1174.66, 0.13],
  ].forEach(([frequency, offset]) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.3);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.34);
  });
}