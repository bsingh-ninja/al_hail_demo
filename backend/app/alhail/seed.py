"""Seed the `alhail` schema: public facts (with sources) + simulated quarterly data.

Run: .venv/bin/python -m app.alhail.seed
Deterministic: same output every run (fixed random seed).
"""
import json
import random

from app.db import connect

SOURCE = "https://alhail.com/sectors"
PERIODS = ["2024-Q4", "2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2", "2026-Q3"]

SECTORS = [
    ("fin", "Financial Services & Technology", "الخدمات المالية والتكنولوجيا", "#062B49", 1),
    ("log", "Critical Logistics", "الخدمات اللوجستية الحيوية", "#536B84", 2),
    ("energy", "Energy", "الطاقة", "#D8C39E", 3),
    ("re", "Real Estate", "العقارات", "#99BDDF", 4),
    ("infra", "Infrastructure Development", "تطوير البنية التحتية", "#A5C5AD", 5),
]

# id, sector, name_en, name_ar, location, relationship, description, public facts
BUSINESSES = [
    ("zand", "fin", "Zand Bank", "بنك زاند", "Dubai, UAE", "Board representation",
     "Digital-economy bank licensed by the UAE Central Bank in 2022: corporate banking, escrow, regulated digital-asset custody.",
     ["Customer deposits AED 5bn+ (FY2025)", "Net profit AED 34m (FY2025)", "Licensed by CBUAE in 2022"]),
    ("index-exchange", "fin", "Index Exchange", "إندكس للصرافة", "UAE", "Joint ownership with Global Development Group",
     "Money transfer, currency exchange, cross-border payments and WPS payroll since 1976.",
     ["Operating since 1976", "Reach in 100+ countries, 60+ currencies"]),
    ("aip", "fin", "Allied Investment Partners", "شركاء الاستثمار المتحالفون", "UAE", "Acquired 2021",
     "Asset and wealth management, alternative investments and corporate finance advisory.",
     ["Established 2007", "Acquired by Al Hail in 2021"]),
    ("samaa", "fin", "SAMAA Finance", "سماء للتمويل", "UAE", "Group company",
     "Non-bank lender for asset-backed, property and supply-chain finance.",
     ["Established 2002 as Al Hail ORIX Finance"]),
    ("sama-egypt", "fin", "SAMA Finance (Egypt)", "سما للتمويل (مصر)", "Egypt", "Shareholder since 2017",
     "Finance leasing for vehicles, plant, equipment and commercial property.",
     ["Roots in ORIX Leasing Egypt (1997)", "Offices in Cairo, Alexandria, Mansoura, Asyut"]),
    ("transguard", "log", "Transguard Group", "ترانسجارد", "UAE", "Joint venture with Emirates Group",
     "Security, aviation support, facilities, cash services, workforce and logistics.",
     ["Revenue AED 3.86bn (FY25/26, year to 31 Mar 2026)", "About 78,500 people"]),
    ("atd", "energy", "Advanced Technology Development", "التطوير التكنولوجي المتقدم", "UAE & Egypt", "Group company",
     "Gas-turbine combustor technology, plant rehabilitation, component manufacture and overhaul (ATD Combustors, ATD Egypt).",
     ["Operations in the UAE and Egypt"]),
    ("dalma", "re", "Dalma Mall", "دلما مول", "Abu Dhabi, UAE", "Via The Developers",
     "Retail and leisure destination in Abu Dhabi.",
     ["151,000+ sq m retail space", "450+ brands", "14-screen cinema"]),
    ("cbre", "re", "CBRE UAE", "سي بي آر إي الإمارات", "Dubai & Abu Dhabi", "Stake in UAE operating companies",
     "Valuation, advisory, leasing and property management (CBRE Dubai LLC, CBRE Emirates).",
     ["Stake in CBRE Dubai LLC and CBRE Emirates"]),
    ("developers", "re", "The Developers", "المطورون", "Abu Dhabi, UAE", "Consortium member",
     "Property development and investment holding owned by a consortium of Abu Dhabi business houses.",
     ["Holdings include Dalma Mall and CBRE interests"]),
    ("re-investments", "re", "Real Estate Investments", "الاستثمارات العقارية", "Dubai & Abu Dhabi", "Direct ownership",
     "Direct property: Emaar Square Buildings 5 and 6, villas at Al Nahyan Camp, Mussafah commercial property.",
     ["Emaar Square Bldg 5: ~16,450 sq m; Bldg 6: ~22,094 sq m", "20 villas, Al Nahyan Camp", "Mussafah commercial ~35,114 sq m"]),
    ("infra", "infra", "Al Hail Infrastructure", "الحيل للبنية التحتية", "Abu Dhabi & Al Ain", "Direct ownership",
     "Industrial cities, roads, utilities and wastewater: ICAD II and III, Al Ain Industrial City, ICADIN.",
     ["ICAD II ~10.9 km² (101 plots), ICAD III ~11 km²", "Al Ain Industrial City 10 km²", "ICADIN wastewater 40,000 m³/day"]),
]

