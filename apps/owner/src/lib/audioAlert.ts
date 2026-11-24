// Audio alert synthesizer using Web Audio API (zero external assets required)
const STORAGE_MUTE_KEY = 'instant_qr_sound_muted';

let audioCtx: AudioContext | null = null;
let alarmIntervalId: any = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// User-gesture unlocker
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('keydown', unlock);
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_MUTE_KEY) === 'true';
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_MUTE_KEY, muted ? 'true' : 'false');
  if (muted) {
    stopContinuousAlarm();
  }
}

export function playOrderChimeOnce(): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Dual-tone melodic bell: Tone 1 (D5 = 587.33Hz), Tone 2 (A5 = 880Hz)
    const now = ctx.currentTime;

    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.55, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (higher bell ring)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0.65, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn('Unable to play audio chime:', err);
  }
}

export function startContinuousAlarm(): void {
  if (isSoundMuted() || alarmIntervalId) return;
  playOrderChimeOnce();
  alarmIntervalId = setInterval(() => {
    if (isSoundMuted()) {
      stopContinuousAlarm();
      return;
    }
    playOrderChimeOnce();
  }, 2800);
}

export function stopContinuousAlarm(): void {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

export function isAlarmRunning(): boolean {
  return alarmIntervalId !== null;
}

// ==========================================
// TV Order Ready Board: Triple-Tone Chime & Voice Callout
// ==========================================
const STORAGE_VOICE_KEY = 'instant_qr_voice_muted';

export function isVoiceMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_VOICE_KEY) === 'true';
}

export function setVoiceMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_VOICE_KEY, muted ? 'true' : 'false');
  if (muted && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Bright, joyful triple-tone pickup bell chime:
 * Tone 1: C5 (523.25 Hz)
 * Tone 2: E5 (659.25 Hz)
 * Tone 3: G5 (783.99 Hz)
 */
export function playReadyChime(): void {
  if (isSoundMuted()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.25 },
      { freq: 659.25, time: 0.12, dur: 0.25 },
      { freq: 783.99, time: 0.24, dur: 0.55 },
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.3, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch (err) {
    console.warn('Unable to play ready chime:', err);
  }
}

// Queue for speech announcements so consecutive orders don't speak over each other
const speechQueue: string[] = [];
let isSpeaking = false;

function processSpeechQueue() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (isSpeaking || speechQueue.length === 0) return;

  if (isVoiceMuted()) {
    speechQueue.length = 0;
    return;
  }

  const text = speechQueue.shift();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95; // slightly slower for clear broadcast acoustics in dining rooms
  utterance.pitch = 1.05; // clear, friendly pitch

  // Pick an English voice if available
  const voices = window.speechSynthesis.getVoices();
  const englishVoice =
    voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0];

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  isSpeaking = true;
  utterance.onend = () => {
    isSpeaking = false;
    setTimeout(processSpeechQueue, 350); // slight pause between announcements
  };
  utterance.onerror = () => {
    isSpeaking = false;
    setTimeout(processSpeechQueue, 200);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Announces that an order is ready for pickup with bell chime + speech
 */
export function speakOrderReady(orderNumber: number, customerName?: string | null): void {
  // Always trigger the melodic chime
  playReadyChime();

  if (isVoiceMuted() || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const cleanName = customerName?.trim();
  const announcement = cleanName
    ? `Order number ${orderNumber} for ${cleanName}, is ready for pickup.`
    : `Order number ${orderNumber}, is ready for pickup.`;

  speechQueue.push(announcement);
  // Short delay so the triple-tone chime plays before speech starts
  setTimeout(() => {
    processSpeechQueue();
  }, 400);
}
