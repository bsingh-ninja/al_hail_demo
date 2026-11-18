"""Al Hail portfolio copilot: Gemini function-calling loop streamed to the browser as Server-Sent Events.

The model answers only from tool results (Postgres + document search) and cites documents as [D<id>p<page>].
"""
import json
import re
from collections.abc import Iterator

from google.genai import errors, types

from app.alhail.docs import search
from app.alhail.router import overview
from app.db import fetch_all
from app.llm import MODEL, NO_KEY_MESSAGE, client, error_message

MAX_TOOL_ROUNDS = 8
CITE_RE = re.compile(r"D\d+p\d+")

SYSTEM = """You are the Group Portfolio Copilot for Al Hail Holding, a UAE diversified investment holding company \
with 12 businesses across 5 sectors (Financial Services & Technology, Critical Logistics, Energy, Real Estate, \
Infrastructure Development). Your users are Al Hail's investment leadership and board office.

How to answer:
- Use the tools to get facts. Never state a number that did not come from a tool result in this conversation.
- Figures are in AED millions unless a unit says otherwise. Quarters are written like 2026-Q3; the latest quarter is 2026-Q3.
- Cite sources: when a tool result carries a `cite` value such as D12p1, put it in square brackets right after the \
fact, e.g. "EBITDA was AED 8.3m [D4p1]". Cite every number and every claim taken from a document. Use only `cite` \
values that appear in tool results in this conversation, copied exactly; never construct or guess one. If a fact \
has no `cite`, state it without a citation.
- A business is off budget or needs attention only when its `rag` is amber or red. A `watch_note` on a green business \
is a watch item, not a budget miss; mention it separately if relevant.
- Reply in the language of the user's question (Arabic or English). When replying in Arabic, use the `name_ar` field \
for business names. Keep IDs and citations unchanged.
- Put each citation in its own brackets, e.g. [D21p1] [D21p2], never several in one bracket.
- For questions about borrowers, loans or covenants, use get_loan_exceptions for each loan's status; call a loan a \
covenant breach only when its status says so (a "Watch" loan is not a breach).
- Be concise and executive: lead with the answer in one or two sentences, then a short list or a small markdown table \
if it helps. No preamble.
- Quarterly figures in this demo are simulated; public facts come from alhail.com. If asked, say so plainly.
- If the tools cannot answer the question, say what is missing instead of guessing."""


def _schema(properties: dict, required: list[str]) -> dict:
    return {"type": "object", "properties": properties, "required": required}


TOOLS = [
    {
        "name": "portfolio_overview",
        "description": "Revenue and EBITDA (AED m) vs budget for all 12 businesses in one quarter, with variance % "
                       "and RAG status (green/amber/red), plus group totals. Start here for portfolio-wide questions.",
        "parameters": _schema({"period": {"type": "string", "description": "Quarter, e.g. 2026-Q3"}}, ["period"]),
    },
    {
        "name": "query_financials",
        "description": "Time series of one metric for one business (or 'all'), actual vs budget per quarter. "
                       "Metrics: revenue, ebitda, net_profit, plus business KPIs such as customer_deposits, loan_book, "
                       "npl_ratio, headcount, order_backlog, footfall, occupancy, plots_leased, aum, transfer_volume.",
        "parameters": _schema({
            "business_id": {"type": "string", "description": "Business id from list_businesses, or 'all'"},
            "metric": {"type": "string"},
            "period_from": {"type": "string", "description": "First quarter, e.g. 2025-Q4"},
            "period_to": {"type": "string", "description": "Last quarter, e.g. 2026-Q3"},
        }, ["business_id", "metric", "period_from", "period_to"]),
    },
    {
        "name": "list_businesses",
        "description": "The 12 businesses: id, name, sector, location, Al Hail's relationship, and public facts.",
        "parameters": _schema({}, []),
    },
    {
        "name": "search_documents",
        "description": "Full-text search over management accounts (2026-Q2, 2026-Q3) and Group Risk Committee minutes. "
                       "Returns passages with a `cite` id. Use for reasons, commentary, actions and risks.",
        "parameters": _schema({
            "query": {"type": "string"},
            "business_id": {"type": "string", "description": "Optional: restrict to one business id"},
        }, ["query"]),
    },
    {
        "name": "list_signals",
        "description": "Risk and news signals (info/watch/alert) across the portfolio, newest first.",
        "parameters": _schema({
            "business_id": {"type": "string", "description": "Optional: one business id"},
            "min_severity": {"type": "string", "enum": ["info", "watch", "alert"]},
        }, ["min_severity"]),
    },
    {
        "name": "get_exposure",
        "description": "Group carrying value (AED m) by country and business for 2026-Q2 and 2026-Q3, with totals.",
        "parameters": _schema({"country": {"type": "string", "description": "Optional: e.g. Egypt or UAE"}}, []),
    },
    {
        "name": "get_loan_exceptions",
        "description": "Non-performing loans (watch list and covenant breaches) for a lending business: samaa or sama-egypt.",
        "parameters": _schema({"lender_id": {"type": "string", "enum": ["samaa", "sama-egypt"]}}, ["lender_id"]),
    },
]

