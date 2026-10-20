import { Box, Typography } from '@mui/material'
import PauseRounded from '@mui/icons-material/PauseRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import StopRounded from '@mui/icons-material/StopRounded'
import VerticalAlignTopRounded from '@mui/icons-material/VerticalAlignTopRounded'
import type { TimerStatus } from '../hooks/useCountdown'
import { formatHMS } from '../utils/date'
import HapticButton from './HapticButton'

interface Props {
  status: TimerStatus
  /** The finished alarm is going; the play button becomes Stop. */
  alarming: boolean
  remainingMs: number
  /** The same caption as the TimerPanel, e.g. the active workout's title. */
  caption: string
  /** Secondary line under the caption, e.g. sets and reps. */
  detail?: string
  onPlayPause: () => void
  onScrollTop: () => void
}

/** Compact timer row shown while the TimerPanel is scrolled out of view. */
export default function TimerBar({ status, alarming, remainingMs, caption, detail, onPlayPause, onScrollTop }: Props) {
  const running = status === 'running'

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        maxWidth: 600,
        mx: 'auto',
        pl: 'max(16px, env(safe-area-inset-left))',
        pr: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {caption}
        </Typography>
        {detail && (
          <Typography variant="caption" component="div" noWrap sx={{ color: 'text.secondary' }}>
            {detail}
          </Typography>
        )}
      </Box>
      <Typography
        component="div"
        sx={{
          flexShrink: 0,
          fontSize: '1.25rem',
          fontWeight: 300,
          fontVariantNumeric: 'tabular-nums',
          color: status === 'done' ? 'success.main' : 'text.primary',
        }}
      >
        {formatHMS(remainingMs)}
      </Typography>
      <HapticButton
        onPress={onPlayPause}
        aria-label={alarming ? 'Stop alarm' : running ? 'Pause' : 'Play'}
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        {alarming ? <StopRounded /> : running ? <PauseRounded /> : <PlayArrowRounded />}
      </HapticButton>
      <HapticButton onPress={onScrollTop} aria-label="Scroll to top" sx={{ color: 'text.secondary' }}>
        <VerticalAlignTopRounded />
      </HapticButton>
    </Box>
  )
}
