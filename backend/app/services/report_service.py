"""PDF report layouts for the FastAPI backend (mirrors frontend/src/lib/reports.ts)."""
from __future__ import annotations

import math
from typing import Dict, List

from app.utils.pdf_generator import PdfDoc, utc_now

RUST = (0.84, 0.325, 0.169)
TEAL = (0.059, 0.549, 0.498)
INK = (0.13, 0.12, 0.1)
MUTED = (0.54, 0.52, 0.48)
LINE = (0.86, 0.85, 0.82)
OK = (0.082, 0.502, 0.239)
M = 48.0

BIOME_CELLS: Dict[str, List] = {
    "urban": [(0.55, 0.52, 0.46), (0.48, 0.45, 0.39), (0.72, 0.69, 0.62), (0.42, 0.39, 0.34)],
    "terrain": [(0.47, 0.47, 0.32), (0.37, 0.38, 0.25), (0.65, 0.65, 0.45), (0.3, 0.32, 0.2)],
    "snow": [(0.86, 0.88, 0.9), (0.72, 0.75, 0.79), (0.95, 0.96, 0.97), (0.6, 0.63, 0.68)],
    "fields": [(0.54, 0.58, 0.31), (0.46, 0.53, 0.24), (0.76, 0.75, 0.44), (0.37, 0.45, 0.2)],
    "water": [(0.27, 0.43, 0.44), (0.18, 0.3, 0.3), (0.5, 0.69, 0.7), (0.14, 0.25, 0.24)],
}


def _biome(seed: str) -> str:
    s = seed.lower()
    if any(k in s for k in ("urban", "building", "mumbai", "road")):
        return "urban"
    if any(k in s for k in ("snow", "siachen", "glacier")):
        return "snow"
    if any(k in s for k in ("field", "punjab", "crop")):
        return "fields"
    if any(k in s for k in ("water", "flood", "kerala")):
        return "water"
    return "terrain"


def _seeded(seed: str):
    h = 2166136261
    for ch in seed:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    state = h

    def rnd() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF
        t = state
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + ((t ^ (t >> 7)) * (t | 61))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return rnd


def _map_thumb(doc: PdfDoc, x, y, w, h, seed, coarse):
    rnd = _seeded(seed + ("lr" if coarse else "sr"))
    pal = BIOME_CELLS[_biome(seed)]
    g = 8 if coarse else 20
    cw, ch = w / g, h / g
    for i in range(g):
        for j in range(g):
            doc.rect(x + i * cw, y + j * ch, cw + 0.4, ch + 0.4, pal[int(rnd() * len(pal))])
    px, py = x, y + h * (0.3 + rnd() * 0.4)
    streak = (0.82, 0.79, 0.72) if _biome(seed) == "urban" else (0.43, 0.64, 0.65)
    for s in range(1, 9):
        nx = x + (w * s) / 8
        ny = y + h * (0.3 + math.sin(s + rnd()) * 0.18 + rnd() * 0.2)
        doc.line(px, py, nx, ny, streak, 2 if coarse else 1.2)
        px, py = nx, ny
    doc.line(x, y, x + w, y, LINE, 0.5).line(x, y + h, x + w, y + h, LINE, 0.5)
    doc.line(x, y, x, y + h, LINE, 0.5).line(x + w, y, x + w, y + h, LINE, 0.5)


def _header(doc: PdfDoc, title, subtitle):
    doc.rect(0, 0, doc.w, 8, RUST)
    doc.rect(M, 40, 22, 22, RUST)
    doc.text(M + 5, 45, "TS", size=12, bold=True, color=(1, 1, 1))
    doc.text(M + 32, 40, "TerraSharp Atlas", size=15, bold=True)
    doc.text(M + 32, 58, "AI Super-Resolution Platform", size=8.5, color=MUTED)
    doc.text(doc.w - M - 150, 44, "NTRO - Internal Use Only", size=8.5, bold=True, color=RUST)
    doc.line(M, 78, doc.w - M, 78, LINE, 1)
    doc.text(M, 96, title, size=20, bold=True)
    doc.text(M, 122, subtitle, size=10, color=MUTED)


