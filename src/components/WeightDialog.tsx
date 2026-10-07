import { useState, type FormEvent } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import ScaleRounded from '@mui/icons-material/ScaleRounded'
import type { Weights } from '../utils/weightTrend'
import { formatLongDate, todayISO } from '../utils/date'

const MIN_LB = 50
const MAX_LB = 1000

interface Props {
  /** Day being logged; null when closed. */
  date: string | null
  weights: Weights
  goal: number | null
  onClose: () => void
  onSave: (date: string, weight: number, goal: number | null) => void
  onDelete: (date: string) => void
}

function parseLb(text: string): number | null {
  const n = Number.parseFloat(text)
  return Number.isFinite(n) && n >= MIN_LB && n <= MAX_LB ? Math.round(n * 10) / 10 : null
}

/** That day's entry, else the closest earlier weigh-in, so usually only a digit or two changes. */
function prefill(weights: Weights, date: string): string {
  if (weights[date] != null) return String(weights[date])
  const prev = Object.keys(weights)
    .filter((d) => d < date)
    .sort()
    .at(-1)
  return prev ? String(weights[prev]) : ''
}

const lbAdornment = { endAdornment: <InputAdornment position="end">lb</InputAdornment> }

export default function WeightDialog({ date, weights, goal, onClose, onSave, onDelete }: Props) {
  const open = date !== null
  // Keep showing the last date while the close transition runs.
  const [shownDate, setShownDate] = useState(date ?? todayISO())
  const [wasOpen, setWasOpen] = useState(false)
  const [weightText, setWeightText] = useState('')
  const [goalText, setGoalText] = useState('')

  if (open !== wasOpen) {
    setWasOpen(open)
    if (date !== null) {
      setShownDate(date)
      setWeightText(prefill(weights, date))
      setGoalText(goal === null ? '' : String(goal))
    }
  }

  const weight = parseLb(weightText)
  const goalValid = goalText.trim() === '' || parseLb(goalText) !== null
  const hasEntry = weights[shownDate] != null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (weight === null || !goalValid) return
    onSave(shownDate, weight, parseLb(goalText))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 3 }}>
          <ScaleRounded sx={{ fontSize: 44, color: 'primary.main' }} />
          <DialogTitle sx={{ pt: 1, pb: 0, fontWeight: 700, textAlign: 'center' }}>How much do you weigh?</DialogTitle>
          {shownDate !== todayISO() && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {formatLongDate(shownDate)}
            </Typography>
          )}
        </Box>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Weight"
            type="number"
            value={weightText}
            onChange={(e) => setWeightText(e.target.value)}
            onFocus={(e) => e.target.select()}
            error={weightText !== '' && weight === null}
            autoFocus
            fullWidth
            slotProps={{ htmlInput: { inputMode: 'decimal', step: 0.1, min: MIN_LB, max: MAX_LB }, input: lbAdornment }}
          />
          <TextField
            label="Goal weight (optional)"
            type="number"
            size="small"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            error={!goalValid}
            fullWidth
            slotProps={{ htmlInput: { inputMode: 'decimal', step: 0.1, min: MIN_LB, max: MAX_LB }, input: lbAdornment }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {hasEntry && (
            <Button color="error" onClick={() => onDelete(shownDate)} sx={{ mr: 'auto' }}>
              Delete
            </Button>
          )}
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={weight === null || !goalValid}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
