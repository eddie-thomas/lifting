import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material'
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'
import FitnessCenterRounded from '@mui/icons-material/FitnessCenterRounded'
import { useNow } from '../hooks/useNow'

interface Props {
  onBack?: () => void
}

export default function NavBar({ onBack }: Props) {
  const now = useNow()
  const date = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  return (
    <AppBar position="sticky" sx={{ pt: 'env(safe-area-inset-top)' }}>
      <Toolbar sx={{ gap: 1, minHeight: 56, px: { xs: 1.5, sm: 2 } }}>
        {onBack && (
          <IconButton edge="start" onClick={onBack} aria-label="Back to calendar" sx={{ color: 'text.primary' }}>
            <ArrowBackIosNewRounded fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0, pl: onBack ? 0 : 0.5 }}>
          <Typography sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
            {date}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
            {time}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
          <FitnessCenterRounded fontSize="small" sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ letterSpacing: 0.5 }}>
            Lifting
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
