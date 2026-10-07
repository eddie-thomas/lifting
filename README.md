# Lifting

A mobile-first workout tracker (Vite + React + TypeScript + MUI), hosted on GitHub Pages. There's no backend: workouts come from a JSON file, and app state is saved in `localStorage`.

## Adding workouts

Edit [`src/workouts.jsonc`](src/workouts.jsonc). The comment at the top of the file describes every field and includes an example you can copy. Put workout images in `public/images/` and point to them with `"img_src": "images/<file>"`.

## Development

```sh
npm install
npm run dev            # http://localhost:5173
npm run dev -- --host  # also reachable from your phone on the same Wi-Fi
npm run build          # type-check + production build into dist/
npm run preview        # serve the production build
```

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes it to GitHub Pages. One-time setup in the GitHub repo: **Settings → Pages → Source → GitHub Actions**.

## Saved state

These `localStorage` keys (all prefixed `lifting:`) persist across reloads:

| Key | What |
| --- | --- |
| `timer` | Countdown status, duration, and remaining time or end time |
| `activeWorkout` | The started workout (`{ date, order }`) |
| `completed` | Finished workouts per date |
| `runs` | Dates you marked "Did you run today?" |
| `selectedDate`, `calendarMonth` | Last-opened day and the month shown on the calendar |

To start fresh, clear the site's data in your browser.
