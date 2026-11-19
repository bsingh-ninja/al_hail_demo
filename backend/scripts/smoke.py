"""Smoke test for a running Al Hail API (used by CI; also runs against a local demo).

Usage: python scripts/smoke.py [base_url]   (default http://127.0.0.1:8000)
Checks the seeded scenario the demo script relies on. Read-only, except that it drafts
a board pack when none exists yet. The copilot needs Gemini and is not called.
"""
import json
import sys
import urllib.error
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")


def call(path, body=None):
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        raw = r.read()
        return raw if not r.headers.get("content-type", "").startswith("application/json") else json.loads(raw)


def check(name, ok):
    print(("ok   " if ok else "FAIL ") + name)
    if not ok:
        sys.exit(1)


check("health", call("/health") == {"status": "ok"})
ov = call("/alhail/overview")
check("12 businesses in 5 sectors", len(ov["businesses"]) == 12 and len(ov["sectors"]) == 5)
check("2 businesses need attention", ov["totals"]["amber_or_red"] == 2)
check("SAMAA Finance flagged", any(b["name_en"] == "SAMAA Finance" and b["rag"] != "green" for b in ov["businesses"]))
check("signals listed", len(call("/alhail/signals")) > 0)
check("source documents indexed", len(call("/alhail/documents")) > 0)
try:
    call("/alhail/board-pack")
except urllib.error.HTTPError as e:
    if e.code != 404:
        raise
    call("/alhail/board-pack", {"lang": "en"})
check("board pack downloads as Word", call("/alhail/board-pack/docx")[:2] == b"PK")
print("Al Hail API smoke test passed")
