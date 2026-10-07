let ctx: AudioContext | null = null

/**
 * Create/resume the AudioContext. Must be called from a user gesture (the Play
 * tap) so mobile browsers allow the completion beep to play later.
 */
export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // Audio unavailable; the alert just won't beep.
  }
}

function beep(): void {
  if (!ctx) return
  const start = ctx.currentTime
  // Three short tones.
  for (let i = 0; i < 3; i++) {
    const t = start + i * 0.35
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.26)
  }
}

/** Vibrate (where supported; not on iOS) and beep. */
export function timerFinishedAlert(): void {
  try {
    navigator.vibrate?.([300, 150, 300])
  } catch {
    // ignore
  }
  try {
    beep()
  } catch {
    // ignore
  }
}
