import { createTheme } from '@mui/material/styles'

export const INTENSITY_RED = '#e53935'

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
