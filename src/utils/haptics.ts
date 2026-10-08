/**
 * Buzz `count` times via the Vibration API (Android). iOS has no way to buzz
 * without a tap, so timer-driven buzzes are Android-only; tap haptics on iOS
 * live in HapticButton.
 */
export function buzz(count = 1, gapMs = 120): void {
  try {
    const pattern = Array.from({ length: count * 2 - 1 }, (_, i) => (i % 2 ? gapMs : 40))
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration unavailable.
  }
}
