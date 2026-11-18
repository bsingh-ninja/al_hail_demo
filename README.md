# UAE AI Demos

Two standalone demos for the owner meeting: **Al Hail Group Portfolio Copilot** (ready) and **Transguard Workforce Intelligence** (next).

- Plan: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
- Status: [PROGRESS.md](PROGRESS.md)
- Background (plans, brand kits, logos): [docs/](docs/)

## Run the Al Hail demo

```bash
./start-alhail.sh            # database, API on :8000, web app on :3001
./start-alhail.sh --reseed   # same, but rebuild the demo data and source PDFs first
```

Open http://localhost:3001 (Arabic: http://localhost:3001/?lang=ar). Requires Docker, Python 3.12 and pnpm.

### AI key (Gemini)

The copilot and the AI-written board pack summary use Google Gemini. Put your key in **`backend/.env`**:

```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
```

The key is read on every request, so no restart is needed. `backend/.env` is ignored by git. Without a key, everything else works and the board pack summary falls back to a template.

## What the demo shows

| Screen | What it does |
|---|---|
| Portfolio | The 12 businesses by sector, flagged businesses first with the reason, EBITDA trend vs budget |
| Business page | Revenue and EBITDA vs budget, KPIs, loan book exceptions, country exposure, source PDFs |
| Copilot | Questions in English or Arabic, answered from the data and documents with clickable citations |
| Board pack | Drafts the quarterly board pack (summary, performance, commentary, risks and actions, sectors) and downloads it as Word |
| Signals | Risk and news signals with severity and business filters |

All quarterly figures are simulated; public facts link to alhail.com.

## Manual start (instead of the script)

```bash
docker compose up -d
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m app.alhail.seed && .venv/bin/python -m app.alhail.docs
.venv/bin/uvicorn app.main:app --port 8000 --reload --reload-dir app
cd apps/alhail-portfolio && pnpm install && pnpm dev --port 3001
```
