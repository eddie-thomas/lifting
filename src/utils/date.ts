const pad = (n: number) => String(n).padStart(2, '0')

/** Local-time "YYYY-MM-DD" (toISOString would shift to UTC). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse "YYYY-MM-DD" as a LOCAL date (new Date("YYYY-MM-DD") parses as UTC). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = () => toISODate(new Date())

/** "YYYY-MM" key for the month containing `iso`. */
export const monthKey = (iso: string) => iso.slice(0, 7)

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export interface GridDay {
  iso: string
  day: number
  inMonth: boolean
}

/** 6x7 grid of days (Sunday-first) covering the given "YYYY-MM" month. */
export function monthGrid(key: string): GridDay[] {
  const [y, m] = key.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const start = new Date(y, m - 1, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === m - 1 }
  })
}

export function formatMonth(key: string): string {
  return parseISODate(`${key}-01`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/** Milliseconds → "HH:MM:SS" (rounded up so 0.4s left still shows 00:00:01). */
export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}
