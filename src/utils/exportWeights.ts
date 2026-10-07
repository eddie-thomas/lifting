import { todayISO } from './date'
import type { Weights } from './weightTrend'

/** One row per weigh-in, oldest first. */
export function weightsToCSV(weights: Weights): string {
  const rows = Object.keys(weights)
    .sort()
    .map((date) => `${date},${weights[date]}`)
  return ['date,weight_lb', ...rows].join('\n') + '\n'
}

/**
 * Hands the CSV to the share sheet (Messages, Mail, Save to Files on iPhone), or
 * downloads it where file sharing isn't supported. Must run from a tap handler.
 */
export async function exportWeights(weights: Weights): Promise<void> {
  const name = `weights-${todayISO()}.csv`
  const file = new File([weightsToCSV(weights)], name, { type: 'text/csv' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return
    } catch (err) {
      // Dismissing the share sheet isn't an error worth reacting to.
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  // Revoking right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
