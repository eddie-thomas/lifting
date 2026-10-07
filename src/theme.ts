import { createTheme } from '@mui/material/styles'

export const INTENSITY_RED = '#e53935'

/**
 * Opacity of a day's red, GitHub-contribution style: the curve is steep so only
 * days near the hardest one look strong, and light days fade to nearly nothing.
 * `ratio` is the day's intensity divided by the hardest day's (0–1).
 */
export function intensityAlpha(ratio: number): number {
  return 0.06 + 0.89 * Math.min(1, Math.max(0, ratio)) ** 6
}
/** Projected-weight line; checked against primary red for colorblind separation. */
export const PROJECTION_BLUE = '#4c97dc'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e05555', contrastText: '#ffffff' },
    secondary: { main: '#9e9e9e' },
    success: { main: '#66bb6a' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#e0e0e0', secondary: '#9e9e9e' },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121212',
          WebkitTapHighlightColor: 'transparent',
          overscrollBehaviorY: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(24, 24, 24, 0.92)',
          backdropFilter: 'blur(8px)',
          border: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
  },
})
