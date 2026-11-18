"""Quarterly board pack for Al Hail Holding: assembled from the portfolio data and source documents,
executive summary written by Gemini (template fallback without a key), exported to Word (.docx).
"""
import json
import re
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

from app.alhail.content import RISK_ITEMS, commentary
from app.alhail.router import overview
from app.db import fetch_all
from app.llm import MODEL, client, generate_text

OUT_DIR = Path(__file__).resolve().parents[2] / "generated" / "alhail" / "boardpack"
LOGO = Path(__file__).resolve().parents[3] / "docs" / "assets" / "logos" / "alhail-logo.png"
NAVY = RGBColor(0x06, 0x2B, 0x49)
MUTED = RGBColor(0x52, 0x66, 0x7C)
QUARTER_END = {"2026-Q2": ("30 June 2026", "30 يونيو 2026"), "2026-Q3": ("30 September 2026", "30 سبتمبر 2026")}

L = {
    "en": {
        "title": "Quarterly Board Pack", "subtitle": "Group portfolio review for the quarter ended {end}",
        "draft": "Draft for board office review", "prepared": "Prepared {d} by the Group Portfolio Copilot",
        "s1": "Executive summary", "s2": "Portfolio performance", "s3": "Business commentary",
        "s4": "Risks and actions", "s5": "Sector view", "sources": "Sources",
        "business": "Business", "revenue": "Revenue", "ebitda": "EBITDA", "budget": "Budget", "var": "vs budget",
        "status": "Status", "risk": "Risk", "action": "Action agreed", "owner": "Owner", "sector": "Sector",
        "aedm": "AED m", "rag": {"green": "On track", "amber": "Watch", "red": "Off track"},
        "sev": {"info": "Info", "watch": "Watch", "alert": "Alert"},
        "simulated": "Quarterly figures are simulated for demonstration; public facts are from alhail.com.",
        "template_note": "Summary drafted from a template (no AI key configured).",
    },
    "ar": {
        "title": "حزمة مجلس الإدارة الفصلية", "subtitle": "مراجعة محفظة المجموعة للربع المنتهي في {end}",
        "draft": "مسودة لمراجعة مكتب مجلس الإدارة", "prepared": "أُعدّت في {d} بواسطة مساعد المحفظة الذكي",
        "s1": "الملخص التنفيذي", "s2": "أداء المحفظة", "s3": "تعليقات الشركات",
        "s4": "المخاطر والإجراءات", "s5": "نظرة على القطاعات", "sources": "المصادر",
        "business": "الشركة", "revenue": "الإيرادات", "ebitda": "EBITDA", "budget": "الميزانية", "var": "مقابل الميزانية",
        "status": "الحالة", "risk": "الخطر", "action": "الإجراء المتفق عليه", "owner": "المسؤول", "sector": "القطاع",
        "aedm": "مليون درهم", "rag": {"green": "ضمن المسار", "amber": "متابعة", "red": "خارج المسار"},
        "sev": {"info": "معلومة", "watch": "متابعة", "alert": "تنبيه"},
        "simulated": "الأرقام الفصلية محاكاة لأغراض العرض؛ المعلومات المنشورة من موقع alhail.com.",
        "template_note": "صيغ الملخص من قالب (لم يُضبط مفتاح الذكاء الاصطناعي).",
    },
}

CITE_RE = re.compile(r"\[(D\d+p\d+)\]")


def _docs(period: str) -> tuple[dict, int | None, dict]:
    rows = fetch_all("select id, business_id, title, period from alhail.document")
    by_business = {r["business_id"]: r["id"] for r in rows if r["period"] == period and r["business_id"]}
    minutes = next((r["id"] for r in rows if r["business_id"] is None and r["period"] == period), None)
    titles = {r["id"]: r["title"] for r in rows}
    return by_business, minutes, titles