# Simulated scale: annual revenue AED m, EBITDA margin, net margin, quarterly growth
SCALE = {
    "zand": (320, 0.18, 0.106, 0.03),
    "index-exchange": (220, 0.22, 0.14, 0.012),
    "aip": (60, 0.35, 0.25, 0.01),
    "samaa": (140, 0.55, 0.30, 0.01),
    "sama-egypt": (90, 0.50, 0.24, 0.0),
    "transguard": (3860, 0.12, 0.07, 0.015),
    "atd": (180, 0.20, 0.11, 0.0),
    "dalma": (420, 0.62, 0.40, 0.01),
    "cbre": (260, 0.24, 0.17, 0.012),
    "developers": (300, 0.40, 0.26, 0.008),
    "re-investments": (110, 0.70, 0.52, 0.005),
    "infra": (150, 0.58, 0.33, 0.015),
}

# Business KPIs: id -> list of (metric, label, unit, start, step_per_quarter, budget_offset)
KPIS = {
    "zand": [("customer_deposits", "Customer deposits", "AED bn", 4.2, 0.15, 0.0)],
    "index-exchange": [("transfer_volume", "Transfer volume", "AED bn", 2.8, 0.05, 0.0)],
    "aip": [("aum", "Assets under management", "AED bn", 3.6, 0.08, 0.0)],
    "samaa": [("loan_book", "Loan book", "AED m", 1750, 20, 0.0), ("npl_ratio", "NPL ratio", "%", 3.0, 0.0, 0.0)],
    "sama-egypt": [("loan_book", "Lease portfolio", "AED m", 900, 5, 0.0), ("npl_ratio", "NPL ratio", "%", 2.8, 0.0, 0.0)],
    "transguard": [("headcount", "Headcount", "people", 74500, 600, 0.0)],
    "atd": [("order_backlog", "Order backlog", "AED m", 260, -6, 0.0)],
    "dalma": [("footfall", "Footfall", "m visits", 5.0, 0.04, 0.0), ("occupancy", "Occupancy", "%", 94.0, 0.2, 0.0)],
    "cbre": [("mandates", "Advisory mandates", "count", 140, 3, 0.0)],
    "developers": [("land_bank", "Land bank value", "AED m", 2100, 15, 0.0)],
    "re-investments": [("occupancy", "Occupancy", "%", 89.0, 0.3, 0.0)],
    "infra": [("plots_leased", "ICAD II plots leased", "of 101", 78, 1.4, 0.0)],
}

SEASON = [1.06, 0.98, 0.94, 1.02]  # Q4, Q1, Q2, Q3: mild seasonality


