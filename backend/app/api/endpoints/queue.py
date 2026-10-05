from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.schemas import QueueResponse
from app.services import data_service
from app.core.dependencies import get_db
from app.db.models import Job
from app.core.auth import current_principal
from app.core.config import settings

router = APIRouter()

@router.get("/queue", response_model=QueueResponse)
async def queue(
    page: int = 1,
    status: str | None = None,
    project: str | None = None,
    q: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    # Fetch real jobs from DB
    query = select(Job).order_by(Job.created_at.desc())
    if settings.AUTH_ENABLED:
        query = query.where(Job.org_id == current_principal().org_id)
    if status and status != "all":
        query = query.where(Job.status == status)
        
    db_jobs = (await db.execute(query)).scalars().all()
    
    # Map real jobs to the contract
    jobs = []
    for j in db_jobs:
        if q and q.lower() not in j.id.lower() and (not j.name or q.lower() not in j.name.lower()):
            continue
            
        jobs.append({
            "job_id": j.id,
            "project": j.project_id or "Unknown Project",
            "status": j.status,
            "date": j.created_at.strftime("%d %b %Y") if j.created_at else "",
            "resolution_gain": f"{j.target_resolution_m}m" if j.target_resolution_m else "4x",
            "progress": j.progress,
            "compute_node": "GPU-Worker-1",
            "gpu": "A100 40GB",
            "started": j.started_at.strftime("%d %b %Y %H:%M") if j.started_at else "—",
            "eta": "—",
            "lr_thumb": j.lr_image_key or "default",
            "sr_thumb": j.sr_image_key or "default",
            "tiles_processed": 0,
            "tiles_total": 0,
            "throughput_mbps": 0,
            "stages": []
        })

    # Fake stats for now, but real lengths
    stats = data_service.QUEUE_STATS.copy()
    stats["queued"] = len([j for j in jobs if j["status"] == "queued"])
    stats["processing"] = len([j for j in jobs if j["status"] in {"preprocessing", "inference", "postprocessing", "validation"}])
    stats["completed_today"] = len([j for j in jobs if j["status"] == "done"])
    stats["failed"] = len([j for j in jobs if j["status"] == "failed"])

    return {
        "stats": stats,
        "jobs": jobs,
        "cluster": data_service.CLUSTER,
        "total": len(jobs),
        "page": page,
        "rows_per_page": 10
    }
