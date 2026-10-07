import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser'
import raw from '../workouts.jsonc?raw'
import type { Workout, WorkoutDay } from '../types'

export interface LoadedWorkouts {
  /** Keyed by "YYYY-MM-DD". */
  byDate: Map<string, WorkoutDay>
  /** Highest summed intensity across all non-rest days (0 if none). */
  maxIntensity: number
  error: string | null
}

export function dayIntensity(day: WorkoutDay | undefined): number {
  if (!day || day.rest_day) return 0
  return (day.workout ?? []).reduce((sum, w) => sum + (w.intensity || 0), 0)
}

/** Workouts sorted by `order`, with the active one moved to the top. */
export function sortedWorkouts(day: WorkoutDay | undefined, activeOrder: number | null): Workout[] {
  const list = [...(day?.workout ?? [])].sort((a, b) => a.order - b.order)
  if (activeOrder === null) return list
  const idx = list.findIndex((w) => w.order === activeOrder)
  if (idx > 0) list.unshift(...list.splice(idx, 1))
  return list
}

function lineOf(offset: number): number {
  return raw.slice(0, offset).split('\n').length
}

export function loadWorkouts(): LoadedWorkouts {
  const errors: ParseError[] = []
  const data: unknown = parse(raw, errors, { allowTrailingComma: true })

  let error: string | null = null
  let days: WorkoutDay[] = []

  if (errors.length > 0) {
    const first = errors[0]
    error = `workouts.jsonc has a syntax error near line ${lineOf(first.offset)} (${printParseErrorCode(first.error)}).`
  } else if (!Array.isArray(data)) {
    error = 'workouts.jsonc must contain an array of days.'
  } else {
    days = data as WorkoutDay[]
  }
  if (error) console.error(error)

  const byDate = new Map<string, WorkoutDay>()
  for (const day of days) {
    if (day && typeof day.date === 'string') byDate.set(day.date, day)
  }

  let maxIntensity = 0
  for (const day of byDate.values()) {
    maxIntensity = Math.max(maxIntensity, dayIntensity(day))
  }

  return { byDate, maxIntensity, error }
}
