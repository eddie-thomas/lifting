import type { ReactNode } from 'react'
import { Box, Button, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
import DirectionsRunRounded from '@mui/icons-material/DirectionsRunRounded'
import HotelRounded from '@mui/icons-material/HotelRounded'
import EventBusyRounded from '@mui/icons-material/EventBusyRounded'
import ScaleRounded from '@mui/icons-material/ScaleRounded'
import type { ActiveWorkout, Workout, WorkoutDay } from '../types'
import { dayIntensity, sortedWorkouts } from '../data/loadWorkouts'
import { formatLongDate, todayISO } from '../utils/date'
import WorkoutCard from './WorkoutCard'

interface Props {
  date: string
  day: WorkoutDay | undefined
  active: ActiveWorkout | null
  completedOrders: number[]
  /** The TimerPanel, rendered above the workout stack. */
  timer: ReactNode
  onStartWorkout: (workout: Workout) => void
  ran: boolean
  onToggleRan: () => void
  /** This day's weigh-in in lb, if logged. */
  weight: number | undefined
  onLogWeight: () => void
}

function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, textAlign: 'center' }}>
      <Box sx={{ color: 'text.secondary', '& svg': { fontSize: 48 } }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {subtitle}
      </Typography>
    </Paper>
  )
}

export default function DayView({
  date,
  day,
  active,
  completedOrders,
  timer,
  onStartWorkout,
  ran,
  onToggleRan,
  weight,
  onLogWeight,
}: Props) {
  const isToday = date === todayISO()
  const isFuture = date > todayISO()
  const activeOrder = active?.date === date ? active.order : null
  const workouts = sortedWorkouts(day, activeOrder)
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration || 0), 0)

  let body: ReactNode
  if (day?.rest_day) {
    body = <EmptyState icon={<HotelRounded />} title="Rest day" subtitle="Recover, hydrate, and sleep well." />
  } else if (workouts.length === 0) {
    body = <EmptyState icon={<EventBusyRounded />} title="Nothing scheduled" subtitle="No workouts for this day." />
  } else {
    body = (
      <>
        {timer}
        <Stack spacing={1.5}>
          {workouts.map((w) => (
            <WorkoutCard
              key={w.order}
              workout={w}
              active={w.order === activeOrder}
              done={completedOrders.includes(w.order)}
              onStart={() => onStartWorkout(w)}
            />
          ))}
        </Stack>
      </>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatLongDate(date)}
          </Typography>
          {ran && <DirectionsRunRounded aria-label="Ran this day" sx={{ color: 'primary.main', fontSize: 28 }} />}
          {isToday && <Chip label="Today" size="small" color="primary" />}
          {!isFuture &&
            (weight != null ? (
              <Button size="small" startIcon={<ScaleRounded />} onClick={onLogWeight} sx={{ ml: 'auto', flexShrink: 0 }}>
                {weight} lb
              </Button>
            ) : (
              <IconButton onClick={onLogWeight} aria-label="Log weight" sx={{ ml: 'auto', color: 'text.secondary' }}>
                <ScaleRounded />
              </IconButton>
            ))}
        </Box>
        {workouts.length > 0 && !day?.rest_day && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {workouts.length} workout{workouts.length === 1 ? '' : 's'} · {totalMinutes} min · intensity{' '}
            {dayIntensity(day)} · {completedOrders.length}/{workouts.length} done
          </Typography>
        )}
      </Box>
      {body}

      {/* Spacer so the fixed run bar never covers the last card. */}
      <Box sx={{ height: 72 }} />
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 'appBar',
          px: 'max(16px, env(safe-area-inset-left))',
          pt: 1.5,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          bgcolor: 'rgba(24, 24, 24, 0.92)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Button
          fullWidth
          size="large"
          variant={ran ? 'outlined' : 'contained'}
          startIcon={<DirectionsRunRounded />}
          onClick={onToggleRan}
          sx={{ display: 'flex', maxWidth: 600, mx: 'auto', py: 1.25, fontSize: '1rem' }}
        >
          {ran ? 'You ran! Tap to undo' : 'Did you run today?'}
        </Button>
      </Box>
    </Box>
  )
}
