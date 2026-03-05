# Contest Winner Tracker

A self-hosted web application that replaces Google Sheets for tracking contest winners and EVM wallet addresses. Built for teams that run frequent contests and need a searchable participant directory, per-contest winner management, payout status tracking, and one-click CSV export of wallet addresses.

## Features

- **Participant directory** -- searchable registry of names and EVM wallet addresses, with click-to-copy
- **Contest management** -- create, edit, and delete contests with date and description
- **Winner tracking** -- add winners via autocomplete combobox; each participant can win a contest only once
- **Payout workflow** -- track per-winner payout status (pending / paid / failed), individually or in bulk
- **CSV export** -- download a contest's winner list as a CSV file (name, wallet, status, prize note, tx hash)
- **API-key authentication** -- optional `X-API-Key` header protects all mutating endpoints
- **Docker deployment** -- single `docker compose up -d` to run in production with persistent SQLite storage

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Framework   | Next.js 16 (App Router, `output: "standalone"`) |
| UI library  | React 19                                        |
| Language    | TypeScript 5.9 (strict mode)                    |
| Styling     | Tailwind CSS v4 with `@tailwindcss/postcss`     |
| ORM         | Drizzle ORM 0.45 + drizzle-kit                  |
| Database    | SQLite via `better-sqlite3` (WAL mode)          |
| Validation  | Zod 4                                           |
| IDs         | CUID2 (`@paralleldrive/cuid2`)                  |
| Container   | Multi-stage Dockerfile + docker-compose          |
| Testing     | Vitest 4                                        |

## Prerequisites

- **Node.js** 20 or later
- **npm** (ships with Node.js)
- **Docker** and **Docker Compose** (for production deployment only)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Push the database schema

The SQLite database file is created automatically in `data/tracker.db`.

```bash
npm run db:push
```

### 3. Start the development server

```bash
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

## Database Commands

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run db:push`    | Push the Drizzle schema directly to SQLite   |
| `npm run db:generate`| Generate SQL migration files in `./drizzle`  |
| `npm run db:migrate` | Run pending migrations                       |
| `npm run db:studio`  | Open Drizzle Studio (visual database browser)|

The database file lives at `data/tracker.db` and is gitignored. SQLite is configured with WAL journal mode, a 5-second busy timeout, and foreign keys enabled.

## Production Deployment (Docker)

Build and start the container:

```bash
docker compose up -d
```

This does the following:

1. Builds a multi-stage Docker image (~Node 20 Alpine base).
2. Runs `drizzle-kit push` at container startup to ensure the schema is up to date.
3. Starts the Next.js standalone server on port **3000**.
4. Persists the SQLite database in a named Docker volume (`tracker-data`).

The container includes a health check that polls `http://localhost:3000` every 30 seconds.

To rebuild after code changes:

```bash
docker compose up -d --build
```

## Environment Variables

| Variable              | Required | Description                                                                 |
| --------------------- | -------- | --------------------------------------------------------------------------- |
| `API_KEY`             | No       | Server-side secret. When set, all POST/PUT/PATCH/DELETE API requests must include a matching `X-API-Key` header. When unset, all requests are allowed (development mode). |
| `NEXT_PUBLIC_API_KEY` | No       | Client-side copy of the API key. The built-in `apiFetch` helper reads this and automatically attaches the `X-API-Key` header to mutating requests from the browser. |

For local development, create a `.env.local` file:

```bash
API_KEY=your-secret-key-here
NEXT_PUBLIC_API_KEY=your-secret-key-here
```

For Docker, pass environment variables in `docker-compose.yml`:

```yaml
services:
  tracker:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=your-secret-key-here
      - NEXT_PUBLIC_API_KEY=your-secret-key-here
    volumes:
      - tracker-data:/app/data
```

## Authentication

The Next.js middleware at `src/middleware.ts` intercepts all requests to `/api/*`. It applies the following rules:

- **GET requests** are always allowed (read-only, no authentication required).
- **POST, PUT, PATCH, DELETE requests** require the `X-API-Key` header to match the `API_KEY` environment variable.
- If `API_KEY` is **not set**, all requests are allowed regardless of method (convenient for local development).
- Unauthorized requests receive a `401` JSON response: `{ "error": "Unauthorized" }`.

## API Endpoints

All endpoints return JSON unless otherwise noted. Mutating endpoints require the `X-API-Key` header when `API_KEY` is configured.

### Participants

| Method | Path                      | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| GET    | `/api/participants`       | List all participants (supports `?search=` query param for name/wallet filtering) |
| POST   | `/api/participants`       | Create a participant               |
| GET    | `/api/participants/:id`   | Get a single participant           |
| PUT    | `/api/participants/:id`   | Update a participant               |
| DELETE | `/api/participants/:id`   | Delete a participant (blocked if they are a winner in any contest) |

### Contests

