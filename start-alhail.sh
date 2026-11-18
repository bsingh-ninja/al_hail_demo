#!/usr/bin/env bash
# Start the Al Hail Group Portfolio Copilot demo: database, API (:8000) and web app (:3001).
# Usage: ./start-alhail.sh          (Ctrl+C stops the API and web app; the database keeps running)
#        ./start-alhail.sh --reseed (rebuild demo data and source PDFs first)
set -euo pipefail
cd "$(dirname "$0")"

echo "1/4 Database"
docker compose up -d db >/dev/null
until docker exec uae-demos-db pg_isready -U demo >/dev/null 2>&1; do sleep 1; done

echo "2/4 Backend dependencies"
if [ ! -x backend/.venv/bin/uvicorn ]; then
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -q -r backend/requirements.txt
fi
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "   Created backend/.env: paste your Gemini key after GEMINI_API_KEY= to enable the AI features."
fi

echo "3/4 Demo data"
seeded=$(docker exec uae-demos-db psql -U demo -d demos -tAc "select to_regclass('alhail.chunk') is not null" 2>/dev/null || echo f)
if [ "${1:-}" = "--reseed" ] || [ "$seeded" != "t" ]; then
  (cd backend && .venv/bin/python -m app.alhail.seed && .venv/bin/python -m app.alhail.docs)
fi

echo "4/4 API and web app"
[ -d apps/alhail-portfolio/node_modules ] || (cd apps/alhail-portfolio && pnpm install --silent)
(cd backend && .venv/bin/uvicorn app.main:app --port 8000 --reload --reload-dir app) &
API_PID=$!
(cd apps/alhail-portfolio && pnpm dev --port 3001) &
WEB_PID=$!
trap 'kill $API_PID $WEB_PID 2>/dev/null' EXIT INT TERM

echo
echo "Al Hail demo: http://localhost:3001   (Arabic: http://localhost:3001/?lang=ar)"
wait
