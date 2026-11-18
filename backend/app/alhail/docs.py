"""Simulated source documents for the Al Hail demo + ingestion into Postgres full-text search.

generate(): writes management-accounts PDFs (2026-Q2, 2026-Q3) per business and Q3 risk committee
            minutes into backend/generated/alhail/docs, built from the seeded numbers.
ingest():   extracts text per page with pypdf and stores it in alhail.document / alhail.chunk.

Run: .venv/bin/python -m app.alhail.docs   (after app.alhail.seed)
"""
import re
from pathlib import Path

from fpdf import FPDF
from pypdf import PdfReader

from app.alhail.content import RISK_ITEMS, commentary
from app.db import connect, fetch_all

DOC_DIR = Path(__file__).resolve().parents[2] / "generated" / "alhail" / "docs"
QUARTERS = ["2026-Q2", "2026-Q3"]
NAVY = (6, 43, 73)



def _pdf(title: str, subtitle: str) -> FPDF:
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(True, margin=18)
    pdf.add_page()
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, 210, 26, "F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 15)
    pdf.set_xy(12, 7)
    pdf.cell(0, 7, title)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(12, 15)
    pdf.cell(0, 5, subtitle + "  |  SIMULATED DATA FOR DEMONSTRATION")
    pdf.set_text_color(9, 19, 31)
    pdf.set_y(34)
    return pdf


def _para(pdf: FPDF, text: str):
    pdf.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")


def _heading(pdf: FPDF, text: str):
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*NAVY)
    pdf.cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(9, 19, 31)
    pdf.set_font("Helvetica", "", 10)


def _table(pdf: FPDF, rows: list[dict]):
    pdf.set_font("Helvetica", "B", 9)
    widths = [70, 30, 30, 30]
    for w, h in zip(widths, ["Line item", "Actual", "Budget", "Variance"]):
        pdf.cell(w, 7, h, border="B", align="L" if h == "Line item" else "R")
    pdf.ln()
    pdf.set_font("Helvetica", "", 9)
    for r in rows:
        var = (r["actual"] / r["budget"] - 1) * 100 if r["budget"] else 0
        unit = f" ({r['unit']})"
        pdf.cell(widths[0], 6.5, r["label"] + unit)
        pdf.cell(widths[1], 6.5, f"{r['actual']:,.1f}", align="R")
        pdf.cell(widths[2], 6.5, f"{r['budget']:,.1f}", align="R")
        pdf.cell(widths[3], 6.5, f"{var:+.1f}%", align="R")
        pdf.ln()


def _summary_sentence(name: str, rows: list[dict]) -> str:
    by = {r["metric"]: r for r in rows}
    rev, ebitda = by["revenue"], by["ebitda"]
    rv = (rev["actual"] / rev["budget"] - 1) * 100
    ev = (ebitda["actual"] / ebitda["budget"] - 1) * 100
    return (f"{name} reported revenue of AED {rev['actual']:,.1f}m ({rv:+.1f}% vs budget) and EBITDA of "
            f"AED {ebitda['actual']:,.1f}m ({ev:+.1f}% vs budget).")


def generate() -> list[Path]:
    DOC_DIR.mkdir(parents=True, exist_ok=True)
    businesses = fetch_all("select id, name_en from alhail.business order by id")
    written = []
    for b in businesses:
        for q in QUARTERS:
            rows = fetch_all(
                "select metric, label, unit, actual::float, budget::float from alhail.metric "
                "where business_id = %s and period = %s order by array_position(array['revenue','ebitda','net_profit'], metric) nulls last, metric",
                (b["id"], q))
            pdf = _pdf(f"{b['name_en']}: Management Accounts", f"Quarter {q}  |  Prepared for Al Hail Holding")
            _heading(pdf, "1. Summary")
            _para(pdf, _summary_sentence(b["name_en"], rows))
            _heading(pdf, "2. Financial performance vs budget")
            _table(pdf, rows)
            _heading(pdf, "3. Management commentary")
            _para(pdf, commentary(b["id"], q)[0])
            if b["id"] in ("samaa", "sama-egypt") and q == "2026-Q3":
                loans = fetch_all(
                    "select ref, sector, outstanding_aed_m::float o, dpd, dscr::float, status from alhail.loan "
                    "where lender_id = %s and status <> 'Performing' order by status", (b["id"],))
                pdf.add_page()
                _heading(pdf, "4. Loan book exceptions")
                for l in loans:
                    # status first, so each line stands alone when the text is split into passages
                    _para(pdf, f"{l['ref']} ({l['sector']}), status {l['status'].lower()}: AED {l['o']:,.1f}m "
                               f"outstanding, {l['dpd']} days past due, DSCR {l['dscr']:.2f} against a 1.20 minimum.")
            path = DOC_DIR / f"{b['id']}_{q}_management-accounts.pdf"
            pdf.output(str(path))
            written.append(path)

    # Group risk committee minutes, Q3
    pdf = _pdf("Al Hail Holding: Group Risk Committee", "Minutes  |  Q3 2026 meeting")
    _heading(pdf, "Items discussed")
    names = {r["id"]: r["name_en"] for r in businesses}
    for item in RISK_ITEMS:
        _para(pdf, f"- {names[item['business']]}: {item['risk']} Action: {item['action']} Owner: {item['owner']}.")
        pdf.ln(1)
    path = DOC_DIR / "group_2026-Q3_risk-committee-minutes.pdf"
    pdf.output(str(path))
    written.append(path)
    return written


