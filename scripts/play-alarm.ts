/**
 * Preview the timer-finished alarm sound on repeat, as the app plays it.
 * Renders one alarm cycle to a WAV and loops it until Ctrl+C.
 *
 *   npm run play-alarm
 *
 * Edit src/utils/alarmSound.ts to change the sound (the app uses it too).
 */
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ALARM_PERIOD_MS, ALARM_TONES, SILENT_GAIN, attackOf } from '../src/utils/alarmSound.ts'

const RATE = 44_100

/** Web Audio's exponentialRampToValueAtTime between (t0, v0) and (t1, v1). */
const expRamp = (t: number, t0: number, v0: number, t1: number, v1: number) =>
  v0 * (v1 / v0) ** ((t - t0) / (t1 - t0))

function renderCycle(): Float32Array {
  const samples = new Float32Array(Math.round((ALARM_PERIOD_MS / 1000) * RATE))
  for (const tone of ALARM_TONES) {
    const attack = attackOf(tone)
    const first = Math.round(tone.at * RATE)
    const count = Math.round(tone.length * RATE)
    for (let i = 0; i < count && first + i < samples.length; i++) {
      const t = i / RATE
      const gain =
        t < attack
          ? expRamp(t, 0, SILENT_GAIN, attack, tone.peak)
          : expRamp(t, attack, tone.peak, tone.length, SILENT_GAIN)
      samples[first + i] += gain * Math.sin(2 * Math.PI * tone.frequency * t)
    }
  }
  return samples
}

function toWav(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2))
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16) // fmt chunk size
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE * 2, 28) // byte rate
  header.writeUInt16LE(2, 32) // block align
  header.writeUInt16LE(16, 34) // bits per sample
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const file = join(tmpdir(), 'lifting-alarm.wav')
writeFileSync(file, toWav(renderCycle()))

// First player found wins (Linux PipeWire/Pulse/ALSA, macOS, ffmpeg).
const PLAYERS: [string, string[]][] = [
  ['pw-play', [file]],
  ['paplay', [file]],
  ['aplay', ['-q', file]],
  ['afplay', [file]],
  ['ffplay', ['-nodisp', '-autoexit', '-loglevel', 'quiet', file]],
]
const player = PLAYERS.find(([cmd]) => spawnSync('which', [cmd]).status === 0)
if (!player) {
  console.error(`No audio player found. Open ${file} yourself.`)
  process.exit(1)
}

console.log(`Playing the alarm every ${ALARM_PERIOD_MS / 1000}s with ${player[0]}. Ctrl+C to stop.`)
for (;;) {
  const { status, signal } = spawnSync(player[0], player[1], { stdio: 'inherit' })
  if (signal || status !== 0) break
}