GEMINI_TOOLS = [types.Tool(function_declarations=[
    types.FunctionDeclaration(name=t["name"], description=t["description"], parameters_json_schema=t["parameters"])
    for t in TOOLS
])]


def _doc_cites() -> dict[tuple[str, str], str]:
    rows = fetch_all("select id, business_id, period from alhail.document where business_id is not null")
    return {(r["business_id"], r["period"]): f"D{r['id']}p1" for r in rows}


def run_tool(name: str, args: dict) -> object:
    if name == "portfolio_overview":
        o = overview(args["period"])
        cites = _doc_cites()
        return {"period": o["period"], "totals": o["totals"],
                "businesses": [{**{k: b[k] for k in ("id", "name_en", "name_ar", "sector_id", "revenue", "revenue_var_pct",
                                                     "ebitda", "ebitda_var_pct", "rag")},
                                **({"reason": b["reason"]} if b["rag"] != "green" else
                                   {"watch_note": b["reason"]} if b["reason"] else {}),
                                "cite": cites.get((b["id"], o["period"]))} for b in o["businesses"]]}
    if name == "query_financials":
        cites = _doc_cites()
        rows = fetch_all(
            "select business_id, period, metric, label, unit, actual::float, budget::float from alhail.metric "
            "where (%(b)s = 'all' or business_id = %(b)s) and metric = %(m)s and period between %(f)s and %(t)s "
            "order by business_id, period",
            {"b": args["business_id"], "m": args["metric"], "f": args["period_from"], "t": args["period_to"]})
        for r in rows:
            r["variance_pct"] = round((r["actual"] / r["budget"] - 1) * 100, 1) if r["budget"] else None
            r["cite"] = cites.get((r["business_id"], r["period"]))
        return rows or {"error": "No rows. Check business_id, metric name and period format (YYYY-Qn)."}
    if name == "list_businesses":
        return fetch_all("select b.id, b.name_en, b.name_ar, s.name_en as sector, b.location, b.relationship, b.facts, b.source_url "
                         "from alhail.business b join alhail.sector s on s.id = b.sector_id order by s.sort, b.name_en")
    if name == "search_documents":
        hits = search(args["query"], args.get("business_id") or None)
        return [{"cite": f"D{h['document_id']}p{h['page']}", "document": h["title"], "text": h["text"]} for h in hits] \
            or {"result": "No matching passages."}
    if name == "list_signals":
        levels = {"info": 0, "watch": 1, "alert": 2}
        cites = _doc_cites()
        rows = fetch_all("select s.date::text, s.business_id, b.name_en, b.name_ar, s.source, s.summary, s.severity "
                         "from alhail.signal s join alhail.business b on b.id = s.business_id "
                         "where (%(b)s::text is null or s.business_id = %(b)s) order by s.date desc",
                         {"b": args.get("business_id") or None})
        rows = [r for r in rows if levels[r["severity"]] >= levels[args.get("min_severity", "info")]]
        for r in rows:
            r["cite"] = cites.get((r["business_id"], "2026-Q3"))
        return rows
    if name == "get_exposure":
        rows = fetch_all("select e.business_id, b.name_en, b.name_ar, e.country, e.period, e.carrying_value_aed_m::float, e.note "
                         "from alhail.exposure e join alhail.business b on b.id = e.business_id "
                         "where (%(c)s::text is null or lower(e.country) = lower(%(c)s)) order by e.period, e.business_id",
                         {"c": args.get("country") or None})
        cites = _doc_cites()
        minutes = fetch_all("select id from alhail.document where business_id is null and period = '2026-Q3'")
        totals: dict[str, float] = {}
        for r in rows:
            totals[r["period"]] = round(totals.get(r["period"], 0) + r["carrying_value_aed_m"], 1)
            r["cite"] = cites.get((r["business_id"], r["period"]))
        return {"rows": rows, "totals_by_period": totals,
                "risk_committee_note": {"text": "Group Risk Committee: Egypt carrying value declined in Q3 on FX translation "
                                                "and provisions; Group Finance to report Egypt exposure quarterly.",
                                        "cite": f"D{minutes[0]['id']}p1" if minutes else None},
                "note": "Simulated carrying values; Egypt rows cover SAMA Finance and the ATD Egypt share."}
    if name == "get_loan_exceptions":
        doc = fetch_all("select id, pages from alhail.document where business_id = %s and period = '2026-Q3'",
                        (args["lender_id"],))
        cite = f"D{doc[0]['id']}p{doc[0]['pages']}" if doc else None  # exceptions are listed on the last page
        rows = fetch_all("select ref, sector, outstanding_aed_m::float, dpd, dscr::float, dscr_min::float, status "
                         "from alhail.loan where lender_id = %s and status <> 'Performing' order by status, ref",
                         (args["lender_id"],))
        return [{**r, "cite": cite} for r in rows]
    raise ValueError(f"Unknown tool {name}")


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False, default=str)}\n\n"


