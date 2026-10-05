import random
import math
from datetime import date
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from app.schemas import NewJobEstimate, JobStatus
from app.services.job_service import JobService
from app.repository.storage import StorageRepository, object_storage
from app.core.config import settings
from app.core.auth import current_principal
from app.core.errors import APIError
from app.core.dependencies import get_db
from app.db.models import Job

router = APIRouter()

@router.post("/jobs/estimate", response_model=NewJobEstimate)
async def estimate(body: dict):
    area = float(body.get("area_km2", 12.64))
    minutes = max(20, round(area * 11))
    return {
        "area_km2": round(area, 2),
        "estimated_time": f"{minutes // 60}h {minutes % 60:02d}m",
        "estimated_storage_gb": round(area * 3.85, 1)
    }

@router.post("/jobs", status_code=201)
async def submit_job(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    chunks = []
    total_bytes = 0
    while True:
        chunk = await file.read(min(1024 * 1024, settings.MAX_UPLOAD_BYTES + 1 - total_bytes))
        if not chunk:
            break
        chunks.append(chunk)
        total_bytes += len(chunk)
        if total_bytes > settings.MAX_UPLOAD_BYTES:
            raise APIError(413, "oversized", "Uploaded file exceeds the maximum allowed size")

    file_bytes = b"".join(chunks)
    try:
        job_id = await JobService.create_job(db, file.filename, file_bytes)
    except ValueError as e:
        if str(e) == "corrupt_file":
            raise APIError(400, "corrupt_file", "Uploaded file must be a valid GeoTIFF (.tif or .tiff)")
        if str(e) == "oversized":
            raise APIError(413, "oversized", "Uploaded file exceeds the configured upload or raster limits")
        if str(e) == "missing_bands":
            raise APIError(400, "missing_bands", "Uploaded raster contains too many bands")
        raise APIError(500, "internal_error", str(e))
    return {"job_id": job_id}

@router.get("/jobs")
async def list_jobs(page: int = 1, limit: int = 10, status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Job).order_by(Job.created_at.desc())
    count_query = select(func.count(Job.id))

    if settings.AUTH_ENABLED:
        org_id = current_principal().org_id
        query = query.where(Job.org_id == org_id)
        count_query = count_query.where(Job.org_id == org_id)
    
    if status:
        query = query.where(Job.status == status)
        count_query = count_query.where(Job.status == status)
        
    query = query.limit(limit).offset((page - 1) * limit)
    
    total = (await db.execute(count_query)).scalar()
    jobs = (await db.execute(query)).scalars().all()
    
    # In a real app we'd map Job models to Pydantic schemas correctly
    # For now, converting to dict
    jobs_list = []
    for job in jobs:
        j_dict = {
            "id": job.id,
            "status": job.status,
            "stage": job.stage,
            "progress": job.progress,
            "model": job.model,
            "error_code": job.error_code,
            "error_message": job.error_message
        }
        jobs_list.append(j_dict)
        
    return {
        "jobs": jobs_list,
        "page": page,
        "total": total,
        "rows_per_page": limit
    }

@router.get("/jobs/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await StorageRepository.get_job(db, job_id)
    if not job:
        raise APIError(404, "not_found", "Job not found")
        
    # Generate presigned URLs for UI if needed
    lr_url = object_storage.get_presigned_url(job_id, job.lr_image_key) if job.lr_image_key else None
    
    return {
        "id": job.id,
        "status": job.status,
        "stage": job.stage,
        "progress": job.progress,
        "model": job.model,
        "error_code": job.error_code,
        "error_message": job.error_message,
        "lr_image_url": lr_url
    }

class ConfigPayload(BaseModel):
    model: str
    target_resolution_m: float
    bands: list[str]
    aoi_coordinates: list[list[float]]

@router.patch("/jobs/{job_id}/config")
async def patch_config(job_id: str, config: ConfigPayload, db: AsyncSession = Depends(get_db)):
    success, reason = await JobService.patch_config(db, job_id, config.dict())
    if not success:
        if reason == "not_found":
            raise APIError(404, "not_found", "Job not found")
        elif reason == "not_ready":
            raise APIError(409, "not_ready", "Job is not in 'created' state")
    return {"status": "ok"}

@router.post("/jobs/{job_id}/run", status_code=202)
async def run_job(job_id: str, db: AsyncSession = Depends(get_db)):
    success, reason = await JobService.enqueue_job(db, job_id)
    if not success:
        if reason == "not_found":
            raise APIError(404, "not_found", "Job not found")
        elif reason == "not_ready":
            raise APIError(409, "not_ready", "Job is not in 'created' state")
    return {"status": "queued"}
