# Forgotten Contest Tracker -- User Guide

This guide walks through every feature of the Forgotten Contest Tracker application, from initial setup to daily use.

## Table of Contents

- [First-Time Setup](#first-time-setup)
- [Dashboard Overview](#dashboard-overview)
- [Managing Participants](#managing-participants)
- [Managing Contests](#managing-contests)
- [Managing Winners](#managing-winners)
- [Payout Tracking Workflow](#payout-tracking-workflow)
- [Exporting Data](#exporting-data)
- [API Authentication](#api-authentication)

---

## First-Time Setup

### Option A: Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Push the database schema to create the SQLite database:

   ```bash
   npm run db:push
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B: Docker (production)

1. Run the application with Docker Compose:

   ```bash
   docker compose up -d
   ```

2. The database schema is applied automatically on container startup. No manual migration step is needed.

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Optional: Set an API key

To protect the application from unauthorized writes, set the `API_KEY` and `NEXT_PUBLIC_API_KEY` environment variables. See [API Authentication](#api-authentication) for details.

---

## Dashboard Overview

The dashboard is the landing page at `/`. It displays:

- **Total Participants** -- the number of registered participants in the directory.
- **Total Contests** -- the number of contests created.
- **Recent Contests** -- the 5 most recent contests by date, shown as clickable cards.

Each stat card links to its respective page. Click a recent contest to go directly to its detail page.

When the application is first launched with an empty database, the dashboard shows zeroed-out stats and a prompt to create your first contest.

---

## Managing Participants

Navigate to **Participants** in the top navigation bar, or visit `/participants`.

### Adding a participant

1. Click the **Add Participant** button in the top-right corner.
2. Fill in the form:
   - **Name** (required) -- the participant's display name, up to 200 characters.
   - **Wallet Address** (required) -- a valid EVM wallet address in the format `0x` followed by exactly 40 hexadecimal characters (for example, `0x1234abcd...`). The address is stored in lowercase regardless of the case you enter.
   - **Notes** (optional) -- free-text notes, up to 1000 characters. Useful for recording a participant's Discord handle, team name, or other context.
3. Click **Add Participant** to save.

If the wallet address is already registered to another participant, the form displays an error. Each wallet address must be unique across all participants.

### Editing a participant

1. Find the participant in the table (use the search box if needed).
2. Click the **Edit** button on the participant's row.
3. Modify the fields and click **Save Changes**.

### Deleting a participant

1. Click the **Delete** button on the participant's row.
2. Confirm the deletion in the browser dialog.

A participant cannot be deleted if they are listed as a winner in any contest. Remove them from all contests first, then delete.

### Searching

Use the search box above the participant table to filter by name or wallet address. The filter runs client-side against the full participant list and updates as you type.

### Copying a wallet address

Each wallet address in the table is shown in a truncated format (for example, `0x1234...abcd`). Click the copy icon next to any wallet address to copy the full address to your clipboard. A brief "Copied!" confirmation appears.

---

## Managing Contests

Navigate to **Contests** in the top navigation bar, or visit `/contests`.

### Creating a contest

1. Click the **Add Contest** button.
2. Fill in the form:
   - **Name** (required) -- the contest title, up to 200 characters.
   - **Date** (required) -- the contest date in YYYY-MM-DD format (use the date picker).
   - **Description** (optional) -- additional context, up to 2000 characters.
3. Click **Create Contest**.

Contests appear as cards on the list page, sorted by date (newest first).

### Viewing a contest

Click any contest card to open its detail page at `/contests/:id`. The detail page shows:

- Contest name, date, and description
- An autocomplete input for adding winners
- The full winner table with payout status controls
- An **Export CSV** button (visible when at least one winner exists)

### Editing a contest

1. On the contest detail page, click **Edit**.
2. Modify the name, date, or description.
3. Click **Save Changes**.

### Deleting a contest

1. On the contest detail page, click **Delete**.
2. Confirm the deletion.

Deleting a contest permanently removes all of its winner records. The participants themselves are not deleted.

---

## Managing Winners

Winners are managed on the contest detail page at `/contests/:id`.

### Adding a winner

1. Click the search input labeled "Search participants to add as winner...".
2. Start typing a participant's name or wallet address. A dropdown appears with matching results.
3. Use the mouse or arrow keys to highlight a participant, then click or press Enter to select.
4. The participant is immediately added to the winner list with a **Pending** payout status.

Participants who are already winners in this contest are excluded from the dropdown. If all participants are already winners, the dropdown displays "All participants are already winners."

### Changing a single winner's payout status

Each winner row has a dropdown next to its payout status badge. Select a new status (**Pending**, **Paid**, or **Failed**) from the dropdown. The change is saved immediately.

### Bulk status updates

1. Use the checkboxes on the left side of the winner table to select multiple winners. Use the header checkbox to select or deselect all.
2. A toolbar appears above the table showing the number of selected winners.
3. Choose the target status from the dropdown in the toolbar (**Pending**, **Paid**, or **Failed**).
4. Click **Update Status** to apply the change to all selected winners at once.

### Removing a winner

Click the **Remove** button on any winner row. The participant is removed from this contest's winner list. The participant record itself is not affected and remains in the directory.

---

## Payout Tracking Workflow

The payout tracking system uses three statuses, each displayed with a color-coded badge:

| Status    | Badge color | Meaning                                      |
| --------- | ----------- | -------------------------------------------- |
| Pending   | Yellow      | Payout has not been processed yet            |
| Paid      | Green       | Payout has been sent successfully             |
| Failed    | Red         | Payout attempt failed and needs attention     |

### Recommended workflow

1. **Add winners** to a contest. All new winners start with **Pending** status.
2. Process payouts externally (send tokens/ETH to the wallet addresses).
3. Return to the contest detail page and mark winners as **Paid** individually using the per-row dropdown, or select multiple winners and use the **bulk update** toolbar to mark them all as **Paid** at once.
4. If any payouts fail, mark those winners as **Failed** so they are easy to identify and retry.
5. Export the final winner list as CSV for your records.

The payout status is included in the CSV export, making it easy to reconcile payouts outside the application.

---

## Exporting Data

### CSV export

1. Navigate to a contest detail page.
2. Click the **Export CSV** button (appears only when the contest has at least one winner).
3. The browser downloads a CSV file named `<contest-name>_winners.csv`.

The CSV contains the following columns:

| Column            | Description                           |
| ----------------- | ------------------------------------- |
| Name              | Participant's name                    |
| Wallet Address    | Full EVM wallet address (lowercase)   |
| Payout Status     | pending, paid, or failed              |
| Prize Note        | Optional note attached to the winner  |
| Payout TX Hash    | Transaction hash (if recorded)        |

The file uses standard CSV formatting with proper escaping of commas, quotes, and newlines.

### Direct API access

You can also fetch the CSV programmatically:

```bash
curl -o winners.csv http://localhost:3000/api/contests/<contest-id>/export
```

The export endpoint is a GET request and does not require authentication, even when `API_KEY` is configured.

---

## API Authentication

Authentication is optional. When no `API_KEY` environment variable is set, all API requests are allowed without restriction. This is the default behavior and is suitable for local development or trusted networks.

### Enabling authentication

Set two environment variables:

- `API_KEY` -- the server-side secret used by the middleware to validate incoming requests.
- `NEXT_PUBLIC_API_KEY` -- the same value, exposed to the browser so the application's built-in fetch helper can attach it to requests automatically.

**For local development**, create a `.env.local` file in the project root:

```
API_KEY=my-secret-key
NEXT_PUBLIC_API_KEY=my-secret-key
```

**For Docker**, add an `environment` section to `docker-compose.yml`:

```yaml
services:
  forgotten-contest-tracker:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=my-secret-key
      - NEXT_PUBLIC_API_KEY=my-secret-key
    volumes:
      - forgotten-contest-tracker-data:/app/data
```

### How it works

- The Next.js middleware intercepts all requests to `/api/*`.
- **GET requests** are never blocked. Reading data does not require authentication.
- **POST, PUT, PATCH, and DELETE requests** must include the header `X-API-Key` with a value matching the `API_KEY` environment variable.
- If the header is missing or incorrect, the server returns `401 Unauthorized`:

  ```json
  { "error": "Unauthorized" }
  ```

### Using the API with curl

GET requests work without any special headers:

```bash
curl http://localhost:3000/api/participants
```

Mutating requests require the `X-API-Key` header:

```bash
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-key" \
  -d '{"name": "Alice", "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"}'
```

### Browser usage

When `NEXT_PUBLIC_API_KEY` is set, the application's built-in `apiFetch` utility automatically attaches the `X-API-Key` header to all requests made from the browser. No manual configuration is needed -- the UI works transparently with authentication enabled.