def _count(output: object) -> int:
    if isinstance(output, list):
        return len(output)
    if isinstance(output, dict):
        return len(output.get("rows", output.get("businesses", [])) or [1])
    return 1


def chat(history: list[dict]) -> Iterator[str]:
    """Yield SSE strings. `history` is [{role: user|assistant, content: str}, ...], ending with a user turn."""
    gemini = client()
    if gemini is None:
        yield _sse({"type": "error", "message": NO_KEY_MESSAGE})
        return

    contents = [types.Content(role="model" if m["role"] == "assistant" else "user",
                              parts=[types.Part.from_text(text=m["content"])]) for m in history]
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM,
        tools=GEMINI_TOOLS,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )

    valid_cites: set[str] = set()
    try:
        for _ in range(MAX_TOOL_ROUNDS):
            turn_parts: list[types.Part] = []
            finish = None
            for chunk in gemini.models.generate_content_stream(model=MODEL, contents=contents, config=config):
                if not chunk.candidates:
                    continue
                cand = chunk.candidates[0]
                finish = cand.finish_reason or finish
                for part in (cand.content.parts if cand.content and cand.content.parts else []):
                    turn_parts.append(part)  # kept whole: thought signatures must go back unchanged
                    if part.text and not part.thought:
                        yield _sse({"type": "text", "text": part.text})

            calls = [p.function_call for p in turn_parts if p.function_call]
            if not calls:
                if finish and str(finish).endswith(("SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST")):
                    yield _sse({"type": "error", "message": "The model declined this request."})
                elif finish and str(finish).endswith("MAX_TOKENS"):
                    yield _sse({"type": "error", "message": "The answer was cut off; please ask a narrower question."})
                yield _sse({"type": "done", "model": MODEL, "cites": sorted(valid_cites)})
                return

            contents.append(types.Content(role="model", parts=turn_parts))
            responses = []
            for call in calls:
                call_id = call.id or call.name
                args = dict(call.args or {})
                yield _sse({"type": "tool_call", "id": call_id, "name": call.name, "input": args})
                try:
                    output = run_tool(call.name, args)
                    payload = {"result": json.loads(json.dumps(output, default=str))}
                    valid_cites |= set(CITE_RE.findall(json.dumps(output, default=str)))
                    yield _sse({"type": "tool_result", "id": call_id, "name": call.name, "count": _count(output)})
                except Exception as e:  # report tool failures to the model rather than aborting the turn
                    payload = {"error": str(e)}
                    yield _sse({"type": "tool_result", "id": call_id, "name": call.name, "error": str(e)})
                responses.append(types.Part(function_response=types.FunctionResponse(
                    id=call.id, name=call.name, response=payload)))
            contents.append(types.Content(role="user", parts=responses))

        yield _sse({"type": "error", "message": "Stopped after too many tool rounds."})
    except errors.APIError as e:
        yield _sse({"type": "error", "message": error_message(e)})
