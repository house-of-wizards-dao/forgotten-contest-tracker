#!/bin/sh
set -e

# Push schema to the volume-mounted database at runtime
npx drizzle-kit push

# Start the Next.js server
exec node server.js
