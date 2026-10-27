import type { Settings } from '../types';
let audio: AudioContext | undefined;
export function playChime(s: Settings) {
  if (s.muted || s.quiet || s.volume <= 0) return;
  audio ??= new AudioContext(); void audio.resume();
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(660, audio.currentTime); oscillator.frequency.exponentialRampToValueAtTime(880, audio.currentTime + .15);
  gain.gain.setValueAtTime(.0001, audio.currentTime); gain.gain.exponentialRampToValueAtTime(s.volume * .08, audio.currentTime + .025); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .35);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .4); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
