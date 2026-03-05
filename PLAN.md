# Contest Winner Tracker — Implementation Plan

## Context

Your org runs frequent contests with 10+ winners each. Currently you track winners and EVM wallet addresses in Google Sheets (one sheet per contest), but copy/pasting wallets for repeat participants is tedious. This tool replaces that workflow with a searchable participant directory, contest management, and batch wallet export — all in a Dockerized web app your team can share via internal GitHub.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14+ (App Router)** | Single codebase for UI + API, easy to containerize |
| ORM | **Drizzle ORM** | Lightweight, no binary engine (simpler in Docker), native SQLite support |
| Database | **SQLite** (via `better-sqlite3`) | Single file, no separate DB container, trivially portable |
| UI | **Tailwind CSS + shadcn/ui** | Copy-paste components, great combobox for participant autocomplete |
| Validation | **Zod** | Runtime validation for EVM addresses and API inputs |
| Container | **Multi-stage Dockerfile + docker-compose** | `docker compose up` and it runs |

## Data Model

```
participants
  id, name, wallet_address (unique, 0x + 40 hex), notes, created_at, updated_at

contests
  id, name, description, date, created_at, updated_at

contest_winners
  id, contest_id (FK CASCADE), participant_id (FK RESTRICT),
  payout_status (pending|paid|failed), payout_tx_hash, prize_note,
  UNIQUE(contest_id, participant_id)
```

- Wallet addresses stored lowercase, validated as `0x` + 40 hex chars
- `RESTRICT` on participant delete prevents orphaning winner records
- `CASCADE` on contest delete cleans up winners

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — contest/participant counts, recent contests |
| `/participants` | Searchable directory — add/edit/delete participants, copy wallet button |
| `/contests` | Contest list — cards sorted by date |
| `/contests/[id]` | **Core page** — add winners via autocomplete, manage payout status, export CSV |

The contest detail page is the key workflow improvement: type a name, pick from autocomplete, done. No more copy/pasting.

## API Routes

```
GET/POST   /api/participants
GET/PUT/DELETE /api/participants/[id]

GET/POST   /api/contests
GET/PUT/DELETE /api/contests/[id]

POST       /api/contests/[id]/winners          — add winner
DELETE     /api/contests/[id]/winners/[winnerId] — remove winner
PATCH      /api/contests/[id]/winners/[winnerId] — update payout status
PATCH      /api/contests/[id]/winners/batch     — bulk status update

GET        /api/contests/[id]/export            — CSV download
```

## File Structure

```
tracker/
├── docker-compose.yml
├── Dockerfile
├── data/                        # SQLite file (gitignored, Docker volume)
├── drizzle/                     # Migration SQL files
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with nav
│   │   ├── page.tsx             # Dashboard
│   │   ├── participants/page.tsx
│   │   ├── contests/page.tsx
│   │   ├── contests/[id]/page.tsx
│   │   └── api/                 # Route handlers (structure mirrors routes above)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── participant-form.tsx
│   │   ├── participant-table.tsx
│   │   ├── winner-combobox.tsx  # Autocomplete for adding winners
│   │   ├── winner-table.tsx
│   │   ├── payout-badge.tsx
│   │   └── copy-button.tsx
│   ├── db/
│   │   ├── schema.ts            # Drizzle table definitions
│   │   └── index.ts             # DB connection singleton (WAL mode)
│   └── lib/
│       ├── validators.ts        # Zod schemas + EVM address validation
│       └── utils.ts             # cn() helper, address formatting
```

## Docker Setup

- **Multi-stage Dockerfile**: deps → build → slim production runner (~100MB)
- Uses Next.js `output: "standalone"` for minimal image
- **docker-compose.yml**: single service, single volume for SQLite persistence
- `docker compose up -d` — that's it

## Build Order

1. Scaffold Next.js + install deps (Drizzle, better-sqlite3, shadcn/ui, Zod, cuid2)
2. Database layer — schema + connection + migrations
3. Participants API + UI (directory page with search, add/edit/delete)
4. Contests API + UI (list page, create/edit)
5. Contest detail page — winner combobox, winner table, payout status, CSV export
6. Dashboard page
7. Dockerize (Dockerfile + docker-compose.yml)
8. Polish (copy buttons, loading states, error toasts, empty states)

## MVP Features

- Participant CRUD with EVM address validation
- Participant search by name or address
- Contest CRUD with date/description
- Add winners via autocomplete from participant directory
- Payout status tracking (pending/paid/failed) with visual badges
- CSV export of winner wallet addresses
- Click-to-copy wallet address
- Dockerized with `docker compose up`

## Future Nice-to-Haves

- Bulk import participants from CSV (migrate from Google Sheets)
- EIP-55 checksum validation
- Transaction hash storage + block explorer links
- Multi-chain support
- Contest templates (clone previous contest's winner list)
- Simple password auth for shared network deployment
- Dark mode
