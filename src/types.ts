export interface Workout {
  title: string
  /** In minutes. Drives the countdown timer. */
  duration: number
  /** 0-9, 9 being the highest. */
  intensity: number
  /** Ordered, step-by-step explanation of the workout. */
  description: string[]
  tips_and_tricks: string
  /** Path relative to the `public` directory, e.g. "images/squat.jpg". */
  img_src: string
  reps: number
  sets: number
  /** Suggested load in lb (per dumbbell for two-dumbbell moves). 0 = bodyweight or band. */
  weight: number
  /** Display / execution order within the day. */
  order: number
}

export interface WorkoutDay {
  /** "YYYY-MM-DD" */
  date: string
  rest_day: boolean
  workout?: Workout[]
}

export interface ActiveWorkout {
  date: string
  order: number
}
