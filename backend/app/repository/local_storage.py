"""
Local filesystem-backed object storage — drop-in replacement for the S3/MinIO
ObjectStorage class.  Used when STORAGE_BACKEND=local (the default for local
dev) so the backend can run without MinIO or any S3-compatible service.
"""

import logging
import os
import shutil
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class LocalObjectStorage:
    """Store blobs on the local filesystem under ``<base_dir>/<job_id>/<key>``."""

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.LOCAL_STORAGE_DIR)
        self._ready = False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _ensure_ready(self):
        if not self._ready:
            self.base_dir.mkdir(parents=True, exist_ok=True)
            self._ready = True

    def _object_path(self, job_id: str, key: str) -> Path:
        return self.base_dir / job_id / key

    # ------------------------------------------------------------------
    # Public interface (mirrors ObjectStorage)
    # ------------------------------------------------------------------

    def write_object(self, job_id: str, object_key: str, data: bytes):
        self._ensure_ready()
        path = self._object_path(job_id, object_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def read_object(self, job_id: str, object_key: str) -> Optional[bytes]:
        self._ensure_ready()
        path = self._object_path(job_id, object_key)
        if not path.exists():
            return None
        return path.read_bytes()

    def delete_object(self, job_id: str, object_key: str):
        self._ensure_ready()
        path = self._object_path(job_id, object_key)
        if path.exists():
            path.unlink()

    def get_presigned_url(
        self, job_id: str, object_key: str, expiration: int = 3600
    ) -> Optional[str]:
        """Return a ``file://`` URL for the object, or ``None`` if missing."""
        self._ensure_ready()
        path = self._object_path(job_id, object_key)
        if not path.exists():
            return None
        return path.resolve().as_uri()
