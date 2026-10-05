"""Minimal dependency-free PDF writer (mirrors frontend/src/lib/pdf.ts).

Produces valid PDF 1.4 bytes with text (Helvetica / Helvetica-Bold, WinAnsi),
filled rectangles and lines — no reportlab or other library required.

Drawing coordinates are TOP-LEFT based (y grows downward); flipped to PDF's
bottom-left origin internally.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Tuple

PAGE_W = 595.28  # A4 portrait, points
PAGE_H = 841.89

RGB = Tuple[float, float, float]


def _esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _n(v: float) -> str:
    return f"{round(v, 2):g}"


class PdfDoc:
    def __init__(self) -> None:
        self.w = PAGE_W
        self.h = PAGE_H
        self._pages: List[List[str]] = [[]]

    @property
    def _cur(self) -> List[str]:
        return self._pages[-1]

    def add_page(self) -> "PdfDoc":
        self._pages.append([])
        return self

    def rect(self, x: float, y: float, w: float, h: float, color: RGB) -> "PdfDoc":
        r, g, b = color
        self._cur.append(f"{_n(r)} {_n(g)} {_n(b)} rg {_n(x)} {_n(self.h - y - h)} {_n(w)} {_n(h)} re f")
        return self

    def line(self, x1: float, y1: float, x2: float, y2: float, color: RGB, width: float = 0.7) -> "PdfDoc":
        r, g, b = color
        self._cur.append(
            f"{_n(r)} {_n(g)} {_n(b)} RG {_n(width)} w "
            f"{_n(x1)} {_n(self.h - y1)} m {_n(x2)} {_n(self.h - y2)} l S"
        )
        return self

    def text(self, x: float, y: float, s: str, size: float = 11, bold: bool = False,
             color: RGB = (0.13, 0.12, 0.1)) -> "PdfDoc":
        r, g, b = color
        font = "F2" if bold else "F1"
        self._cur.append(
            f"BT {_n(r)} {_n(g)} {_n(b)} rg /{font} {_n(size)} Tf "
            f"1 0 0 1 {_n(x)} {_n(self.h - y - size)} Tm ({_esc(s)}) Tj ET"
        )
        return self

    def build(self) -> bytes:
        chunks: List[str] = []
        offset = 0
        obj_offsets: List[int] = []

        def push(s: str) -> None:
            nonlocal offset
            chunks.append(s)
            offset += len(s.encode("latin-1"))

        def start_obj(body: str) -> None:
            obj_offsets.append(offset)
            push(f"{len(obj_offsets)} 0 obj\n{body}\nendobj\n")

        push("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

        n_pages = len(self._pages)
        pages_id, f1_id, f2_id, catalog_id = 2, 3, 4, 1
        page_ids = [5 + i * 2 for i in range(n_pages)]
        content_ids = [6 + i * 2 for i in range(n_pages)]

        start_obj(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")
        kids = " ".join(f"{pid} 0 R" for pid in page_ids)
        start_obj(f"<< /Type /Pages /Kids [{kids}] /Count {n_pages} >>")
        start_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
        start_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")

        for i in range(n_pages):
            stream = "\n".join(self._pages[i])
            length = len(stream.encode("latin-1"))
            start_obj(
                f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {_n(PAGE_W)} {_n(PAGE_H)}] "
                f"/Resources << /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R >> >> /Contents {content_ids[i]} 0 R >>"
            )
            start_obj(f"<< /Length {length} >>\nstream\n{stream}\nendstream")

        xref_start = offset
        count = len(obj_offsets) + 1
        xref = f"xref\n0 {count}\n0000000000 65535 f \n"
        for o in obj_offsets:
            xref += f"{o:010d} 00000 n \n"
        push(xref)
        push(f"trailer\n<< /Size {count} /Root {catalog_id} 0 R >>\nstartxref\n{xref_start}\n%%EOF")

        return "".join(chunks).encode("latin-1")


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