def build(period: str, lang: str) -> dict:
    t = L[lang]
    o = overview(period)
    by_business, minutes_id, titles = _docs(period)
    name = {b["id"]: b["name_ar" if lang == "ar" else "name_en"] for b in o["businesses"]}
    sector_name = {s["id"]: s["name_ar" if lang == "ar" else "name_en"] for s in o["sectors"]}
    cite = lambda bid: f"D{by_business[bid]}p1" if bid in by_business else None  # noqa: E731
    minutes_cite = f"D{minutes_id}p1" if minutes_id else None

    order = {"red": 0, "amber": 1, "green": 2}
    businesses = sorted(o["businesses"], key=lambda b: (order[b["rag"]], b["ebitda_var_pct"]))
    performance = [{
        "id": b["id"], "name": name[b["id"]], "sector": sector_name[b["sector_id"]], "rag": b["rag"],
        "revenue": round(b["revenue"], 1), "revenue_budget": round(b["revenue"] / (1 + b["revenue_var_pct"] / 100), 1),
        "revenue_var_pct": b["revenue_var_pct"], "ebitda": round(b["ebitda"], 1),
        "ebitda_budget": round(b["ebitda"] / (1 + b["ebitda_var_pct"] / 100), 1), "ebitda_var_pct": b["ebitda_var_pct"],
        "cite": cite(b["id"]),
    } for b in businesses]
    notes = [{"id": b["id"], "name": name[b["id"]], "rag": b["rag"], "ebitda_var_pct": b["ebitda_var_pct"],
              "text": commentary(b["id"], period)[1 if lang == "ar" else 0], "cite": cite(b["id"])} for b in businesses]
    risks = [{"business": name[r["business"]], "severity": r["severity"],
              "risk": r["risk_ar" if lang == "ar" else "risk"], "action": r["action_ar" if lang == "ar" else "action"],
              "owner": r["owner_ar" if lang == "ar" else "owner"], "cite": minutes_cite}
             for r in RISK_ITEMS] if minutes_id else []
    sectors = []
    for s in o["sectors"]:
        items = [p for p in performance if p["sector"] == sector_name[s["id"]]]
        rev, rev_b = sum(p["revenue"] for p in items), sum(p["revenue_budget"] for p in items)
        e, e_b = sum(p["ebitda"] for p in items), sum(p["ebitda_budget"] for p in items)
        sectors.append({"id": s["id"], "name": sector_name[s["id"]], "color": s["color"],
                        "revenue": round(rev, 1), "revenue_var_pct": round((rev / rev_b - 1) * 100, 1),
                        "ebitda": round(e, 1), "ebitda_var_pct": round((e / e_b - 1) * 100, 1),
                        "businesses": [p["name"] for p in items]})

    egypt = {r["period"]: r["v"] for r in fetch_all(
        "select period, sum(carrying_value_aed_m)::float v from alhail.exposure where country = 'Egypt' group by period")}
    revenue_budget = sum(p["revenue_budget"] for p in performance)
    facts = {
        "period": period,
        "group": {"revenue_aed_m": o["totals"]["revenue"], "revenue_var_pct": round((o["totals"]["revenue"] / revenue_budget - 1) * 100, 1),
                  "ebitda_aed_m": o["totals"]["ebitda"],
                  "ebitda_var_pct": round((o["totals"]["ebitda"] / o["totals"]["ebitda_budget"] - 1) * 100, 1),
                  "businesses_on_track": sum(1 for b in businesses if b["rag"] == "green"), "businesses_total": len(businesses)},
        "flagged": [{"name": n["name"], "ebitda_var_pct": n["ebitda_var_pct"], "commentary": n["text"], "cite": n["cite"]}
                    for n in notes if n["rag"] != "green"],
        "egypt_carrying_value_aed_m": {"previous_quarter": egypt.get("2026-Q2"), "this_quarter": egypt.get("2026-Q3"),
                                       "cite": minutes_cite},
        "risk_committee_actions": [{"business": r["business"], "action": r["action"], "cite": r["cite"]} for r in risks],
    }
    summary, generated_by = _summary(facts, lang)

    used = {int(m.group(1)[1:].split("p")[0]) for text in [*summary, *[n["text"] for n in notes]]
            for m in CITE_RE.finditer(text)}
    used |= {int(x["cite"][1:].split("p")[0]) for x in [*performance, *risks] if x.get("cite")}
    pack = {
        "period": period, "lang": lang, "quarter_end": QUARTER_END.get(period, (period, period))[1 if lang == "ar" else 0],
        "prepared": date.today().isoformat(), "generated_by": generated_by,
        "summary": summary, "performance": performance, "commentary": notes, "risks": risks, "sectors": sectors,
        "sources": [{"id": i, "cite": f"D{i}", "title": titles[i]} for i in sorted(used) if i in titles],
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"{period}_{lang}.json").write_text(json.dumps(pack, ensure_ascii=False, indent=1))
    return pack


def _summary(facts: dict, lang: str) -> tuple[list[str], str]:
    valid = {c for c in re.findall(r"D\d+p\d+", json.dumps(facts))}
    if client() is not None:
        language = "Modern Standard Arabic" if lang == "ar" else "English"
        system = ("You write the executive summary of the quarterly board pack of Al Hail Holding, a UAE investment holding "
                  "company. Audience: the owner and the board. Use only the facts in the JSON you are given; never add numbers. "
                  "Write 4 to 6 bullets, most important first, each one or two sentences, plain and factual. End each bullet "
                  "with the citation ids of the facts it uses in square brackets, e.g. [D4p1]; the group totals bullet needs "
                  f"no citation. Write in {language}. Output only the bullets, one per line, each starting with '- '.")
        text = generate_text(json.dumps(facts, ensure_ascii=False), system)
        bullets = [line.strip()[2:].strip() for line in text.splitlines() if line.strip().startswith(("- ", "* "))]
        bullets = [CITE_RE.sub(lambda m: m.group(0) if m.group(1) in valid else "", b).strip() for b in bullets]
        if bullets:
            return bullets, MODEL
    return _template_summary(facts, lang), "template"


