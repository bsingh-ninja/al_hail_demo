# UAE AI Demos

Two standalone demos for the owner meeting: **Al Hail Group Portfolio Copilot** (in progress) and **Transguard Workforce Intelligence** (next).

- Plan: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
- Status: [PROGRESS.md](PROGRESS.md)
- Background (plans, brand kits, logos): [docs/](docs/)

## Run the Al Hail demo

```bash
# 1. Database (Postgres 16 on :5433)
docker compose up -d

# 2. Backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # first time only
cp .env.example .env            # then set ANTHROPIC_API_KEY for the copilot
.venv/bin/python -m app.alhail.seed    # portfolio data
.venv/bin/python -m app.alhail.docs    # source PDFs + search index
.venv/bin/uvicorn app.main:app --port 8000 --reload --reload-dir app

# 3. Front end (new terminal)
cd apps/alhail-portfolio
pnpm install                     # first time only
pnpm dev --port 3001             # http://localhost:3001  (Arabic: http://localhost:3001/?lang=ar)
```

All quarterly figures are simulated; public facts link to alhail.com.
