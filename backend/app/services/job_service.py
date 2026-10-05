import uuid
from io import BytesIO
from pathlib import Path
from typing import Dict, Any, Tuple
from PIL import Image
from PIL.Image import DecompressionBombError
from app.repository.storage import StorageRepository, object_storage
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from app.workers.tasks import process_job

class JobService:
    @staticmethod
    def _validate_upload(filename: str, file_bytes: bytes):
        if not filename or not filename.lower().endswith((".tif", ".tiff")):
            raise ValueError("corrupt_file")
        if len(file_bytes) > settings.MAX_UPLOAD_BYTES:
            raise ValueError("oversized")

        try:
            with Image.open(BytesIO(file_bytes)) as image:
                if image.format != "TIFF":
                    raise ValueError("corrupt_file")
                width, height = image.size
                image.verify()
        except (DecompressionBombError, OSError):
            raise ValueError("corrupt_file")

        if width * height > settings.MAX_RASTER_PIXELS:
            raise ValueError("oversized")
        if len(image.getbands()) > settings.MAX_RASTER_BANDS:
            raise ValueError("missing_bands")

    @staticmethod
    async def create_job(db: AsyncSession, filename: str, file_bytes: bytes) -> str:
        JobService._validate_upload(filename, file_bytes)
        job_id = str(uuid.uuid4())

        object_key = "input/original.tif"
        object_storage.write_object(job_id, object_key, file_bytes)

        job_data = {
            "id": job_id,
            "name": f"Job {Path(filename).name}",
            "status": "created",
            "model": "gan",
            "lr_image_key": object_key
        }

        try:
            await StorageRepository.create_job(db, job_data)
        except Exception:
            object_storage.delete_object(job_id, object_key)
            raise

        return job_id

    @staticmethod
    async def patch_config(db: AsyncSession, job_id: str, config: Dict[str, Any]) -> Tuple[bool, str]:
        job = await StorageRepository.get_job(db, job_id)
        if not job:
            return False, "not_found"
        
        if job.status != "created":
            return False, "not_ready"
            
        # Mapping API config payload to DB columns
        updates = {
            "model": config.get("model", job.model),
            "target_resolution_m": config.get("target_resolution_m"),
            "bands": config.get("bands"),
            "aoi_coordinates": config.get("aoi_coordinates")
        }
        await StorageRepository.update_job(db, job_id, updates)
        return True, ""

    @staticmethod
    async def enqueue_job(db: AsyncSession, job_id: str) -> Tuple[bool, str]:
        job = await StorageRepository.get_job(db, job_id)
        if not job:
            return False, "not_found"
        
        if job.status != "created":
            return False, "not_ready"
            
        await StorageRepository.update_job(db, job_id, {"status": "queued"})
        
        # Enqueue via Celery
        process_job.delay(job_id)
        
        return True, ""
