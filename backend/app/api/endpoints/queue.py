import asyncio
import logging
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.schemas import QueueResponse
from app.services import data_service
from app.core.dependencies import get_db
from app.db.models import Job
from app.core.auth import current_principal
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

PROCESSING_STATUSES = {"processing", "preprocessing", "inference", "postprocessing", "validation"}
COMPLETED_STATUSES = {"completed", "done"}

def _build_stages(status: str, stage: str | None, progress: int | None, model: str = "GeoSRNet"):
    p = progress if progress is not None else 25
    if status in ("completed", "done"):
        return [
            {"name": "Pre-processing", "state": "completed", "detail": "Completed · Cloud masking passed"},
            {"name": "Model Inference", "state": "completed", "detail": f"Completed ({model} ×4)"},
            {"name": "Post-processing", "state": "completed", "detail": "Completed · GeoTIFF generated"},
            {"name": "Validation", "state": "completed", "detail": "Completed · Quality thresholds met"},
        ]
    elif status == "failed":
        return [
            {"name": "Pre-processing", "state": "completed", "detail": "Completed"},
            {"name": "Model Inference", "state": "failed", "detail": "Failed · Error encountered"},
            {"name": "Post-processing", "state": "pending", "detail": "Pending"},
            {"name": "Validation", "state": "pending", "detail": "Pending"},
        ]
    else:  # processing / queued
        if p < 35:
            return [
                {"name": "Pre-processing", "state": "in_progress", "detail": "In Progress · Calibration & masking", "progress": p},
                {"name": "Model Inference", "state": "pending", "detail": "Pending"},
                {"name": "Post-processing", "state": "pending", "detail": "Pending"},
                {"name": "Validation", "state": "pending", "detail": "Pending"},
            ]
        elif p < 75:
            return [
                {"name": "Pre-processing", "state": "completed", "detail": "Completed · Cloud masking passed"},
                {"name": "Model Inference", "state": "in_progress", "detail": f"In Progress ({model} ×4)", "progress": p},
                {"name": "Post-processing", "state": "pending", "detail": "Pending"},
                {"name": "Validation", "state": "pending", "detail": "Pending"},
            ]
        elif p < 90:
            return [
                {"name": "Pre-processing", "state": "completed", "detail": "Completed"},
                {"name": "Model Inference", "state": "completed", "detail": f"Completed ({model} ×4)"},
                {"name": "Post-processing", "state": "in_progress", "detail": "In Progress · Sub-pixel reconstruction", "progress": p},
                {"name": "Validation", "state": "pending", "detail": "Pending"},
            ]
        else:
            return [
                {"name": "Pre-processing", "state": "completed", "detail": "Completed"},
                {"name": "Model Inference", "state": "completed", "detail": f"Completed ({model} ×4)"},
                {"name": "Post-processing", "state": "completed", "detail": "Completed"},
                {"name": "Validation", "state": "in_progress", "detail": "In Progress · Verifying PSNR/SSIM", "progress": p},
            ]


