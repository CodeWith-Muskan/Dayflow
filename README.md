# DayFlow

A dreamy, daily task manager. Every task belongs to exactly one day — past days are locked and can only be viewed, never edited. Days are stored with a timezone-safe `dateKey` (`YYYY-MM-DD`), so "today" always reflects the browser's local calendar.

## Structure

- `backend/` — Express 5 + Mongoose REST API (JWT auth, date-based read-only enforcement, analytics).
- `frontend/` — React 19 + Vite SPA (responsive layout, day/night theme).

## Getting started

### Backend

1. `cd backend && npm install`
2. Create `backend/.env`:

   ```
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/dayflow
   JWT_SECRET=<long-random-string>
   ```

3. Whitelist your IP in Mongo Atlas (Network Access) — connections from outside the whitelist are refused.
4. `npm run dev` (nodemon) or `npm start`

On boot the server runs an idempotent backfill that stamps `dateKey` onto any legacy tasks.

### Frontend

1. `cd frontend && npm install`
2. `npm run dev` — Vite dev server on `http://localhost:5173`
3. or `npm run build` + `npm run preview` for a production build.

The API URL is `http://localhost:5000/api` (see `frontend/src/services/api.js`).

## Conventions

- **Dates** — created/sent/received as `dateKey` strings `YYYY-MM-DD`. The stored `taskDate` field is UTC midnight for indexability; always filter by `dateKey`.
- **Historical read-only** — the backend rejects any create/update/toggle/delete whose `date` is before today with `403 Historical tasks are read-only.` (same for schedules). "Today" is taken from the browser's local calendar via the `x-client-date` header (falls back to the server's date when absent). The UI hides editing controls on past days.
- **Categories** — global across dates, optional on tasks. A subcategory is one level deep under a parent (color inherits from the parent); deleting a parent cascades to its subcategories.
- **Theme** — `data-theme="day|night"` on `<html>`, persisted in `localStorage["dayflow-theme"]`. An inline script in `index.html` applies it before first paint to avoid flash.

## API endpoints (all under `/api`, auth via `Authorization: Bearer <token>`)

- Auth: `POST /auth/register`, `POST /auth/login`
- Tasks: `GET/POST /tasks`, `PUT /tasks/:id`, `PATCH /tasks/:id/toggle`, `DELETE /tasks/:id`
- Categories: `GET/POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id`
- Schedules: `GET /schedules` (with `?date=YYYY-MM-DD` or `?start=&end=` range), `POST /schedules`, `PUT /schedules/:id`, `DELETE /schedules/:id`
- Analytics: `GET /analytics/overall|daily|weekly?start=&end=|monthly?month=|categories|streaks?today=`