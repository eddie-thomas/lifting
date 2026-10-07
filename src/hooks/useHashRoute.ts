import { useCallback, useEffect, useState } from 'react'

export type Route = { view: 'calendar' } | { view: 'day'; date: string }

const DAY_RE = /^#\/day\/(\d{4}-\d{2}-\d{2})$/

function parse(hash: string): Route {
  const match = DAY_RE.exec(hash)
  return match ? { view: 'day', date: match[1] } : { view: 'calendar' }
}

/**
 * Hash-based routing: "" → calendar, "#/day/YYYY-MM-DD" → that day.
 * Keeps the bookmark landing on the calendar, survives reloads, and makes the
 * phone's back gesture work without a router dependency.
 */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))

  useEffect(() => {
    const sync = () => setRoute(parse(location.hash))
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const openDay = useCallback((date: string) => {
    history.pushState({ inApp: true }, '', `#/day/${date}`)
    setRoute({ view: 'day', date })
  }, [])

  const openCalendar = useCallback(() => {
    if (history.state?.inApp) {
      // We pushed this entry, so going back lands on the calendar.
      history.back()
    } else {
      // Opened directly on a day link: swap to the calendar without leaving the site.
      history.replaceState(null, '', location.pathname + location.search)
      setRoute({ view: 'calendar' })
    }
  }, [])

  return { route, openDay, openCalendar }
}
