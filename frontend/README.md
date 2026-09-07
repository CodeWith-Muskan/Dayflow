# DayFlow — Frontend

React 19 + Vite SPA for DayFlow. See the [project README](../README.md) for full setup.

```bash
npm install      # install dependencies
npm run dev      # dev server on http://localhost:5173
npm run build    # production build to dist/
npm run lint     # eslint
npm run preview  # preview the production build
```

Key bits:

- `src/services/` — axios client (base URL `http://localhost:5000/api`, JWT interceptor) + per-domain services.
- `src/utils/dates.js` — timezone-safe date key helpers (`todayKey`, `addDays`, `buildMonthGrid`, …).
- `src/context/ThemeContext.jsx` — day/night theme persisted to `localStorage`.
- Pages: Dashboard, Tasks, Categories, Schedule, Analytics, History, Settings.

Any task/schedule mutation on a past day is rejected by the backend with a 403; the UI also hides edit controls for locked days.