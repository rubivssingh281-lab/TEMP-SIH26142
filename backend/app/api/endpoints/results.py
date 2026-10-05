import os
import json
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import APIError
from app.repository.storage import StorageRepository, object_storage
from app.core.dependencies import get_db

router = APIRouter()

@router.get("/jobs/{job_id}/results")
async def get_results(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await StorageRepository.get_job(db, job_id)
    if not job:
        raise APIError(404, "not_found", "Job not found")
        
    if job.status != "done":
        raise APIError(409, "not_ready", "Job is not finished yet")

    manifest_bytes = object_storage.read_object(job_id, "manifest.json")
    
    if not manifest_bytes:
        raise APIError(500, "internal_error", "Manifest not found for completed job")
        
    manifest = json.loads(manifest_bytes.decode('utf-8'))

    # Contract format required by Frontend
    return {
        "bounds": manifest.get("bounds"),
        "crs": manifest.get("crs", "EPSG:32643"),
        "scale_factor": job.scale_factor or manifest.get("scale_factor", 4),
        "output_resolution_m": job.output_res_m or manifest.get("output_resolution_m", 2.5),
        "thumbnails": {
            "original": f"/api/v1/jobs/{job_id}/tiles/original",
            "enhanced": f"/api/v1/jobs/{job_id}/tiles/enhanced",
            "uncertainty": f"/api/v1/jobs/{job_id}/tiles/uncertainty"
        },
        "metrics_summary": {"psnr": job.psnr, "ssim": job.ssim},
        "confidence_summary": manifest.get("confidence_summary", {"low": None, "medium": None, "high": None}),
        "calibration_status": job.calibration_status or "not_evaluated",
        "degradation_tier": job.degradation_tier,
        "validation_level": job.validation_level or manifest.get("validation_level", ["self_consistency"])
    }

@router.get("/jobs/{job_id}/tiles/{layer}")
async def get_tile(job_id: str, layer: str, db: AsyncSession = Depends(get_db)):
    if layer not in ["original", "enhanced", "uncertainty"]:
        raise APIError(400, "invalid_layer", f"Unknown layer: {layer}")
        
    job = await StorageRepository.get_job(db, job_id)
    if not job:
        raise APIError(404, "not_found", "Job not found")
        
    if job.status != "done":
        raise APIError(409, "not_ready", "Job is not finished yet")
        
    # Map layers to object keys
    key_map = {
        "original": "preview/original.png",
        "enhanced": job.sr_image_key,
        "uncertainty": job.uncertainty_image_key
    }
    key = key_map.get(layer)
    if not key:
        raise APIError(404, "not_found", "Layer not found")
        
    url = object_storage.get_presigned_url(job_id, key.replace(f"{job_id}/", "")) # strip job_id prefix if it was stored
    
    # If the key doesn't have the job_id prefix yet (like "preview/enhanced.png")
    if not url:
        url = object_storage.get_presigned_url(job_id, key)

    if url:
        return RedirectResponse(url=url)
    
    raise APIError(404, "not_found", "Tile not found")

@router.get("/jobs/{job_id}/uncertainty")
async def get_uncertainty(job_id: str, db: AsyncSession = Depends(get_db)):
    return await get_tile(job_id, "uncertainty", db)

@router.get("/jobs/{job_id}/metrics")
async def get_metrics(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await StorageRepository.get_job(db, job_id)
    if not job:
        raise APIError(404, "not_found", "Job not found")
        
    if job.status != "done":
        raise APIError(409, "not_ready", "Job is not finished yet")
        
    metrics_bytes = object_storage.read_object(job_id, "metrics.json")
    
    if not metrics_bytes:
        return {}
        
    return json.loads(metrics_bytes.decode('utf-8'))

@router.get("/jobs/{job_id}/applications/{app_type}")
async def get_application(job_id: str, app_type: str, db: AsyncSession = Depends(get_db)):
    valid_apps = ["agriculture", "urban", "disaster"]
    if app_type not in valid_apps:
        raise APIError(400, "invalid_application", f"Must be one of {valid_apps}")
        
    job = await StorageRepository.get_job(db, job_id)
    if not job:
        raise APIError(404, "not_found", "Job not found")
        
    if job.status != "done":
        raise APIError(409, "not_ready", "Job is not finished yet")
        
    application_bytes = object_storage.read_object(job_id, f"applications/{app_type}.json")
    if not application_bytes:
        raise APIError(404, "not_found", "Application result not found")
    return json.loads(application_bytes.decode("utf-8"))
