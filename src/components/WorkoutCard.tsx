import { useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import PlayCircleFilledRounded from "@mui/icons-material/PlayCircleFilledRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import TimerOutlined from "@mui/icons-material/TimerOutlined";
import BoltRounded from "@mui/icons-material/BoltRounded";
import FitnessCenterRounded from "@mui/icons-material/FitnessCenterRounded";
import type { Workout } from "../types";

interface Props {
  workout: Workout;
  active: boolean;
  done: boolean;
  onStart: () => void;
}

const imageUrl = (src: string) =>
  import.meta.env.BASE_URL + src.replace(/^\/+/, "");

const countChipSx = {
  height: 34,
  fontSize: "1rem",
  fontWeight: 700,
  bgcolor: "rgba(255,255,255,0.08)",
  "& .MuiChip-label": { px: 1.5 },
};

// Dashed outline so the suggested load reads as advice, not a fixed target like sets/reps.
const suggestedChipSx = {
  width: "100%",
  height: 34,
  fontSize: "1rem",
  bgcolor: "transparent",
  border: "1px dashed rgba(255,255,255,0.3)",
  "& .MuiChip-label": { px: 1.5 },
  "& .MuiChip-icon": { color: "text.secondary", fontSize: 18 },
};

export default function WorkoutCard({ workout, active, done, onStart }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const suggestedWeight = workout.weight > 0 ? workout.weight : null;

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: active ? "#2a2a2a" : "background.paper",
        borderLeft: "4px solid",
        borderLeftColor: active ? "primary.main" : "transparent",
        ...(active && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }),
        transition: "background-color 200ms",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {done && (
              <CheckCircleRounded
                sx={{ color: "success.main", fontSize: 20 }}
              />
            )}
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.25 }}>
              {workout.title}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
            <Chip label={`${workout.sets} sets`} sx={countChipSx} />
            <Chip label={`${workout.reps} reps`} sx={countChipSx} />
            {suggestedWeight !== null && (
              <Chip
                icon={<FitnessCenterRounded />}
                aria-label={`Suggested weight: ${suggestedWeight} lb`}
                label={
                  <>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {suggestedWeight} lb
                    </Box>{" "}
                    <Box
                      component="span"
                      sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                    >
                      suggested
                    </Box>
                  </>
                }
                sx={suggestedChipSx}
              />
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mt: 1,
              color: "text.secondary",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TimerOutlined sx={{ fontSize: 16 }} />
              <Typography variant="caption">{workout.duration} min</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <BoltRounded sx={{ fontSize: 16 }} />
              <Typography variant="caption">{workout.intensity}/9</Typography>
            </Box>
          </Box>
        </Box>

        <IconButton
          onClick={onStart}
          disabled={active}
          aria-label={active ? "Current workout" : `Start ${workout.title}`}
          sx={{
            p: 0.5,
            color: "primary.main",
            "&.Mui-disabled": { color: "primary.main", opacity: 0.45 },
          }}
        >
          <PlayCircleFilledRounded sx={{ fontSize: 48 }} />
        </IconButton>
      </Box>

      <Collapse in={active} unmountOnExit>
        <Divider sx={{ my: 2 }} />

        {workout.img_src && !imgFailed && (
          <Box
            component="img"
            src={imageUrl(workout.img_src)}
            alt={workout.title}
            loading="lazy"
            onError={() => setImgFailed(true)}
            sx={{
              display: "block",
              width: "100%",
              borderRadius: 2,
              mb: 2,
              bgcolor: "#161616",
            }}
          />
        )}

        {workout.description.length > 0 && (
          <Box
            component="ol"
            sx={{
              m: 0,
              pl: 3,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {workout.description.map((step, i) => (
              <Typography
                component="li"
                key={i}
                sx={{ lineHeight: 1.5, pl: 0.5 }}
              >
                {step}
              </Typography>
            ))}
          </Box>
        )}

        {workout.tips_and_tricks && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.04)",
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: "primary.main", lineHeight: 1.5 }}
            >
              Tips & tricks
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {workout.tips_and_tricks}
            </Typography>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
}