def _footer(doc: PdfDoc):
    doc.line(M, doc.h - 44, doc.w - M, doc.h - 44, LINE, 0.7)
    doc.text(M, doc.h - 36, f"Generated {utc_now()} UTC", size=8, color=MUTED)
    doc.text(doc.w - M - 200, doc.h - 22, "Synthetic demonstration data - no classified imagery.", size=7.5, color=MUTED)


def _section(doc: PdfDoc, y, label):
    doc.rect(M, y - 2, 3, 14, RUST)
    doc.text(M + 10, y, label, size=13, bold=True)


def validation_report_pdf(d: dict) -> bytes:
    doc = PdfDoc()
    _header(doc, "Validation Report", f"Job {d['job_id']}")
    y = 150
    doc.text(M, y, "Compared against:", size=10, color=MUTED)
    doc.text(M + 110, y, d["compare_against"], size=10, bold=True)
    y += 34
    _section(doc, y, "Quality Metrics")
    y += 24
    col_w = (doc.w - 2 * M) / len(d["metrics"])
    for i, m in enumerate(d["metrics"]):
        x = M + i * col_w
        doc.rect(x, y, col_w - 8, 66, (0.97, 0.96, 0.94))
        doc.text(x + 10, y + 10, m["label"], size=9, color=MUTED)
        doc.text(x + 10, y + 26, f"{m['value']}{m['unit']}", size=17, bold=True)
        sign = "+" if m["delta_dir"] == "up" else "-"
        doc.text(x + 10, y + 50, f"{sign}{m['delta']}  {m['rating']}", size=8,
                 color=OK if m["delta_dir"] == "up" else RUST)
    y += 96
    _section(doc, y, "Spatial Accuracy Map (Per-Region PSNR)")
    y += 22
    _map_thumb(doc, M, y, 220, 150, f"{d['job_id']}-spatial", False)
    doc.text(M + 260, y + 6, "Uncertainty vs Accuracy Correlation (R):", size=9, color=MUTED)
    doc.text(M + 260, y + 24, str(d["correlation"]["r"]), size=20, bold=True, color=TEAL)
    y += 172
    _section(doc, y, "Task-Based Validation Results")
    y += 22
    cx = [M, M + 170, M + 250, M + 310, M + 370]
    doc.rect(M, y - 4, doc.w - 2 * M, 20, (0.95, 0.94, 0.92))
    for i, c in enumerate(["Task", "Metric", "Result", "Status", "Reference"]):
        doc.text(cx[i], y, c, size=9, bold=True, color=MUTED)
    y += 22
    for t in d["tasks"]:
        doc.text(cx[0], y, t["task"], size=9.5)
        doc.text(cx[1], y, t["metric"], size=9.5, color=MUTED)
        doc.text(cx[2], y, f"{t['result']:.2f}", size=9.5, bold=True)
        doc.text(cx[3], y, "Pass" if t["status"] == "pass" else "Fail", size=9.5, bold=True,
                 color=OK if t["status"] == "pass" else RUST)
        doc.text(cx[4], y, t["reference"], size=9.5, color=MUTED)
        doc.line(M, y + 14, doc.w - M, y + 14, LINE, 0.5)
        y += 24
    _footer(doc)
    return doc.build()


