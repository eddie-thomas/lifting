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
import { useWakeLock } from './hooks/useWakeLock'
import type { ActiveWorkout, Workout } from './types'
import { startAlarm, tick, unlockAudio } from './utils/alert'
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
  const [tickOn, setTickOn] = usePersistentState('tickSound', true)
  // Timer finished and the alarm is going until the user presses stop.
  const [alarming, setAlarming] = useState(false)
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

  useEffect(() => (alarming ? startAlarm() : undefined), [alarming])

  const markDone = useCallback(
    ({ date, order }: ActiveWorkout) =>
      setCompleted((prev) => {
        const orders = prev[date] ?? []
        return orders.includes(order) ? prev : { ...prev, [date]: [...orders, order] }
      }),
    [setCompleted],
  )

  const onComplete = useCallback(() => {
    setAlarming(true)
    if (active) markDone(active)
  }, [active, markDone])

  const countdown = useCountdown(onComplete, tickOn ? tick : undefined)
  useWakeLock(countdown.status === 'running' || alarming)
  const activeWorkout = findWorkout(active)
  // The active workout's day, in order, for the previous / next arrows.
  const activeDayList = active ? sortedWorkouts(DATA.byDate.get(active.date), null) : []
  const activeIdx = activeDayList.findIndex((w) => w.order === active?.order)

  const handleOpenDay = (date: string) => {
    setSelectedDate(date)
    setCalendarMonth(monthKey(date))
    openDay(date)
  }

  const handleStartWorkout = (date: string, workout: Workout) => {
    setAlarming(false)
    setActive({ date, order: workout.order })
    countdown.load(workout.duration)
    scrollToTop()
  }

  const handlePlayPause = (date: string) => {
    unlockAudio()
    if (alarming) {
      setAlarming(false)
      return
    }
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

  // Check off the active workout and load the next unfinished one of its day
  // (looking past it first, then wrapping around). Clears the timer when none are left.
  const handleMarkComplete = () => {
    if (!active || activeIdx < 0) return
    markDone(active)
    const done = [...(completed[active.date] ?? []), active.order]
    const next = [...activeDayList.slice(activeIdx + 1), ...activeDayList.slice(0, activeIdx)].find(
      (w) => !done.includes(w.order),
    )
    if (next) {
      handleStartWorkout(active.date, next)
    } else {
      setAlarming(false)
      setActive(null)
      countdown.load(0)
    }
  }

  const stepWorkout = (delta: number) => {
    const target = activeDayList[activeIdx + delta]
    return active && activeIdx >= 0 && target ? () => handleStartWorkout(active.date, target) : undefined
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

  const handleReset = () => {
    setAlarming(false)
    countdown.load(activeWorkout?.duration ?? 0)
  }

  const toggleTick = () => {
    unlockAudio()
    setTickOn((on) => !on)
  }

  let caption = 'Press play or start a workout below'
  if (route.view === 'day') {
    const dayList = DATA.byDate.get(route.date)?.workout ?? []
    const done = completed[route.date] ?? []
    if (dayList.length > 0 && dayList.every((w) => done.includes(w.order))) caption = 'All workouts done'
  }
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
                alarming={alarming}
                remainingMs={countdown.remainingMs}
                durationMs={countdown.durationMs}
                caption={caption}
                onPlayPause={() => handlePlayPause(route.date)}
                onReset={handleReset}
                tickOn={tickOn}
                onToggleTick={toggleTick}
                onMarkComplete={activeWorkout ? handleMarkComplete : undefined}
                onPrevWorkout={stepWorkout(-1)}
                onNextWorkout={stepWorkout(1)}
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
