import { Box, IconButton, type IconButtonProps, type SxProps, type Theme } from '@mui/material'

// WebKit's native switch control; not in React's input typings.
const SWITCH = { switch: '' }

interface Props extends Omit<IconButtonProps, 'onClick'> {
  onPress: () => void
  /** Styles for the wrapper, e.g. to position the button. */
  wrapperSx?: SxProps<Theme>
}

/**
 * IconButton that buzzes on tap. iOS has no vibration API, but toggling a
 * native `<input type="checkbox" switch>` plays a haptic, as long as it's a
 * real tap (script-triggered clicks don't buzz without one). So on touch
 * screens a transparent label wired to a hidden switch covers the button and
 * runs the action. Mouse and keyboard users get the plain button underneath.
 */
export default function HapticButton({ onPress, wrapperSx, children, ...props }: Props) {
  const handleSwitch = () => {
    try {
      navigator.vibrate?.(10)
    } catch {
      // ignore
    }
    onPress()
  }

  return (
    <Box sx={[{ position: 'relative', display: 'inline-flex' }, ...(Array.isArray(wrapperSx) ? wrapperSx : [wrapperSx])]}>
      <IconButton {...props} onClick={onPress}>
        {children}
      </IconButton>
      {/* A disabled button gets no overlay, or a tap would still run the action. */}
      {!props.disabled && (
        <Box
          component="label"
          aria-hidden
          sx={{
            display: 'none',
            '@media (hover: none)': { display: 'block' },
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <input
            type="checkbox"
            {...SWITCH}
            tabIndex={-1}
            onChange={handleSwitch}
            style={{ position: 'absolute', width: 1, height: 1, margin: 0, opacity: 0, pointerEvents: 'none' }}
          />
        </Box>
      )}
    </Box>
  )
}