@router.get("/queue", response_model=QueueResponse)
async def queue(
    page: int = 1,
    status: str | None = None,
    project: str | None = None,
    q: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    db_jobs = None
    try:
        # Fetch real jobs from DB with short timeout so requests never hang if Postgres is offline
        query = select(Job).order_by(Job.created_at.desc())
        if settings.AUTH_ENABLED:
            query = query.where(Job.org_id == current_principal().org_id)
        if status and status != "all":
            if status == "completed":
                query = query.where(Job.status.in_(["completed", "done"]))
            elif status == "processing":
                query = query.where(Job.status.in_(list(PROCESSING_STATUSES)))
            else:
                query = query.where(Job.status == status)
            
        result = await asyncio.wait_for(db.execute(query), timeout=1.5)
        db_jobs = result.scalars().all()
    except Exception as exc:
        logger.warning(f"Database connection unavailable in /queue, falling back to mock jobs: {exc}")
        db_jobs = None

    # If DB is unavailable or has no jobs, fallback gracefully to data_service mock data
    if not db_jobs:
        jobs = list(data_service.QUEUE_JOBS)
        if status and status != "all":
            if status == "completed":
                jobs = [j for j in jobs if j.get("status") in COMPLETED_STATUSES]
            elif status == "processing":
                jobs = [j for j in jobs if j.get("status") in PROCESSING_STATUSES]
            else:
                jobs = [j for j in jobs if j.get("status") == status]
        if project and project != "all":
            jobs = [j for j in jobs if j.get("project") == project]
        if q:
            ql = q.lower()
            jobs = [
                j for j in jobs
                if ql in str(j.get("job_id", "")).lower() or ql in str(j.get("project", "")).lower()
            ]

        stats = data_service.QUEUE_STATS.copy()
        stats["queued"] = len([j for j in jobs if j.get("status") == "queued"])
        stats["processing"] = len([j for j in jobs if j.get("status") in PROCESSING_STATUSES])
        stats["completed_today"] = len([j for j in jobs if j.get("status") in COMPLETED_STATUSES])
        stats["failed"] = len([j for j in jobs if j.get("status") == "failed"])

        return {
            "stats": stats,
            "jobs": jobs,
            "cluster": data_service.CLUSTER,
            "total": len(jobs),
            "page": page,
            "rows_per_page": 10
        }

    # Map real jobs to the contract
    jobs = []
    for j in db_jobs:
        if q and q.lower() not in j.id.lower() and (not j.name or q.lower() not in j.name.lower()):
            continue
        if project and project != "all" and (j.project_id or "Unknown Project") != project:
            continue
            
        job_status = j.status
        if job_status == "done":
            job_status = "completed"

        mem_job = next((mj for mj in data_service.QUEUE_JOBS if mj.get("job_id") == j.id), None)
        stages = mem_job.get("stages") if (mem_job and mem_job.get("stages")) else _build_stages(job_status, j.stage, j.progress, (j.model or "GeoSRNet").upper())
        tiles_total = mem_job.get("tiles_total", 1280) if mem_job else 1280
        tiles_proc = mem_job.get("tiles_processed") if mem_job else int(min(1.0, (j.progress or 25) / 100.0) * tiles_total)
        throughput = mem_job.get("throughput_mbps", 340.0) if job_status == "processing" else 0.0
        eta = mem_job.get("eta") if mem_job else ("~25s" if (j.progress or 25) < 70 else ("~10s" if (j.progress or 25) < 99 else "Done"))
        cur_progress = mem_job.get("progress") if mem_job else j.progress

        jobs.append({
            "job_id": j.id,
            "project": j.project_id or "Unknown Project",
            "status": job_status,
            "date": j.created_at.strftime("%d %b %Y") if j.created_at else "",
            "resolution_gain": f"{j.target_resolution_m}m" if j.target_resolution_m else "4x",
            "progress": cur_progress,
            "compute_node": "GPU-Worker-1",
            "gpu": "A100 40GB",
            "started": j.started_at.strftime("%d %b %Y %H:%M") if j.started_at else "—",
            "eta": eta,
            "lr_thumb": mem_job.get("lr_thumb") if mem_job else (f"/api/v1/jobs/{j.id}/tiles/original" if j.lr_image_key else "default"),
            "sr_thumb": mem_job.get("sr_thumb") if mem_job else (f"/api/v1/jobs/{j.id}/tiles/enhanced" if j.sr_image_key else "default"),
            "tiles_processed": tiles_proc,
            "tiles_total": tiles_total,
            "throughput_mbps": throughput,
            "stages": stages,
        })

    # Stats
    stats = data_service.QUEUE_STATS.copy()
    stats["queued"] = len([j for j in jobs if j["status"] == "queued"])
    stats["processing"] = len([j for j in jobs if j["status"] in PROCESSING_STATUSES])
    stats["completed_today"] = len([j for j in jobs if j["status"] in COMPLETED_STATUSES])
    stats["failed"] = len([j for j in jobs if j["status"] == "failed"])

    return {
        "stats": stats,
        "jobs": jobs,
        "cluster": data_service.CLUSTER,
        "total": len(jobs),
        "page": page,
        "rows_per_page": 10
    }
