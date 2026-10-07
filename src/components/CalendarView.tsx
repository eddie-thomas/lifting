import { Box, Button, ButtonBase, IconButton, Paper, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import TodayRounded from '@mui/icons-material/TodayRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import type { LoadedWorkouts } from '../data/loadWorkouts'
import { dayIntensity } from '../data/loadWorkouts'
import { INTENSITY_RED } from '../theme'
import { formatMonth, monthGrid, shiftMonth, todayISO } from '../utils/date'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface Props {
  data: LoadedWorkouts
  month: string
  onMonthChange: (month: string) => void
  selectedDate: string | null
  completed: Record<string, number[]>
  onOpenDay: (date: string) => void
}

export default function CalendarView({ data, month, onMonthChange, selectedDate, completed, onOpenDay }: Props) {
  const today = todayISO()
  const grid = monthGrid(month)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<TodayRounded />}
        onClick={() => onOpenDay(today)}
        sx={{ py: 1.5, fontSize: '1.05rem' }}
      >
        Go to today's workout
      </Button>

      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Previous month">
            <ChevronLeftRounded />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {formatMonth(month)}
          </Typography>
          <IconButton onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Next month">
            <ChevronRightRounded />
          </IconButton>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.5, sm: 0.75 } }}>
          {WEEKDAYS.map((d, i) => (
            <Typography
              key={i}
              variant="caption"
              sx={{ textAlign: 'center', color: 'text.secondary', fontWeight: 600, pb: 0.5 }}
            >
              {d}
            </Typography>
          ))}

          {grid.map(({ iso, day, inMonth }) => {
            const entry = data.byDate.get(iso)
            const intensity = dayIntensity(entry)
            const ratio = data.maxIntensity > 0 ? intensity / data.maxIntensity : 0
            const workoutCount = entry && !entry.rest_day ? (entry.workout?.length ?? 0) : 0
            const allDone = workoutCount > 0 && (completed[iso]?.length ?? 0) >= workoutCount
            const isToday = iso === today
            const isSelected = iso === selectedDate

            return (
              <ButtonBase
                key={iso}
                onClick={() => onOpenDay(iso)}
                aria-label={iso}
                sx={{
                  aspectRatio: '1',
                  minHeight: 44,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: intensity > 0 ? alpha(INTENSITY_RED, 0.15 + 0.7 * ratio) : 'rgba(255,255,255,0.03)',
                  opacity: inMonth ? 1 : 0.35,
                  outline: isSelected ? '2px solid rgba(255,255,255,0.35)' : 'none',
                  outlineOffset: -2,
                  position: 'relative',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: isToday ? 800 : 500,
                    fontSize: '0.95rem',
                    color: isToday ? '#fff' : 'text.primary',
                    textDecoration: isToday ? 'underline' : 'none',
                    textDecorationThickness: '2px',
                    textUnderlineOffset: '4px',
                  }}
                >
                  {day}
                </Typography>
                {entry?.rest_day && (
                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1, mt: 0.25 }}>
                    rest
                  </Typography>
                )}
                {allDone && (
                  <CheckRounded sx={{ position: 'absolute', top: 2, right: 2, fontSize: 12, color: '#fff' }} />
                )}
              </ButtonBase>
            )
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Easier
          </Typography>
          {[0.15, 0.32, 0.5, 0.67, 0.85].map((a) => (
            <Box key={a} sx={{ width: 16, height: 16, borderRadius: 0.75, bgcolor: alpha(INTENSITY_RED, a) }} />
          ))}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Harder
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
