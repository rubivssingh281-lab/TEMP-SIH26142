import asyncio
from app.workers.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.services.orchestrator import Orchestrator
import logging

logger = logging.getLogger(__name__)

async def _process_job_async(job_id: str):
    async with AsyncSessionLocal() as db:
        await Orchestrator.run_pipeline(db, job_id)

@celery_app.task(bind=True, max_retries=3)
def process_job(self, job_id: str):
    """
    Celery task to process the job.
    Uses asyncio.run to execute the async pipeline.
    """
    try:
        asyncio.run(_process_job_async(job_id))
    except Exception as exc:
        logger.error(f"Error processing job {job_id}: {exc}")
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
