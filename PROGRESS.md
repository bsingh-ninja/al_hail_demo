# Progress Log

Newest first.

## 2026-11-18
### Demo 1 (Al Hail): live Gemini test passed (after fixes)
- Key in `backend/.env` works; model `gemini-2.5-flash` (newer ones on the account: up to `gemini-3.8-flash`).
- Bug found live: SDK 3.5 defaults to API v1, where function calling is off → client now uses `v1beta`.
- Quality fixes from reading real answers: invented citation (now: tools return real cite ids, server reports confirmed ids, UI drops the rest); a lease watch item miscounted as "off budget"; English names in Arabic answers; risk-committee actions missed by filtered search; a watch-list loan called a breach; "+0.5% vs budget" written as growth.
- Result: 5/5 scripted copilot questions correct (EN + AR), 4–9 s each, 0 unconfirmed citations; board pack summary written by Gemini in EN and AR, all cited; Word export OK.

### Demo 1 (Al Hail): complete UI revamp
- New shell: solid navy sidebar with the Al Hail mark and bilingual name, nav with icons, quarter note and language/theme controls (top bar with scrolling nav on phones). Old header/footer removed.
- Portfolio: large opening headline beside the three group figures; two prominent attention panels (big variance figure, larger trend line, reason); the 12 businesses as one table grouped by sector (revenue, EBITDA, variances, 8-quarter trend, status) instead of 12 cards; signals as a dated timeline.
- Business page: breadcrumb, executive header (name, sector, description, Q3 revenue and EBITDA figures), public facts aside; softer panels and taller charts.
- Copilot: question-first opening (large heading, prominent question box, suggestions as quiet rows); "New conversation".
- Signals and board pack restyled to match (grouped lists, segmented filter).
- Design tokens: quieter neutrals, hairlines instead of borders, one soft panel style, 15px base type, display/title/figure/label type styles with size-specific tracking.
- Verified with Playwright screenshots (headless Chrome replaced): every screen in light, portfolio in dark, Arabic RTL and at 400px phone width.

### Demo 1 (Al Hail): Apple-style interaction pass (apple-design skill)
- **Source documents open in a side sheet** (`components/DocumentSheet.tsx`, `motion` 12.23.12) from every citation, the board pack sources and the business page PDFs. Drag or flick the header to dismiss: 1:1 tracking from the grab point, release velocity from a short pointer history, Apple's momentum projection to choose close vs stay, spring settle that inherits the release velocity (bounce only after a flick), rubber-band resistance past the open edge, interruptible mid-flight, Esc and close button, enters and leaves from the trailing edge (left in Arabic). Cmd/Ctrl-click still opens a new tab.
- Press feedback on pointer-down for buttons, tiles and suggestions; no tap delay.
- Translucent header and copilot composer with content scrolling underneath, scroll-edge fade instead of a hard divider.
- Size-specific tracking and leading (tight large headings, neutral body, no tracking on Arabic); rem-based body size.
- Copilot: Stop button (aborts the stream). Board pack: "Board pack drafted" notice; the paper settles in.
- Accessibility: reduced motion (cross-fades, no scale), reduced transparency (solid surfaces), increased contrast (solid, defined edges); eased light/dark switch.
- Not visually checked: headless Chrome on this machine stopped loading any localhost page this session (even a static test page). Type check, lint and HTTP checks pass.

### Demo 1 (Al Hail): feature-complete, on Gemini
- **AI provider switched to Google Gemini** (`google-genai` 3.5.0): `backend/app/llm.py` shared client; copilot uses Gemini function calling with streaming, model turns (incl. thought signatures) sent back unchanged. Key in `backend/.env` (`GEMINI_API_KEY`, `GEMINI_MODEL`, default `gemini-2.5-flash`), re-read per request so no restart is needed. Verified: tools against the DB, full loop with a stubbed Gemini client built from real SDK types, clear message without a key. **Live Gemini call not yet tested (no key yet).**
- **Board pack** (`/board-pack`, `app/alhail/boardpack.py`): executive summary (Gemini from cited facts, template fallback), portfolio performance, business commentary, risks and actions (from the Group Risk Committee), sector view, sources; English and Arabic; Word download (`/alhail/board-pack/docx`) with Al Hail logo and RTL Arabic. Verified both languages via the API and rendered the Word files with LibreOffice.
- **Signals** (`/signals`): severity and business filters, grouped by month, Arabic text.
- **Arabic data text**: business locations, relationships, descriptions, signal sources and summaries, commentary and risk items (`app/alhail/content.py`, single source for PDFs, signals and board pack).
- **Design** (frontend-design skill): board pack typeset as a numbered board paper; sentence-case labels instead of all-caps; no "A · B" meta strings.
- **One-command start**: `./start-alhail.sh` (`--reseed` to rebuild data).
- Not visually checked this session: Signals page and Arabic board pack page (headless Chrome stopped loading localhost pages after the session restart; type check, lint and HTTP checks pass).

### Demo 1 (Al Hail): design pass (artifact-design skill guidance)
- Cockpit rebuilt summary-first: headline sentence ("2 of 12 businesses need attention this quarter"), one totals band (group revenue and EBITDA vs budget, 10/12 on track), then a "Needs attention" list with each flag's reason, EBITDA trend and variance, then the portfolio by sector, with signals in a side rail.
- State shown in form: a warning/critical stripe only on flagged businesses (replaces the sector colour bar on every card); EBITDA sparklines (actual vs dashed budget, latest quarter emphasised) on every business.
- Theme: all colours are now tokens with light and dark values (system setting + toggle in the header); charts use the tokens. Visible focus outlines, reduced-motion support, sticky header, phone-width layout (checked at 400px in Arabic).
- API: `/alhail/overview` now returns each business's 8-quarter EBITDA trend and its flag reason.

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
