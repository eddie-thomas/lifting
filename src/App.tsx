import { useCallback, useEffect, useState } from 'react'
import { Alert, Box } from '@mui/material'
import NavBar from './components/NavBar'
import CalendarView from './components/CalendarView'
import DayView from './components/DayView'
import TimerPanel from './components/TimerPanel'
import WeightCard from './components/WeightCard'
import WeightDialog from './components/WeightDialog'
import { loadWorkouts, sortedWorkouts } from './data/loadWorkouts'
import { useCountdown } from './hooks/useCountdown'
import { useHashRoute } from './hooks/useHashRoute'
import { usePersistentState } from './hooks/usePersistentState'
import type { ActiveWorkout, Workout } from './types'
import { timerFinishedAlert, unlockAudio } from './utils/alert'
import { monthKey, parseISODate, todayISO } from './utils/date'
import type { Weights } from './utils/weightTrend'

const DATA = loadWorkouts()

function findWorkout(active: ActiveWorkout | null): Workout | undefined {
  if (!active) return undefined
  return DATA.byDate.get(active.date)?.workout?.find((w) => w.order === active.order)
}

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

export default function App() {
  const { route, openDay, openCalendar } = useHashRoute()
  const [calendarMonth, setCalendarMonth] = usePersistentState('calendarMonth', monthKey(todayISO()))
  const [selectedDate, setSelectedDate] = usePersistentState<string | null>('selectedDate', null)
  const [active, setActive] = usePersistentState<ActiveWorkout | null>('activeWorkout', null)
  const [completed, setCompleted] = usePersistentState<Record<string, number[]>>('completed', {})
  const [runs, setRuns] = usePersistentState<string[]>('runs', [])
  const [weights, setWeights] = usePersistentState<Weights>('weights', {})
  const [weightGoal, setWeightGoal] = usePersistentState<number | null>('weightGoal', null)
  const [weightPromptedOn, setWeightPromptedOn] = usePersistentState<string | null>('weightPromptedOn', null)
  const [weighDate, setWeighDate] = useState<string | null>(null)
  const [errorDismissed, setErrorDismissed] = useState(false)

  // Ask for the morning weigh-in once a day: on load, and when the app comes back
  // to the foreground (a phone can leave it open overnight).
  useEffect(() => {
    const prompt = () => {
      const today = todayISO()
      if (document.visibilityState !== 'visible' || weights[today] != null || weightPromptedOn === today) return
      setWeightPromptedOn(today)
      setWeighDate(today)
    }
    prompt()
    document.addEventListener('visibilitychange', prompt)
    return () => document.removeEventListener('visibilitychange', prompt)
  }, [weights, weightPromptedOn, setWeightPromptedOn])

  const onComplete = useCallback(() => {
    timerFinishedAlert()
    if (!active) return
    setCompleted((prev) => {
      const orders = prev[active.date] ?? []
      return orders.includes(active.order) ? prev : { ...prev, [active.date]: [...orders, active.order] }
    })
  }, [active, setCompleted])

  const countdown = useCountdown(onComplete)
  const activeWorkout = findWorkout(active)

  const handleOpenDay = (date: string) => {
    setSelectedDate(date)
    setCalendarMonth(monthKey(date))
    openDay(date)
  }

  const handleStartWorkout = (date: string, workout: Workout) => {
    setActive({ date, order: workout.order })
    countdown.load(workout.duration)
    scrollToTop()
  }

  const handlePlayPause = (date: string) => {
    unlockAudio()
    if (countdown.status === 'running') {
      countdown.pause()
      return
    }
    if (!activeWorkout) {
      // Nothing chosen yet: start the first unfinished workout of this day.
      const done = completed[date] ?? []
      const list = sortedWorkouts(DATA.byDate.get(date), null)
      const next = list.find((w) => !done.includes(w.order)) ?? list[0]
      if (!next) return
      setActive({ date, order: next.order })
      countdown.begin(next.duration)
      scrollToTop()
      return
    }
    if (countdown.status === 'done' || countdown.remainingMs <= 0) {
      countdown.begin(activeWorkout.duration)
    } else {
      countdown.start()
    }
  }

  const toggleRan = (date: string) =>
    setRuns((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]))

  const saveWeight = (date: string, weight: number, goal: number | null) => {
    setWeights((prev) => ({ ...prev, [date]: weight }))
    setWeightGoal(goal)
    setWeighDate(null)
  }

  const deleteWeight = (date: string) => {
    setWeights((prev) => {
      const next = { ...prev }
      delete next[date]
      return next
    })
    setWeighDate(null)
  }

  const handleReset = () => countdown.load(activeWorkout?.duration ?? 0)

  let caption = 'Press play or start a workout below'
  if (activeWorkout && active) {
    caption =
      route.view === 'day' && active.date === route.date
        ? activeWorkout.title
        : `${activeWorkout.title} · ${parseISODate(active.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <NavBar onBack={route.view === 'day' ? openCalendar : undefined} />
      <Box
        component="main"
        sx={{
          maxWidth: 600,
          mx: 'auto',
          pt: 2,
          pb: 'calc(24px + env(safe-area-inset-bottom))',
          pl: 'max(16px, env(safe-area-inset-left))',
          pr: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        {DATA.error && !errorDismissed && (
          <Alert severity="error" variant="filled" onClose={() => setErrorDismissed(true)} sx={{ mb: 2 }}>
            {DATA.error}
          </Alert>
        )}

        {route.view === 'calendar' ? (
          <CalendarView
            data={DATA}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            selectedDate={selectedDate}
            completed={completed}
            runs={runs}
            onOpenDay={handleOpenDay}
            weight={<WeightCard weights={weights} goal={weightGoal} onLog={() => setWeighDate(todayISO())} />}
          />
        ) : (
          <DayView
            date={route.date}
            day={DATA.byDate.get(route.date)}
            active={active}
            completedOrders={completed[route.date] ?? []}
            onStartWorkout={(w) => handleStartWorkout(route.date, w)}
            ran={runs.includes(route.date)}
            onToggleRan={() => toggleRan(route.date)}
            weight={weights[route.date]}
            onLogWeight={() => setWeighDate(route.date)}
            timer={
              <TimerPanel
                status={countdown.status}
                remainingMs={countdown.remainingMs}
                durationMs={countdown.durationMs}
                caption={caption}
                onPlayPause={() => handlePlayPause(route.date)}
                onReset={handleReset}
              />
            }
          />
        )}
      </Box>

      <WeightDialog
        date={weighDate}
        weights={weights}
        goal={weightGoal}
        onClose={() => setWeighDate(null)}
        onSave={saveWeight}
        onDelete={deleteWeight}
      />
    </Box>
  )
}