def quarterly_financials(rng: random.Random) -> list[tuple]:
    rows = []
    for bid, (annual, em, nm, g) in SCALE.items():
        q_base = annual / 4
        actuals = []
        for i, period in enumerate(PERIODS):
            budget_rev = q_base * (1 + g) ** i * SEASON[i % 4]
            var = rng.uniform(-0.02, 0.035)
            actuals.append((period, budget_rev, budget_rev * (1 + var)))
        # Anchor Transguard FY25/26 (2025-Q2..2026-Q1) revenue to the public AED 3,860m.
        if bid == "transguard":
            fy = [a for a in actuals if a[0] in ("2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1")]
            k = 3860 / sum(a[2] for a in fy)
            actuals = [(p, b, a * k if p in ("2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1") else a) for p, b, a in actuals]
        for period, b_rev, a_rev in actuals:
            e_var = rng.uniform(-0.025, 0.03)
            # Planted: ATD misses EBITDA budget two quarters running (Egypt plant rehab delays).
            if bid == "atd" and period == "2026-Q2":
                e_var = -0.084
            if bid == "atd" and period == "2026-Q3":
                e_var = -0.095
            # Planted: SAMAA higher impairments in 2026-Q3.
            if bid == "samaa" and period == "2026-Q3":
                e_var = -0.068
            b_e, a_e = b_rev * em, b_rev * em * (1 + e_var) * (a_rev / b_rev) ** 0.3
            b_n, a_n = b_rev * nm, a_e * (nm / em)
            rows += [
                (bid, period, "revenue", "Revenue / operating income", "AED m", round(a_rev, 2), round(b_rev, 2)),
                (bid, period, "ebitda", "EBITDA", "AED m", round(a_e, 2), round(b_e, 2)),
                (bid, period, "net_profit", "Net profit", "AED m", round(a_n, 2), round(b_n, 2)),
            ]
    # Anchor Zand FY2025 net profit to the public AED 34m.
    zand_2025 = [r for r in rows if r[0] == "zand" and r[2] == "net_profit" and r[1].startswith("2025")]
    k = 34 / sum(r[5] for r in zand_2025)
    scaled = {r[1]: (round(r[5] * k, 2), round(r[6] * k, 2)) for r in zand_2025}
    scaled["2025-Q4"] = (round(34 - sum(v[0] for p, v in scaled.items() if p != "2025-Q4"), 2), scaled["2025-Q4"][1])
    return [(*r[:5], *scaled[r[1]]) if r in zand_2025 else r for r in rows]


def kpi_rows(rng: random.Random) -> list[tuple]:
    rows = []
    npl = {"samaa": [3.0, 3.1, 3.0, 3.2, 3.3, 3.4, 3.9, 4.6], "sama-egypt": [2.8, 2.9, 2.8, 2.7, 2.9, 3.0, 3.0, 3.1]}
    for bid, kpis in KPIS.items():
        for metric, label, unit, start, step, _ in kpis:
            for i, period in enumerate(PERIODS):
                budget = start + step * i
                actual = budget * (1 + rng.uniform(-0.015, 0.02))
                if metric == "npl_ratio":
                    actual, budget = npl[bid][i], 3.5 if bid == "samaa" else 3.2
                if metric == "occupancy":
                    actual = min(actual, 99.0)
                if bid == "zand" and period == "2025-Q4":
                    actual = 5.1  # public: deposits AED 5bn+ in FY2025
                if bid == "transguard" and period == "2026-Q1":
                    actual = 78500  # public: about 78,500 people
                if bid == "atd" and metric == "order_backlog" and period in ("2026-Q2", "2026-Q3"):
                    actual = budget * 0.88
                digits = 0 if unit in ("people", "count", "of 101", "AED m") else 2
                rows.append((bid, period, metric, label, unit, round(actual, digits), round(budget, digits)))
    return rows


def loan_rows(rng: random.Random) -> list[tuple]:
    sectors = ["Construction", "Trading", "Logistics", "Manufacturing", "Healthcare", "Hospitality", "Real estate"]
    rows = []
    for lender, n, prefix in (("samaa", 30, "SAMAA-C"), ("sama-egypt", 20, "SAMA-L")):
        for i in range(1, n + 1):
            ref = f"{prefix}-{i:03d}"
            outstanding = round(rng.uniform(8, 60) if lender == "samaa" else rng.uniform(5, 35), 1)
            dscr, dpd, status = round(rng.uniform(1.35, 2.4), 2), 0, "Performing"
            if ref == "SAMAA-C-017":  # Planted covenant breach
                outstanding, dscr, dpd, status = 48.0, 1.05, 35, "Covenant breach"
            elif ref in ("SAMAA-C-004", "SAMAA-C-022", "SAMA-L-009"):
                dscr, dpd, status = round(rng.uniform(1.22, 1.3), 2), 12, "Watch"
            rows.append((ref, lender, f"{rng.choice(sectors)} borrower {i:03d}", rng.choice(sectors),
                         outstanding, dpd, dscr, 1.20, status))
    return rows


