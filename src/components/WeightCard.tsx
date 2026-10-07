import { useMemo } from 'react'
import { Box, Button, IconButton, Paper, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { LineChart, lineClasses } from '@mui/x-charts/LineChart'
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine'
import IosShareRounded from '@mui/icons-material/IosShareRounded'
import ScaleRounded from '@mui/icons-material/ScaleRounded'
import { PROJECTION_BLUE } from '../theme'
import { addDays, daysBetween, parseISODate, todayISO } from '../utils/date'
import { exportWeights } from '../utils/exportWeights'
import { analyzeWeights, type Weights } from '../utils/weightTrend'

/** How much history the chart shows before today. */
const HISTORY_DAYS = 90
/** Above this many visible weigh-ins, dots would overlap; draw the line alone. */
const MAX_MARKS = 45

interface Props {
  weights: Weights
  goal: number | null
  onLog: () => void
}

const lb = (n: number) => `${n.toFixed(1)} lb`

/** lb/day → signed "−1.2 lb/wk". */
function formatPace(slope: number): string {
  const perWeek = Math.round(slope * 7 * 10) / 10
  const sign = perWeek > 0 ? '+' : perWeek < 0 ? '−' : ''
  return `${sign}${Math.abs(perWeek).toFixed(1)} lb/wk`
}

const shortDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }} noWrap>
        {value}
      </Typography>
    </Box>
  )
}

/** Short line sample for the legend, matching how each series is drawn. */
function Swatch({ color, dotted }: { color: string; dotted?: boolean }) {
  return (
    <svg width="22" height="10" aria-hidden>
      <line
        x1="3"
        y1="5"
        x2="19"
        y2="5"
        stroke={color}
        strokeWidth={dotted ? 3 : 2}
        strokeLinecap="round"
        strokeDasharray={dotted ? '0 6' : undefined}
      />
      {!dotted && <circle cx="11" cy="5" r="3.5" fill={color} />}
    </svg>
  )
}

export default function WeightCard({ weights, goal, onLog }: Props) {
  const theme = useTheme()
  const today = todayISO()
  const analysis = useMemo(() => analyzeWeights(weights, goal, today), [weights, goal, today])
  const { points, slope, projection, goalDate, goalReached } = analysis
  const latest = points.at(-1)

  const chart = useMemo(() => {
    if (points.length === 0) return null
    const end = projection.at(-1)?.date ?? today
    const cutoff = addDays(today, -HISTORY_DAYS)
    let start = points[0].date > cutoff ? points[0].date : cutoff
    // Keep the axis at least a week wide so a single weigh-in still plots sensibly.
    const minStart = addDays(end, -6)
    if (start > minStart) start = minStart
    const projected = new Map(projection.map((p) => [p.date, p.weight]))
    const dates = Array.from({ length: daysBetween(start, end) + 1 }, (_, i) => addDays(start, i))
    const actual = dates.map((d) => weights[d] ?? null)
    const proj = dates.map((d) => projected.get(d) ?? null)

    const values = [...actual, ...proj].filter((v): v is number => v !== null)
    if (goal !== null) values.push(goal)
    return {
      x: dates.map(parseISODate),
      actual,
      proj,
      yMin: Math.floor(Math.min(...values) - 2),
      yMax: Math.ceil(Math.max(...values) + 2),
      markCount: actual.filter((v) => v !== null).length,
    }
  }, [points, projection, weights, goal, today])

  let goalText = 'Not set'
  if (goal !== null) {
    if (goalReached) goalText = 'Reached'
    else if (goalDate) goalText = shortDate(parseISODate(goalDate))
    else if (slope !== null) goalText = 'Off pace'
    else goalText = lb(goal)
  }

  let note: string | null = null
  if (latest && slope === null) {
    note =
      daysBetween(latest.date, today) > 14
        ? 'Log a weigh-in to refresh your projection.'
        : 'Log a few more days to see a projection.'
  }

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, pl: 0.5 }}>
          Weight
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {latest && (
            <IconButton size="small" aria-label="Export weights as CSV" onClick={() => exportWeights(weights)}>
              <IosShareRounded fontSize="small" />
            </IconButton>
          )}
          <Button size="small" variant="outlined" startIcon={<ScaleRounded />} onClick={onLog}>
            {weights[today] != null ? 'Edit today' : 'Log weight'}
          </Button>
        </Box>
      </Box>

      {!chart || !latest ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', px: 0.5, py: 2 }}>
          Weigh in each morning to see your trend and where it's heading.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 1, px: 0.5, mb: 1 }}>
            <Stat label="Trend" value={lb(latest.trend)} />
            <Stat label="Pace" value={slope === null ? '—' : formatPace(slope)} />
            <Stat label={goal === null ? 'Goal' : `Goal ${goal} lb`} value={goalText} />
          </Box>

          <LineChart
            height={220}
            hideLegend
            grid={{ horizontal: true }}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            xAxis={[
              {
                data: chart.x,
                scaleType: 'time',
                tickNumber: 4,
                // The 25px default leaves too little room, and labels that don't fit are dropped.
                height: 30,
                valueFormatter: (d: Date, ctx) =>
                  ctx.location === 'tick'
                    ? shortDate(d)
                    : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
              },
            ]}
            yAxis={[{ min: chart.yMin, max: chart.yMax, width: 40, tickNumber: 5 }]}
            series={[
              {
                id: 'actual',
                label: 'Weight',
                data: chart.actual,
                color: theme.palette.primary.main,
                connectNulls: true,
                curve: 'linear',
                showMark: chart.markCount <= MAX_MARKS,
                valueFormatter: (v) => (v === null ? null : lb(v)),
              },
              {
                id: 'projected',
                label: 'Projected',
                data: chart.proj,
                color: PROJECTION_BLUE,
                curve: 'linear',
                showMark: false,
                valueFormatter: (v) => (v === null ? null : lb(v)),
              },
            ]}
            sx={{
              // Solid dots with a ring in the card color so overlapping weigh-ins stay distinct.
              [`& .${lineClasses.mark}[data-series="actual"]`]: {
                r: 4,
                fill: theme.palette.primary.main,
                stroke: theme.palette.background.paper,
                strokeWidth: 1.5,
              },
              [`& .${lineClasses.line}[data-series="projected"]`]: {
                strokeDasharray: '0 7',
                strokeLinecap: 'round',
                strokeWidth: 3,
              },
            }}
          >
            {goal !== null && (
              <ChartsReferenceLine
                y={goal}
                label="Goal"
                labelAlign="start"
                lineStyle={{ stroke: theme.palette.text.secondary, strokeDasharray: '6 4', strokeWidth: 1 }}
                labelStyle={{ fill: theme.palette.text.secondary, fontSize: 11 }}
              />
            )}
          </LineChart>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, px: 0.5, mt: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Swatch color={theme.palette.primary.main} />
              <Typography variant="caption">Weigh-ins</Typography>
            </Box>
            {projection.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Swatch color={PROJECTION_BLUE} dotted />
                <Typography variant="caption">Projected (trend)</Typography>
              </Box>
            )}
          </Box>
          {note && (
            <Typography variant="caption" component="p" sx={{ color: 'text.secondary', px: 0.5, mt: 1 }}>
              {note}
            </Typography>
          )}
        </>
      )}
    </Paper>
  )
}
