import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

const PREFIX = 'lifting:'

function read<T>(key: string, initial: T): T {
  try {
    const stored = localStorage.getItem(PREFIX + key)
    return stored === null ? initial : (JSON.parse(stored) as T)
  } catch {
    return initial
  }
}

/** useState that mirrors its value to localStorage under `lifting:<key>`. */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => read(key, initial))

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // Storage full or blocked (private mode); state still works in memory.
    }
  }, [key, value])

  return [value, setValue]
}