EXPOSURE = [
    # business, country, period, carrying value AED m (simulated), note
    ("sama-egypt", "Egypt", "2026-Q2", 312.0, ""),
    ("sama-egypt", "Egypt", "2026-Q3", 289.0, "FX translation and higher provisions"),
    ("atd", "Egypt", "2026-Q2", 148.0, "ATD Egypt share (35%)"),
    ("atd", "Egypt", "2026-Q3", 141.0, "ATD Egypt share (35%); plant rehab contract delayed"),
    ("atd", "UAE", "2026-Q2", 275.0, ""),
    ("atd", "UAE", "2026-Q3", 268.0, ""),
]

SIGNALS = [
    ("samaa", "2026-11-12", "Loan book review", "Borrower SAMAA-C-017 (construction) breaches DSCR covenant: 1.05 vs 1.20 minimum; 35 days past due.", "alert"),
    ("samaa", "2026-10-28", "Q3 management accounts", "NPL ratio rises to 4.6% vs 3.5% budget; impairment charge up quarter on quarter.", "watch"),
    ("atd", "2026-10-30", "Q3 management accounts", "EBITDA below budget for a second quarter; Egypt plant rehabilitation contract start moved to Q1 2027.", "watch"),
    ("sama-egypt", "2026-10-15", "Market monitor", "Currency translation reduces AED value of Egypt lease portfolio this quarter.", "info"),
    ("transguard", "2026-11-05", "Operations update", "Workforce onboarding programme expanded; headcount stable.", "info"),
    ("dalma", "2026-11-02", "Operations update", "Footfall ahead of budget for third consecutive quarter; occupancy 95%.", "info"),
    ("zand", "2026-10-20", "Board update", "Digital-asset custody volumes growing; deposits ahead of plan.", "info"),
    ("infra", "2026-10-25", "Leasing update", "Three new ICAD II plot leases signed in the quarter.", "info"),
    ("re-investments", "2026-11-08", "Leasing update", "Two Emaar Square tenants (Bldg 5) have leases expiring in Q1 2027; renewals in negotiation.", "watch"),
    ("index-exchange", "2026-10-18", "Regulatory monitor", "New payment-services reporting requirements take effect next year; compliance plan in progress.", "info"),
]

DDL = """
drop schema if exists alhail cascade;
create schema alhail;
create table alhail.sector (id text primary key, name_en text, name_ar text, color text, sort int);
create table alhail.business (
  id text primary key, sector_id text references alhail.sector, name_en text, name_ar text,
  location text, relationship text, description text, facts jsonb, source_url text);
create table alhail.metric (
  business_id text references alhail.business, period text, metric text, label text, unit text,
  actual numeric, budget numeric, primary key (business_id, period, metric));
create table alhail.loan (
  ref text primary key, lender_id text references alhail.business, borrower text, sector text,
  outstanding_aed_m numeric, dpd int, dscr numeric, dscr_min numeric, status text);
create table alhail.exposure (
  business_id text references alhail.business, country text, period text, carrying_value_aed_m numeric, note text);
create table alhail.signal (
  id serial primary key, business_id text references alhail.business, date date, source text, summary text, severity text);
"""


def seed():
    rng = random.Random(42)
    with connect() as conn:
        conn.execute(DDL)
        with conn.cursor() as cur:
            cur.executemany("insert into alhail.sector values (%s,%s,%s,%s,%s)", SECTORS)
            cur.executemany(
                "insert into alhail.business values (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                [(b[0], b[1], b[2], b[3], b[4], b[5], b[6], json.dumps(b[7]), SOURCE) for b in BUSINESSES],
            )
            metric_sql = "insert into alhail.metric values (%s,%s,%s,%s,%s,%s,%s)"
            cur.executemany(metric_sql, quarterly_financials(rng))
            cur.executemany(metric_sql, kpi_rows(rng))
            cur.executemany("insert into alhail.loan values (%s,%s,%s,%s,%s,%s,%s,%s,%s)", loan_rows(rng))
            cur.executemany("insert into alhail.exposure values (%s,%s,%s,%s,%s)", EXPOSURE)
            cur.executemany(
                "insert into alhail.signal (business_id, date, source, summary, severity) values (%s,%s,%s,%s,%s)", SIGNALS
            )
    print("Seeded alhail schema.")


if __name__ == "__main__":
    seed()
