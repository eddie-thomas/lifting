import { Box, CircularProgress, IconButton, Paper, Typography } from '@mui/material'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import PauseRounded from '@mui/icons-material/PauseRounded'
import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import type { TimerStatus } from '../hooks/useCountdown'
import { formatHMS } from '../utils/date'

const SIZE = 128

interface Props {
  status: TimerStatus
  remainingMs: number
  durationMs: number
  /** What the timer is counting for, e.g. the active workout's title. */
  caption: string
  onPlayPause: () => void
  onReset: () => void
}

export default function TimerPanel({ status, remainingMs, durationMs, caption, onPlayPause, onReset }: Props) {
  const running = status === 'running'
  const progress = durationMs > 0 ? (remainingMs / durationMs) * 100 : 0

  return (
    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
        {/* Track + remaining-time ring */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={SIZE}
          thickness={2}
          sx={{ position: 'absolute', inset: 0, color: 'rgba(255,255,255,0.08)' }}
        />
        <CircularProgress
          variant="determinate"
          value={progress}
          size={SIZE}
          thickness={2}
          sx={{ position: 'absolute', inset: 0, color: 'primary.main' }}
        />
        <IconButton
          onClick={onPlayPause}
          aria-label={running ? 'Pause' : 'Play'}
          sx={{
            position: 'absolute',
            inset: 12,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: '0 8px 24px rgba(224, 85, 85, 0.25)',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          {running ? <PauseRounded sx={{ fontSize: 56 }} /> : <PlayArrowRounded sx={{ fontSize: 64 }} />}
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 5 /* balance the reset button */ }}>
        <Typography
          component="div"
          sx={{
            fontSize: '2.5rem',
            fontWeight: 300,
            letterSpacing: 1,
            fontVariantNumeric: 'tabular-nums',
            color: status === 'done' ? 'success.main' : 'text.primary',
          }}
        >
          {formatHMS(remainingMs)}
        </Typography>
        <IconButton onClick={onReset} aria-label="Reset timer" sx={{ color: 'text.secondary' }}>
          <RestartAltRounded />
        </IconButton>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        {status === 'done' ? `Done — ${caption}` : caption}
      </Typography>
    </Paper>
  )
}
