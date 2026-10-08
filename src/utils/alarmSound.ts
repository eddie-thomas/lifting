/**
 * The timer-finished alarm sound, as plain data so both the app (Web Audio,
 * see alert.ts) and `npm run play-alarm` (offline render) play the same thing.
 */

export interface Tone {
  /** Start, in seconds from the beginning of the cycle. */
  at: number
  frequency: number
  /** Peak gain, 0–1. */
  peak: number
  /** Seconds from start until it has faded out. */
  length: number
}

/** The alarm repeats this often (sound + buzz burst), until stopped. */
export const ALARM_PERIOD_MS = 2000

/** One alarm cycle: three short beeps. */
export const ALARM_TONES: Tone[] = [0, 1, 2].map((i) => ({ at: i * 0.35, frequency: 880, peak: 0.4, length: 0.25 }))

/** Seconds to ramp up to the peak; the rest of the length is the fade out. */
export const attackOf = (tone: Tone) => Math.min(0.02, tone.length / 4)

/** Gain is ramped exponentially from/to this instead of 0 (exp ramps can't hit 0). */
export const SILENT_GAIN = 0.0001
