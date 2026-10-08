import { useEffect } from 'react'

/**
 * Keep the screen on while `active`. iOS suspends the page (timers and audio)
 * once the screen locks, so this keeps the ticks and end beep on time. The
 * lock is dropped whenever the page is hidden, so re-request it on return.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) void next.release()
        else lock = next
      } catch {
        // Denied or unsupported (e.g. low power mode); the screen may dim.
      }
    }

    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      void lock?.release().catch(() => {})
    }
  }, [active])
}
