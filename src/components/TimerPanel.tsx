import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import StopRounded from "@mui/icons-material/StopRounded";
import VolumeOffRounded from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import type { TimerStatus } from "../hooks/useCountdown";
import { formatHMS } from "../utils/date";
import HapticButton from "./HapticButton";

const SIZE = 128;

interface Props {
  status: TimerStatus;
  /** The finished alarm is going; the main button becomes Stop. */
  alarming: boolean;
  remainingMs: number;
  durationMs: number;
  /** What the timer is counting for, e.g. the active workout's title. */
  caption: string;
  onPlayPause: () => void;
  onReset: () => void;
  /** Whether each second of the countdown ticks. */
  tickOn: boolean;
  onToggleTick: () => void;
  /** Mark the active workout done and move on; the button is hidden when undefined. */
  onMarkComplete?: () => void;
  /** Select the previous / next workout of the day; disabled when undefined. */
  onPrevWorkout?: () => void;
  onNextWorkout?: () => void;
}

export default function TimerPanel({
  status,
  alarming,
  remainingMs,
  durationMs,
  caption,
  onPlayPause,
  onReset,
  tickOn,
  onToggleTick,
  onMarkComplete,
  onPrevWorkout,
  onNextWorkout,
}: Props) {
  const running = status === "running";
  const progress = durationMs > 0 ? (remainingMs / durationMs) * 100 : 0;

  return (
    <Paper
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Box sx={{ position: "relative", width: SIZE, height: SIZE }}>
        {/* Track + remaining-time ring */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={SIZE}
          thickness={2}
          sx={{
            position: "absolute",
            inset: 0,
            color: "rgba(255,255,255,0.08)",
          }}
        />
        <CircularProgress
          variant="determinate"
          value={progress}
          size={SIZE}
          thickness={2}
          sx={{ position: "absolute", inset: 0, color: "primary.main" }}
        />
        <HapticButton
          onPress={onPlayPause}
          aria-label={alarming ? "Stop alarm" : running ? "Pause" : "Play"}
          wrapperSx={{ position: "absolute", inset: 12 }}
          sx={{
            width: "100%",
            height: "100%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: "0 8px 24px rgba(224, 85, 85, 0.25)",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          {alarming ? (
            <StopRounded sx={{ fontSize: 56 }} />
          ) : running ? (
            <PauseRounded sx={{ fontSize: 56 }} />
          ) : (
            <PlayArrowRounded sx={{ fontSize: 64 }} />
          )}
        </HapticButton>
        {onMarkComplete && (
          // Dotted outline so it reads as secondary to play, like the suggested-weight chip.
          <HapticButton
            onPress={onMarkComplete}
            aria-label="Mark workout complete"
            wrapperSx={{ position: "absolute", top: -18, right: -18 }}
            sx={{
              p: 0.75,
              bgcolor: "background.paper",
              color: "success.main",
              border: "2px dashed",
              borderColor: "success.main",
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            <CheckRounded sx={{ fontSize: 22 }} />
          </HapticButton>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <HapticButton
          onPress={onToggleTick}
          aria-label={tickOn ? "Mute ticking" : "Unmute ticking"}
          aria-pressed={tickOn}
          sx={{ color: "text.secondary" }}
        >
          {tickOn ? <VolumeUpRounded /> : <VolumeOffRounded />}
        </HapticButton>
        <Typography
          component="div"
          sx={{
            fontSize: "2.5rem",
            fontWeight: 300,
            letterSpacing: 1,
            fontVariantNumeric: "tabular-nums",
            color: status === "done" ? "success.main" : "text.primary",
          }}
        >
          {formatHMS(remainingMs)}
        </Typography>
        <HapticButton
          onPress={onReset}
          aria-label="Reset timer"
          sx={{ color: "text.secondary" }}
        >
          <RestartAltRounded />
        </HapticButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          alignSelf: "stretch",
        }}
      >
        <HapticButton
          onPress={() => onPrevWorkout?.()}
          disabled={!onPrevWorkout}
          aria-label="Previous workout"
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <ChevronLeftRounded />
        </HapticButton>
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            minWidth: 0,
            color: "text.secondary",
            textAlign: "center",
          }}
        >
          {status === "done" ? `Done — ${caption}` : caption}
        </Typography>
        <HapticButton
          onPress={() => onNextWorkout?.()}
          disabled={!onNextWorkout}
          aria-label="Next workout"
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <ChevronRightRounded />
        </HapticButton>
      </Box>
    </Paper>
  );
}
