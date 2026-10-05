import asyncio
import io
import json
import os
import sys
import unittest
from types import SimpleNamespace

from fastapi.testclient import TestClient
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.config import settings
from app.repository.storage import StorageRepository, object_storage
from app.services.job_service import JobService
from app.services.orchestrator import Orchestrator


class TestBackendIntegration(unittest.TestCase):
    def test_health_metrics_and_validation_contracts(self):
        with TestClient(app) as client:
            health = client.get("/healthz", headers={"X-Trace-ID": "integration-test"})
            self.assertEqual(health.status_code, 200)
            self.assertEqual(health.headers["X-Trace-ID"], "integration-test")
            self.assertEqual(health.headers["X-Content-Type-Options"], "nosniff")

            metrics = client.get("/metrics")
            self.assertEqual(metrics.status_code, 200)
            self.assertIn(b"http_requests_total", metrics.content)

            invalid = client.post("/api/v1/jobs")
            self.assertEqual(invalid.status_code, 422)
            self.assertEqual(invalid.json()["error_code"], "validation_error")
            self.assertIn("trace_id", invalid.json())

    def test_upload_validation_rejects_non_tiff(self):
        with self.assertRaises(ValueError) as error:
            JobService._validate_upload("scene.tif", b"not-a-tiff")
        self.assertEqual(str(error.exception), "corrupt_file")

    def test_auth_boundary_rejects_missing_token_when_enabled(self):
        previous = settings.AUTH_ENABLED
        settings.AUTH_ENABLED = True
        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/dashboard")
            self.assertEqual(response.status_code, 401)
            self.assertEqual(response.json()["error_code"], "http_error")
            self.assertTrue(response.json()["trace_id"])
        finally:
            settings.AUTH_ENABLED = previous

    def test_orchestrator_publishes_readable_artifacts(self):
        job = SimpleNamespace(id="integration-job", model="gan", lr_image_key="input/original.tif")
        stored = {}
        updates = []

        async def fake_get(db, job_id):
            return job

        async def fake_update(db, job_id, values):
            updates.append(values)
            for key, value in values.items():
                setattr(job, key, value)

        original_get = StorageRepository.get_job
        original_update = StorageRepository.update_job
        original_read = object_storage.read_object
        original_write = object_storage.write_object
        try:
            StorageRepository.get_job = staticmethod(fake_get)
            StorageRepository.update_job = staticmethod(fake_update)
            object_storage.read_object = lambda job_id, key: b"mock-input"
            object_storage.write_object = lambda job_id, key, data: stored.__setitem__(key, data)
            asyncio.run(Orchestrator.run_pipeline(None, job.id))
        finally:
            StorageRepository.get_job = original_get
            StorageRepository.update_job = original_update
            object_storage.read_object = original_read
            object_storage.write_object = original_write

        expected = {
            "output/enhanced.tif",
            "output/uncertainty.tif",
            "preview/original.png",
            "preview/enhanced.png",
            "preview/uncertainty.png",
            "metrics.json",
            "applications/agriculture.json",
            "applications/urban.json",
            "applications/disaster.json",
            "manifest.json",
        }
        self.assertTrue(expected.issubset(stored))
        image_keys = {
            "output/enhanced.tif",
            "output/uncertainty.tif",
            "preview/original.png",
            "preview/enhanced.png",
            "preview/uncertainty.png",
        }
        for key in image_keys:
            Image.open(io.BytesIO(stored[key])).verify()
        self.assertEqual(job.status, "done")
        self.assertEqual(job.progress, 100)
        self.assertGreaterEqual(len(updates), 5)
        manifest = json.loads(stored["manifest.json"])
        self.assertEqual(sum(manifest["confidence_summary"].values()), 1.0)
        agriculture = json.loads(stored["applications/agriculture.json"])
        self.assertEqual(agriculture["index"], "NDVI")


if __name__ == "__main__":
    unittest.main()
