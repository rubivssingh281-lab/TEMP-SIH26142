import os
import zipfile
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.errors import APIError
from app.repository.storage import StorageRepository, object_storage
from app.core.dependencies import get_db

router = APIRouter()

@router.get("/jobs/{job_id}/export")
async def export_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await StorageRepository.get_job(db, job_id)
    if not job:
        raise APIError(404, "not_found", "Job not found")
        
    if job.status != "done":
        raise APIError(409, "not_ready", "Job is not finished yet")

    # In-memory zip file
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Download files from S3 and add to Zip
        
        enhanced_bytes = object_storage.read_object(job_id, "output/enhanced.tif")
        if enhanced_bytes:
            zip_file.writestr("enhanced.tif", enhanced_bytes)
            
        uncertainty_bytes = object_storage.read_object(job_id, "output/uncertainty.tif")
        if uncertainty_bytes:
            zip_file.writestr("uncertainty.tif", uncertainty_bytes)
            
        metrics_bytes = object_storage.read_object(job_id, "metrics.json")
        if metrics_bytes:
            zip_file.writestr("metrics.json", metrics_bytes)
            
        manifest_bytes = object_storage.read_object(job_id, "manifest.json")
        if manifest_bytes:
            zip_file.writestr("manifest.json", manifest_bytes)

    # Reset buffer position
    zip_buffer.seek(0)
    
    headers = {
        "Content-Disposition": f"attachment; filename=BhuDristi_Job_{job_id}.zip"
    }
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/x-zip-compressed",
        headers=headers
    )
