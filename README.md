# DevFest 2026 — Speakers & Schedule

A responsive conference web app: browse speakers, explore the agenda, build a personal schedule, and manage content through a protected admin dashboard.

> ⚠️ **All event details, dates, venues, speakers and sessions are placeholder demonstration data.**

**Stack:** React + Vite + Tailwind CSS + React Router + Lucide icons · Node.js + Express · local JSON files (no database).

## Quick start

Requires Node.js 18+. Use two terminals.

```bash
# Terminal 1 — backend (http://localhost:4000)
cd server
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm install
npm run dev
```

Open http://localhost:5173. In development Vite proxies `/api` to the backend, so no frontend configuration is needed.

### Admin login

Create `server/.env` from the example, then generate your own password hash:

```bash
cd server
cp .env.example .env
npm run hash-password -- "your-strong-password"   # prints ADMIN_PASSWORD_HASH='…'
```

Paste the printed line into `server/.env` (replacing the placeholder), set `JWT_SECRET` to a long random value
(`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) and restart the server. Then sign in at **/admin**.

## Configuration

| File | Variable | Purpose |
|---|---|---|
| `server/.env` | `PORT` | API port (default 4000) |
| | `CORS_ORIGIN` | Comma-separated allowed origins (default `http://localhost:5173`) |
| | `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password (never stored in code/JSON) |
| | `JWT_SECRET` | Secret used to sign admin tokens |
| | `JWT_EXPIRES_IN` | Token lifetime (default `8h`) |
| `client/.env` | `VITE_API_URL` | Backend URL for production builds (e.g. `https://api.example.com/api`); empty in dev |
| | `VITE_PROXY_TARGET` | Dev proxy target (default `http://localhost:4000`) |

Copy `.env.example` files as a starting point.

## Features

- **Home** — hero, date/venue, description, featured speakers & sessions, statistics (calculated from the data).
- **Speakers** — profile cards, search by name / organization / expertise, detailed profile with their sessions.
- **Schedule** — chronological agenda grouped by day; filters for day, time of day, speaker, track and room; colour-coded tracks.
- **Session details** — full description, speakers, date, time, location, track, type, *Add to My Schedule*.
- **My Schedule** — saved in `localStorage` (no login), chronological, remove sessions, **overlap warnings**; handles sessions deleted by organizers.
- **Admin** — password login; add/edit/delete speakers and sessions; edit event info. Changes persist to the JSON files.
- Loading skeletons, empty states, error states with retry, keyboard/screen-reader friendly markup, reduced-motion support.

## REST API

Public: `GET /api/event`, `/api/tracks`, `/api/speakers`, `/api/speakers/:id`, `/api/sessions`, `/api/sessions/:id`
Auth: `POST /api/auth/login` `{ "password": "…" }` → `{ token }`
Admin (header `Authorization: Bearer <token>`): `PUT /api/event`, `POST|PUT|DELETE /api/speakers[/:id]`, `POST|PUT|DELETE /api/sessions[/:id]`

Errors are JSON: `{ "error": "message", "details": { "field": "problem" } }`.

Validation highlights: required fields, `YYYY-MM-DD` dates within the event, `HH:MM` times, **end time must be after start**, speakers/track/room/type must exist, **no room double-booking and no speaker double-booking** (HTTP 409), speakers assigned to sessions can't be deleted (409).

## Data & safety

`server/data/{speakers,sessions,tracks,event}.json`. Sessions reference speakers by `speakerIds`. All writes go through a single in-process lock (read → validate → write) and are **atomic** (temp file + rename), so concurrent requests can't corrupt files or lose updates. This assumes a **single server process** — don't run multiple instances against the same data directory. Login is rate-limited; if you deploy, serve over HTTPS and keep the data directory on persistent storage.

## Deploying to Vercel

The repo deploys as one Vercel project: the React app is served as static files and the Express API runs as a single serverless function behind `/api/*` (see `vercel.json` and `api/index.js`).

Vercel's filesystem is read-only, so on Vercel the data and uploaded photos live in **Vercel Blob** instead of local files. The app switches automatically when `BLOB_READ_WRITE_TOKEN` is present; local development is unchanged.

1. Import the GitHub repo into Vercel (root directory = repo root; no framework preset).
2. Create a **public** Blob store and connect it to the project (Storage tab, or `vercel blob create-store <name> --access public`). This adds `BLOB_READ_WRITE_TOKEN`.
3. Add these environment variables for Production:
   - `ADMIN_PASSWORD_HASH`: output of `npm run hash-password -- "your-password"` (without the surrounding quotes)
   - `JWT_SECRET`: a long random string
4. Deploy. Pushes to `main` deploy automatically.

To change the admin password later: `vercel env rm ADMIN_PASSWORD_HASH production`, add the new hash with `vercel env add ADMIN_PASSWORD_HASH production`, then redeploy.

**How Blob storage works.** Each save creates a new numbered file (`data/speakers/v000007.json`) and the highest number is the current data. Blob overwrites are not read-after-write consistent, but new files are, and creating a version that already exists is refused. So two admins saving at once can never silently overwrite each other: the second gets a "Someone else saved changes, please reload" message. The last 5 versions are kept as a simple history. The first request seeds the store from `server/data/*.json`, so those files are only the initial sample data on Vercel.

Photos are stored in the same Blob store and referenced by absolute URL. The login rate limiter is in-memory, so on Vercel it is per function instance; use a strong admin password.

## Tests

```bash
cd server && npm test   # API, auth, validation and concurrency tests (uses a temp copy of the data)
```

## For developers

### Code tour

```
client/src/
  main.jsx            providers (Router → Event → MySchedule → Auth) wrapping <App/>
  App.jsx             page shell + route table (add new pages here)
  pages/              one file per screen; they fetch data and compose components
  components/         reusable UI (cards, forms, states); components/admin/ holds the admin forms
  hooks/              useFetch (loading/error/reload), useEvent, useMySchedule, useAuth
  services/api.js     the ONLY place that calls the backend
  utils/              time.js (date/time + overlap logic), calendar.js (.ics / Google Calendar)

server/
  server.js           local entry point (loads .env, listens)      api/index.js = Vercel entry point
  app.js              builds the Express app (CORS, body parsing, routes, error handling)
  routes/index.js     the endpoint table: what is public, what needs admin
  controllers/        request handlers: validate → withLock(read, change, write) → respond
  middleware/         auth.js (JWT check), errorHandler.js (consistent JSON errors)
  utils/              validators.js (all input rules), jsonStore.js (the "database"), errors.js, ids.js
  data/*.json         sample data; also the seed for Blob storage
  test/               API tests (npm test)
```

### How a request flows

`Page → api.js → /api route → requireAdmin (writes only) → controller → validators → jsonStore (inside withLock) → JSON response`.
Any thrown `HttpError` becomes `{ "error": "...", "details": { field: "message" } }`, and the forms show those per-field messages.

### Conventions

- **No event data in components.** Names, dates, rooms, track colours and so on come from the API, so organizers can change them without code changes.
- **Validate on the server.** Client checks are only for faster feedback; `server/utils/validators.js` is the source of truth. Two rules are deliberately duplicated and must stay in sync: session overlap (`validators.js` and `client/src/utils/time.js`).
- **Writes go through `withLock`.** Never read-modify-write a data file outside it.
- **Handle the three states** (loading, error, empty) on every page: use the components in `components/States.jsx`.
- **Comments explain why**, not what. Each file starts with a short header saying what it is for.

### Common changes

- **Add a field to speakers** (e.g. `pronouns`): add the rule in `validateSpeaker` (`server/utils/validators.js`) → add the input in `components/admin/SpeakerForm.jsx` → show it in `SpeakerCard.jsx` / `SpeakerDetail.jsx`. Existing records without the field keep working if you treat it as optional.
- **Add an endpoint:** write the handler in a controller, register it in `routes/index.js` (add `requireAdmin` for writes), add a method to `client/src/services/api.js`, and add a test in `server/test/api.test.js`.
- **Add a page:** create it in `pages/`, add a `<Route>` in `App.jsx`, link it from `Navbar.jsx`.
- **Change colours/fonts:** design tokens are in `client/tailwind.config.js` (palette, fonts) and `client/src/index.css` (buttons, cards, inputs).

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, for example `feat(client): add calendar reminders`, `fix(server): reject overlapping sessions`. Types used here: `feat`, `fix`, `docs`, `test`, `build`, `chore`, `refactor`. Explain the *why* in the body when it isn't obvious, and keep each commit to one logical change.

## Structure

```
client/src/{components,pages,services,hooks,utils}  App.jsx  main.jsx
server/{routes,controllers,middleware,utils,data,scripts,test}  app.js  server.js
```
