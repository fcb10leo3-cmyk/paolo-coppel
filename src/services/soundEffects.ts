// Sound & Vibration notification engine for Mobile Employee App and Kiosk
class SoundEffectsService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Dual-tone urgent alert chime (like a store pager / radio call)
  public playEmergencyAlert() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Play 3 rapid beeps (high urgency chime)
      const freqs = [880, 1046, 1318, 880, 1046, 1318];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.12);
      });

      // Vibrate mobile device if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }
    } catch (e) {
      console.warn('Sound effect error:', e);
    }
  }

  // Gentle confirmation chime (when request is accepted or resolved)
  public playSuccessChime() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.26);
      });

      if ('vibrate' in navigator) {
        navigator.vibrate(120);
      }
    } catch (e) {
      console.warn('Sound effect error:', e);
    }
  }

  // Request browser Web Push notification permission
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    const res = await Notification.requestPermission();
    return res === 'granted';
  }

  // Trigger local mobile browser push notification
  public showBrowserNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'coppel-assistance',
        });
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
  }
}

export const soundEffects = new SoundEffectsService();
