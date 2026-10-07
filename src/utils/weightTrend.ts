import { addDays, daysBetween } from './date'

/** Weigh-ins in lb, keyed by "YYYY-MM-DD". */
export type Weights = Record<string, number>

/** Per-day EMA smoothing (Hacker's Diet / Libra default): each reading moves the trend 10% toward it. */
const ALPHA = 0.1
/** On a steady slope the (fully warmed-up) EMA trails the true weight by this many days' worth of change. */
const EMA_LAG_DAYS = (1 - ALPHA) / ALPHA
/** The velocity regression only looks at this many days before the latest weigh-in. */
const VELOCITY_WINDOW_DAYS = 21
const MIN_POINTS = 5
const MIN_SPAN_DAYS = 7
/** Don't project from data this old; the pace has probably changed. */
const STALE_AFTER_DAYS = 14
const DEFAULT_HORIZON_DAYS = 30
const MAX_HORIZON_DAYS = 120
const MAX_ETA_DAYS = 730

export interface TrendPoint {
  date: string
  weight: number
  /** Smoothed (EMA) weight as of this weigh-in. */
  trend: number
}

export interface WeightAnalysis {
  points: TrendPoint[]
  /** lb/day, or null when there's too little recent data to trust a pace. */
  slope: number | null
  /** Daily projected weights starting today; empty when `slope` is null. */
  projection: { date: string; weight: number }[]
  /** When the projection crosses the goal, or null if not on pace (or no goal). */
  goalDate: string | null
  goalReached: boolean
}

/**
 * Time-aware EMA: a gap of `d` days applies `d` days' worth of decay, so skipped
 * mornings don't make a single reading count for more than it should.
 */
export function computeTrend(weights: Weights): TrendPoint[] {
  const points: TrendPoint[] = []
  for (const date of Object.keys(weights).sort()) {
    const weight = weights[date]
    const prev = points.at(-1)
    const trend = prev ? prev.trend + (1 - (1 - ALPHA) ** daysBetween(prev.date, date)) * (weight - prev.trend) : weight
    points.push({ date, weight, trend })
  }
  return points
}

/**
 * Least-squares slope (lb/day) of the last few weeks of weigh-ins. Fitting the raw
 * readings rather than the EMA avoids the EMA's warm-up lag, which understates the
 * pace for the first month; 3+ weeks of points already average out daily noise.
 */
export function recentSlope(points: TrendPoint[]): number | null {
  const last = points.at(-1)
  if (!last) return null
  const recent = points.filter((p) => daysBetween(p.date, last.date) <= VELOCITY_WINDOW_DAYS)
  if (recent.length < MIN_POINTS || daysBetween(recent[0].date, last.date) < MIN_SPAN_DAYS) return null

  const xs = recent.map((p) => daysBetween(last.date, p.date))
  const meanX = xs.reduce((s, x) => s + x, 0) / xs.length
  const meanY = recent.reduce((s, p) => s + p.weight, 0) / recent.length
  let num = 0
  let den = 0
  recent.forEach((p, i) => {
    num += (xs[i] - meanX) * (p.weight - meanY)
    den += (xs[i] - meanX) ** 2
  })
  return den === 0 ? null : num / den
}

export function analyzeWeights(weights: Weights, goal: number | null, today: string): WeightAnalysis {
  const points = computeTrend(weights)
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return { points, slope: null, projection: [], goalDate: null, goalReached: false }

  // Direction is set by where you started relative to the goal (losing vs. gaining).
  const direction = goal === null ? 0 : Math.sign(goal - first.weight)
  const goalReached = goal !== null && (goal - last.trend) * direction <= 0

  const age = Math.max(0, daysBetween(last.date, today))
  const slope = age <= STALE_AFTER_DAYS ? recentSlope(points) : null
  if (slope === null) return { points, slope, projection: [], goalDate: null, goalReached }

  // Start from the smoothed weight, shifted forward by the EMA's lag so the
  // projection doesn't begin a week-plus behind where you actually are. The EMA is
  // seeded at the first weigh-in, so its lag only builds up to EMA_LAG_DAYS over time.
  const warmup = 1 - (1 - ALPHA) ** daysBetween(first.date, last.date)
  const level = last.trend + slope * EMA_LAG_DAYS * warmup
  let goalDate: string | null = null
  if (goal !== null && !goalReached && slope !== 0) {
    const daysToGoal = (goal - level) / slope
    if (daysToGoal > 0 && daysToGoal <= MAX_ETA_DAYS) {
      goalDate = addDays(last.date, Math.max(age, Math.ceil(daysToGoal)))
    }
  }

  const start = level + slope * age
  const horizon = goalDate
    ? Math.min(MAX_HORIZON_DAYS, Math.max(7, daysBetween(today, goalDate)))
    : DEFAULT_HORIZON_DAYS
  const projection = Array.from({ length: horizon + 1 }, (_, i) => ({
    date: addDays(today, i),
    weight: start + slope * i,
  }))

  return { points, slope, projection, goalDate, goalReached }
}
