#!/bin/sh
set -e

# Remove local .env so Docker environment variables take precedence
# (Prisma auto-loads .env via dotenv, which would override Docker's DATABASE_URL)
if [ -f ".env" ]; then
  echo "⚠️  Removing mounted .env to use Docker environment variables"
  rm -f .env
fi

echo "══════════════════════════════════════════════"
echo "🔄 Syncing database schema (prisma db push)..."
echo "══════════════════════════════════════════════"
npx prisma db push --accept-data-loss

# Run seed if available
echo "══════════════════════════════════════════════"
echo "🌱 Checking seed data..."
echo "══════════════════════════════════════════════"
if [ -f "prisma/seed.js" ]; then
  node prisma/seed.js || echo "⚠️  Seed skipped (may already exist)"
fi

echo "══════════════════════════════════════════════"
echo "🚀 Starting backend with nodemon..."
echo "══════════════════════════════════════════════"
exec nodemon --watch . --ext js,json --ignore node_modules --ignore logs index.js