| Method | Path                      | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| GET    | `/api/contests`           | List all contests (sorted by date descending) |
| POST   | `/api/contests`           | Create a contest                   |
| GET    | `/api/contests/:id`       | Get a contest with its winners     |
| PUT    | `/api/contests/:id`       | Update a contest                   |
| DELETE | `/api/contests/:id`       | Delete a contest (cascades to winners) |

### Winners

| Method | Path                                        | Description                              |
| ------ | ------------------------------------------- | ---------------------------------------- |
| POST   | `/api/contests/:id/winners`                 | Add a participant as a winner            |
| PATCH  | `/api/contests/:id/winners/:winnerId`       | Update payout status for a single winner |
| DELETE | `/api/contests/:id/winners/:winnerId`       | Remove a winner from a contest           |
| PATCH  | `/api/contests/:id/winners/batch`           | Bulk-update payout status for multiple winners |

### Export

| Method | Path                              | Description                                          |
| ------ | --------------------------------- | ---------------------------------------------------- |
| GET    | `/api/contests/:id/export`        | Download winners as a CSV file (name, wallet, status, prize note, tx hash) |

## Project Structure

```
tracker/
├── docker-compose.yml          # Single-service Docker Compose config
├── Dockerfile                  # Multi-stage build (deps -> build -> runner)
├── entrypoint.sh               # Runs drizzle-kit push then starts the server
├── drizzle.config.ts           # Drizzle Kit configuration
├── vitest.config.ts            # Vitest test runner configuration
├── data/                       # SQLite database file (gitignored, Docker volume-mounted)
├── drizzle/                    # Generated SQL migration files
├── src/
│   ├── middleware.ts            # API key authentication middleware
│   ├── app/
│   │   ├── layout.tsx           # Root layout with top navigation bar
│   │   ├── page.tsx             # Dashboard (participant/contest counts, recent contests)
│   │   ├── globals.css          # Tailwind CSS v4 imports and CSS custom properties
│   │   ├── participants/
│   │   │   └── page.tsx         # Participant directory (search, add, edit, delete)
│   │   ├── contests/
│   │   │   ├── page.tsx         # Contest list (cards sorted by date)
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Contest detail (add winners, manage payouts, export CSV)
│   │   └── api/
│   │       ├── participants/
│   │       │   ├── route.ts     # GET (list/search), POST (create)
│   │       │   └── [id]/
│   │       │       └── route.ts # GET, PUT, DELETE
│   │       └── contests/
│   │           ├── route.ts     # GET (list), POST (create)
│   │           └── [id]/
│   │               ├── route.ts # GET (with winners), PUT, DELETE
│   │               ├── export/
│   │               │   └── route.ts  # GET (CSV download)
│   │               └── winners/
│   │                   ├── route.ts       # POST (add winner)
│   │                   ├── batch/
│   │                   │   └── route.ts   # PATCH (bulk status update)
│   │                   └── [winnerId]/
│   │                       └── route.ts   # PATCH (status), DELETE (remove)
│   ├── components/
│   │   ├── ui/                  # Reusable UI primitives (badge, button, dialog, input)
│   │   ├── copy-button.tsx      # Click-to-copy wallet address button
│   │   ├── participant-form.tsx # Add/edit participant form with wallet validation
│   │   ├── participant-table.tsx# Searchable participant table
│   │   ├── payout-badge.tsx     # Color-coded payout status badge
│   │   ├── winner-combobox.tsx  # Autocomplete search for adding winners
│   │   └── winner-table.tsx     # Winner list with bulk selection and status controls
│   ├── db/
│   │   ├── schema.ts            # Drizzle table definitions (participants, contests, contest_winners)
│   │   └── index.ts             # Database connection singleton (WAL mode, foreign keys)
│   └── lib/
│       ├── validators.ts        # Zod schemas (EVM address, participant, contest, winner, payout)
│       └── utils.ts             # cn() helper, formatAddress(), apiFetch() with API key injection
└── src/__tests__/
    ├── middleware.test.ts       # Middleware authentication tests
    ├── utils.test.ts            # Utility function tests
    └── validators.test.ts       # Zod validator tests
```

## Testing

Tests are written with Vitest and located in `src/__tests__/`.

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

## Data Model

The application uses three tables:

- **participants** -- `id`, `name`, `wallet_address` (unique, lowercase `0x` + 40 hex chars), `notes`, `created_at`, `updated_at`
- **contests** -- `id`, `name`, `description`, `date` (YYYY-MM-DD, enforced by CHECK constraint), `created_at`, `updated_at`
- **contest_winners** -- `id`, `contest_id` (FK, CASCADE on delete), `participant_id` (FK, RESTRICT on delete), `payout_status` (pending/paid/failed), `payout_tx_hash`, `prize_note`, UNIQUE on (contest_id, participant_id)

Key constraints:

- Deleting a **contest** cascades to its winner records.
- Deleting a **participant** is blocked if they are a winner in any contest (RESTRICT). Remove them from contests first.
- Each participant can be a winner in a given contest only once (unique index).

## License

ISC
