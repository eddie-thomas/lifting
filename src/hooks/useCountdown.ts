import { useCallback, useEffect, useRef, useState } from 'react'
import { usePersistentState } from './usePersistentState'

export type TimerStatus = 'ready' | 'running' | 'paused' | 'done'

export interface TimerState {
  status: TimerStatus
  durationMs: number
  /** Remaining time while ready/paused/done. */
  remainingMs: number
  /** Epoch ms the countdown hits zero; only set while running. */
  endsAt: number | null
}

const INITIAL: TimerState = { status: 'ready', durationMs: 0, remainingMs: 0, endsAt: null }

const minutesToMs = (min: number) => Math.max(0, min) * 60_000

/**
 * Persistent countdown. While running it stores the absolute `endsAt` time, so
 * reloads and backgrounded tabs stay accurate. If the time ran out while the
 * page was closed, it finishes on the next load.
 */
export function useCountdown(onComplete: () => void, onTick?: (secondsLeft: number) => void) {
  const [timer, setTimer] = usePersistentState<TimerState>('timer', INITIAL)
  const [now, setNow] = useState(() => Date.now())

  const onCompleteRef = useRef(onComplete)
  const onTickRef = useRef(onTick)
  useEffect(() => {
    onCompleteRef.current = onComplete
    onTickRef.current = onTick
  })
  // Guards against firing twice for the same run (e.g. StrictMode double effects).
  const firedForRef = useRef<number | null>(null)

  useEffect(() => {
    if (timer.status !== 'running' || timer.endsAt === null) return
    const endsAt = timer.endsAt
    let lastSecond: number | null = null
    let id: ReturnType<typeof setTimeout>
    const check = () => {
      const t = Date.now()
      if (t < endsAt) {
        setNow(t)
        const remaining = endsAt - t
        const second = Math.ceil(remaining / 1000)
        // Tick when the displayed second changes (not on start/resume).
        if (lastSecond !== null && second < lastSecond) onTickRef.current?.(second)
        lastSecond = second
        // Wake just after the next whole-second boundary.
        id = setTimeout(check, (remaining % 1000 || 1000) + 5)
        return
      }
      setTimer((prev) => ({ ...prev, status: 'done', remainingMs: 0, endsAt: null }))
      if (firedForRef.current !== endsAt) {
        firedForRef.current = endsAt
        onCompleteRef.current()
      }
    }
    check()
    return () => clearTimeout(id)
  }, [timer.status, timer.endsAt, setTimer])

  /** Load a duration in the ready state (does not start). */
  const load = useCallback(
    (minutes: number) => {
      const ms = minutesToMs(minutes)
      setTimer({ status: 'ready', durationMs: ms, remainingMs: ms, endsAt: null })
    },
    [setTimer],
  )

  /** Load a duration and start counting immediately. */
  const begin = useCallback(
    (minutes: number) => {
      const ms = minutesToMs(minutes)
      const t = Date.now()
      setNow(t)
      setTimer({ status: 'running', durationMs: ms, remainingMs: ms, endsAt: t + ms })
    },
    [setTimer],
  )

  /** Start or resume from the current remaining time. */
  const start = useCallback(() => {
    const t = Date.now()
    setNow(t)
    setTimer((prev) =>
      prev.remainingMs > 0 && (prev.status === 'ready' || prev.status === 'paused')
        ? { ...prev, status: 'running', endsAt: t + prev.remainingMs }
        : prev,
    )
  }, [setTimer])

  const pause = useCallback(() => {
    setTimer((prev) =>
      prev.status === 'running' && prev.endsAt !== null
        ? { ...prev, status: 'paused', remainingMs: Math.max(0, prev.endsAt - Date.now()), endsAt: null }
        : prev,
    )
  }, [setTimer])

  const remainingMs =
    timer.status === 'running' && timer.endsAt !== null
      ? Math.max(0, timer.endsAt - now)
      : timer.remainingMs

  return {
    status: timer.status,
    durationMs: timer.durationMs,
    remainingMs,
    load,
    begin,
    start,
    pause,
  }
}
