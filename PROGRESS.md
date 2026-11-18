# Progress Log

Newest first.

## 2026-11-18
### Demo 1 (Al Hail): Phase 4 (copilot) built, waiting on API key for the live test
- `backend/app/alhail/copilot.py`: Claude (`claude-opus-5-5`, effort medium, adaptive thinking) tool-use loop, streamed over SSE from `POST /alhail/copilot`. 7 strict tools: `portfolio_overview`, `query_financials`, `list_businesses`, `search_documents`, `list_signals`, `get_exposure`, `get_loan_exceptions`. Prompt caching on (top-level `cache_control`); server-side refusal fallback on (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`). Answers cite documents as `[D<id>p<page>]`.
- Front end `/copilot`: suggested questions (EN + AR), tool-call chips, streaming markdown answer, citation chips that open the source PDF at the page.
- Verified: every tool against the DB (e.g. Egypt exposure AED 460m → 430m); full loop with a stubbed client (tool call → result → streamed text → done); SDK accepts all request parameters; no key → clear error event; browser console clean.
- **Not yet verified:** a live answer from Claude, because no Anthropic credentials are configured on this machine. Add `ANTHROPIC_API_KEY=...` to `backend/.env`.

### Demo 1 (Al Hail): Phase 3 (documents) done
- `python -m app.alhail.docs` generates 25 simulated PDFs from the seeded numbers (management accounts for 12 businesses × 2026-Q2/Q3, plus Q3 Group Risk Committee minutes), with planted commentary (ATD Egypt delay, SAMAA covenant breach, Egypt FX, Emaar Square lease expiries).
- Ingestion: pypdf text → overlapping 3-sentence chunks → Postgres full-text search (72 chunks), any-term matching ranked by relevance; each hit carries document + page for citations.
- API: `/alhail/documents`, `/alhail/documents/{id}/file` (PDF), `/alhail/search?q=`. Business page lists its source PDFs.
- Simplification vs plan: PDFs only (no XLSX), because the copilot reads numbers from SQL and only needs the documents for narrative.

### Demo 1 (Al Hail): Phases 0, 1, 2 done
- **Phase 0 (foundation):** Postgres 16 in Docker on :5433 (`docker-compose.yml`); FastAPI backend (`backend/`, `/health`); Next.js 15 app `apps/alhail-portfolio` with Al Hail brand tokens, Manrope + IBM Plex Sans Arabic, logo mark, EN/AR toggle with RTL (also `?lang=ar`).
- **Phase 1 (data):** `python -m app.alhail.seed` creates the `alhail` schema: 5 sectors, 12 businesses with public facts + source link, 8 quarters (2024-Q4 to 2026-Q3) of revenue/EBITDA/net profit vs budget, business KPIs, SAMAA + SAMA loan books, Egypt exposure, 10 signals. Deterministic (verified identical across runs). Anchors: Transguard FY25/26 revenue = AED 3,860m; Zand FY2025 net profit = AED 34.0m; Zand deposits 5.1bn; Transguard headcount 78,500. Planted: ATD EBITDA miss 2 quarters running (-9.3% in Q3), SAMAA NPL 4.6% vs 3.5% + covenant breach SAMAA-C-017.
- **Phase 2 (UI):** Cockpit (`/`): KPI strip, 12 business cards by sector with RAG + variance, latest signals. Drill-down (`/business/[id]`): public facts with source, revenue/EBITDA vs budget charts, KPIs, signals, loan book (exceptions first), country exposure. Checked via headless screenshots in EN and AR.
- **Open items:** signal/description text is English only (Arabic data translations → Phase 6); copilot needs an `ANTHROPIC_API_KEY` in `backend/.env` (Phase 4).

- Created project at `/home/ninjatech/Demos/uae-ai-demos`, git initialised, plan docs + logos in `docs/`.
- Development happens on branch `worktree-alhail-demo` (worktree under `.claude/worktrees/alhail-demo`).
- Wrote `DEVELOPMENT_PLAN.md`.
- Started **Demo 1 (Al Hail), Phase 0: Foundation**.
