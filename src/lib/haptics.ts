// Light tactile feedback on key success moments. Uses the web Vibration API where
// available (Android/Chrome); a no-op elsewhere (iOS Safari ignores it gracefully).
export function haptic(pattern: number | number[] = 12) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
