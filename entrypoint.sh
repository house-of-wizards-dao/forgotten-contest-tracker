#!/bin/sh
set -e

# Apply schema migrations to PostgreSQL (only on first boot or schema changes)
npx drizzle-kit push --force

# Start the Next.js server
exec node server.js