DDL = """
drop table if exists alhail.chunk; drop table if exists alhail.document;
create table alhail.document (
  id serial primary key, business_id text, period text, title text, filename text unique, pages int);
create table alhail.chunk (
  id serial primary key, document_id int references alhail.document on delete cascade, page int, text text,
  tsv tsvector generated always as (to_tsvector('english', text)) stored);
create index chunk_tsv_idx on alhail.chunk using gin (tsv);
"""


def ingest_file(conn, path: Path):
    stem = path.stem  # e.g. samaa_2026-Q3_management-accounts
    business_id, period, kind = stem.split("_", 2)
    reader = PdfReader(str(path))
    title_prefix = "Al Hail Holding" if business_id == "group" else conn.execute(
        "select name_en from alhail.business where id = %s", (business_id,)).fetchone()["name_en"]
    doc = conn.execute(
        "insert into alhail.document (business_id, period, title, filename, pages) values (%s,%s,%s,%s,%s) "
        "on conflict (filename) do update set pages = excluded.pages returning id",
        (None if business_id == "group" else business_id, period,
         f"{title_prefix}: {kind.replace('-', ' ').capitalize()} {period}", path.name, len(reader.pages))).fetchone()
    conn.execute("delete from alhail.chunk where document_id = %s", (doc["id"],))
    for i, page in enumerate(reader.pages, start=1):
        lines = (page.extract_text() or "").splitlines()
        if i == 1:
            lines = lines[2:]  # drop the title band (title + "Quarter ... | SIMULATED DATA" line)
        text = " ".join(" ".join(lines).split())
        sentences = [s.strip() for s in re.split(r"(?<=[.:])\s+(?=[A-Z0-9-])", text) if s.strip()]
        # overlapping 3-sentence windows keep enough context for a precise citation
        for start in range(0, max(len(sentences) - 1, 1), 2):
            chunk = " ".join(sentences[start:start + 3])
            conn.execute("insert into alhail.chunk (document_id, page, text) values (%s,%s,%s)", (doc["id"], i, chunk))
    return doc["id"]


def ingest_all() -> int:
    with connect() as conn:
        conn.execute(DDL)
        for path in sorted(DOC_DIR.glob("*.pdf")):
            ingest_file(conn, path)
        return conn.execute("select count(*) n from alhail.document").fetchone()["n"]


def search(query: str, business_id: str | None = None, limit: int = 8) -> list[dict]:
    return fetch_all(
        """
        select c.id as chunk_id, d.id as document_id, d.title, d.filename, d.business_id, d.period, c.page, c.text,
               ts_rank(c.tsv, qq.q) as rank
        from alhail.chunk c join alhail.document d on d.id = c.document_id,
             (select replace(plainto_tsquery('english', %(q)s)::text, '&', '|')::tsquery as q) qq
        where c.tsv @@ qq.q and (%(b)s::text is null or d.business_id = %(b)s or d.business_id is null)
        order by rank desc limit %(n)s
        """,
        {"q": query, "b": business_id, "n": limit},
    )


if __name__ == "__main__":
    files = generate()
    print(f"Generated {len(files)} PDFs in {DOC_DIR}")
    print(f"Ingested {ingest_all()} documents")
