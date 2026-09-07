# 🌙 DayFlow

> A dreamy, daily task manager. Every task belongs to exactly one day — past days are locked and can only be viewed, never edited.

**Live demo:** https://dayflow-jay1.vercel.app

## ✨ Features

- **Day-centric tasks** — tasks are attached to a specific calendar day; every day has its own task list and progress ring.
- **Historical read-only days** — once a day has passed, it's locked. You can view it, but never edit — so "today" always stays true.
- **Timezone-safe dates** — days are stored with a `dateKey` (`YYYY-MM-DD`) computed from the browser's local calendar, so "today" is *your* today, anywhere in the world.
- **Categories & subcategories** — organize tasks into color-coded categories (one level of nesting). Subcategories inherit their parent's color; deleting a parent cascades.
- **Schedules** — plan your day/week/month/year ahead (daily timeline, week view, month grid, year view).
- **Monthly & yearly goals** — built into the schedule planner, so longer-term intentions sit alongside your daily flow.
- **Analytics** — overall completion, daily/weekly/monthly breakdowns, category insights, and streak tracking.
- **History** — revisit any past day and see exactly what you did.
- **Day / night theme** — dreamy ambient themes, persisted without any flash on load.
- **JWT auth** — secure register/login, protected API.

## 🧱 Tech Stack

| Layer | Tech |
| --- | --- |
| **Frontend** | React 19, Vite 8, React Router 7, Axios, Recharts, Lucide icons |
| **Backend** | Node.js, Express 5, Mongoose 9 (MongoDB) |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **Hosting** | Vercel (static frontend + serverless API) + MongoDB Atlas |

## 📁 Project Structure

```
dayflow/
├── backend/                # Express 5 + Mongoose REST API
│   ├── api/index.js        # Vercel serverless entrypoint
│   ├── config/db.js        # MongoDB connection (cached for serverless)
│   ├── controllers/        # Auth, tasks, categories, schedules, goals, analytics
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # User, Task, Category, Schedule, Monthly/YearlyGoal
│   ├── routes/             # Express route definitions
│   ├── utils/              # date helpers, token generation, validation
│   └── server.js           # App bootstrap (runs locally, exports for Vercel)
└── frontend/               # React 19 + Vite SPA
    ├── public/             # Static assets (favicon, icons)
    ├── src/
    │   ├── components/     # Reusable UI (layout, tasks, schedule & goals, common)
    │   ├── context/        # AuthContext, ThemeContext
    │   ├── pages/          # Dashboard, Tasks, Categories, Schedule, Analytics,
    │   │                   # History, Settings, Login, Register
    │   ├── services/       # Axios client + per-domain API services
    │   └── utils/          # Timezone-safe date keys, colors, categories
    └── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & install

```bash
git clone https://github.com/CodeWith-Muskan/Dayflow.git
cd dayflow

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

Create `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/dayflow
JWT_SECRET=<long-random-string>
```

Then **whitelist your IP** in MongoDB Atlas (Network Access) so connections aren't refused.

### 3. Run the backend

```bash
cd backend
npm run dev        # nodemon on http://localhost:5000
```

On boot, the server runs an idempotent backfill that stamps `dateKey` onto any legacy tasks.

### 4. Run the frontend

```bash
cd frontend
npm run dev        # Vite dev server on http://localhost:5173
```

Open http://localhost:5173, register an account, and start planning your day.

> The frontend talks to the API at `http://localhost:5000/api` by default (see `frontend/src/services/api.js`). Set `VITE_API_URL` to override it.

### Useful scripts

| Command | Description |
| --- | --- |
| `cd backend && npm run dev` | Backend with auto-reload (nodemon) |
| `cd backend && npm start` | Backend (production-ish) |
| `cd frontend && npm run dev` | Frontend dev server |
| `cd frontend && npm run build` | Production build to `dist/` |
| `cd frontend && npm run preview` | Preview the production build |
| `cd frontend && npm run lint` | ESLint |

## 🔐 Environment Variables

| Variable | Where | Required | Description |
| --- | --- | --- | --- |
| `PORT` | backend | no | API port (default `5000`) |
| `MONGO_URI` | backend | yes | MongoDB connection string |
| `JWT_SECRET` | backend | yes | Secret used to sign auth tokens |
| `VITE_API_URL` | frontend | no | Deployed API base URL (defaults to `http://localhost:5000/api`) |

## 📡 API Endpoints

All routes are under `/api` and require `Authorization: Bearer <token>` unless noted.

- **Auth**
  - `POST /auth/register` — create an account
  - `POST /auth/login` — log in, receive a JWT
- **Tasks**
  - `GET /tasks` — list tasks (optional `?date=YYYY-MM-DD`)
  - `POST /tasks` — create a task
  - `PUT /tasks/:id` — update a task
  - `PATCH /tasks/:id/toggle` — toggle completion
  - `DELETE /tasks/:id` — delete a task
- **Categories**
  - `GET /categories` · `POST /categories` · `PUT /categories/:id` · `DELETE /categories/:id`
- **Schedules**
  - `GET /schedules` (with `?date=` or `?start=&end=` range) · `POST` · `PUT /:id` · `DELETE /:id`
- **Goals**
  - `GET /goals/monthly` · `POST /goals/monthly` · `PUT /goals/monthly/:id` · `DELETE /goals/monthly/:id`
  - `GET /goals/yearly` · `POST /goals/yearly` · `PUT /goals/yearly/:id` · `DELETE /goals/yearly/:id`
- **Analytics**
  - `GET /analytics/overall` · `/daily?date=` · `/weekly?start=&end=` · `/monthly?month=` · `/categories` · `/streaks?today=`

## 📖 Conventions

- **Dates** — created/sent/received as `dateKey` strings (`YYYY-MM-DD`). The stored `taskDate` is UTC midnight for indexability; always filter by `dateKey`.
- **Historical read-only** — the backend rejects any create/update/toggle/delete on a day before today (`403 Historical tasks are read-only.`). "Today" comes from the browser's calendar via the `x-client-date` header (falls back to server date). The UI hides edit controls on past days.
- **Categories** — global across dates, optional on tasks. Subcategories can be nested one level under a parent.
- **Theme** — `data-theme="day|night"` on `<html>`, persisted in `localStorage["dayflow-theme"]`. An inline script in `index.html` applies it before first paint to avoid flash.
- **Serverless-friendly backend** — the Mongoose connection is cached in `global` and reused across invocations; the connection reconnects automatically if it drops.

## ☁️ Deployment (Vercel)

The app deploys as **two Vercel projects** from the same repository.

**Backend project** (root directory `backend/`)
- `MONGO_URI` and `JWT_SECRET` as environment variables.
- The Express app is exported from `backend/api/index.js` and runs as a serverless function; `backend/vercel.json` routes all traffic to it.
- Open MongoDB Atlas Network Access to `0.0.0.0/0` so the serverless functions can connect.

**Frontend project** (root directory `frontend/` with the **Vite** preset)
- Set `VITE_API_URL` to your deployed backend URL, e.g. `https://<backend>.vercel.app/api`.
- `frontend/vercel.json` adds SPA fallback so client-side routes work on refresh.

## 🗺️ Roadmap Ideas

- Recurring tasks
- Drag-and-drop day planning
- Shared/collaborative lists
- Offline-first with background sync
- Mobile PWA

## 📄 License

MIT © Muskan