def _template_summary(f: dict, lang: str) -> list[str]:
    g, eg = f["group"], f["egypt_carrying_value_aed_m"]
    c = lambda x: f" [{x}]" if x else ""  # noqa: E731
    if lang == "ar":
        out = [f"بلغت إيرادات المجموعة {g['revenue_aed_m']:,.1f} مليون درهم ({g['revenue_var_pct']:+.1f}% مقابل الميزانية) "
               f"وEBITDA {g['ebitda_aed_m']:,.1f} مليون درهم ({g['ebitda_var_pct']:+.1f}%) في {f['period']}؛ "
               f"{g['businesses_on_track']} من {g['businesses_total']} شركة ضمن المسار."]
        out += [f"{x['name']}: EBITDA {x['ebitda_var_pct']:+.1f}% مقابل الميزانية. {x['commentary'].split('. ')[0].rstrip('.')}.{c(x['cite'])}"
                for x in f["flagged"]]
        if eg["previous_quarter"] and eg["this_quarter"]:
            out.append(f"انخفضت القيمة الدفترية في مصر من {eg['previous_quarter']:,.0f} إلى {eg['this_quarter']:,.0f} مليون درهم "
                       f"بسبب تحويل العملات والمخصصات.{c(eg['cite'])}")
        if f["risk_committee_actions"]:
            out.append(f"اتفقت لجنة المخاطر على {len(f['risk_committee_actions'])} إجراءات، أبرزها: "
                       f"{f['risk_committee_actions'][0]['action']}{c(f['risk_committee_actions'][0]['cite'])}")
        return out
    out = [f"Group revenue was AED {g['revenue_aed_m']:,.1f}m ({g['revenue_var_pct']:+.1f}% vs budget) and EBITDA "
           f"AED {g['ebitda_aed_m']:,.1f}m ({g['ebitda_var_pct']:+.1f}%) in {f['period']}; "
           f"{g['businesses_on_track']} of {g['businesses_total']} businesses are on track."]
    out += [f"{x['name']}: EBITDA {x['ebitda_var_pct']:+.1f}% vs budget. {x['commentary'].split('. ')[0].rstrip('.')}.{c(x['cite'])}"
            for x in f["flagged"]]
    if eg["previous_quarter"] and eg["this_quarter"]:
        out.append(f"Egypt carrying value fell from AED {eg['previous_quarter']:,.0f}m to AED {eg['this_quarter']:,.0f}m "
                   f"on FX translation and provisions.{c(eg['cite'])}")
    if f["risk_committee_actions"]:
        out.append(f"The Group Risk Committee agreed {len(f['risk_committee_actions'])} actions, led by: "
                   f"{f['risk_committee_actions'][0]['action']}{c(f['risk_committee_actions'][0]['cite'])}")
    return out


def load(period: str, lang: str) -> dict | None:
    path = OUT_DIR / f"{period}_{lang}.json"
    return json.loads(path.read_text()) if path.exists() else None


# ---------- Word export ----------

def _rtl(paragraph):
    p_pr = paragraph._p.get_or_add_pPr()
    p_pr.append(OxmlElement("w:bidi"))
    for run in paragraph.runs:
        r_pr = run._r.get_or_add_rPr()
        r_pr.append(OxmlElement("w:rtl"))


def _para(doc, text, lang, size=10.5, bold=False, color=None, style=None, align=None):
    p = doc.add_paragraph(style=style)
    run = p.add_run(text)
    run.font.size, run.bold = Pt(size), bold
    if color:
        run.font.color.rgb = color
    if align is not None:
        p.alignment = align
    if lang == "ar":
        _rtl(p)
        p.alignment = align if align is not None else WD_ALIGN_PARAGRAPH.RIGHT
    return p


def _heading(doc, number: int, text: str, lang: str):
    p = _para(doc, f"{number}. {text}", lang, size=14, bold=True, color=NAVY)
    p.paragraph_format.space_before, p.paragraph_format.space_after = Pt(16), Pt(6)


