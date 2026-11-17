// Text-to-speech via the Web Speech API. Speaker buttons are hidden when no German voice exists.
export const tts = $state<{ voices: SpeechSynthesisVoice[]; supported: boolean }>({ voices: [], supported: false });

function refresh() {
  if (typeof speechSynthesis === 'undefined') return;
  tts.voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('de'));
}

export function initTts() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  tts.supported = true;
  refresh();
  speechSynthesis.addEventListener?.('voiceschanged', refresh);
  // Some engines populate voices lazily without firing the event.
  setTimeout(refresh, 500);
  setTimeout(refresh, 2000);
}

export function speak(text: string, voiceName: string) {
  if (!tts.supported || !tts.voices.length) return;
  const u = new SpeechSynthesisUtterance(text);
  const v = tts.voices.find((x) => x.name === voiceName) ?? tts.voices.find((x) => x.lang === 'de-DE') ?? tts.voices[0];
  u.voice = v;
  u.lang = v.lang || 'de-DE';
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