def comparison_snapshot_pdf(d: dict) -> bytes:
    doc = PdfDoc()
    _header(doc, "Comparison Snapshot", f"Job {d['job_id']}  -  {d['coordinate']}")
    y = 150
    half = (doc.w - 2 * M - 20) / 2
    doc.text(M, y, "Low Resolution (Sentinel-2)", size=10, bold=True)
    doc.text(M + half + 20, y, "Super-Resolved (TerraSharp)", size=10, bold=True)
    y += 8
    _map_thumb(doc, M, y, half, 200, d["lr_image"], True)
    _map_thumb(doc, M + half + 20, y, half, 200, d["sr_image"], False)
    doc.text(M + 6, y + 184, d["lr_resolution"], size=9, bold=True, color=(1, 1, 1))
    doc.text(M + half + 26, y + 184, d["sr_resolution"], size=9, bold=True, color=(1, 1, 1))
    y += 226
    _section(doc, y, "Quality Metrics (vs. Reference)")
    y += 24
    col_w = (doc.w - 2 * M) / len(d["metrics"])
    for i, m in enumerate(d["metrics"]):
        x = M + i * col_w
        doc.rect(x, y, 3, 60, TEAL)
        doc.rect(x + 3, y, col_w - 12, 60, (0.97, 0.96, 0.94))
        doc.text(x + 12, y + 10, m["label"], size=9, color=MUTED)
        doc.text(x + 12, y + 26, m["value"], size=16, bold=True)
        doc.text(x + 12, y + 46, f"Threshold {m['threshold']}  {'PASS' if m['pass'] else 'FAIL'}",
                 size=7.5, color=OK if m["pass"] else RUST)
    y += 90
    _section(doc, y, "Pixel Inspector")
    y += 22
    doc.text(M, y, f"Coordinate: {d['pixel']['coordinate']}", size=9.5)
    y += 20
    for b in d["pixel"]["bands"]:
        doc.text(M, y, b["band"], size=9.5, color=MUTED)
        doc.text(M + 160, y, f"{b['reflectance']:.3f}", size=9.5, bold=True)
        y += 16
    _footer(doc)
    return doc.build()


def job_manifest_pdf(j: dict) -> bytes:
    doc = PdfDoc()
    _header(doc, "Job Manifest", f"{j['job_id']}  -  {j['project']}")
    y = 150
    _map_thumb(doc, M, y, 200, 130, j.get("sr_thumb") or j["job_id"], False)
    rows = [
        ("Status", j["status"]), ("Resolution gain", j["resolution_gain"]),
        ("Compute node", f"{j.get('compute_node', '-')} ({j.get('gpu', '-')})"),
        ("Started", j.get("started", "-")), ("Est. completion", j.get("eta", "-")),
        ("Tiles processed", f"{j.get('tiles_processed', 0):,} / {j.get('tiles_total', 0):,}"),
        ("Throughput", f"{j.get('throughput_mbps', 0)} MB/s"),
    ]
    ry = y
    for k, v in rows:
        doc.text(M + 220, ry, k, size=9.5, color=MUTED)
        doc.text(M + 350, ry, str(v), size=9.5, bold=True)
        ry += 20
    _footer(doc)
    return doc.build()


def invoice_pdf(inv_id: str, amount: float, date_str: str) -> bytes:
    doc = PdfDoc()
    _header(doc, "Invoice", f"{inv_id}  -  {date_str}")
    y = 160
    lines = [
        ("Super-Resolution compute (GPU-hours)", round(amount * 0.62)),
        ("Storage & data egress", round(amount * 0.23)),
        ("Platform subscription", round(amount * 0.15)),
    ]
    doc.rect(M, y - 4, doc.w - 2 * M, 20, (0.95, 0.94, 0.92))
    doc.text(M + 8, y, "Description", size=9, bold=True, color=MUTED)
    doc.text(doc.w - M - 90, y, "Amount (INR)", size=9, bold=True, color=MUTED)
    y += 26
    for k, v in lines:
        doc.text(M + 8, y, k, size=10)
        doc.text(doc.w - M - 90, y, f"Rs {v:,}", size=10, bold=True)
        doc.line(M, y + 14, doc.w - M, y + 14, LINE, 0.5)
        y += 24
    y += 10
    doc.text(doc.w - M - 200, y, "Total", size=12, bold=True)
    doc.text(doc.w - M - 90, y, f"Rs {round(amount):,}", size=12, bold=True, color=RUST)
    _footer(doc)
    return doc.build()
