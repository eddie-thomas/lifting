import type { ReactNode } from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import HotelRounded from '@mui/icons-material/HotelRounded'
import EventBusyRounded from '@mui/icons-material/EventBusyRounded'
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

export default function DayView({ date, day, active, completedOrders, timer, onStartWorkout }: Props) {
  const isToday = date === todayISO()
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
          {isToday && <Chip label="Today" size="small" color="primary" />}
        </Box>
        {workouts.length > 0 && !day?.rest_day && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {workouts.length} workout{workouts.length === 1 ? '' : 's'} · {totalMinutes} min · intensity{' '}
            {dayIntensity(day)} · {completedOrders.length}/{workouts.length} done
          </Typography>
        )}
      </Box>
      {body}
    </Box>
  )
}
