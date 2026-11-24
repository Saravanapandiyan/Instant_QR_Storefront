/**
 * Customer Audio & Notification Service
 * Pure Web Audio API synthesized chimes + Haptic Vibration + Browser Notifications
 * Zero external audio assets required (100% reliable offline & in low connectivity)
 */

const NOTIFIED_ORDERS_KEY = 'iqr_notified_ready_orders';

let audioCtx: AudioContext | null = null;

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

// User-gesture unlocker for mobile browsers (iOS Safari, Android Chrome)
if (typeof window !== 'undefined') {
  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {
      // ignore
    }
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('touchstart', unlock);
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

/**
 * Checks if a sound notification has already been played for this order
 */
export function hasOrderBeenNotified(orderId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(NOTIFIED_ORDERS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(orderId);
  } catch {
    return false;
  }
}

/**
 * Marks an order as notified so the sound does not repeat every polling cycle
 */
export function markOrderAsNotified(orderId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(NOTIFIED_ORDERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(orderId)) {
      list.push(orderId);
      sessionStorage.setItem(NOTIFIED_ORDERS_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

/**
 * Synthesizes a joyful, bright 4-tone "Order Ready" chime:
 * Tone 1: C5  (523.25 Hz)
 * Tone 2: E5  (659.25 Hz)
 * Tone 3: G5  (783.99 Hz)
 * Tone 4: C6 (1046.50 Hz) with lingering bell resonance
 */
export function playOrderReadyChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.22, gain: 0.35 },
      { freq: 659.25, time: 0.12, dur: 0.22, gain: 0.4 },
      { freq: 783.99, time: 0.24, dur: 0.28, gain: 0.45 },
      { freq: 1046.5, time: 0.38, dur: 0.85, gain: 0.5 },
    ];

    notes.forEach(({ freq, time, dur, gain: vol }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Use triangle oscillator for warm chime harmonics
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gainNode.gain.setValueAtTime(0.001, now + time);
      gainNode.gain.exponentialRampToValueAtTime(vol, now + time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch (err) {
    console.warn('Customer ready chime failed:', err);
  }
}

/**
 * Triggers mobile device haptic vibration pattern
 */
export function triggerHapticVibrate(): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      // Vibrant double buzz pattern
      navigator.vibrate([250, 100, 250, 100, 400]);
    } catch {
      // vibration not allowed or supported
    }
  }
}

/**
 * Request notification permission if supported
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

/**
 * Triggers browser system notification if permission was granted
 */
export function sendBrowserNotification(
  title: string,
  body: string,
  icon?: string,
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: icon || '/favicon.png',
      badge: '/favicon.png',
      tag: 'order-status-ready',
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch {
    // ignore
  }
}

/**
 * Full notification dispatch for an order that is ready:
 * 1. Plays joyful 4-note chime
 * 2. Triggers phone vibration
 * 3. Sends system notification if granted
 * 4. Friendly optional voice prompt
 */
export function notifyCustomerOrderReady(options: {
  orderId: string;
  orderNumber: number;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: string | null;
  restaurantName?: string;
  forceSound?: boolean; // If true, plays even if already marked
}): void {
  const { orderId, orderNumber, orderType, tableNumber, forceSound } = options;

  if (!forceSound && hasOrderBeenNotified(orderId)) {
    return;
  }

  // 1. Play chime audio
  playOrderReadyChime();

  // 2. Trigger vibration
  triggerHapticVibrate();

  // 3. Browser system notification
  const bodyText =
    orderType === 'DINE_IN'
      ? `Hot food is being served to Table ${tableNumber || '-'}!`
      : 'Please collect your takeaway order at the pickup counter.';

  sendBrowserNotification(`🎉 Order #${orderNumber} is Ready!`, bodyText);

  // 4. Mark as notified so it does not chime repeatedly
  markOrderAsNotified(orderId);
}
