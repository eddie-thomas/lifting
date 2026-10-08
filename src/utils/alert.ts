import { ALARM_PERIOD_MS, ALARM_TONES, SILENT_GAIN, attackOf, type Tone } from './alarmSound'
import { buzz } from './haptics'

let ctx: AudioContext | null = null

/** Safari's Audio Session API (not in the TS DOM lib yet). */
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

/**
 * Create/resume the AudioContext. Must be called from a user gesture (the Play
 * tap) so mobile browsers allow the ticks and completion beep to play later.
 */
export function unlockAudio(): void {
  try {
    // 'playback' keeps sounds audible with the iPhone silent switch on (at the
    // cost of interrupting music from other apps).
    const session = (navigator as AudioSessionNavigator).audioSession
    if (session) session.type = 'playback'
  } catch {
    // ignore
  }
  try {
    if (!ctx) {
      ctx = new AudioContext()
      // A one-sample silent buffer fully unlocks audio on iOS.
      const src = ctx.createBufferSource()
      src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
      src.connect(ctx.destination)
      src.start()
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // Audio unavailable; the timer just won't make sound.
  }
}

/** Play `tone`, offset from audio-clock time `start`. */
function play(tone: Tone, start: number): void {
  if (!ctx) return
  const t = start + tone.at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = tone.frequency
  gain.gain.setValueAtTime(SILENT_GAIN, t)
  gain.gain.exponentialRampToValueAtTime(tone.peak, t + attackOf(tone))
  gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, t + tone.length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + tone.length + 0.01)
}

const TICK_TONE: Tone = { at: 0, frequency: 1200, peak: 0.15, length: 0.025 }

/** A short, quiet click (and a light buzz on Android) for each second of the countdown. */
export function tick(): void {
  try {
    if (ctx) play(TICK_TONE, ctx.currentTime)
  } catch {
    // ignore
  }
  buzz()
}

function beep(): void {
  if (!ctx) return
  const start = ctx.currentTime
  for (const tone of ALARM_TONES) play(tone, start)
}

const ALARM_BUZZES = 6
const ALARM_BUZZ_GAP_MS = 100

function alarmCycle(): void {
  buzz(ALARM_BUZZES, ALARM_BUZZ_GAP_MS)
  try {
    beep()
  } catch {
    // ignore
  }
}

/**
 * Timer-finished alarm: the beep (plus a burst of buzzes on Android), a pause,
 * and again, until the returned stop function is called.
 */
export function startAlarm(): () => void {
  alarmCycle()
  const id = setInterval(alarmCycle, ALARM_PERIOD_MS)
  return () => {
    clearInterval(id)
    try {
      navigator.vibrate?.(0)
    } catch {
      // ignore
    }
  }
}
