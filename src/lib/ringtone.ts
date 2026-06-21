// Synthesized telephone ringback tone using WebAudio.
// Produces the familiar "ring... ring..." cadence (2s on / 4s off) blending
// 440Hz + 480Hz tones, similar to standard telephony ringback.

export type Ringtone = { stop: () => void };

export function playRingback(): Ringtone {
  const AC: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = "sine";
  osc2.type = "sine";
  osc1.frequency.value = 440;
  osc2.frequency.value = 480;
  osc1.connect(master);
  osc2.connect(master);
  osc1.start();
  osc2.start();

  let stopped = false;
  const cadence = () => {
    if (stopped) return;
    const now = ctx.currentTime;
    // 2 seconds on
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
    master.gain.setValueAtTime(0.18, now + 1.95);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
    // schedule next cycle after 6s (2 on + 4 off)
    setTimeout(cadence, 6000);
  };
  cadence();

  return {
    stop: () => {
      stopped = true;
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      } catch {
        /* noop */
      }
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          ctx.close();
        } catch {
          /* noop */
        }
      }, 120);
    },
  };
}

// Short "connected" beep when the other side picks up.
export function playConnectChime() {
  try {
    const AC: typeof AudioContext =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(ctx.destination);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.18);
    o.connect(g);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* noop */
  }
}

// End-call descending tone.
export function playEndChime() {
  try {
    const AC: typeof AudioContext =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(ctx.destination);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(520, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.25);
    o.connect(g);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.stop(ctx.currentTime + 0.45);
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* noop */
  }
}
