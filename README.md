# Al Hail Group Portfolio Copilot (demo)

AI portfolio intelligence demo prepared for Al Hail Holding by NinjaTech: one view of the 12 businesses, a copilot that answers in English or Arabic with every number linked to its source, and a quarterly board pack drafted for the board office.

All quarterly figures, borrowers and documents are simulated; business names and public facts come from alhail.com.

## Run

```bash
./start.sh            # database (:5433), API (:8000), web app (:3001)
./start.sh --reseed   # rebuild the demo data and source PDFs first
```

Open http://localhost:3001 (Arabic: http://localhost:3001/?lang=ar). Requires Docker, Python 3.12 and pnpm.

### Gemini key

The copilot and the AI-written board pack summary use Google Gemini. Put your key in `backend/.env` (ignored by git):

```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.5-flash
```

The key is read on every request, so no restart is needed. Without a key everything else works and the board pack summary uses a template.

## Screens

| Screen | What it does |
|---|---|
| Portfolio | The 12 businesses by sector, flagged businesses first with the reason, EBITDA trend vs budget |
| Business page | Revenue and EBITDA vs budget, KPIs, loan book exceptions, country exposure, source PDFs |
| Copilot | Questions in English or Arabic, answered from the data and documents; every answer must look up the data first, and only server-confirmed citations are shown |
| Board pack | Drafts the quarterly board pack (summary, performance, commentary, risks and actions, sectors) and downloads it as Word |
| Signals | Risk and news signals with severity and business filters |

## Layout

```
backend/   FastAPI + Postgres (app/alhail: seed, documents, copilot, board pack)
web/       Next.js app (Al Hail brand, EN/AR, light/dark)
docs/      plan, brand kit, logo
```
