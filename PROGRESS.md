# Progress Log

Newest first.

## 2026-11-18
### Demo 1 (Al Hail): Phases 0, 1, 2 done
- **Phase 0 (foundation):** Postgres 16 in Docker on :5433 (`docker-compose.yml`); FastAPI backend (`backend/`, `/health`); Next.js 15 app `apps/alhail-portfolio` with Al Hail brand tokens, Manrope + IBM Plex Sans Arabic, logo mark, EN/AR toggle with RTL (also `?lang=ar`).
- **Phase 1 (data):** `python -m app.alhail.seed` creates the `alhail` schema: 5 sectors, 12 businesses with public facts + source link, 8 quarters (2024-Q4 to 2026-Q3) of revenue/EBITDA/net profit vs budget, business KPIs, SAMAA + SAMA loan books, Egypt exposure, 10 signals. Deterministic (verified identical across runs). Anchors: Transguard FY25/26 revenue = AED 3,860m; Zand FY2025 net profit = AED 34.0m; Zand deposits 5.1bn; Transguard headcount 78,500. Planted: ATD EBITDA miss 2 quarters running (-9.3% in Q3), SAMAA NPL 4.6% vs 3.5% + covenant breach SAMAA-C-017.
- **Phase 2 (UI):** Cockpit (`/`): KPI strip, 12 business cards by sector with RAG + variance, latest signals. Drill-down (`/business/[id]`): public facts with source, revenue/EBITDA vs budget charts, KPIs, signals, loan book (exceptions first), country exposure. Checked via headless screenshots in EN and AR.
- **Open items:** signal/description text is English only (Arabic data translations → Phase 6); copilot needs an `ANTHROPIC_API_KEY` in `backend/.env` (Phase 4).

- Created project at `/home/ninjatech/Demos/uae-ai-demos`, git initialised, plan docs + logos in `docs/`.
- Development happens on branch `worktree-alhail-demo` (worktree under `.claude/worktrees/alhail-demo`).
- Wrote `DEVELOPMENT_PLAN.md`.
- Started **Demo 1 (Al Hail), Phase 0: Foundation**.
