from fastapi import APIRouter, HTTPException

from app.db import fetch_all, fetch_one

router = APIRouter(prefix="/alhail", tags=["alhail"])

LATEST = "2026-Q3"
PREVIOUS = "2026-Q2"


def rag(variance_pct: float, flagged: bool) -> str:
    if flagged or variance_pct <= -10:
        return "red" if variance_pct <= -10 else "amber"
    return "amber" if variance_pct <= -5 else "green"


def _num(v):
    return float(v) if v is not None else None


@router.get("/overview")
def overview(period: str = LATEST):
    sectors = fetch_all("select * from alhail.sector order by sort")
    rows = fetch_all(
        """
        select b.id, b.sector_id, b.name_en, b.name_ar, b.location, b.relationship,
               r.actual as revenue, r.budget as revenue_budget,
               e.actual as ebitda, e.budget as ebitda_budget,
               (select count(*) from alhail.signal s where s.business_id = b.id and s.severity in ('watch','alert')) as flags
        from alhail.business b
        join alhail.metric r on r.business_id = b.id and r.period = %(p)s and r.metric = 'revenue'
        join alhail.metric e on e.business_id = b.id and e.period = %(p)s and e.metric = 'ebitda'
        """,
        {"p": period},
    )
    businesses = []
    for r in rows:
        ev = (_num(r["ebitda"]) / _num(r["ebitda_budget"]) - 1) * 100
        rv = (_num(r["revenue"]) / _num(r["revenue_budget"]) - 1) * 100
        businesses.append({
            **{k: r[k] for k in ("id", "sector_id", "name_en", "name_ar", "location", "relationship")},
            "revenue": _num(r["revenue"]), "revenue_var_pct": round(rv, 1),
            "ebitda": _num(r["ebitda"]), "ebitda_var_pct": round(ev, 1),
            "flags": r["flags"], "rag": rag(ev, r["flags"] > 0 and ev <= -5),
        })
    totals = {
        "revenue": round(sum(b["revenue"] for b in businesses), 1),
        "ebitda": round(sum(b["ebitda"] for b in businesses), 1),
        "ebitda_budget": round(sum(_num(r["ebitda_budget"]) for r in rows), 1),
        "amber_or_red": sum(1 for b in businesses if b["rag"] != "green"),
    }
    return {"period": period, "sectors": sectors, "businesses": businesses, "totals": totals}


@router.get("/periods")
def periods():
    return [r["period"] for r in fetch_all("select distinct period from alhail.metric order by period")]


@router.get("/business/{bid}")
def business(bid: str):
    b = fetch_one(
        "select b.*, s.name_en as sector_en, s.name_ar as sector_ar, s.color from alhail.business b "
        "join alhail.sector s on s.id = b.sector_id where b.id = %s", (bid,))
    if not b:
        raise HTTPException(404, "Unknown business")
    metrics = fetch_all(
        "select period, metric, label, unit, actual::float, budget::float from alhail.metric "
        "where business_id = %s order by metric, period", (bid,))
    signals = fetch_all(
        "select date::text, source, summary, severity from alhail.signal where business_id = %s order by date desc", (bid,))
    loans = fetch_all(
        "select ref, borrower, sector, outstanding_aed_m::float, dpd, dscr::float, dscr_min::float, status "
        "from alhail.loan where lender_id = %s order by (status = 'Performing'), outstanding_aed_m desc", (bid,))
    exposure = fetch_all(
        "select country, period, carrying_value_aed_m::float, note from alhail.exposure where business_id = %s "
        "order by country, period", (bid,))
    return {"business": b, "metrics": metrics, "signals": signals, "loans": loans, "exposure": exposure}


@router.get("/signals")
def signals():
    return fetch_all(
        "select s.date::text, s.business_id, b.name_en, b.name_ar, s.source, s.summary, s.severity "
        "from alhail.signal s join alhail.business b on b.id = s.business_id order by s.date desc")
