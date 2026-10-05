"""Backend unit tests — no server or extra deps required.

    cd backend
    python -m unittest discover -s tests
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.pdf_generator import PdfDoc  # noqa: E402
from app.services import data_service as data  # noqa: E402
from app.services.report_service import (  # noqa: E402
    validation_report_pdf, comparison_snapshot_pdf, job_manifest_pdf, invoice_pdf,
)


def assert_valid_pdf(tc: unittest.TestCase, b: bytes, min_size: int = 800) -> None:
    tc.assertEqual(b[:5], b"%PDF-")
    tc.assertGreater(len(b), min_size)
    tc.assertTrue(b.rstrip().endswith(b"%%EOF"))


class TestPdf(unittest.TestCase):
    def test_single_page(self):
        doc = PdfDoc()
        doc.text(50, 50, "Hello (world)").rect(10, 10, 20, 20, (1, 0, 0))
        b = doc.build()
        assert_valid_pdf(self, b, min_size=200)
        self.assertIn(b"/Type /Catalog", b)
        self.assertIn(b"(Hello \\(world\\))", b)

    def test_multi_page(self):
        doc = PdfDoc()
        doc.text(40, 40, "one")
        doc.add_page().text(40, 40, "two")
        self.assertIn(b"/Count 2", doc.build())


class TestReports(unittest.TestCase):
    def test_validation(self):
        assert_valid_pdf(self, validation_report_pdf(data.build_validation("SR_TEST")))

    def test_comparison(self):
        assert_valid_pdf(self, comparison_snapshot_pdf(data.build_comparison("SR_TEST")))

    def test_job(self):
        assert_valid_pdf(self, job_manifest_pdf({**data.QUEUE_JOBS[0], "job_id": "SR_TEST"}))

    def test_invoice(self):
        assert_valid_pdf(self, invoice_pdf("INV-1", 18400, "01 May 2024"))


class TestData(unittest.TestCase):
    def test_comparison_shape(self):
        c = data.build_comparison("J1")
        self.assertEqual(c["job_id"], "J1")
        self.assertGreaterEqual(len(c["metrics"]), 4)

    def test_validation_shape(self):
        v = data.build_validation("J1")
        self.assertEqual(len(v["correlation"]["points"]), 70)
        self.assertGreaterEqual(len(v["tasks"]), 3)


if __name__ == "__main__":
    unittest.main()