def _table(doc, header: list[str], rows: list[list[str]], lang: str, widths: list[float] | None = None):
    table = doc.add_table(rows=1, cols=len(header))
    table.style = "Light Grid Accent 1"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    if lang == "ar":
        tbl_pr = table._tbl.tblPr
        tbl_pr.append(OxmlElement("w:bidiVisual"))
    for i, h in enumerate(header):
        cell = table.rows[0].cells[i]
        cell.text = ""
        run = cell.paragraphs[0].add_run(h)
        run.bold, run.font.size = True, Pt(9)
        if lang == "ar":
            _rtl(cell.paragraphs[0])
    for row in rows:
        cells = table.add_row().cells
        for i, v in enumerate(row):
            if lang == "ar" and re.fullmatch(r"[+\-]?[\d,.]+%?", v):
                v = f"‎{v}‎"  # keep signed figures left-to-right inside RTL tables
            cells[i].text = ""
            run = cells[i].paragraphs[0].add_run(v)
            run.font.size = Pt(9)
            if lang == "ar":
                _rtl(cells[i].paragraphs[0])
    if widths:
        for row in table.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    return table


def to_docx(pack: dict) -> Path:
    lang, t = pack["lang"], L[pack["lang"]]
    doc = Document()
    for section in doc.sections:
        section.left_margin = section.right_margin = Cm(2.2)
        section.top_margin = section.bottom_margin = Cm(2)
    normal = doc.styles["Normal"]
    normal.font.name = "Arial"
    normal.element.rPr.rFonts.set(qn("w:cs"), "Arial")
    normal.font.size = Pt(10.5)

    if LOGO.exists():
        logo = doc.add_paragraph()
        logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        logo.add_run().add_picture(str(LOGO), width=Cm(5.5))
    _para(doc, t["title"], lang, size=24, bold=True, color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)
    _para(doc, t["subtitle"].format(end=pack["quarter_end"]), lang, size=12, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER)
    _para(doc, t["draft"], lang, size=10, bold=True, color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)
    _para(doc, t["prepared"].format(d=pack["prepared"]), lang, size=9, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER)

    _heading(doc, 1, t["s1"], lang)
    for bullet in pack["summary"]:
        _para(doc, bullet, lang, style="List Bullet")
    if pack["generated_by"] == "template":
        _para(doc, t["template_note"], lang, size=8.5, color=MUTED)

    _heading(doc, 2, t["s2"], lang)
    _table(doc, [t["business"], f"{t['revenue']} ({t['aedm']})", t["var"], f"{t['ebitda']} ({t['aedm']})", t["var"], t["status"]],
           [[p["name"], f"{p['revenue']:,.1f}", f"{p['revenue_var_pct']:+.1f}%", f"{p['ebitda']:,.1f}",
             f"{p['ebitda_var_pct']:+.1f}%", t["rag"][p["rag"]]] for p in pack["performance"]], lang,
           widths=[5.2, 2.6, 2.0, 2.6, 2.0, 2.2])

    _heading(doc, 3, t["s3"], lang)
    for n in pack["commentary"]:
        _para(doc, f"{n['name']}  ({t['rag'][n['rag']]}, {t['ebitda']} {n['ebitda_var_pct']:+.1f}%)", lang, size=11, bold=True, color=NAVY)
        _para(doc, n["text"] + (f" [{n['cite']}]" if n["cite"] else ""), lang)

    if pack["risks"]:
        _heading(doc, 4, t["s4"], lang)
        _table(doc, [t["business"], t["risk"], t["action"], t["owner"], t["status"]],
               [[r["business"], r["risk"], r["action"], r["owner"], t["sev"][r["severity"]]] for r in pack["risks"]], lang,
               widths=[3.0, 5.0, 5.0, 2.6, 1.8])

    _heading(doc, 5, t["s5"], lang)
    _table(doc, [t["sector"], f"{t['revenue']} ({t['aedm']})", t["var"], f"{t['ebitda']} ({t['aedm']})", t["var"], t["business"]],
           [[s["name"], f"{s['revenue']:,.1f}", f"{s['revenue_var_pct']:+.1f}%", f"{s['ebitda']:,.1f}",
             f"{s['ebitda_var_pct']:+.1f}%", ", ".join(s["businesses"])] for s in pack["sectors"]], lang,
           widths=[3.6, 2.4, 1.8, 2.4, 1.8, 4.6])

    _para(doc, t["sources"], lang, size=11, bold=True, color=NAVY).paragraph_format.space_before = Pt(16)
    for s in pack["sources"]:
        _para(doc, f"[{s['cite']}] {s['title']}", lang, size=9, color=MUTED)
    _para(doc, t["simulated"], lang, size=8.5, color=MUTED)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"Al-Hail-Board-Pack-{pack['period']}-{lang.upper()}.docx"
    doc.save(str(path))
    return path
